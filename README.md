# 👛 OISY Wallet Signer

A library designed to facilitate communication between a dApp and the [OISY Wallet](https://oisy.com) on the [Internet Computer](https://internetcomputer.org/).

<div align="center" style="display:flex;flex-direction:column;">
<br/>

[![Internet Computer portal](https://img.shields.io/badge/Internet-Computer-grey?logo=internet%20computer)](https://internetcomputer.org)
[![GitHub CI Checks Workflow Status](https://img.shields.io/github/actions/workflow/status/dfinity/oisy-wallet-signer/checks.yml?logo=github&label=CI%20checks)](https://github.com/dfinity/oisy-wallet-signer/actions/workflows/checks.yml)
[![GitHub CI Tests Workflow Status](https://img.shields.io/github/actions/workflow/status/dfinity/oisy-wallet-signer/tests.yml?logo=github&label=CI%20tests)](https://github.com/dfinity/oisy-wallet-signer/actions/workflows/tests.yml)

</div>

## 🚀 Introduction

OISY Wallet Signer is a lightweight library designed to connect dApps with the OISY Wallet on the Internet Computer, enabling secure message signing and transaction approvals.

It implements various ICRC standards that have been discussed and developed by the [Identity and Wallet Standards Working Group](https://github.com/dfinity/wg-identity-authentication/).

While primarily developed for OISY, the library can be integrated into any wallet or project seeking signer capabilities.

Additionally, it includes opinionated clients that enable interactions with the ICP or ICRC ledgers without the need for any specific JavaScript framework, making the library fully agnostic.

## 🖥️ Installation

```bash
# with npm
npm install --save-dev @dfinity/oisy-wallet-signer
# with pnpm
pnpm add --save-dev @dfinity/oisy-wallet-signer
# with yarn
yarn add -D @dfinity/oisy-wallet-signer
```

## ✍️ Usage in a Wallet

To use the OISY Wallet Signer within your wallet or project, follow these steps:

### 1. Initialize a Signer

Turning your application into a signer that starts listening and processing ICRC messages requires the initialization of a `Signer` object.

```typescript
import { Signer } from '@dfinity/oisy-wallet-signer/signer';

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
signer?.disconnect();
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
    prompt: ({ confirm: confirmScopes, requestedScopes }: PermissionsPromptPayload) => {
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
    prompt: ({ approve: approveAccounts }: AccountsPromptPayload) => {
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
    prompt: ({ status, ...rest }: ConsentMessagePromptPayload) => {
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
   prompt: ({ status: callCanisterStatus, ...rest }: CallCanisterPromptPayload) => {
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

## ✍️ Usage in a Client

As mentioned in the introduction, this library is primarily developed for OISY. However, it also includes opinionated clients that enable interactions with the ICP or ICRC ledgers in any JavaScript application.

> [!IMPORTANT]
> These clients are not yet used by any known dApps, which is why they currently only support ICRC-1 transfers. If you wish to use other ICRC methods or ICP transfers, please reach out.

