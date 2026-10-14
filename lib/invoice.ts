import type { Booking, BookingItem } from '@/lib/database.types';

function formatPrice(amount: number): string {
  return '\u20B9' + amount.toLocaleString('en-IN');
}

export function generateInvoicePDF(booking: Booking & { booking_items: BookingItem[] }) {
  const invoiceDate = new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const scheduledDate = booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

  const items = booking.booking_items || [];

  // Build an HTML invoice that looks official
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice - ${booking.booking_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #ff751f; }
  .logo { font-size: 28px; font-weight: 800; color: #ff751f; letter-spacing: -1px; }
  .logo-sub { font-size: 11px; color: #666; margin-top: 2px; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 32px; font-weight: 300; color: #333; letter-spacing: 4px; text-transform: uppercase; }
  .invoice-title .inv-number { font-size: 14px; color: #ff751f; font-weight: 600; margin-top: 4px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .meta-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 8px; }
  .meta-section p { font-size: 13px; color: #333; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  thead th { background: #f8f8f8; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #eee; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  tbody td:last-child { text-align: right; font-weight: 500; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-table { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #555; }
  .totals-row.total { border-top: 2px solid #1a1a1a; padding-top: 14px; margin-top: 8px; font-size: 18px; font-weight: 700; color: #1a1a1a; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999; line-height: 1.6; }
  .footer strong { color: #ff751f; }
  .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
  .status-pending { background: #fef3cd; color: #856404; }
  .status-confirmed { background: #d4edda; color: #155724; }
  .status-completed { background: #d4edda; color: #155724; }
  .status-cancelled { background: #f8d7da; color: #721c24; }
  .status-in_progress { background: #cce5ff; color: #004085; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo"><img src="/images/logo.jpg" style="height: 36px; vertical-align: middle; border-radius: 8px; margin-right: 8px; margin-bottom: 4px;" alt="ZARPIT" /> ZARPIT</div>
      <div class="logo-sub">Connecting Needs with Opportunities</div>
      <div class="logo-sub" style="margin-top:8px">zarpittechservices@gmail.com</div>
      <div class="logo-sub">Greater Noida, Uttar Pradesh</div>
    </div>
    <div class="invoice-title">
      <h1>Invoice</h1>
      <div class="inv-number">${booking.booking_number}</div>
      <div style="font-size:12px;color:#999;margin-top:8px">${invoiceDate}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-section">
      <h3>Service Details</h3>
      <p>
        <strong>Date:</strong> ${scheduledDate}<br>
        <strong>Time:</strong> ${booking.scheduled_time || 'N/A'}<br>
        <strong>Payment:</strong> ${booking.payment_method || 'Cash After Service'}<br>
        <strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status?.replace('_', ' ')}</span>
      </p>
    </div>
    <div class="meta-section" style="text-align:right">
      <h3>Service Address</h3>
      <p style="max-width:250px;margin-left:auto">${booking.address || 'N/A'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Service</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.service_name}</td>
        <td>${item.quantity}</td>
        <td>${formatPrice(item.unit_price)}</td>
        <td>${formatPrice(item.unit_price * item.quantity)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Subtotal</span><span>${formatPrice(booking.subtotal)}</span></div>
      ${booking.discount > 0 ? `<div class="totals-row"><span>Discount</span><span style="color:#22c55e">-${formatPrice(booking.discount)}</span></div>` : ''}
      <div class="totals-row"><span>Tax (0% GST)</span><span>${formatPrice(booking.tax)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${formatPrice(booking.total)}</span></div>
    </div>
  </div>

  ${booking.special_instructions ? `
  <div style="margin-top:24px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #eee">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:6px">Special Instructions</div>
    <p style="font-size:13px;color:#555">${booking.special_instructions}</p>
  </div>` : ''}

  <div class="footer">
    <p>Thank you for choosing <strong>ZARPIT</strong></p>
    <p>This is a computer-generated invoice and does not require a signature.</p>
    <p style="margin-top:8px">For queries, contact <strong>zarpittechservices@gmail.com</strong></p>
  </div>
</body>
</html>`;

  // Open in new window and trigger print (which allows PDF save)
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to render then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
