import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const { canisters } = JSON.parse(
	(await readFile(join(process.cwd(), 'dfx.json'))).toString('utf8')
);

const deleteFolder = async (canister) => {
	const path = join(process.cwd(), 'src', 'declarations', canister);
	await rm(path, { recursive: true, force: true });
};

const promises = Object.keys(canisters)
	.filter(
		(canister) => !['relying_party_backend', 'wallet_backend', 'icp_ledger'].includes(canister)
	)
	.map(deleteFolder);

await Promise.allSettled(promises);

console.log(`Useless declarations deleted!`);
