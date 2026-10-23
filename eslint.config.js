import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintPluginImport from 'eslint-plugin-import'

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
    // The new code (design system, i18n, data, features, the globe) must not import the old map.
    // App.jsx is not listed: it is where the old pages are plugged into the new routes.
    files: [
      'src/{design,i18n,data,dev,features,map}/**/*.{js,jsx}',
      'src/app/{routes,LocaleLayout,RootRedirect}.jsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['src/modules/*', 'src/shared/components/Sidebar/*', 'src/app/store/*'],
              message: 'Новый код не зависит от старой карты (план M0)',
            },
          ],
        },
      ],
    },
  },
]
