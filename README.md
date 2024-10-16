# 👛 OISY Wallet Signer

A library designed to facilitate communication between a dApp and the [OISY Wallet](https://oisy.com) on the [Internet Computer](https://internetcomputer.org/).

<div align="center" style="display:flex;flex-direction:column;">
<br/>

[![Internet Computer portal](https://img.shields.io/badge/Internet-Computer-grey?logo=internet%20computer)](https://internetcomputer.org)
[![GitHub CI Checks Workflow Status](https://img.shields.io/github/actions/workflow/status/dfinity/oisy-wallet-signer/checks.yml?logo=github&label=CI%20checks)](https://github.com/dfinity/oisy-wallet-signer/actions/workflows/checks.yml)
[![GitHub CI Tests Workflow Status](https://img.shields.io/github/actions/workflow/status/dfinity/oisy-wallet-signer/tests.yml?logo=github&label=CI%20tests)](https://github.com/dfinity/oisy-wallet-signer/actions/workflows/tests.yml)

</div>

## :rocket: Introduction

OISY Wallet Signer is a lightweight library designed to connect dApps with the OISY Wallet on the Internet Computer, enabling secure message signing and transaction approvals.

It implements various ICRC standards that have been discussed and developed by the [Identity and Wallet Standards Working Group](https://github.com/dfinity/wg-identity-authentication/).

While primarily developed for OISY, the library can be integrated into any wallet or project seeking signer capabilities.

Additionally, it includes opinionated clients that enable interactions with the ICP or ICRC ledgers without the need for any specific JavaScript framework, making the library fully agnostic.

## 📚 Table of Contents

- [:computer: Installation](#computer-installation)
- [:writing_hand: Usage in a Wallet](#writing_hand-usage-in-a-wallet)
  - [1. Initialize a Signer](#1-initialize-a-signer)
  - [2. Implement the Disconnection](#2-implement-the-disconnection)
  - [3. Register Prompts](#3-register-prompts)
    - [A. Request Permissions](#a-request-permissions)
    - [B. Accounts](#b-accounts)
    - [C. Consent Message](#c-consent-message)
    - [D. Call Canister](#d-call-canister)
- [:writing_hand: Usage in a Client](#writing_hand-usage-in-a-client)
  - [1. Initialize a Wallet](#1-initialize-a-wallet)
  - [2. Implement the Disconnection](#2-implement-the-disconnection-1)
  - [3. Request Permissions and Accounts](#3-request-permissions-and-accounts)
  - [4. Call Canister](#4-call-canister)
- [:information_desk_person::️ Tips & Tricks](#information_desk_person-tips--tricks)
  - [Examples](#examples)
  - [Running Tests Locally](#running-tests-locally)
  - [Running E2E Tests Locally](#running-e2e-tests-locally)
  - [Developing with OISY Wallet](#developing-with-oisy-wallet)
- [:couple: Community](#couple-community)

## :computer: Installation

```bash
# with npm
npm install --save-dev @dfinity/oisy-wallet-signer
# with pnpm
pnpm add --save-dev @dfinity/oisy-wallet-signer
# with yarn
yarn add -D @dfinity/oisy-wallet-signer
```

## :writing_hand: Usage in a Wallet

To use the OISY Wallet Signer within your wallet or project, follow these steps:

### 1. Initialize a Signer

Turning your application into a signer that starts listening and processing ICRC messages requires the initialization of a `Signer` object.

```typescript
import {Signer} from '@dfinity/oisy-wallet-signer/signer';

const signer = Signer.init({
  owner
});
```

The `owner` is the non-anonymous identity that can interact with the signer. Commonly, it is the user of your app.

> [!TIP]
> When developing locally, you can initialize the signer with a parameter `host` that points to your local replica.
> By default, it uses `https://icp-api.io`

```typescript
const signer = Signer.init({
  owner,
  host: 'http://localhost:4943'
});
```

### 2. Implement the Disconnection

Before moving on, it's important to implement the disconnection of the signer. This can happen when your user signs out or when the component in which it is used is unmounted.

```typescript
signer.disconnect();
```

Disconnecting the signer removes its listener and also resets the origin indication with which it was communicating.

### 3. Register Prompts

The OISY Wallet Signer library supports various standards that require interaction with your application. For example, when a dApp requests the list of accounts supported by your wallet or project, you will need to provide this information, either by automatically responding or by asking your user to make a selection.

These types of interactions—where the client requests information from the signer, which then queries your app and sends the response back to the client—are managed by what we call "prompts" in this library.

That is why, to effectively implement these features, you need to register prompts in your application.

> [!WARNING]
> Registering the same prompt multiple times will overwrite the previously attached prompt. The library supports only one active prompt at a time.
> While this pattern has proven effective in the various applications where we've implemented the signer, be aware that this API is particularly subject to breaking changes for that reason.

#### A. Request Permissions

Any actions supported by the OISY Wallet Signer library has to be first granted by the user of your wallet or project as defined by the [ICRC-25: Signer Interaction Standard](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#icrc25_request_permissions).

If a permission is granted, an action can be performed. If never granted nor approved, the library will continue to prompt for permission each time the action is requested. If denied, it will deny the access to the actions and respond with an error to the client.

The permissions prompt is triggered upon explicit request by the client but, automatically as well if the signer detects that an action is called and those have never been set.

> [!NOTE]
> Permissions have a lifecycle that is currently set to 7 days. This means that users of your wallet or project may be prompted every week to re-confirm the permissions they have set.

```typescript
import {
  ICRC25_REQUEST_PERMISSIONS,
  type IcrcScope,
  type PermissionsConfirmation,
  type PermissionsPromptPayload
} from '@dfinity/oisy-wallet-signer';

let scopes: IcrcScope[] | undefined = undefined;
let confirm: PermissionsConfirmation | undefined = undefined;

signer.register({
  method: ICRC25_REQUEST_PERMISSIONS,
  prompt: ({confirm: confirmScopes, requestedScopes}: PermissionsPromptPayload) => {
    scopes = requestedScopes;
    confirm = confirmScopes;
  }
});
```

To register a prompt for permissions, you need to specify the method `ICRC25_REQUEST_PERMISSIONS` and provide a callback that will be executed by the library each time permissions are requested.

The `prompt` callback receives two parameters:

- **`requestedScopes`**: The requested scopes that need to be approved or denied. For example, this could include permissions like listing accounts or initiating actions to call canisters.
- **`confirm`**: A callback that can be used to respond to the signer and, by extension, to the client, with the permissions that were granted or denied.

The flow works as follows:

1. The `prompt` callback is triggered by the signer.
2. In your app or wallet, you receive the `requestedScopes` and the `confirm` callback.
3. You either prompt your user to approve or deny the requested scopes, or your application automatically makes these decisions. For example, the result of this decision-making process might be stored in a variable called `yourScopes`.
4. Finally, you confirm the permissions to the signer by calling the callback: `confirm(yourScopes);`.

#### B. Accounts

The client can request information about the accounts managed by your wallet or project. This behavior is defined by the [ICRC-27: Accounts](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_27_accounts.md) specification.

The corresponding prompt is triggered each time the account list is requested if the necessary permissions have been granted.

If the client requests the accounts and the permissions have been denied, the signer will automatically respond with an error. If the permissions have neither been granted nor denied, you will be prompted to make this decision first.

```typescript
import {
  ICRC27_ACCOUNTS,
  type AccountsApproval,
  type AccountsPromptPayload
} from '@dfinity/oisy-wallet-signer';

let approve: AccountsApproval | undefined = undefined;

signer.register({
  method: ICRC27_ACCOUNTS,
  prompt: ({approve: approveAccounts}: AccountsPromptPayload) => {
    approve = approveAccounts;
  }
});
```

To register a prompt for accounts, you need to specify the method `ICRC27_ACCOUNTS` and provide a callback that will be executed by the library each time accounts are requested.

The `prompt` callback receives a sole parameter:

- **`approve`**: A callback that can be used to respond to the signer and, by extension, to the client, with the accounts.

The flow works as follows:

1. The client requests the list of accounts.
2. The signer checks the permissions.
   a. If never granted or denied, the signer prompts you to confirm or deny the scopes.
   b. If denied, it responds with an error.
   c. If permissions are granted, the `prompt` callback is triggered by the signer.
3. In your app or wallet, you receive the `approve` callback.
4. You either prompt your user to select a list of accounts, or your application automatically decides which accounts can be shared. For example, you store those accounts in a variable called `yourAccounts`.
5. Finally, you approve the accounts to the signer by calling the callback: `approve(yourAccounts);`.

#### C. Consent Message

The signer will never execute a call to a canister without first prompting your wallet or project to approve or deny the action.

To provide explanation on the action being requested, the signer retrieves a, hopefully, human-readable consent message from the targeted canister, as defined by the [ICRC-21: Canister Call Consent Messages](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/ICRC-21/icrc_21_consent_msg.md) specification, and displays it for your user's review.

Since a consent message is only fetched when a canister call is requested, this prompt is triggered only if the necessary permissions to call canisters have been granted.

```typescript
import {
  type ConsentMessageApproval,
  type ConsentMessagePromptPayload,
  type ResultConsentMessage,
  type icrc21_consent_info,
  ICRC21_CALL_CONSENT_MESSAGE,
  type Rejection
} from '@dfinity/oisy-wallet-signer';

let approve: ConsentMessageApproval | undefined = undefined;
let reject: Rejection | undefined = undefined;
let consentInfo: icrc21_consent_info | undefined = undefined;

let loading = false;

signer.register({
  method: ICRC21_CALL_CONSENT_MESSAGE,
  prompt: ({status, ...rest}: ConsentMessagePromptPayload) => {
    switch (status) {
      case 'result': {
        approve = rest.approve;
        reject = rest.reject;
        consentInfo = rest.consentInfo;
        loading = false;
        break;
      }
      case 'loading': {
        loading = true;
        break;
      }
      default: {
        approve = undefined;
        reject = undefined;
        consentInfo = undefined;
        loading = false;
      }
    }
  }
});
```

To register a prompt for permissions, you need to specify the method `ICRC21_CALL_CONSENT_MESSAGE` and provide a callback that will be executed by the library each time a consent message is fetched.

The `prompt` callback receives several parameters:

- **`status`**: Fetching a consent message requires an **update call**, which can take a few seconds to complete. Additionally, the process might encounter errors due to networking issues or if the targeted canister does not implement such an API. For this reason, the callback might be triggered multiple times per call, each time providing a different status.
- **`approve`**: A callback used to approve the consent message. Approving the message instructs the signer to proceed with executing the requested call to the targeted canister.
- **`reject`**: A callback to reject the canister call, meaning no action will be taken, and the client will receive an error in response.
- **`consentInfo`**: The information containing the consent message, formatted in Markdown.

> [!NOTE]
> The OISY Wallet Signer currently supports only a generic display of the consent message.

The flow works as follows:

1. The client requests a call to a canister.
2. The signer checks the permissions:
   - If the permissions have neither been granted nor denied, the signer prompts you to confirm or deny the scopes.
   - If permissions have been denied, the signer responds with an error.
   - If permissions are granted, the `prompt` callback is triggered by the signer with the status `loading`.
3. The signer fetches the consent message:
   - If fetching the message fails, the callback is triggered with the status `error`, and the client is notified with an error.
   - If fetching succeeds, your app or wallet receives the consent information (`consentInfo`), along with the `approve` and `reject` callbacks.
4. You present the formatted consent message to your user and prompt them to either approve or deny the call to the canister.
5. Based on your user's decision, you either approve or reject the canister call:
   - To reject, you execute the callback `reject();`, which prompts the signer to respond to the client with an error.
   - To approve, you execute the callback `approve();`, instructing the signer to proceed with executing the canister call.

#### D. Call Canister

Calling a canister does not require direct interaction from your wallet or project. However, you might want to provide some visual feedback to your users while the call is being executed or to inform them when it succeeds or fails. For this purpose, you can register a prompt for the [ICRC-49: Call Canister](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_49_call_canister.md) specification.

The signer will execute the call only if the necessary permissions have been granted and the consent message has been approved.

```typescript
import {
  type CallCanisterPromptPayload,
  ICRC49_CALL_CANISTER,
  type Status
} from '@dfinity/oisy-wallet-signer';

let status: Status | undefined = undefined;

signer.register({
  method: ICRC49_CALL_CANISTER,
  prompt: ({status: callCanisterStatus, ...rest}: CallCanisterPromptPayload) => {
    status = callCanisterStatus;
  }
});
```

To register a prompt for a call to a canister, you need to specify the method `ICRC49_CALL_CANISTER` and provide a callback that will be executed by the library.

The `prompt` callback receives several parameters:

- **`status`**: The callback may be triggered multiple times per call, each time providing a different status: `loading`, `result`, or `error`.
- **`result`**: If the call to the canister succeeds, the prompt provides the results. These results include a `contentMap` and a `certificate`, both of which are blobs.
- **`error`**: If the call fails, any errors returned by the canister or network (if available) will be provided by the prompt.

> [!TIP]
> In OISY Wallet, we do not display the result or error. We only interpret the status, as the actual results of the call to the canister are expected to be handled by the client that requested the signer to execute the action.

The flow works as follows:

> [!NOTE]
> The flow that leads to executing the call to the canister is described in the previous chapter, "Consent Message." The following description assumes that the permissions and consent message have been approved.

1. Before initiating the call to the canister, the signer prompts to inform that the request is about to start, with the status set to `loading`.
2. The call to the canister is executed.
3. Upon receiving a result or error, the prompt is triggered with the appropriate status, and a corresponding response is sent to the client.

## :writing_hand: Usage in a Client

As mentioned in the introduction, this library is primarily developed for OISY. However, it also includes opinionated clients that enable interactions with the ICP or ICRC ledgers in any JavaScript application.

> [!IMPORTANT]
> These clients are not yet used by any known dApps, which is why they currently only support ICRC-1 transfers. If you wish to use other ICRC methods or ICP transfers, please reach out.

### 1. Initialize a Wallet

Communicating with a wallet or project that supports signer standards is initialized by creating a client.

> [!NOTE]
> In this and the following chapters, we use the `IcpWallet` client to interact with the ICP ledger through a signer. However, the approach is similar if you wish to communicate with an ICRC ledger through a signer; in that case, use the other exposed client, the `IcrcWallet`.

```typescript
import {IcpWallet} from '@dfinity/oisy-wallet-signer/icp-wallet';

const wallet = await IcpWallet.connect({
  url: 'https://staging.oisy.com/sign'
});
```

The `url` is the URL of the signer to which you would like to connect. In the case of OISY, the production URL is `https://staging.oisy.com/sign`. If you wish to connect to a local wallet or project, you can, for example, specify a URL like `http://localhost:5174/sign`.

In addition to this parameter, the connection can also be established with various additional parameters:

- **`windowOptions`**: Allows you to specify how the popup with the wallet or project that acts as a signer should be opened. You can define its position (e.g., centered or top-right) and set specific dimensions. By default, the signer is opened as a popup at the top-right edge of the user's browser on desktop or as a separate tab on mobile.
- **`connectionOptions`**: Lets you specify timeout and polling options when establishing the connection with the signer.
- **`onDisconnect`**: By providing this callback, your application can be notified if the user closes the signer window.

For example:

```typescript
import {IcpWallet} from '@dfinity/oisy-wallet-signer/icp-wallet';
import {DEFAULT_SIGNER_WINDOW_FEATURES} from '@dfinity/oisy-wallet-signer';

const onDisconnect = (): void => console.log('The user has close the wallet popup.');

const wallet = await IcpWallet.connect({
  windowOptions: {
    width: 576,
    height: 625,
    position: 'center',
    features: DEFAULT_SIGNER_WINDOW_FEATURES
  },
  url: 'http://localhost:5174/sign',
  onDisconnect
});
```

### 2. Implement the Disconnection

Before moving on, it's important to implement the disconnection of the wallet. This can happen when your user signs out or when the component in which it is used is unmounted.

```typescript
wallet.disconnect();
```

Disconnecting the wallet closes its popup, removes the listeners that are waiting for responses, and stops the polling that checks whether the wallet is still active.

### 3. Request Permissions and Accounts

When interacting with OISY, you don't need to explicitly request permissions to comply with the specification, as the signer library used by the wallet automatically handles permissions for you. However, based on the feedback we've gathered from early users, it seems that explicitly requesting permissions once, if necessary, before initiating any other actions provides a smoother and more intuitive experience.

Similarly, you might want to display information in your app about the account(s) available in the signer. This is especially relevant when integrating with OISY, as it currently supports a single account and can respond to account requests without prompting the user (assuming the permissions have already been granted).

For these reasons, we recommend chaining these two operations—requesting permissions and retrieving account information—after the connection has been established.

> [!NOTE]
> In the future, we may consider incorporating this pattern directly into the opinionated clients, so you won't need to implement it manually. If this approach resonates with you while using this library, please let us know.

```typescript
import {IcpWallet} from '@dfinity/oisy-wallet-signer/icp-wallet';
import type {IcrcAccount, IcrcScopeMethod, IcrcScopesArray} from '@dfinity/oisy-wallet-signer';

const wallet = await IcpWallet.connect({
  url: 'https://staging.oisy.com/sign'
});

const permissions = await wallet.permissions();

const requestPermissionsIfNeeded = async (): Promise<{allScopesGranted: boolean}> => {
  const findNotGranted = (permissions: IcrcScopesArray): IcrcScopeMethod[] =>
    permissions.filter(({state}) => state !== 'granted').map(({scope}) => scope);

  const notGrantedScopes = findNotGranted(permissions);

  if (notGrantedScopes.length === 0) {
    return {allScopesGranted: true};
  }

  const result = await wallet.requestPermissions({
    params: {
      scopes: notGrantedScopes
    }
  });

  const remainingNotGrantedScopes = findNotGranted(result ?? []);

  if (remainingNotGrantedScopes.length === 0) {
    return {allScopesGranted: true};
  }

  console.error('The wallet requires all permissions to be approved.');

  return {allScopesGranted: false};
};

const {allScopesGranted} = await requestPermissionsIfNeeded();

if (!allScopesGranted) {
  return;
}

const accounts = await wallet.accounts();

const account = accounts?.[0];
```

### 4. Call Canister

Finally, you are ready to call the canister to transfer ICP (or ICRC tokens if you are using `IcrcWallet`).

The opinionated clients of this library use the same interfaces as their counterparts that do not require a signer but operate imperatively—namely, `@dfinity/ledger-icp` and `@dfinity/ledger-icrc`. This means that any payload you provide as a request or receive as a response is identical to those used by these standard interfaces.

For example, let's say we want to transfer ICP from the account the user have in the wallet to the one registered in your client.

```typescript
import type {Account} from '@dfinity/ledger-icp';

const E8S_PER_ICP = 100_000_000n;
const ONE_ICP = 1n * E8S_PER_ICP;

const to: Account = {
  owner: YOUR_USER_PRINCIPAL,
  subaccount: []
};

const request = {
  owner: to,
  amount: ONE_ICP
};

await wallet.icrc1Transfer({
  owner: account.owner,
  request
});
```

The `request` argument is the payload for the transfer. It contains the standard information required to send ICP. In this example, the target recipient is the user signed in to your app (without a subaccount), and we aim to transfer 1 ICP.

To process the canister call, the request needs to be initiated for a known account, which is why the `owner` of the `icrc1Transfer` is set to the `account` that was resolved in the previous chapter.

## :information_desk_person: Tips & Tricks

### Examples

You can find various examples of the library's implementation in the [demo](./demo).

> [!TIP]
> These examples are implemented in Svelte v5.

- The [wallet](./demo/src/wallet_frontend) frontend app is a test application that demonstrates the signer's capabilities of the library.

- The [relying party](./demo/src/relying_party_frontend) is a client that contains two distinct routes:
  1. A [demo](./demo/src/relying_party_frontend/src/routes/+page.svelte) that simulates a "real-life" usage scenario of the library in an application, such as in a webshop.
  2. An extended [client](./demo/src/relying_party_frontend/src/routes/dev/+page.svelte) primarily used for end-to-end (E2E) testing, allowing for the evaluation of each standard separately.

### Running Tests Locally

Proceed as follows to run the test suite locally:

```bash
git clone https://github.com/dfinity/oisy-wallet-signer
cd oisy-wallet-signer
npm ci
npm run test
```

### Running E2E Tests Locally

While the test suite covers most cases, the library is also covered by some E2E tests that focus more on "happy path" scenarios rather than "extended edge cases".

To run these those locally, you'll need to install the Juno CLI. Follow the steps below:

1. Install Docker:

Make sure you have Docker installed on your machine ([Windows](https://docs.docker.com/desktop/install/windows-install/), [MacOS](https://docs.docker.com/desktop/install/mac-install/), or [Linux](https://docs.docker.com/desktop/install/linux-install/)).

> [!NOTE]
> For MacBooks with M processors, it is important to use Docker Desktop version 4.25.0 or later, ideally the latest available version.

2. Install Juno CLI:

```bash
npm i -g @junobuild/cli
```

3. Start the Demo:

Navigate to the [demo](./demo) directory and start the environment:

> [!NOTE]
> Each command should be run in a separate terminal or in the background.

```bash
cd demo
juno dev start
npm run dev:party
npm run dev:wallet
```

4. Run the Tests:

Return to the root directory and execute the tests:

```
npm run e2e
```

### Developing with OISY Wallet

The demo of a relying party can be used to test the integration of signer features within the OISY Wallet.

1. Install OISY Wallet

```bash
git clone https://github.com/dfinity/oisy-wallet
cd oisy-wallet
npm ci
npm run deploy
```

2. Start the local replica

Within the `oisy-wallet` folder:

```bash
dfx start
```

3. Run the demo

Navigate to the [demo](./demo) folder of the OISY Wallet Signer and start the demo on port `5173`:

```
npm run dev:party
```

4. Start OISY Wallet

In `oisy-wallet` project, run the local development server on port `5174`:

```bash
npm run dev
```

## :couple: Community

- [Identity and Wallet Standards](https://github.com/dfinity/wg-identity-authentication/)
- [Forum](https://forum.dfinity.org/)
- [Discord](https://discord.gg/E9FxceAg2j)
