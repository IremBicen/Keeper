import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

// Explicitly load backend .env (two levels up from dist/utils in production)
dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  FROM_EMAIL,
} = process.env;

const port = SMTP_PORT ? parseInt(SMTP_PORT, 10) : 465;
const secure =
  typeof SMTP_SECURE === "string"
    ? SMTP_SECURE.toLowerCase().startsWith("true")
    : true;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "mail.dovecgroup.com",   // fallback to real SMTP host
  port,
  secure,
  auth:
    SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
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
    subject: "Keeper'a Hoş Geldiniz - Giriş Bilgileriniz",
    text: [
      `Merhaba ${name || ""},`.trim(),
      "",
      "Keeper'a hoş geldiniz!",
      "",
      "Giriş bilgileriniz aşağıdadır:",
      `E-posta: ${toEmail}`,
      `Şifre: ${password}`,
      "",
      "Lütfen bu bilgileri kimseyle paylaşmayın ve güvenli bir yerde saklayın.",
      "",
      "İyi çalışmalar,",
      "Keeper Ekibi",
    ].join("\n"),
  };

  await transporter.sendMail(mailOptions);
}


