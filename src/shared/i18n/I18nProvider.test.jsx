import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from './I18nProvider.jsx';
import { LANGUAGE_STORAGE_KEY } from './config.js';

function SwitchProbe({ to }) {
  const { setLanguage } = useI18n();
  return <button onClick={() => setLanguage(to)}>switch</button>;
}

function Readout() {
  const { language, languageConfig, languages, t } = useI18n();
  return (
    <>
      <p data-testid="language">{language}</p>
      <p data-testid="html-lang-config">{languageConfig.htmlLang}</p>
      <p data-testid="count">{languages.length}</p>
      <p data-testid="brand">{t('common.brand')}</p>
      <p data-testid="missing">{t('no.such.key', 'fallback text')}</p>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('I18nProvider, uncontrolled (as before)', () => {
  it('starts in the default language when nothing is saved', () => {
    render(
      <I18nProvider>
        <Readout />
      </I18nProvider>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('kk');
    expect(screen.getByTestId('html-lang-config')).toHaveTextContent('kk-Latn-KZ');
    expect(screen.getByTestId('count')).toHaveTextContent('3');
    expect(screen.getByTestId('brand')).toHaveTextContent('Tabiat Kuzeti');
    expect(screen.getByTestId('missing')).toHaveTextContent('fallback text');
    expect(document.documentElement.lang).toBe('kk-Latn-KZ');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('kk');
  });

  it('starts from the saved language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ru');
    render(
      <I18nProvider>
        <Readout />
      </I18nProvider>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('ru');
    expect(document.documentElement.lang).toBe('ru-KZ');
  });

  it('changes language, saves it and updates html lang', async () => {
    render(
      <I18nProvider>
        <Readout />
        <SwitchProbe to="en" />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('ignores unsupported language codes', async () => {
    render(
      <I18nProvider>
        <Readout />
        <SwitchProbe to="de" />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('language')).toHaveTextContent('kk');
  });

  it('ignores onLanguageChange when no language is passed', async () => {
    const onLanguageChange = vi.fn();
    render(
      <I18nProvider onLanguageChange={onLanguageChange}>
        <Readout />
        <SwitchProbe to="en" />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(onLanguageChange).not.toHaveBeenCalled();
  });
});

describe('useI18n without a provider (as before)', () => {
  it('reads and persists the language on its own', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ru');
    render(
      <>
        <Readout />
        <SwitchProbe to="en" />
      </>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('ru');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('I18nProvider, controlled', () => {
  it('delegates language changes in controlled mode', async () => {
    const onLanguageChange = vi.fn();
    render(
      <I18nProvider language="ru" onLanguageChange={onLanguageChange}>
        <SwitchProbe to="en" />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onLanguageChange).toHaveBeenCalledWith('en');
  });

  it('follows the language prop and only changes when the parent does', async () => {
    const onLanguageChange = vi.fn();
    const tree = (language) => (
      <I18nProvider language={language} onLanguageChange={onLanguageChange}>
        <Readout />
        <SwitchProbe to="en" />
      </I18nProvider>
    );
    const { rerender } = render(tree('ru'));
    expect(screen.getByTestId('language')).toHaveTextContent('ru');
    expect(screen.getByTestId('html-lang-config')).toHaveTextContent('ru-KZ');

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('language')).toHaveTextContent('ru');

    rerender(tree('en'));
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('html-lang-config')).toHaveTextContent('en');
  });

  it('neither reads nor writes localStorage', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <I18nProvider language="ru" onLanguageChange={() => {}}>
        <Readout />
        <SwitchProbe to="kk" />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('language')).toHaveTextContent('ru');
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('leaves document.documentElement.lang to whoever controls the language', () => {
    document.documentElement.lang = 'set-by-owner';
    render(
      <I18nProvider language="ru" onLanguageChange={() => {}}>
        <Readout />
      </I18nProvider>,
    );
    expect(document.documentElement.lang).toBe('set-by-owner');
  });

  it('ignores unsupported language codes', async () => {
    const onLanguageChange = vi.fn();
    render(
      <I18nProvider language="ru" onLanguageChange={onLanguageChange}>
        <SwitchProbe to="de" />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onLanguageChange).not.toHaveBeenCalled();
  });

  it('falls back to the default language for an unsupported language prop', () => {
    render(
      <I18nProvider language="de" onLanguageChange={() => {}}>
        <Readout />
      </I18nProvider>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('kk');
  });

  it('does not throw when onLanguageChange is missing', async () => {
    render(
      <I18nProvider language="ru">
        <SwitchProbe to="en" />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('keeps the context value stable when only an inline callback changes', () => {
    const values = [];
    function Capture() {
      values.push(useI18n());
      return null;
    }
    const tree = (cb) => (
      <I18nProvider language="ru" onLanguageChange={cb}>
        <Capture />
      </I18nProvider>
    );
    const { rerender } = render(tree(() => {}));
    rerender(tree(() => {}));
    expect(values.at(-1)).toBe(values[0]);
  });

  it('calls the latest onLanguageChange', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const tree = (cb) => (
      <I18nProvider language="ru" onLanguageChange={cb}>
        <SwitchProbe to="en" />
      </I18nProvider>
    );
    const { rerender } = render(tree(first));
    rerender(tree(second));
    await userEvent.click(screen.getByRole('button'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('en');
  });
});
