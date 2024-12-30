export const mockConsentMessage = ({
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
