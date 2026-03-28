import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { OrgSettings, Quote } from "@/types";
import { formatMXN } from "@/lib/utils";

export async function generateAndSharePDF(quote: Quote, settings: OrgSettings | null): Promise<void> {
  const businessName = settings?.business_name ?? "Mi Negocio";
  const logoUrl = settings?.logo_url;

  const itemsHtml = (quote.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #E2E8F0;">${item.description}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #E2E8F0; text-align:center;">${item.qty}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #E2E8F0; text-align:right;">${formatMXN(item.unit_price)}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #E2E8F0; text-align:right;">${formatMXN(item.line_total)}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0F172A; background:#fff; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; padding-bottom:24px; border-bottom:3px solid #1E40AF; }
    .logo { font-size:28px; font-weight:700; color:#1E40AF; }
    .logo img { max-height:60px; max-width:180px; }
    .folio-block { text-align:right; }
    .folio-number { font-size:22px; font-weight:700; color:#1E40AF; }
    .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; background:${quote.status === "sent" ? "#D1FAE5" : "#FEF3C7"}; color:${quote.status === "sent" ? "#065F46" : "#92400E"}; margin-top:6px; }
    .meta { display:flex; justify-content:space-between; margin-bottom:32px; }
    .meta-block h3 { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#64748B; margin-bottom:6px; }
    .meta-block p { font-size:14px; color:#0F172A; line-height:1.5; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    thead tr { background:#1E40AF; color:#fff; }
    thead th { padding:10px 12px; text-align:left; font-size:13px; font-weight:600; }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align:center; }
    thead th:last-child { text-align:right; }
    thead th:nth-child(3) { text-align:right; }
    tbody tr:nth-child(even) { background:#F8FAFF; }
    .totals { margin-left:auto; width:280px; }
    .total-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
    .total-row.grand { border-top:2px solid #1E40AF; margin-top:8px; padding-top:10px; font-weight:700; font-size:16px; color:#1E40AF; }
    .footer { margin-top:48px; text-align:center; font-size:12px; color:#94A3B8; border-top:1px solid #E2E8F0; padding-top:16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      ${logoUrl ? `<img src="${logoUrl}" alt="${businessName}"/>` : businessName}
    </div>
    <div class="folio-block">
      <div class="folio-number">${quote.number ?? "BORRADOR"}</div>
      <div class="status-badge">${quote.status === "sent" ? "Enviado" : "Borrador"}</div>
      <div style="font-size:13px; color:#64748B; margin-top:6px;">Fecha: ${quote.issue_date}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h3>Cliente</h3>
      ${quote.customer ? `
        <p><strong>${quote.customer.name}</strong></p>
        ${quote.customer.email ? `<p>${quote.customer.email}</p>` : ""}
        ${quote.customer.phone ? `<p>${quote.customer.phone}</p>` : ""}
      ` : `<p style="color:#94A3B8;">Sin cliente</p>`}
    </div>
    <div class="meta-block" style="text-align:right;">
      <h3>Moneda</h3>
      <p>${quote.currency}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:right;">Precio Unit.</th>
        <th style="text-align:right;">Total Línea</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${formatMXN(quote.subtotal)}</span></div>
    <div class="total-row"><span>IVA</span><span>${formatMXN(quote.tax_total)}</span></div>
    <div class="total-row grand"><span>Total</span><span>${formatMXN(quote.total)}</span></div>
  </div>

  <div class="footer">
    ${businessName} · Cotización generada con Cotizador App
  </div>
</body>
</html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (Platform.OS === "web") {
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Cotización ${quote.number ?? "Borrador"}`,
      UTI: "com.adobe.pdf",
    });
  }
}
