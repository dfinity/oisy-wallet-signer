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

Any actions supported by the OISY Wallet Signer library has to be first granted by the user of your wallet or project as defined by the ICRC-25: Signer Interaction Standard.

If a permission is granted, an action can be performed. If never granted nor approved, the library will continue to prompt for permission each time the action is requested. If denied, it will deny the access to the actions and respond with an error to the client.

The permissions prompt is triggered upon explicit request by the client but, automatically as well if the signer detects that an action is called and those have never been set.

> [!NOTE]
> Permissions have a lifecycle which is currrently set to 7 days. This means that user of your wallet or project will potentially be prompted every week to re-confirm the permissions they have set.

```typescript
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

The callback receives two parameters:

- **`requestedScopes`**: The requested scopes that need to be approved or denied. For example, this could include permissions like listing accounts or initiating actions to call canisters.
- **`confirm`**: A callback that can be used to respond to the signer and, by extension, to the client, with the permissions that were granted or denied.

The flow works as follows:

1. The `prompt` callback is triggered by the signer.
2. In your app or wallet, you receive the `requestedScopes` and the `confirm` callback.
3. You either prompt your user to approve or deny the requested scopes, or your application automatically makes these decisions. For example, the result of this decision-making process might be stored in a variable called `yourScopes`.
4. Finally, you confirm the permissions to the signer by calling the callback: `confirm(yourScopes);`.
