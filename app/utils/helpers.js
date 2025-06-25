export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'pkr' }).format(amount);
};

export const downloadCSV = (data, filename) => {
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map((row) => Object.values(row).map((v) => `"${v}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};