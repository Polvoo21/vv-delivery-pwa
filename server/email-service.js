import nodemailer from "nodemailer";

let transporter = null;
let transporterKey = "";

function clean(value) {
  return String(value || "").trim();
}

function getConfig() {
  return {
    host: clean(process.env.SMTP_HOST),
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "0",
    user: clean(process.env.SMTP_USER),
    password: clean(process.env.SMTP_PASSWORD),
    from: clean(process.env.EMAIL_FROM || process.env.SMTP_USER)
  };
}

export function isEmailDeliveryConfigured() {
  const config = getConfig();
  return Boolean(config.host && config.port && config.user && config.password && config.from);
}

export function getEmailDeliveryPublicConfig() {
  return {
    available: isEmailDeliveryConfigured(),
    required: process.env.EMAIL_VERIFICATION_REQUIRED === "1"
  };
}

function getTransporter() {
  const config = getConfig();
  if (!isEmailDeliveryConfigured()) {
    const error = new Error("Отправка email еще не настроена");
    error.statusCode = 503;
    throw error;
  }

  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    transporterKey = key;
  }

  return { config, transporter };
}

export async function sendEmailVerificationCode({ email, code }) {
  const { config, transporter: mailer } = getTransporter();
  const safeCode = String(code || "").replace(/\D/g, "").slice(0, 6);
  if (safeCode.length !== 6) throw new Error("Некорректный код подтверждения email");

  await mailer.sendMail({
    from: config.from,
    to: email,
    subject: `${safeCode} — подтверждение email «Вместе Вкуснее»`,
    text: `Код подтверждения: ${safeCode}\n\nОн действует 10 минут. Если вы не запрашивали код, просто проигнорируйте письмо.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#202124">
        <p style="margin:0 0 12px;color:#68707c">Вместе Вкуснее</p>
        <h1 style="margin:0 0 16px;font-size:26px">Подтвердите email</h1>
        <p style="margin:0 0 20px;line-height:1.5">Введите этот код на сайте:</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#ca7767">${safeCode}</div>
        <p style="margin:24px 0 0;color:#68707c;line-height:1.5">Код действует 10 минут. Если вы не запрашивали его, письмо можно проигнорировать.</p>
      </div>
    `
  });
}
