export const mockConsentMessageIcrc1Transfer = ({
  walletUserId,
  partyUserId,
  tokenSymbol,
  tokenName
}: {
  walletUserId: string;
  partyUserId: string;
  tokenSymbol: 'ICP' | 'TKN';
  tokenName: 'Internet Computer' | 'Token';
}): string => `# Send ${tokenName}

You are approving a transfer of funds from your account.

**From:**
\`${walletUserId}\`

**Amount:** \`0.5 ${tokenSymbol}\`

**To:**
\`${partyUserId}\`

**Fees:** \`0.0001 ${tokenSymbol}\`
Charged for processing the transfer.`;

export const mockConsentMessageIcrc2Approve = ({
  walletUserId,
  partyUserId,
  tokenSymbol
}: {
  walletUserId: string;
  partyUserId: string;
  tokenSymbol: 'ICP' | 'TKN';
  tokenName: 'Internet Computer' | 'Token';
}): string => `# Approve spending

You are authorizing another address to withdraw funds from your account.

**From:**
\`${walletUserId}\`

**Approve to spender:**
\`${partyUserId}\`

**Requested allowance:** \`0.5 ${tokenSymbol}\`
This is the withdrawal limit that will apply upon approval.

**Approval expiration:**
This approval does not have an expiration.

**Approval fees:** \`0.0001 ${tokenSymbol}\`
Charged for processing the approval.
 
**Fees paid by:**
\`${walletUserId}\``;

export const mockConsentMessageIcrc2TransferFrom = ({
  walletUserId,
  partyUserId,
  tokenSymbol,
  tokenName
}: {
  walletUserId: string;
  partyUserId: string;
  tokenSymbol: 'ICP' | 'TKN';
  tokenName: 'Internet Computer' | 'Token';
}): string => `# Spend ${tokenName}

You are approving a transfer of funds from a withdrawal account.

**From:**
\`${walletUserId}\`

**Amount:** \`0.25 ${tokenSymbol}\`

**Spender:**
\`${walletUserId}\`

**To:**
\`${partyUserId}\`

**Fees:** \`0.0001 ${tokenSymbol}\` Charged for processing the transfer.`;
