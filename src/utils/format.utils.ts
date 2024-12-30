export const formatAmount = ({amount, decimals}: {amount: bigint; decimals: number}): string => {
  const converted = Number(amount) / 10 ** decimals;

  // For ease of readability we want to display two decimals at least but, handle edge case where ledgers have none or 1 decimal set.
  const minimumFractionDigits = decimals >= 1 ? 1 : decimals;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits: decimals
  }).format(converted);
};

export const formatDate = (nanoseconds: bigint): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short'
  };

  const date = new Date(Number(nanoseconds / 1_000_000n));
  return date.toLocaleDateString('en', options);
};
