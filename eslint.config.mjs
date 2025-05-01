import {default as config} from '@dfinity/eslint-config-oisy-wallet';
import {default as vitestConfig} from '@dfinity/eslint-config-oisy-wallet/vitest';

export default [
  ...config,
  ...vitestConfig,
  {
    ignores: ['**/dist', 'src/declarations', 'src/tsconfig.json']
  }
];
