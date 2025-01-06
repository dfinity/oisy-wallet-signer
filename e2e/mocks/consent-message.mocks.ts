export const mockConsentMessageIcrc1Transfer = ({
  walletUserId,
  partyUserId,
  tokenSymbol
}: {
  walletUserId: string;
  partyUserId: string;
  tokenSymbol: 'ICP' | 'TKN';
}): string => `# Approve the transfer of funds

**Amount:**
0.5 ${tokenSymbol}

**From:**
${walletUserId}

**To:**
${partyUserId}

**Fee:**
0.0001 ${tokenSymbol}`;

export const mockConsentMessageIcrc2Approve = ({
  walletUserId,
  partyUserId,
  tokenSymbol
}: {
  walletUserId: string;
  partyUserId: string;
  tokenSymbol: 'ICP' | 'TKN';
}): string => `# Authorize another address to withdraw from your account

**The following address is allowed to withdraw from your account:**
${partyUserId}

**Your account:**
${walletUserId}

**Requested withdrawal allowance:**
0.5 ${tokenSymbol}

⚠ The allowance will be set to 0.5 ${tokenSymbol} independently of any previous allowance. Until this transaction has been executed the spender can still exercise the previous allowance (if any) to it's full amount.

**Expiration date:**
No expiration.

**Approval fee:**
0.0001 ${tokenSymbol}
 
**Transaction fees to be paid by:**
${walletUserId}`;

export const mockConsentMessageIcrc2TransferFrom = ({
  walletUserId,
  partyUserId,
  tokenSymbol
}: {
  walletUserId: string;
  partyUserId: string;
  tokenSymbol: 'ICP' | 'TKN';
}): string => `# Transfer from a withdrawal account

**Withdrawal account:**
${walletUserId}

**Account sending the transfer request:**
${walletUserId}

**Amount to withdraw:**
0.25 ${tokenSymbol}

**To:**
${partyUserId}

**Fee paid by withdrawal account:**
0.0001 ${tokenSymbol}`;
