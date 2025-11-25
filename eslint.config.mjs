import {default as config} from '@dfinity/eslint-config-oisy-wallet';
import {default as vitestConfig} from '@dfinity/eslint-config-oisy-wallet/vitest';

export default [
  ...config,
  ...vitestConfig,
  {
    ignores: ['**/dist', 'src/declarations/icrc', 'src/tsconfig.json']
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/declarations/icrc/*', '!./declarations/icrc/*'],
              message: 'Direct usage of ICRC declaration modules is not allowed.'
            }
          ]
        }
      ]
    }
  }
];
