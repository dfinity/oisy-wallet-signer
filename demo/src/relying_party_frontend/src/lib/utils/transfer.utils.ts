import type { Icrc1TransferRequest } from '@icp-sdk/canisters/ledger/icp';
import type { Principal } from '@icp-sdk/core/principal';

export const getTransferRequest = ({
	minusFees,
	owner
}: {
	owner: Principal;
	minusFees: boolean;
}): Icrc1TransferRequest => {
	const E8S_PER_ICP = 100_000_000n;
	const TRANSACTION_FEE = 10_000n;

	return {
		to: {
			owner,
			subaccount: []
		},
		amount: 1n * (E8S_PER_ICP / 20n) - (minusFees ? TRANSACTION_FEE : 0n)
	};
};
