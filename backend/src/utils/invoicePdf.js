function escapePdfText(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toPdfBuffer(lines) {
  const content = ["BT", "/F1 11 Tf", "50 780 Td", "14 TL"];
  lines.forEach((line, index) => {
    if (index > 0) content.push("T*");
    content.push(`(${escapePdfText(line)}) Tj`);
  });
  content.push("ET");

  const stream = content.join("\n");

  const objects = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj");
  objects.push("3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>endobj");
  objects.push("4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj");
  objects.push(`5 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}

export function generateInvoicePdf(order) {
  const lines = [
    "MARAN FARMS - TAX INVOICE",
    `Invoice No: ${order.invoice?.invoiceNumber || "N/A"}`,
    `Order No: ${order.orderNumber}`,
    `Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`,
    "",
    `Customer: ${order.deliveryDetails.fullName}`,
    `Phone: ${order.deliveryDetails.phone}`,
    `Address: ${order.deliveryDetails.address} - ${order.deliveryDetails.pincode}`,
    "",
    "Items:"
  ];

  order.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.productName} | Qty ${item.quantity} | Unit Rs.${item.unitPrice} | Total Rs.${item.subtotal}`
    );
  });

  lines.push("");
  lines.push(`Subtotal: Rs.${order.subtotal.toFixed(2)}`);
  lines.push(`Discount: Rs.${order.discountAmount.toFixed(2)}`);
  lines.push(`Savings: Rs.${order.savingsAmount.toFixed(2)}`);
  lines.push(`Delivery: Rs.${order.deliveryCharge.toFixed(2)}`);
  lines.push(`Grand Total: Rs.${order.totalAmount.toFixed(2)}`);
  lines.push(`Payment Status: ${order.paymentStatus.toUpperCase()}`);

  return toPdfBuffer(lines);
}
