const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, SMTP_FROM_NAME } = process.env;

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10) || 587,
        secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      })
    : null;

const fromAddress = `"${SMTP_FROM_NAME || "Objetos Perdidos"}" <${SMTP_FROM_EMAIL || SMTP_USER}>`;

async function sendVerificationCode(to, name, code) {
  if (!transporter) {
    console.log(`[SMTP no configurado] Código de verificación para ${to}: ${code}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: "Verifica tu cuenta - Objetos Perdidos",
      text: `Hola ${name}, tu código de verificación es: ${code}. Vence en 15 minutos.`,
      html: `<div style="font-family: sans-serif; max-width: 480px;">
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu código de verificación para Objetos Perdidos es:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #963455;">${code}</p>
        <p>Este código vence en 15 minutos.</p>
      </div>`
    });
  } catch (err) {
    console.error("Error al enviar correo de verificación por SMTP:", err.message);
    console.log(`[Respaldo] Código de verificación para ${to}: ${code}`);
  }
}

module.exports = { sendVerificationCode };
