import pluginVue from 'eslint-plugin-vue'
import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,

  {
    files: ['packages/api-express/**/*.js', 'packages/shared/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
      sourceType: 'commonjs',
    },
  },

  ...pluginVue.configs['flat/recommended'],

  {
    files: ['packages/web-gis/**/*.{js,vue}'],
    languageOptions: {
      globals: globals.browser,
      sourceType: 'module',
    },
  },

  eslintConfigPrettier,

  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/pnpm-lock.yaml'],
  },
]
