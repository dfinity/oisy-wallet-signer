---
name: oisy-wallet-signer
description: Guides development with the @dfinity/oisy-wallet-signer library for Internet Computer dApps. Use when building wallet integrations, signer UIs, token transfers (ICP/ICRC), permission flows, or any ICRC-25/27/29/49 signer interaction on the IC. Also use when the user mentions OISY, wallet signer, relying party, consent messages, or canister call signing.
---

# OISY Wallet Signer

## Core Model

OISY signer = **explicit per-action approval** via popup window, using JSON-RPC 2.0 over `window.postMessage`.

It is **not**: a session/delegation system, a background executor, or ICRC-34 delegated identity.
`connect()` establishes a communication channel. Nothing more.

**Two roles:**
- **Signer** (wallet side): listens for requests, prompts user, executes canister calls
- **Relying Party** (dApp side): opens popup to signer, sends requests, receives results

**ICRC standards implemented:** ICRC-21 (consent messages), ICRC-25 (permissions), ICRC-27 (accounts), ICRC-29 (postMessage transport), ICRC-49 (call canister).

[//]: # (TODO : specify that ICRC-46 is not yet implemented)

## When to Use

- Clear, intentional, high-value actions: token transfers (ICP / ICRC-1 / ICRC-2), NFT mint/claim, single approvals
- Funding / deposit flows: "Top up", "Deposit into protocol"
- Any action where a confirmation dialog per operation feels natural

## When NOT to Use

- **Delegation or sessions**: sign once / act many times, background execution, autonomous behavior
- **High-frequency interactions**: games, social actions, rapid write operations
- **Invisible writes**: autosave, cron jobs, auto-compounding

> **Decision test:** If your app still feels good when every meaningful update shows a confirmation dialog, OISY is appropriate. If not, use a delegation-capable model instead.

## Installation

```bash
npm i @dfinity/oisy-wallet-signer
```

**Peer dependencies** (must be installed separately):

```bash
npm i @dfinity/utils @dfinity/zod-schemas @icp-sdk/canisters @icp-sdk/core zod
```

## Import Paths

The library uses multiple entry points. Always import from the correct path:

```typescript
// Types, constants, and ICRC standard identifiers
import {
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_PERMISSION_GRANTED,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_ASK_ON_USE,
  ICRC27_ACCOUNTS,
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC49_CALL_CANISTER,
  ICRC29_STATUS
} from '@dfinity/oisy-wallet-signer';

import type {
  PermissionsPromptPayload,
  AccountsPromptPayload,
  ConsentMessagePromptPayload,
  CallCanisterPromptPayload,
  IcrcAccounts,
  SignerOptions,
  RelyingPartyOptions
} from '@dfinity/oisy-wallet-signer';

// Classes — each from its own entry point
import {Signer} from '@dfinity/oisy-wallet-signer/signer';
import {RelyingParty} from '@dfinity/oisy-wallet-signer/relying-party';
import {IcpWallet} from '@dfinity/oisy-wallet-signer/icp-wallet';
import {IcrcWallet} from '@dfinity/oisy-wallet-signer/icrc-wallet';
```

**Never** import `Signer` or `RelyingParty` from the main entry point — they are only available from their dedicated subpaths.

## Client Side (Relying Party / dApp)

### Choosing the Right Class

| Class | Use for |
|-------|---------|
| `IcpWallet` | ICP ledger operations (`icrc1Transfer`, `icrc2Approve`) — defaults to ICP ledger canister |
| `IcrcWallet` | Any ICRC ledger (`transfer`, `approve`, `transferFrom`) — requires `ledgerCanisterId` |
| `RelyingParty` | Low-level access, custom canister calls via `call()` (protected in subclasses) |

### Connect

```typescript
const wallet = await IcrcWallet.connect({
  url: 'https://oisy.com/sign',
  host: 'https://icp-api.io',  // omit for mainnet default, set for local dev
  windowOptions: {
    width: 576,
    height: 625,
    position: 'center'  // or 'top-right'
  },
  connectionOptions: {
    timeoutInMilliseconds: 120_000,       // connection timeout (default: 2 min)
    pollingIntervalInMilliseconds: 500    // status poll interval (default: 500ms)
  },
  onDisconnect: () => {
    // Handle wallet popup closed or disconnected
  }
});
```

### Request Permissions and Accounts

```typescript
const {allPermissionsGranted} = await wallet.requestPermissionsNotGranted();

const accounts = await wallet.accounts();
const {owner} = accounts[0];
```

`requestPermissionsNotGranted()` only prompts for permissions not yet granted — safe to call every time.

### IcpWallet — ICP Transfers

```typescript
const blockHeight = await wallet.icrc1Transfer({
  owner,
  request: {
    to: {owner: recipientPrincipal, subaccount: []},
    amount: 100_000_000n  // 1 ICP in e8s
  }
});

const blockHeight = await wallet.icrc2Approve({
  owner,
  request: {
    spender: {owner: spenderPrincipal, subaccount: []},
    amount: 500_000_000n
  }
});
```

`ledgerCanisterId` is optional for `IcpWallet` — defaults to the ICP ledger (`ryjl3-tyaaa-aaaaa-aaaba-cai`).

### IcrcWallet — Any ICRC Ledger

```typescript
const blockIndex = await wallet.transfer({
  owner,
  ledgerCanisterId: 'mxzaz-hqaaa-aaaar-qaada-cai',  // required
  params: {
    to: {owner: recipientPrincipal, subaccount: []},
    amount: 1_000_000n
  }
});

const blockIndex = await wallet.approve({
  owner,
  ledgerCanisterId: 'mxzaz-hqaaa-aaaar-qaada-cai',
  params: {
    spender: {owner: spenderPrincipal, subaccount: []},
    amount: 5_000_000n
  }
});

const blockIndex = await wallet.transferFrom({
  owner,
  ledgerCanisterId: 'mxzaz-hqaaa-aaaar-qaada-cai',
  params: {
    from: {owner: fromPrincipal, subaccount: []},
    to: {owner: toPrincipal, subaccount: []},
    amount: 1_000_000n
  }
});
```

### Disconnect

```typescript
await wallet.disconnect();
```

Always disconnect when done. This closes the popup and cleans up listeners.

### Query Methods (No Signing Required)

```typescript
const standards = await wallet.supportedStandards();
const currentPermissions = await wallet.permissions();
```

## Signer Side (Wallet UI)

### Initialize

```typescript
const signer = Signer.init({
  owner: identity,  // must be non-anonymous (e.g. Ed25519KeyIdentity, ECDSAKeyIdentity)
  host: 'https://icp-api.io',  // optional, defaults to mainnet
  sessionOptions: {
    sessionPermissionExpirationInMilliseconds: 7 * 24 * 60 * 60 * 1000  // default: 7 days
  }
});
```

### Register Prompts

All four prompts **must** be registered before the signer can handle requests. Each prompt is called by the signer when user interaction is needed.

**Permissions prompt** — called when relying party requests permissions or accesses a feature requiring ungranted permissions:

```typescript
signer.register({
  method: ICRC25_REQUEST_PERMISSIONS,
  prompt: ({requestedScopes, confirm, origin}: PermissionsPromptPayload) => {
    // Show UI with requested scopes, then call confirm() with user's decision
    confirm(requestedScopes.map(({scope}) => ({
      scope,
      state: userApproved ? ICRC25_PERMISSION_GRANTED : ICRC25_PERMISSION_DENIED
    })));
  }
});
```

**Accounts prompt** — called when relying party requests accounts:

```typescript
signer.register({
  method: ICRC27_ACCOUNTS,
  prompt: ({approve, reject, origin}: AccountsPromptPayload) => {
    // Return accounts the user wants to share
    approve([{owner: identity.getPrincipal().toText()}]);
    // Or reject: reject();
  }
});
```

**Consent message prompt** — called during canister calls, with multiple status updates:

```typescript
signer.register({
  method: ICRC21_CALL_CONSENT_MESSAGE,
  prompt: (payload: ConsentMessagePromptPayload) => {
    if (payload.status === 'loading') {
      // Show loading indicator
    } else if (payload.status === 'result') {
      // payload.consentInfo is { Ok: ... } (from canister) or { Warn: ... } (signer-generated)
      // Show consent message to user
      // payload.approve() or payload.reject()
    } else if (payload.status === 'error') {
      // Show error, optionally payload.details
    }
  }
});
```

**Call canister prompt** (optional, for UI feedback on execution progress):

```typescript
signer.register({
  method: ICRC49_CALL_CANISTER,
  prompt: (payload: CallCanisterPromptPayload) => {
    if (payload.status === 'executing') {
      // Show "executing..." indicator
    } else if (payload.status === 'result') {
      // Call succeeded — payload includes contentMap and certificate
    } else if (payload.status === 'error') {
      // Call failed
    }
  }
});
```

### Consent Message Types

- `{ Ok: consentInfo }` — canister implements ICRC-21, message came from the canister itself
- `{ Warn: { consentInfo, canisterId, method, arg } }` — signer generated a fallback message (for `icrc1_transfer`, `icrc2_approve`, `icrc2_transfer_from`)

Always distinguish these in UI — warn the user when the message is signer-generated, not canister-verified.

### Disconnect

```typescript
signer.disconnect();
```

Removes all listeners and resets origin. Call on page unload or when the wallet session ends.

## Error Handling

### Error Codes (SignerErrorCode)

| Code | Name | Meaning |
|------|------|---------|
| 500 | `ORIGIN_ERROR` | Origin mismatch — relying party origin not allowed |
| 501 | `PERMISSIONS_PROMPT_NOT_REGISTERED` | Signer has no prompt registered for the request |
| 502 | `SENDER_NOT_ALLOWED` | `sender` in canister call doesn't match signer's `owner` |
| 503 | `BUSY` | Signer is already processing another request |
| 504 | `NOT_INITIALIZED` | Signer's `owner` identity not set |
| 1000 | `GENERIC_ERROR` | Catch-all error |
| 2000 | `REQUEST_NOT_SUPPORTED` | Method not supported by signer |
| 3000 | `PERMISSION_NOT_GRANTED` | Permission denied for requested feature |
| 3001 | `ACTION_ABORTED` | User explicitly rejected/cancelled the action |
| 4000 | `NETWORK_ERROR` | IC call or network failure |

### Client-Side Error Classes

```typescript
import {RelyingPartyResponseError} from '@dfinity/oisy-wallet-signer';

try {
  await wallet.transfer({...});
} catch (err) {
  if (err instanceof RelyingPartyResponseError) {
    // err.code matches SignerErrorCode values
    // err.message contains human-readable description
  }
}
```

`RelyingPartyDisconnectedError` is thrown if the wallet popup closes unexpectedly.

## Engineering Rules

1. **One signer request at a time.** The signer sets a `busy` flag — concurrent requests return error 503.
2. **Never auto-trigger signing on connect.** `connect()` only establishes the channel. Always let the user initiate actions.
3. **Prepare full payload before calling signer.** All parameters (amount, recipient, canisterId) must be ready.
4. **Handle cancel/reject cleanly.** The user can reject at permissions, consent, or any prompt stage.
5. **Do not assume "connected = authenticated session".** Connection is just a postMessage channel, not an identity delegation.
6. **Always call `disconnect()`** when done — on both signer and relying party sides.
7. **Register all prompts before handling requests** on the signer side. Missing prompts cause error 501.
8. **`sender` must match `owner`.** The signer validates that the `sender` field in `icrc49_call_canister` matches the signer's `owner` identity.
9. **Read-only requests bypass busy state.** `icrc29_status` and `icrc25_supported_standards` always work, even when the signer is busy.
10. **Permissions expire.** Default: 7 days. After expiration, permissions revert to `ask_on_use`.

## Permission States

| State | Constant | Behavior |
|-------|----------|----------|
| Granted | `ICRC25_PERMISSION_GRANTED` | Request proceeds without prompting |
| Denied | `ICRC25_PERMISSION_DENIED` | Request rejected immediately (error 3000) |
| Ask on use | `ICRC25_PERMISSION_ASK_ON_USE` | User prompted when feature is accessed (default) |

Permissions are stored in `localStorage` keyed by `oisy_signer_{origin}_{owner}` and include creation/update timestamps.

## Typical Lifecycle

```
1. dApp: IcrcWallet.connect({url})         → opens popup, polls icrc29_status
2. dApp: wallet.requestPermissionsNotGranted() → prompts user if needed
3. dApp: wallet.accounts()                  → signer prompts, returns accounts
4. dApp: wallet.transfer({...})             → signer fetches consent message (ICRC-21)
                                               → signer prompts user with consent
                                               → signer executes canister call
                                               → returns block index
5. dApp: wallet.disconnect()                → closes popup, cleans up
```

## Window Configuration

Default popup: 576x625px, top-right position. Exported constants available:

```typescript
import {
  DEFAULT_SIGNER_WINDOW_TOP_RIGHT,
  DEFAULT_SIGNER_WINDOW_CENTER,
  DEFAULT_SIGNER_WINDOW_SIZE
} from '@dfinity/oisy-wallet-signer';
```

## Local Development

For local replica development, pass `host` to both signer and relying party:

```typescript
// Relying party
const wallet = await IcrcWallet.connect({
  url: 'http://localhost:5173/sign',
  host: 'http://localhost:4943'
});

// Signer
const signer = Signer.init({
  owner: identity,
  host: 'http://localhost:4943'
});
```

## Common Mistakes

- Importing `Signer` from `'@dfinity/oisy-wallet-signer'` instead of `'@dfinity/oisy-wallet-signer/signer'`
- Forgetting to register all four prompts before the signer handles requests
- Using `IcrcWallet` without providing `ledgerCanisterId` (it's required, unlike `IcpWallet`)
- Not handling the `loading` → `result`/`error` state transitions in consent message prompts
- Assuming connection means the user is authenticated or permissions are granted
- Sending concurrent requests to the signer (only one at a time)
- Not calling `disconnect()` on cleanup, leaking event listeners and open windows
