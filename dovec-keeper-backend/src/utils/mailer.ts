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
    : true; // Default to true for port 465

// Create transporter with proper configuration for Microsoft Exchange
const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "mail.dovecgroup.com",
  port,
  secure, // true for 465, false for other ports
  auth:
    SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  // For Microsoft Exchange/Office 365, verify certificate properly
  tls: {
    // Verify certificate (default behavior - certificate should be valid now)
    rejectUnauthorized: true,
  },
  // Connection timeout
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export async function sendWelcomePasswordEmail(
  toEmail: string,
  name: string,
  password: string
) {
  if (!toEmail || !password) {
    throw new Error("Email address and password are required");
  }

  // Verify SMTP connection before sending
  try {
    await transporter.verify();
    console.log("SMTP server is ready to send emails");
  } catch (verifyError: any) {
    console.error("SMTP verification failed:", verifyError);
    throw new Error(
      `SMTP connection failed: ${verifyError.message || "Unknown error"}. Please check SMTP configuration.`
    );
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

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (sendError: any) {
    console.error("Error sending email:", sendError);
    throw new Error(
      `Failed to send email: ${sendError.message || "Unknown error"}. Check SMTP credentials and server configuration.`
    );
  }
}


