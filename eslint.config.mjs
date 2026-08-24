import apiConfig from './packages/api/eslint.config.mjs';
import cliConfig from './packages/cli/eslint.config.mjs';
import nzSourcesConfig from './packages/nz-sources/eslint.config.mjs';
import statsNzConfig from './packages/stats-nz/eslint.config.mjs';

export default [
  ...apiConfig,
  ...cliConfig,
  ...nzSourcesConfig,
  ...statsNzConfig,
  {
    ignores: [
      'node_modules/',
      '**/coverage/',
      'dist/',
      '**/*.tsbuildinfo',
      '**/eslint.config.mjs',
      'packages/config-eslint/**',
      'packages/config-typescript/**',
    ],
  },
];
