export const formatAmount = ({amount, decimals}: {amount: bigint; decimals: number}): string => {
  const converted = Number(amount) / 10 ** decimals;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals
  }).format(converted);
};
