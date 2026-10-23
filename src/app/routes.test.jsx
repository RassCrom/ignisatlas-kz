import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createBrowserRouter, createMemoryRouter } from 'react-router-dom';
import { useLocale } from 'src/i18n/LocaleProvider.jsx';
import { useI18n } from 'src/shared/i18n/I18nProvider';
import { createAppRoutes } from './routes.jsx';

const stub = (name) => {
  const Stub = () => <h1>{name}</h1>;
  Stub.displayName = `stub-${name}`; // react/display-name rejects an anonymous inner component
  return Stub;
};
const pages = {
  Landing: stub('landing'),
  LegacyMap: stub('legacy-map'),
  Report: stub('report'),
  Research: stub('research'),
  NotFound: stub('404'),
};

function renderAt(url, storageLocale = null, routePages = pages) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE']); // jsdom reports en-US; force the kk default
  localStorage.clear();
  if (storageLocale) localStorage.setItem('fires-kz-language', storageLocale);
  const router = createMemoryRouter(createAppRoutes(routePages), { initialEntries: [url] });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createAppRoutes', () => {
  it('redirects / to the saved locale', async () => {
    const r = renderAt('/', 'ru');
    await screen.findByText('landing');
    expect(r.state.location.pathname).toBe('/ru/');
  });

  it('prefixes unprefixed legacy URLs', async () => {
    const r = renderAt('/map');
    await screen.findByText('legacy-map');
    expect(r.state.location.pathname).toBe('/kk/map');
  });

  it('lowercases the locale', async () => {
    const r = renderAt('/KK/report');
    await screen.findByText('report');
    expect(r.state.location.pathname).toBe('/kk/report');
  });

  it('keeps query and hash on the legacy map', async () => {
    const r = renderAt('/ru/map/legacy?x=1#h');
    await screen.findByText('legacy-map');
    expect(r.state.location).toMatchObject({ search: '?x=1', hash: '#h' });
  });

  it('shows 404 for unknown pages instead of a blank screen', async () => {
    renderAt('/de/map');
    await screen.findByText('404');
  });

  it('serves a bare locale without a trailing slash', async () => {
    renderAt('/en');
    await screen.findByText('landing');
    expect(document.documentElement.lang).toBe('en');
  });

  it('has no spike route unless provided', async () => {
    renderAt('/kk/dev/globe-spike');
    await screen.findByText('404');
  });

  it('serves the spike route when it is provided', async () => {
    renderAt('/kk/dev/globe-spike', null, { ...pages, GlobeSpike: stub('globe-spike') });
    await screen.findByText('globe-spike');
  });

  it('keeps query and hash when prefixing an unprefixed URL', async () => {
    const r = renderAt('/map?x=1#h');
    await screen.findByText('legacy-map');
    expect(r.state.location).toMatchObject({ pathname: '/kk/map', search: '?x=1', hash: '#h' });
  });

  it('keeps query and hash when redirecting from /', async () => {
    const r = renderAt('/?utm=a#h', 'en');
    await screen.findByText('landing');
    expect(r.state.location).toMatchObject({ pathname: '/en/', search: '?utm=a', hash: '#h' });
  });

  it('sends an unprefixed URL to the language the visitor is currently using', async () => {
    // renderAt forces the browser language to German, so only the saved choice can say 'ru'.
    const r = renderAt('/ru/map/legacy');
    await screen.findByText('legacy-map');
    expect(localStorage.getItem('fires-kz-language')).toBe('ru');

    await act(() => r.navigate('/report'));
    await screen.findByText('report');
    expect(r.state.location.pathname).toBe('/ru/report');
  });
});

describe('providers under a locale route', () => {
  // Reads both the new and the old provider, and switches language through the old one.
  function Probe() {
    const { locale } = useLocale();
    const { language, setLanguage } = useI18n();
    return (
      <>
        <p data-testid="state">{`${locale}/${language}`}</p>
        <button onClick={() => setLanguage('en')}>to-en</button>
      </>
    );
  }
  const probePages = { ...pages, LegacyMap: Probe };

  it('feeds the URL language to the new and the old provider', async () => {
    renderAt('/ru/map/legacy', 'kk', probePages);
    expect(await screen.findByTestId('state')).toHaveTextContent('ru/ru');
    expect(document.documentElement.lang).toBe('ru');
    // The saved choice follows the URL: the visitor is now using Russian, whatever was saved before.
    expect(localStorage.getItem('fires-kz-language')).toBe('ru');
  });

  it('turns a language picked in the old UI into a navigation that keeps path, query and hash', async () => {
    const r = renderAt('/ru/map/legacy?x=1#h', null, probePages);
    await userEvent.click(await screen.findByRole('button', { name: 'to-en' }));
    expect(r.state.location).toMatchObject({ pathname: '/en/map/legacy', search: '?x=1', hash: '#h' });
    expect(screen.getByTestId('state')).toHaveTextContent('en/en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('fires-kz-language')).toBe('en');
  });
});

describe('language switch with a real browser history', () => {
  // Same shape as the legacy map: it moves the address bar with history.pushState(), which the
  // router does not hear about.
  function Map() {
    const { setLanguage } = useI18n();
    return (
      <>
        <button onClick={() => window.history.pushState(null, '', '#map=6.00/71.00000/49.00000/0.0')}>pan</button>
        <button onClick={() => setLanguage('en')}>to-en</button>
      </>
    );
  }

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('keeps the map view written by pushState when the old UI switches language', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE']);
    localStorage.clear();
    window.history.replaceState(null, '', '/ru/map/legacy#map=5.00/70.00000/48.00000/0.0');
    const router = createBrowserRouter(createAppRoutes({ ...pages, LegacyMap: Map }));
    render(<RouterProvider router={router} />);

    await userEvent.click(await screen.findByRole('button', { name: 'pan' }));
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));

    expect(window.location.pathname + window.location.hash).toBe('/en/map/legacy#map=6.00/71.00000/49.00000/0.0');
    expect(router.state.location.hash).toBe('#map=6.00/71.00000/49.00000/0.0');
  });
});
