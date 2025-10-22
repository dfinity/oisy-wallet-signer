import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// The script is run from the dist folder
const packagePath = join(process.cwd(), 'package.json');

const stripEngines = async () => {
  const {engines: _, ...rest} = JSON.parse(readFileSync(packagePath, 'utf-8'));

  await writeFile(packagePath, JSON.stringify(rest, null, 2), 'utf-8');

  console.log('engines field stripped from package.json');
};

await stripEngines();
