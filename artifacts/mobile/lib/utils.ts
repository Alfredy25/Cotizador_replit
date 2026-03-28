export function formatMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateLocalId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function calcItemTotals(qty: number, unitPrice: number, taxRate: number) {
  const base = qty * unitPrice;
  const iva = base * taxRate;
  const lineTotal = base + iva;
  return { base, iva, lineTotal };
}

export function calcQuoteTotals(
  items: { qty: number; unit_price: number; tax_rate: number }[]
) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const item of items) {
    const base = item.qty * item.unit_price;
    const iva = base * item.tax_rate;
    subtotal += base;
    taxTotal += iva;
  }
  return { subtotal, tax_total: taxTotal, total: subtotal + taxTotal };
}
