import { dirname } from 'path'
import { fileURLToPath } from 'url'
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintPluginImport from 'eslint-plugin-import'

// The new code (design system, i18n, data, features, the globe, the locale routes) must not depend
// on the old map. App.jsx is not listed: it is where the old pages are plugged into the new routes.
const NEW_CODE = [
  './src/design',
  './src/i18n',
  './src/data',
  './src/dev',
  './src/features',
  './src/map',
  './src/app/routes.jsx',
  './src/app/LocaleLayout.jsx',
  './src/app/RootRedirect.jsx',
]
const OLD_MAP = ['./src/modules', './src/shared/components/Sidebar', './src/app/store']

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: '18.3' },
      'import/resolver': {
        alias: {
          map: [['src', './src']],
          extensions: ['.js', '.jsx'],
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: eslintPluginImport,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Optional: catch unresolved imports
      'import/no-unresolved': 'error',
    },
  },
  {
    // import/no-restricted-paths resolves every import first, so the 'src/...' alias and relative
    // paths ('../modules/...', './store/...') are both caught.
    files: ['**/*.{js,jsx}'],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          basePath: dirname(fileURLToPath(import.meta.url)),
          zones: [
            {
              target: NEW_CODE,
              from: OLD_MAP,
              message: 'Новый код не зависит от старой карты (план M0)',
            },
          ],
        },
      ],
    },
  },
]
