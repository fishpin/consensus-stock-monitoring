const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatCurrency = (n) => currency.format(Math.round(n * 100) / 100);
