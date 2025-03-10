<script lang="ts">
    import {Signer} from "@dfinity/oisy-wallet-signer/signer";
    import {LOCAL_REPLICA_URL} from "$core/constants/app.constants";
    import {isNullish} from "@dfinity/utils";
    import type {Snippet} from "svelte";
    import ConfirmPermissions from "$lib/ConfirmPermissions.svelte";
    import CallCanister from "$lib/CallCanister.svelte";
    import ConsentMessage from "$lib/ConsentMessage.svelte";
    import ConfirmAccounts from "$lib/ConfirmAccounts.svelte";

    const signer = Signer.init({
        host: LOCAL_REPLICA_URL
    });

    $effect(() => {
        if ($notSignedIn) {
            signer?.disconnect();
            return;
        }

        if (isNullish($authStore.identity)) {
            signer?.disconnect();
            return;
        }

        signer.setOwner($authStore.identity);

        return () => {
            signer?.disconnect();
        };
    });
</script>

<ConfirmPermissions {signer} />

<ConfirmAccounts {signer} />

<ConsentMessage {signer} />

<CallCanister {signer} />