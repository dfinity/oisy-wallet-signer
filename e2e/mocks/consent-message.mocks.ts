export const mockConsentMessage = ({
  walletUserId,
  partyUserId
}: {
  walletUserId: string;
  partyUserId: string;
}): string => `# Approve the transfer of funds

**Amount:**
0.00000123 ICP

**From:**
${walletUserId}

**To:**
${partyUserId}

**Fee:**
0.0001 ICP`;
