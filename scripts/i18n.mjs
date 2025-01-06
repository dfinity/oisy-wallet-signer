#!/usr/bin/env node

import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

const PATH_FROM_ROOT = join(process.cwd(), 'src');
const PATH_TO_EN_JSON = join(PATH_FROM_ROOT, 'i18n', 'en.json');
const PATH_TO_OUTPUT = join(PATH_FROM_ROOT, 'types', 'i18n.ts');

/**
 * Generates Zod schema from the English translation file.
 */
const generateTypes = async () => {
  const {default: en} = await import(PATH_TO_EN_JSON, {with: {type: 'json'}});

  const mapValues = (values) =>
    Object.entries(values).reduce(
      (acc, [key, value]) => [
        ...acc,
        `${key}: ${typeof value === 'object' ? `z.object({${mapValues(value).join('')}})` : `z.string()`},`
      ],
      []
    );

  const data = Object.entries(en).map(([key, values]) => ({
    key,
    schema: `i18n${key.charAt(0).toUpperCase()}${key.slice(1)}Schema`,
    values: mapValues(values)
  }));

  const comment = `// Auto-generated definitions file ("npm run i18n")\n`;

  const schemas = data
    .map(
      ({schema, values}) => `export const ${schema} = z.object({
  ${values.join('\n')}
}).strict();`
    )
    .join('\n\n');

  const schema = `import { z } from 'zod';

${schemas}

export const i18Schema = z.object({
	${data.map(({key, schema}) => `${key}: ${schema},`).join('\n')}
}).strict();

export type I18n = z.infer<typeof i18Schema>;`;

  writeFileSync(PATH_TO_OUTPUT, `${comment}${schema}`);
};

await generateTypes();
