#!/usr/bin/env bash

dfx deploy internet_identity --specified-id rdmx6-jaaaa-aaaaa-aaadq-cai

dfx deploy relying_party_backend
dfx deploy relying_party_frontend

./scripts/download.icp.sh
./scripts/deploy.icp_ledger.sh
./scripts/deploy.icp_index.sh

dfx identity use default
PRINCIPAL="$(dfx identity get-principal)"
dfx deploy wallet_backend --argument "$(didc encode '(record {owners = vec { principal"'${PRINCIPAL}'";}})' --format hex)" --argument-type raw --mode reinstall

dfx deploy wallet_frontend