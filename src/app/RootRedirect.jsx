import { Navigate, useLocation } from 'react-router-dom';
import { detectLocale } from 'src/i18n/detectLocale.js';
import { withLocale } from 'src/i18n/paths.js';

// '/' has no language yet: send the visitor to the saved or browser language, keeping query and hash.
export default function RootRedirect() {
  const { search, hash } = useLocation();
  return <Navigate replace to={`${withLocale(detectLocale(), '/')}${search}${hash}`} />;
}
