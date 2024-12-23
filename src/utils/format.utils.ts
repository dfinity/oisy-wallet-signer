export const formatAmount = ({amount, decimals}: {amount: bigint; decimals: number}): string => {
  const converted = Number(amount) / 10 ** decimals;

  // For ease of readability we want to display two decimals at least but, handle edge case where ledgers have none or 1 decimal set.
  const minimumFractionDigits = decimals >= 2 ? 2 : decimals;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits: decimals
  }).format(converted);
};
