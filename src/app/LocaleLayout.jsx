import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { detectLocale } from 'src/i18n/detectLocale.js';
import { LocaleProvider, useLocale } from 'src/i18n/LocaleProvider.jsx';
import { isLocale } from 'src/i18n/locales.js';
import { swapLocaleInPath, withLocale } from 'src/i18n/paths.js';
import { I18nProvider } from 'src/shared/i18n/I18nProvider';

// The old pages still read the language from their own provider. Here it follows the URL, and a
// language picked in the old UI becomes a navigation to the other prefix.
function LegacyI18nBridge({ children }) {
  const { locale, setLocale } = useLocale();
  return (
    <I18nProvider language={locale} onLanguageChange={setLocale}>
      {children}
    </I18nProvider>
  );
}

// Layout of the `/:lang` route. `lang` is whatever the first path segment was, so it is checked
// here: a valid code in another case is lowercased, anything else is not a language at all and the
// whole path is prefixed with the detected one ('/map' -> '/kk/map').
export default function LocaleLayout() {
  const { lang = '' } = useParams();
  const { pathname, search, hash } = useLocation();
  const locale = lang.toLowerCase();

  if (!isLocale(locale)) {
    return <Navigate replace to={`${withLocale(detectLocale(), pathname)}${search}${hash}`} />;
  }
  if (lang !== locale) {
    return <Navigate replace to={swapLocaleInPath(pathname, search, hash, locale)} />;
  }

  return (
    <LocaleProvider locale={locale}>
      <LegacyI18nBridge>
        <Outlet />
      </LegacyI18nBridge>
    </LocaleProvider>
  );
}
