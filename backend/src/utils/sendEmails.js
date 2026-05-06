import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ type, data }) => {
  let subject = "";
  let text = "";

  /* ------------------------------------------------ */
  /* STANDARD CONTACT TYPES                           */
  /* ------------------------------------------------ */

  if (type === "inquiry") {
    subject = `[Inquiry] ${data.subject}`;
  }

  if (type === "commission") {
    subject = `[Commission] ${data.subject}`;
  }

  if (type === "purchase") {
    subject = `[Purchase] ${data.subject}`;
  }

  if (type === "collaboration") {
    subject = `[Collaboration] ${data.subject}`;
  }

  if (
    type === "inquiry" ||
    type === "commission" ||
    type === "purchase" ||
    type === "collaboration"
  ) {
    text = `
New Contact Request

Type: ${type}

Name: ${data.name}
Email: ${data.email}

Subject:
${data.subject}

Message:
${data.message}
    `;
  }

  /* ------------------------------------------------ */
  /* CART PURCHASE                                    */
  /* ------------------------------------------------ */

  if (type === "cart_purchase") {
    subject = `[Cart Purchase] New Multi-Artwork Inquiry`;

    const itemsList = data.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.title} (${item.type}) x${
            item.quantity
          } - INR ${(item.price * item.quantity).toLocaleString()}`,
      )
      .join("\n");

    text = `
NEW CART PURCHASE INQUIRY

Buyer Information
--------------------------
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

Shipping Address
--------------------------
${data.address}

Selected Artworks
--------------------------
${itemsList}

Total
--------------------------
INR ${data.total.toLocaleString()}

Additional Notes
--------------------------
${data.notes || "None"}
    `;
  }

  /* ------------------------------------------------ */
  /* SEND TO ADMIN                                    */
  /* ------------------------------------------------ */

  await resend.emails.send({
    from: "Paper Slayer <contact@paperslayer.in>",
    to: process.env.EMAIL_USER,
    replyTo: data.email,
    subject,
    text,
  });

  /* ------------------------------------------------ */
  /* AUTO REPLY TO USER                               */
  /* ------------------------------------------------ */

  await resend.emails.send({
    from: "Paper Slayer <contact@paperslayer.in>",
    to: data.email,
    subject: "We received your message",
    text: "Thank you for reaching out. Your inquiry has been received successfully.",
  });
};
