/**
 * emailService.js — Envio real de emails via SMTP (Nodemailer).
 *
 * Suporta Gmail, Outlook, Yahoo, ou qualquer SMTP genérico.
 * Para activar:
 *   1. Gmail: criar "App Password" em https://myaccount.google.com/apppasswords
 *   2. Preencher SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS em .env
 *   3. Reiniciar o backend
 *
 * Sem credenciais → entra em modo "mock" e apenas regista no log.
 */
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const config = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromName: process.env.EMAIL_FROM_NAME || 'AlertaClima · AMOSA',
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@amosa.org.mz',
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5173',
  unsubscribeSecret: process.env.UNSUBSCRIBE_SECRET || 'amosa-ambos-2026-change-me',
};

let transporter = null;
let mode = 'mock';

function init() {
  if (!config.user || !config.pass) {
    console.log('[email] SMTP não configurado — modo MOCK (apenas logs)');
    mode = 'mock';
    return;
  }
  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
    mode = 'live';
    console.log(`[email] SMTP configurado para ${config.user}@${config.host}:${config.port}`);
  } catch (err) {
    console.error('[email] Falha a criar transporter:', err.message);
    mode = 'mock';
  }
}

init();

// =================== Unsubscribe (RFC 8058) ===================
// Tokens HMAC-SHA256 do email + segredo. Permitem unsubscribe seguro
// sem guardar tokens em base de dados.

function generateToken(email) {
  return crypto
    .createHmac('sha256', config.unsubscribeSecret)
    .update(email.toLowerCase().trim())
    .digest('hex')
    .slice(0, 32);
}

function verifyToken(email, token) {
  if (!email || !token) return false;
  const expected = generateToken(email);
  // Comparação timing-safe
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

function unsubscribeMailto(email) {
  return `mailto:${config.fromAddress}?subject=unsubscribe%20${encodeURIComponent(email)}`;
}

function unsubscribeHttpUrl(email, token) {
  return `${config.publicBaseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

const SEVERITY_LABELS = { green: 'SEGURO', yellow: 'ATENÇÃO', red: 'PERIGO IMEDIATO' };
const SEVERITY_COLORS = { green: '#16a34a', yellow: '#eab308', red: '#dc2626' };

function renderAlertEmail(alert) {
  const color = SEVERITY_COLORS[alert.severity];
  const label = SEVERITY_LABELS[alert.severity];
  const issuedAt = new Date(alert.issuedAt).toLocaleString('pt-PT', { timeZone: 'Africa/Maputo' });

  return {
    subject: `${label} · Alerta de ${alert.severity === 'red' ? 'CICLONE' : 'chuva intensa'} · ${alert.location}`,
    html: `
<!doctype html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:${color};color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:22px;">⚠ ${label}</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:0.9;">${alert.location}, Moçambique</p>
    </div>
    <div style="background:#1e293b;padding:20px;border-radius:0 0 12px 12px;">
      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${alert.description}</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #334155;"><strong>🌧 Chuva</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #334155;text-align:right;">${alert.rainfallMm} mm/h</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #334155;"><strong>💨 Vento</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #334155;text-align:right;">${alert.windKmh} km/h</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #334155;"><strong>🌡 Temperatura</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #334155;text-align:right;">${alert.temperatureC.toFixed(1)}°C</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>🕐 Emissão</strong></td>
          <td style="padding:8px 0;text-align:right;">${issuedAt}</td>
        </tr>
      </table>

      <div style="background:#0f172a;border-left:4px solid ${color};padding:12px 16px;border-radius:6px;margin:16px 0;">
        <strong>🛡 O que fazer agora:</strong>
        <p style="margin:8px 0 0;">${alert.advice}</p>
      </div>

      <p style="text-align:center;margin:24px 0 8px;">
        <a href="https://www.amosa.org.mz"
           style="background:#38bdf8;color:#0f172a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
          Ver mapa em tempo real →
        </a>
      </p>

      <hr style="border:0;border-top:1px solid #334155;margin:24px 0;">
      <p style="font-size:12px;color:#94a3b8;line-height:1.5;">
        <strong>AlertaClima · AMOSA</strong><br>
        Associação Moçambicana para Saúde e Ambiente<br>
        <a href="mailto:amosa.associacao@gmail.com" style="color:#38bdf8;">amosa.associacao@gmail.com</a> ·
        <a href="tel:+25883462650" style="color:#38bdf8;">+258 83 462 650</a><br>
        <a href="https://www.amosa.org.mz" style="color:#38bdf8;">www.amosa.org.mz</a>
      </p>
      <p style="font-size:11px;color:#64748b;margin-top:12px;text-align:center;">
        Não quer receber mais alertas?<br>
        <a href="{{UNSUBSCRIBE_URL}}" style="color:#38bdf8;">Cancelar subscrição</a> ·
        <a href="mailto:amosa.associacao@gmail.com?subject=unsubscribe" style="color:#38bdf8;">por email</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
${label} — ${alert.location}

${alert.description}

🌧 Chuva: ${alert.rainfallMm} mm/h
💨 Vento: ${alert.windKmh} km/h
🌡 Temperatura: ${alert.temperatureC.toFixed(1)}°C
🕐 Emissão: ${issuedAt}

🛡 ${alert.advice}

Ver mapa: https://www.amosa.org.mz

—
AlertaClima · AMOSA
Associação Moçambicana para Saúde e Ambiente
amosa.associacao@gmail.com · +258 83 462 650
www.amosa.org.mz

---
Cancelar subscrição: {{UNSUBSCRIBE_URL}}
Por email: amosa.associacao@gmail.com
    `.trim(),
  };
}

function renderWelcomeEmail(email, location) {
  return {
    subject: 'Bem-vindo aos alertas climáticos da AMOSA',
    html: `
<!doctype html>
<html>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#16a34a,#0f172a);color:#fff;padding:24px;border-radius:12px;text-align:center;">
      <div style="font-size:48px;">🌍</div>
      <h1 style="margin:8px 0;font-size:24px;">Bem-vindo!</h1>
      <p style="margin:0;font-size:14px;opacity:0.9;">AlertaClima · AMOSA</p>
    </div>
    <div style="background:#1e293b;padding:24px;border-radius:0 0 12px 12px;">
      <p style="font-size:16px;line-height:1.6;">
        Olá! Confirmámos a tua subscrição no endereço <strong>${email}</strong>.
      </p>
      <p style="font-size:16px;line-height:1.6;">
        Vais receber alertas automáticos sempre que houver:
      </p>
      <ul style="line-height:1.8;">
        <li>🌧 <strong>Chuvas intensas</strong> (&gt; 50 mm/h)</li>
        <li>💨 <strong>Ventos fortes</strong> (&gt; 60 km/h)</li>
        <li>🌀 <strong>Ciclones ou eventos severos</strong> (vento &gt; 118 km/h)</li>
      </ul>
      <p style="font-size:16px;line-height:1.6;">
        <strong>Região:</strong> ${location || 'Todas as regiões monitorizadas'}
      </p>
      <p style="text-align:center;margin:24px 0;">
        <a href="https://www.amosa.org.mz"
           style="background:#38bdf8;color:#0f172a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
          Abrir o dashboard →
        </a>
      </p>
      <hr style="border:0;border-top:1px solid #334155;margin:24px 0;">
      <p style="font-size:12px;color:#94a3b8;line-height:1.5;">
        <strong>AlertaClima · AMOSA</strong><br>
        Associação Moçambicana para Saúde e Ambiente<br>
        <a href="mailto:amosa.associacao@gmail.com" style="color:#38bdf8;">amosa.associacao@gmail.com</a> ·
        <a href="tel:+25883462650" style="color:#38bdf8;">+258 83 462 650</a>
      </p>
      <p style="font-size:11px;color:#64748b;margin-top:12px;text-align:center;">
        Não quer receber mais alertas?<br>
        <a href="{{UNSUBSCRIBE_URL}}" style="color:#38bdf8;">Cancelar subscrição</a> ·
        <a href="mailto:amosa.associacao@gmail.com?subject=unsubscribe" style="color:#38bdf8;">por email</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Bem-vindo aos alertas climáticos da AMOSA!

Confirmámos a tua subscrição no endereço: ${email}
Região: ${location || 'Todas as regiões'}

Vais receber alertas automáticos para:
- Chuvas intensas (> 50 mm/h)
- Ventos fortes (> 60 km/h)
- Ciclones ou eventos severos (vento > 118 km/h)

Dashboard: https://www.amosa.org.mz

—
AlertaClima · AMOSA
Associação Moçambicana para Saúde e Ambiente
amosa.associacao@gmail.com · +258 83 462 650

---
Cancelar subscrição: {{UNSUBSCRIBE_URL}}
Por email: amosa.associacao@gmail.com
    `.trim(),
  };
}

/** Envia um email individual. Inclui headers RFC 8058 (List-Unsubscribe). */
async function sendEmail({ to, subject, html, text }) {
  // Gerar token de unsubscribe
  const token = generateToken(to);
  const httpUrl = unsubscribeHttpUrl(to, token);
  const mailtoUrl = unsubscribeMailto(to);

  // Adicionar link de unsubscribe ao HTML e ao texto
  const htmlWithUnsub = injectUnsubscribeLink(html, httpUrl);
  const textWithUnsub = injectUnsubscribeLink(text, httpUrl);

  // Headers RFC 8058 — one-click unsubscribe
  const headers = {
    'List-Unsubscribe': `<${mailtoUrl}>, <${httpUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };

  if (mode === 'mock') {
    console.log(`[email:MOCK] to=${to} subject="${subject}"`);
    console.log(`  List-Unsubscribe: ${httpUrl}`);
    return { ok: true, mock: true, unsubscribeUrl: httpUrl };
  }
  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to,
      subject,
      text: textWithUnsub,
      html: htmlWithUnsub,
      headers,
      list: {
        unsubscribe: { url: httpUrl, comment: 'One-Click Unsubscribe (RFC 8058)' },
      },
    });
    console.log(`[email:LIVE] enviado para ${to} — messageId=${info.messageId}`);
    return { ok: true, messageId: info.messageId, unsubscribeUrl: httpUrl };
  } catch (err) {
    console.error(`[email:ERROR] ${to}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

/** Substitui o placeholder {{UNSUBSCRIBE_URL}} nos templates. */
function injectUnsubscribeLink(content, url) {
  if (!content) return content;
  // Substituir placeholder
  let out = content.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, url);
  // Se não houver placeholder mas houver um marcador conhecido, adicionar
  // (apenas para HTML onde queremos garantir que o link está presente)
  return out;
}

/** Envia email de boas-vindas. */
async function sendWelcome(toEmail, location) {
  const { subject, html, text } = renderWelcomeEmail(toEmail, location);
  return sendEmail({ to: toEmail, subject, html, text });
}

/** Envia email de alerta a um subscritor. */
async function sendAlert(toEmail, alert) {
  const { subject, html, text } = renderAlertEmail(alert);
  return sendEmail({ to: toEmail, subject, html, text });
}

module.exports = {
  sendEmail,
  sendWelcome,
  sendAlert,
  generateToken,
  verifyToken,
  unsubscribeHttpUrl,
  unsubscribeMailto,
  get mode() { return mode; },
  get config() { return config; },
};
