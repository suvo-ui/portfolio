import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ type, data }) => {
  let subject = "";
  let text = "";
  let autoReplySubject = "We received your message";
  let autoReplyText =
    "Thank you for reaching out. Your message has been received and a reply will follow soon.";

  /* ------------------------------------------------ */
  /* CONTACT / SINGLE ARTWORK INQUIRIES               */
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
  /* CART PURCHASE INQUIRY                            */
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

==================================================

BUYER INFORMATION

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

==================================================

SHIPPING ADDRESS

${data.address}

==================================================

SELECTED ARTWORKS

${itemsList}

==================================================

TOTAL

INR ${data.total.toLocaleString()}

==================================================

ADDITIONAL NOTES

${data.notes || "None"}

==================================================
    `;

    autoReplySubject = "Your purchase inquiry was received";

    autoReplyText = `
Thank you for your purchase inquiry.

The studio has received your selected artworks and inquiry details successfully.

A response regarding availability, shipping, and next steps will follow shortly.

— Paper Slayer Studio
    `;
  }

  /* ------------------------------------------------ */
  /* SEND TO ADMIN                                    */
  /* ------------------------------------------------ */

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: data.email,
    subject,
    text,
  });

  /* ------------------------------------------------ */
  /* AUTO REPLY TO USER                               */
  /* ------------------------------------------------ */

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: data.email,
    subject: autoReplySubject,
    text: autoReplyText,
  });
};
