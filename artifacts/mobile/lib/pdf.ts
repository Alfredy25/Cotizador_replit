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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Inter', -apple-system, Helvetica, Arial, sans-serif; color: #1E293B; background:#fff; padding:50px; line-height: 1.5; }
    
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:50px; }
    .business-info { flex: 1; }
    .business-name { font-size:26px; font-weight:800; color:#1E40AF; text-transform: uppercase; letter-spacing: -0.02em; }
    .business-logo { max-height:70px; max-width:200px; object-fit: contain; }
    
    .quote-meta { text-align:right; }
    .quote-title { font-size:12px; font-weight:700; color:#64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .quote-number { font-size:32px; font-weight:800; color:#0F172A; margin-bottom: 8px; }
    
    .badges { display:flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
    .badge { padding:4px 12px; border-radius:6px; font-size:11px; font-weight:700; text-transform: uppercase; }
    .badge-status { background:${quote.status === "sent" ? "#DCFCE7" : "#FEF9C3"}; color:${quote.status === "sent" ? "#166534" : "#854D0E"}; }
    .badge-date { background:#F1F5F9; color:#475569; }

    .info-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; padding: 24px; background: #F8FAFF; border-radius: 12px; border: 1px solid #E2E8F0; }
    .info-section h3 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#1E40AF; margin-bottom:12px; border-bottom: 1px solid #DBEAFE; padding-bottom: 4px; }
    .info-content p { font-size:14px; color:#334155; margin-bottom: 2px; }
    .info-content .name { font-size:16px; font-weight:700; color:#0F172A; margin-bottom: 4px; }

    table { width:100%; border-collapse:separate; border-spacing: 0; margin-bottom:32px; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
    thead tr { background:#1E40AF; }
    thead th { padding:14px 16px; text-align:left; font-size:12px; font-weight:700; color:#fff; text-transform: uppercase; letter-spacing: 0.05em; }
    
    tbody td { padding:14px 16px; font-size:14px; color:#334155; border-bottom: 1px solid #F1F5F9; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:nth-child(even) { background:#FBFCFF; }
    
    .col-qty { width: 80px; text-align: center; }
    .col-price { width: 130px; text-align: right; }
    .col-total { width: 140px; text-align: right; font-weight: 600; color: #0F172A; }

    .summary-container { display: flex; justify-content: flex-end; }
    .summary-box { width:300px; background: #F8FAFF; padding: 20px; border-radius: 12px; border: 1px solid #E2E8F0; }
    .summary-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; color: #475569; }
    .summary-row.total { border-top:1.5px solid #E2E8F0; margin-top:12px; padding-top:14px; font-weight:800; font-size:18px; color:#1E40AF; }

    .footer { margin-top:60px; text-align:center; }
    .footer-text { font-size:12px; color:#94A3B8; margin-bottom: 4px; }
    .footer-accent { font-size:11px; font-weight: 700; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-info">
      ${logoUrl ? `<img src="${logoUrl}" class="business-logo" alt="${businessName}"/>` : `<div class="business-name">${businessName}</div>`}
    </div>
    <div class="quote-meta">
      <div class="quote-title">Cotización</div>
      <div class="quote-number">${quote.number ?? "Borrador"}</div>
      <div class="badges">
        <div class="badge badge-date">Emitido: ${quote.issue_date}</div>
        <div class="badge badge-status">${quote.status === "sent" ? "Enviado" : "Borrador"}</div>
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h3>Información del Cliente</h3>
      <div class="info-content">
        ${quote.customer ? `
          <p class="name">${quote.customer.name}</p>
          ${quote.customer.email ? `<p>${quote.customer.email}</p>` : ""}
          ${quote.customer.phone ? `<p>${quote.customer.phone}</p>` : ""}
        ` : `<p style="color:#94A3B8; font-style: italic;">Sin cliente asignado</p>`}
      </div>
    </div>
    <div class="info-section" style="text-align: right;">
      <h3>Detalles de Pago</h3>
      <div class="info-content">
        <p>Moneda: <strong>${quote.currency}</strong></p>
        <p>Método: Transferencia Bancaria</p>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción del Servicio / Producto</th>
        <th class="col-qty">Cant.</th>
        <th class="col-price">Precio Unit.</th>
        <th class="col-total">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="summary-container">
    <div class="summary-box">
      <div class="summary-row"><span>Subtotal</span><span>${formatMXN(quote.subtotal)}</span></div>
      <div class="summary-row"><span>Impuestos (IVA)</span><span>${formatMXN(quote.tax_total)}</span></div>
      <div class="summary-row total"><span>Total General</span><span>${formatMXN(quote.total)}</span></div>
    </div>
  </div>

  <div class="footer">
    <p class="footer-text">Gracias por su preferencia.</p>
    <p class="footer-accent">${businessName} &middot; Cotizador Profesional</p>
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
