import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  FROM_EMAIL,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
  secure: SMTP_SECURE === "true",
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendWelcomePasswordEmail(
  toEmail: string,
  name: string,
  password: string
) {
  if (!toEmail || !password) {
    return;
  }

  const fromAddress = FROM_EMAIL || SMTP_USER || "no-reply@keeper.local";

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: "Welcome to Keeper",
    text: [
      `Hello ${name || ""},`.trim(),
      "",
      "Welcome to Keeper!",
      "",
      "Here are your login details:",
      `Email: ${toEmail}`,
      `Password: ${password}`,
      "",
      "Please log in and change your password after your first login.",
      "",
      "Best regards,",
      "Keeper Team",
    ].join("\n"),
  };

  await transporter.sendMail(mailOptions);
}


