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

  // Send to admin
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: data.email,
    subject,
    text,
  });

  // Auto reply to user
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: data.email,
    subject: "We received your message",
    text: "Thank you for reaching out. Your message has been received and a reply will follow soon.",
  });
};
