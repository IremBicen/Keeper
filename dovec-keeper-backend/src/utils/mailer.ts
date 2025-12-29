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

const port = SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587;
// For Microsoft Exchange/Office 365:
// - Port 587 uses STARTTLS (secure: false, requireTLS: true) - RECOMMENDED
// - Port 465 uses direct SSL (secure: true) - but may not work with all Exchange servers
const secure =
  typeof SMTP_SECURE === "string"
    ? SMTP_SECURE.toLowerCase().startsWith("true")
    : port === 465; // Auto-detect: true for 465, false for 587

console.log(`SMTP Configuration: host=${SMTP_HOST || "mail.dovecgroup.com"}, port=${port}, secure=${secure}`);

// Create transporter with proper configuration for Microsoft Exchange
const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "mail.dovecgroup.com",
  port,
  secure, // true for 465 (SSL), false for 587 (STARTTLS)
  auth:
    SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  // For Microsoft Exchange/Office 365
  tls: {
    // Verify certificate (default behavior - certificate should be valid now)
    rejectUnauthorized: true,
  },
  // Connection timeout
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
  // For port 587 with STARTTLS, require TLS upgrade
  requireTLS: !secure && port === 587, // Require TLS for STARTTLS connections (port 587)
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


