import { describe, expect, it } from "vitest";
import {
  customerReceiptEmail,
  escapeHtml,
  ownerNewOrderEmail,
  type OrderEmailData,
} from "./templates";

const order: OrderEmailData = {
  id: "00000000-0000-0000-0000-000000000123",
  reference: "KS-10428",
  customerName: "Asha <script>alert(1)</script> Patil",
  phone: "9876543210",
  whatsappOk: true,
  email: "asha@example.com",
  address: ["B-402, Shanti Residency", "Baner Road", "Pune 411045, Maharashtra"],
  pincodeServiceable: false,
  slot: "morning",
  note: "Ring twice & wait",
  items: [
    { name: "A2 Gir Cow Ghee", label: "500 ml", quantity: 2, lineTotalPaise: 290000 },
    { name: "A2 Fresh Milk", label: "1 L glass", quantity: 1, lineTotalPaise: 11000 },
  ],
  totalPaise: 301000,
};

describe("order emails", () => {
  it("escapes HTML", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });

  it("owner email has the essentials and never raw customer HTML", () => {
    const email = ownerNewOrderEmail(
      order,
      "https://shop.example/admin/orders/123",
      "peacock-brass",
    );
    expect(email.subject).toContain("KS-10428");
    expect(email.subject).toContain("₹3,010");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("Pincode not on the delivery list");
    expect(email.html).toContain("https://shop.example/admin/orders/123");
    expect(email.text).toContain("A2 Gir Cow Ghee 500 ml × 2: ₹2,900");
    expect(email.text).toContain("Early morning (6:00 – 9:00 am)");
  });

  it("customer receipt confirms nothing was charged", () => {
    const email = customerReceiptEmail(order, "peacock-brass");
    expect(email.subject).toBe("We've got your order request KS-10428");
    expect(email.text).toContain("Nothing has been charged.");
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("Pincode not on the delivery list");
  });
});
