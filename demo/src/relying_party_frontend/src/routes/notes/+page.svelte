<script lang="ts">
	// Relying Pary

	import { DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity';

	const myIdentity = Ed25519KeyIdentity.generate();

	const answer = await myWallet.icrc34;

	const delegation = DelegationAgentJS.fromJSON(answer.result.signerDelegation[0]);

	const newIdentity = DelegationIdentity.fromDelegation(myIdenditity, delegation);

	// Oisy
	import { authStore } from '$core/stores/auth.store';
	import { SignIdentity } from '@dfinity/agent';

	// There is at least one target in the request
	// I want the relying party to get the same principal as in OISY - i.e. account
	const identity: SignIdentity = $authStore.identity as SignIdentity;
	const signature = identity.sign('TODO: find how to create delegation on public party key');

	myWallet.response([
		{ signedDelegation, signeture },
		{ iiIdentityDelegrationFromIdb, signatureFromIdb }
	]);

	// If there is no target
	// TODO: oisy frontend call backend with identity derived by ii with arguments is public key from relying  party + origin + expiration
	// TODO: backend does the same thing as in II - prepare delegation + get delegation

	myWallet.response(delegationBuildInBackend);
</script>
