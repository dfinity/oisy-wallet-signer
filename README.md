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




