import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { LocaleProvider, useLocale } from './LocaleProvider.jsx';
import { LOCALE_STORAGE_KEY } from './locales.js';

function Probe({ to = 'en' }) {
  const { t, setLocale } = useLocale();
  const loc = useLocation();
  return (
    <>
      <p>{t('common.nav.story')}</p>
      <p data-testid="path">{loc.pathname + loc.search + loc.hash}</p>
      <button onClick={() => setLocale(to)}>{to}</button>
    </>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>back</button>;
}

function renderAt(entry, locale, children = <Probe />) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider locale={locale}>{children}</LocaleProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LocaleProvider', () => {
  it('translates, sets html lang and switches locale keeping the path', async () => {
    render(
      <MemoryRouter initialEntries={['/ru/map/legacy?x=1']}>
        <LocaleProvider locale="ru">
          <Probe />
        </LocaleProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('История')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ru');
    await userEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('path')).toHaveTextContent('/en/map/legacy?x=1');
  });

  it('keeps the hash when switching', async () => {
    renderAt('/ru/atlas?x=1#top', 'ru');
    await userEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('path')).toHaveTextContent('/en/atlas?x=1#top');
  });

  it('saves the chosen locale in storage', async () => {
    renderAt('/ru/map', 'ru');
    await userEvent.click(screen.getByText('en'));
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('saves the active locale on mount and whenever it changes, without any click', () => {
    const tree = (locale) => (
      <MemoryRouter initialEntries={['/ru/map']}>
        <LocaleProvider locale={locale}>
          <Probe />
        </LocaleProvider>
      </MemoryRouter>
    );
    const { rerender } = render(tree('ru'));
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
    rerender(tree('en'));
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('renders when reading localStorage itself throws', () => {
    vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderAt('/ru/map', 'ru');
    expect(screen.getByText('История')).toBeInTheDocument();
  });

  it('adds a history entry instead of replacing the current one', async () => {
    renderAt('/ru/map', 'ru', (
      <>
        <Probe />
        <BackButton />
      </>
    ));
    await userEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('path')).toHaveTextContent('/en/map');
    await userEvent.click(screen.getByText('back'));
    expect(screen.getByTestId('path')).toHaveTextContent('/ru/map');
  });

  it('ignores values that are not supported locales', async () => {
    renderAt('/ru/map', 'ru', <Probe to="de" />);
    await userEvent.click(screen.getByText('de'));
    expect(screen.getByTestId('path')).toHaveTextContent('/ru/map');
    // Still the mounted locale that the provider saved, not the rejected 'de'.
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
  });

  it('does not add a history entry when the locale is already active, but still saves it', async () => {
    render(
      <MemoryRouter initialEntries={['/ru/map', '/ru/atlas']} initialIndex={1}>
        <LocaleProvider locale="ru">
          <Probe to="ru" />
          <BackButton />
        </LocaleProvider>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByText('ru'));
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
    expect(screen.getByTestId('path')).toHaveTextContent('/ru/atlas');
    // A pushed duplicate would make "back" land on /ru/atlas again.
    await userEvent.click(screen.getByText('back'));
    expect(screen.getByTestId('path')).toHaveTextContent('/ru/map');
  });

  it('still navigates when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderAt('/ru/map', 'ru');
    await userEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('path')).toHaveTextContent('/en/map');
  });

  it('follows the locale prop: html lang and translations', () => {
    const tree = (locale) => (
      <MemoryRouter initialEntries={['/kk/map']}>
        <LocaleProvider locale={locale}>
          <Probe />
        </LocaleProvider>
      </MemoryRouter>
    );
    const { rerender } = render(tree('kk'));
    expect(screen.getByText('Тарих')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('kk');
    rerender(tree('en'));
    expect(screen.getByText('Story')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('builds the translator once per locale', async () => {
    const seen = [];
    function Capture() {
      const { t, locale } = useLocale();
      const renders = useRef(0);
      renders.current += 1;
      seen.push({ t, locale });
      return <p data-testid="renders">{renders.current}</p>;
    }
    const tree = (locale, entry) => (
      <MemoryRouter initialEntries={[entry]}>
        <LocaleProvider locale={locale}>
          <Capture />
        </LocaleProvider>
      </MemoryRouter>
    );
    const { rerender } = render(tree('ru', '/ru/map'));
    rerender(tree('ru', '/ru/map'));
    expect(seen.at(-1).t).toBe(seen[0].t);
    rerender(tree('en', '/ru/map'));
    expect(seen.at(-1).t).not.toBe(seen[0].t);
    expect(seen.at(-1).locale).toBe('en');
  });

  it('keeps setLocale stable across navigation so consumers are not re-rendered by it', async () => {
    const setters = [];
    function Capture() {
      const { setLocale } = useLocale();
      const navigate = useNavigate();
      setters.push(setLocale);
      return <button onClick={() => navigate('/ru/atlas?page=2')}>go</button>;
    }
    renderAt('/ru/map', 'ru', <Capture />);
    await userEvent.click(screen.getByText('go'));
    expect(new Set(setters).size).toBe(1);
  });

  it('uses the current URL, not the one it was mounted at', async () => {
    function Mover() {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/ru/atlas?page=2')}>go</button>;
    }
    renderAt('/ru/map', 'ru', (
      <>
        <Probe />
        <Mover />
      </>
    ));
    await userEvent.click(screen.getByText('go'));
    await userEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('path')).toHaveTextContent('/en/atlas?page=2');
  });

  it('useLocale throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bare() {
      useLocale();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/LocaleProvider/);
  });
});

describe('LocaleProvider under a browser history router', () => {
  // The legacy map writes its view with window.history.pushState(), which BrowserRouter never hears
  // about, so useLocation() lags behind the address bar. A switch must use the address bar.
  function Pan({ url }) {
    return <button onClick={() => window.history.pushState(null, '', url)}>pan</button>;
  }

  const address = () => window.location.pathname + window.location.search + window.location.hash;

  function renderInBrowser(startUrl, panUrl) {
    window.history.replaceState(null, '', startUrl);
    render(
      <BrowserRouter>
        <LocaleProvider locale="ru">
          <Probe />
          <Pan url={panUrl} />
        </LocaleProvider>
      </BrowserRouter>,
    );
  }

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('takes the map hash written after the page loaded when there was none before', async () => {
    renderInBrowser('/ru/map/legacy', '#map=6.00/71.00000/49.00000/0.0');
    await userEvent.click(screen.getByText('pan'));
    await userEvent.click(screen.getByText('en'));
    expect(address()).toBe('/en/map/legacy#map=6.00/71.00000/49.00000/0.0');
    expect(screen.getByTestId('path')).toHaveTextContent('/en/map/legacy#map=6.00/71.00000/49.00000/0.0');
  });

  it('takes the latest map hash, not the one the page was loaded with', async () => {
    renderInBrowser('/ru/map/legacy#map=5.00/70.00000/48.00000/0.0', '#map=6.00/71.00000/49.00000/0.0');
    await userEvent.click(screen.getByText('pan'));
    await userEvent.click(screen.getByText('en'));
    expect(address()).toBe('/en/map/legacy#map=6.00/71.00000/49.00000/0.0');
  });

  it('takes the query string from the address bar too', async () => {
    renderInBrowser('/ru/map/legacy?x=1#a', '?y=2#b');
    await userEvent.click(screen.getByText('pan'));
    await userEvent.click(screen.getByText('en'));
    expect(address()).toBe('/en/map/legacy?y=2#b');
  });
});
