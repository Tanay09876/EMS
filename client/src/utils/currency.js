export const currencyOptions = [
  { code: "INR", symbol: "Rs", label: "Rupees (Rs)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "Pound (£)" },
  { code: "JPY", symbol: "¥", label: "Yen (¥)" },
];

export const getCurrency = (codeOrSymbol = "INR") =>
  currencyOptions.find((currency) => currency.code === codeOrSymbol || currency.symbol === codeOrSymbol) ||
  currencyOptions[0];

export const formatMoney = (amount = 0, currencyCode, currencySymbol) => {
  const currency = getCurrency(currencyCode || currencySymbol);
  return `${currencySymbol || currency.symbol} ${Number(amount || 0).toLocaleString()}`;
};
