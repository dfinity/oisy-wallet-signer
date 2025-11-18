import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

// The suffix we use to publish to npm wip version of the libs
const SUFFIX = 'next';

const nextVersion = async ({project, currentVersion}) => {
  const version = `${currentVersion}-${SUFFIX}-${new Date().toISOString().slice(0, 10)}`;

  const {versions} = await (await fetch(`https://registry.npmjs.org/${project}`)).json();

  // The wip version has never been published
  if (versions[version] === undefined) {
    return version;
  }

  // There was some wip versions already published so, we increment the version number
  const count = Object.keys(versions).filter((v) => v.includes(version)).length;
  return `${version}.${count}`;
};

const updateVersion = async () => {
  const project = '@dfinity/oisy-wallet-signer';

  const packagePath = join(process.cwd(), 'package.json');

  if (!existsSync(packagePath)) {
    console.log(`Target ${packagePath} does not exist.`);
    return;
  }

  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

  // Build wip version number
  const version = await nextVersion({
    project,
    currentVersion: packageJson.version
  });

  // Peer dependencies need to reference WIP versions (e.g. @dfinity/utils@0.0.1-next),
  // which is why the specific tag is used.
  //
  // Other foundation packages, like @icp-sdk/core, are referenced with a wildcard.
  // This has proven useful when developing new features, as it allows more flexibility.
  const peerDependencies = Object.entries(packageJson.peerDependencies ?? {}).reduce(
    (acc, [key, value]) => {
      acc[key] =
        key.startsWith('@dfinity') || key === '@icp-sdk/canisters'
          ? SUFFIX
          : key === '@icp-sdk/core'
            ? '*'
            : value;
      return acc;
    },
    {}
  );

  writeFileSync(
    packagePath,
    JSON.stringify(
      {
        ...packageJson,
        version,
        ...(Object.keys(peerDependencies).length > 0 && {peerDependencies})
      },
      null,
      2
    ),
    'utf-8'
  );
};

await updateVersion();
