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