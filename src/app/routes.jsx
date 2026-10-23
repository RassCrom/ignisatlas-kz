import LocaleLayout from './LocaleLayout.jsx';
import RootRedirect from './RootRedirect.jsx';

// `pages` maps a page name to a React component, so the table can be tested with stubs and the
// new code never imports the old pages itself:
//   { Landing, LegacyMap, Report, Research, NotFound, GlobeSpike? }
// GlobeSpike is optional (a dev-only page): without it the path falls through to NotFound.
export function createAppRoutes({ Landing, LegacyMap, Report, Research, NotFound, GlobeSpike }) {
  return [
    { path: '/', element: <RootRedirect /> },
    {
      // The first segment is any string here; LocaleLayout redirects when it is not a language.
      path: '/:lang',
      element: <LocaleLayout />,
      children: [
        // Temporary: the landing page stays the old one until M3.
        { index: true, element: <Landing /> },
        // Temporary: '/map' keeps serving the old map until M2; '/map/legacy' is its permanent address.
        { path: 'map', element: <LegacyMap /> },
        { path: 'map/legacy', element: <LegacyMap /> },
        // Temporary: the old report and research pages stay until M4.
        { path: 'report', element: <Report /> },
        { path: 'research', element: <Research /> },
        ...(GlobeSpike ? [{ path: 'dev/globe-spike', element: <GlobeSpike /> }] : []),
        { path: '*', element: <NotFound /> },
      ],
    },
  ];
}
