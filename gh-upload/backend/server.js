/**
 * server.js — Versão simplificada em JavaScript puro.
 * Faz listen() IMEDIATAMENTE e warmUp em background.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const axios = require('axios');
const path = require('node:path');
const fs = require('node:fs');
const emailService = require('./emailService');
const { historicalAlerts } = require('./historicalAlerts');
const { enrichAlert } = require('./riskClassifier');
const capInamService = require('./capInamService');
const { TTLCache } = require('./ttlcache');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  // CORS_ORIGIN pode ser uma string única OU uma lista separada por vírgulas.
  // Em produção, definir como: 'https://www.amosa.org.mz,https://alerta-clima-mz.onrender.com'
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || 'demo_key',
  OPENWEATHER_BASE_URL: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
  RAIN_THRESHOLD_MM: parseFloat(process.env.RAIN_THRESHOLD_MM || '50'),
  RAIN_THRESHOLD_RED: parseFloat(process.env.RAIN_THRESHOLD_RED || '100'),
  WIND_THRESHOLD_KMH: parseFloat(process.env.WIND_THRESHOLD_KMH || '60'),
  WIND_THRESHOLD_RED: parseFloat(process.env.WIND_THRESHOLD_RED || '118'),
  POLLING_INTERVAL_MIN: parseInt(process.env.POLLING_INTERVAL_MIN || '15', 10),
  // Cache TTL (segundos) — evita chamadas repetidas ao OWM
  OWM_TTL_SECONDS: parseInt(process.env.OWM_TTL_SECONDS || '600', 10), // 10 min default
  GEOCODE_TTL_SECONDS: parseInt(process.env.GEOCODE_TTL_SECONDS || '604800', 10), // 7 dias
};
const locationsList = (process.env.MONITORED_LOCATIONS || 'Maputo,Beira,Nampula')
  .split(',').map(s => s.trim()).filter(Boolean);

function decideSeverity(rainfallMm, windKmh) {
  if (rainfallMm >= config.RAIN_THRESHOLD_RED || windKmh >= config.WIND_THRESHOLD_RED) return 'red';
  if (rainfallMm >= config.RAIN_THRESHOLD_MM || windKmh >= config.WIND_THRESHOLD_KMH) return 'yellow';
  return 'green';
}

const ADVICE = {
  green: 'Condições normais. Mantenha-se atento aos boletins do INAM.',
  yellow: 'Atenção: proteja janelas, evite zonas ribeirinhas. Acompanhe boletins oficiais.',
  red: 'PERIGO IMEDIATO. Procure abrigo em local seguro. Contacte a Defesa Civil: 119',
};
const DESCRIPTION = {
  green: 'Condições climatéricas normais.',
  yellow: 'Risco moderado de chuvas fortes e ventos.',
  red: 'Evento climático severo em curso. Risco de ciclone ou inundação.',
};

const alertCache = new Map();
const emailSubscribers = new Set();
const seenAlerts = new Set();   // IDs de alertas já enviados por email
const alertSendLog = [];        // Histórico de envios (últimos 100)

const owClient = axios.create({
  baseURL: config.OPENWEATHER_BASE_URL,
  timeout: 5_000,
  params: { appid: config.OPENWEATHER_API_KEY, units: 'metric', lang: 'pt' },
});

// Caches com TTL — evita chamadas repetidas ao OWM
const geocodeCache = new TTLCache(config.GEOCODE_TTL_SECONDS, { maxEntries: 100 });
const weatherCache = new TTLCache(config.OWM_TTL_SECONDS, {
  maxEntries: 200,
  staleWhileRevalidate: true, // servir último valor conhecido enquanto actualiza
});
// Chave de weather: arredondar coords a 2 casas (~1km) para melhorar hit rate
function weatherKey(lat, lon) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function geocode(cityName) {
  const cached = geocodeCache.get(cityName);
  if (cached !== null) return cached;
  try {
    const url = 'https://api.openweathermap.org/geo/1.0/direct';
    const { data } = await axios.get(url, {
      params: { q: cityName, limit: 1, appid: config.OPENWEATHER_API_KEY },
      timeout: 5_000,
    });
    const result = data[0] ?? null;
    if (result) geocodeCache.set(cityName, result);
    return result;
  } catch (e) { return null; }
}

async function getCurrentWeather(lat, lon) {
  const key = weatherKey(lat, lon);
  const cached = weatherCache.get(key);
  if (cached !== null) {
    // Devolver cópia (não referência) para evitar mutações externas
    return JSON.parse(JSON.stringify(cached));
  }
  const { data } = await owClient.get('/weather', { params: { lat, lon } });
  weatherCache.set(key, data);
  return data;
}

async function buildAlertForCoordinates(lat, lon, locationName) {
  const raw = await getCurrentWeather(lat, lon);
  const rainfallMm = raw.rain?.['1h'] ?? 0;
  const windMs = raw.wind.speed;
  const windKmh = Math.round(windMs * 3.6);
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 3 * 60 * 60 * 1000);
  const base = {
    id: `${locationName.toLowerCase()}-${issuedAt.getTime()}`,
    location: locationName,
    coordinates: { lat, lon },
    severity: decideSeverity(rainfallMm, windKmh),
    rainfallMm, windKmh, temperatureC: raw.main.temp,
    description: `${DESCRIPTION[decideSeverity(rainfallMm, windKmh)]} (${raw.weather[0]?.description ?? 'sem dados'})`,
    advice: ADVICE[decideSeverity(rainfallMm, windKmh)],
    source: 'openweathermap',
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  // Enriquece com classificação de risco (tipo de risco, ícone, cor)
  return enrichAlert(base);
}

async function refreshLocation(locationName) {
  const geo = await geocode(locationName);
  if (!geo) return null;
  const alert = await buildAlertForCoordinates(geo.lat, geo.lon, geo.name);
  alertCache.set(locationName.toLowerCase(), alert);
  return alert;
}

async function warmUpCache() {
  const results = await Promise.allSettled(
    locationsList.map(async (city) => {
      try { return await refreshLocation(city); }
      catch (err) { return null; }
    })
  );
  // Também buscar alertas oficiais do INAM
  try {
    const inamAlerts = await capInamService.fetchLatestInamAlert();
    for (const alert of inamAlerts) {
      alertCache.set(alert.id, alert);
    }
    if (inamAlerts.length > 0) {
      console.log(`[cap-inam] ${inamAlerts.length} alerta(s) oficial(is) INAM carregado(s)`);
    }
  } catch (e) {
    console.warn('[cap-inam] warmUp falhou:', e.message);
  }
  return results.filter(r => r.status === 'fulfilled' && r.value).length;
}

const app = express();

// Rate limiting — protege contra abuso
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 100, // 100 requests/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos. Tente novamente em 1 minuto.' },
});
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 subscrições/hora por IP (evita abuse)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de subscrições atingido. Tente novamente em 1 hora.' },
});
app.use('/api/', generalLimiter);

// Helmet com CSP relaxada para permitir iframes externos (WordPress) e fontes
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'frame-ancestors': ["'self'", 'https://www.amosa.org.mz', 'https://amosa.org.mz'],
      'img-src': ["'self'", 'data:', 'https://*.tile.openstreetmap.org', 'https://*.openstreetmap.org'],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'connect-src': ["'self'", 'https://api.openweathermap.org'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS com suporte a múltiplas origens separadas por vírgula
const allowedOrigins = config.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Permitir same-origin (sem header Origin) e origens na lista
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  credentials: false,
}));
app.use(express.json());

// =================== Static frontend (production) ===================
// Se existir `public/` (build do React copiado pelo `npm run build:frontend`),
// servimos o bundle como SPA. Em dev, a Vite serve em :5173 separadamente.
const publicDir = path.join(__dirname, 'public');
const hasFrontendBuild = fs.existsSync(path.join(publicDir, 'index.html'));
if (hasFrontendBuild) {
  console.log(`[static] a servir frontend build de ${publicDir}`);
  app.use(express.static(publicDir, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }));
  // SPA fallback: qualquer rota que NÃO comece com /api devolve o index.html
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  console.log('[static] public/ não existe — a servir só API (modo dev)');
}

// =================== Health ===================
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development', ts: new Date().toISOString() });
});

// =================== Alerts ===================
app.get('/api/alerts', (_req, res) => {
  res.json({ count: alertCache.size, alerts: Array.from(alertCache.values()), generatedAt: new Date().toISOString() });
});

// IMPORTANTE: rotas estáticas devem vir ANTES das dinâmicas
app.get('/api/alerts/history', (_req, res) => {
  const historical = Array.from(alertCache.entries())
    .filter(([k]) => k.startsWith('hist-') || k.startsWith('history-'))
    .map(([, a]) => a)
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
  res.json({ count: historical.length, alerts: historical });
});

app.get('/api/alerts/send-log', (_req, res) => {
  res.json({ total: alertSendLog.length, log: alertSendLog });
});

app.post('/api/alerts/recheck', async (_req, res) => {
  const result = await checkAndDispatchNewAlerts();
  res.json({ ok: true, ...result, sendLog: alertSendLog.slice(-10) });
});

app.get('/api/alerts/feed.rss', (_req, res) => {
  const alerts = Array.from(alertCache.values())
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    .slice(0, 50);
  const escapeXml = (s) => String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const items = alerts.map((a) => {
    const pubDate = new Date(a.issuedAt).toUTCString();
    const sevLabel = ({ red: '🔴 PERIGO', yellow: '🟡 ATENÇÃO', green: '🟢 Normal' })[a.severity] || a.severity;
    const title = `[${sevLabel}] ${escapeXml(a.location)} — ${escapeXml((a.description || 'alerta').slice(0, 80))}`;
    return `    <item>
      <title>${title}</title>
      <link>https://alertaclima-mz.onrender.com/?alert=${encodeURIComponent(a.id)}</link>
      <guid isPermaLink="false">${escapeXml(a.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(a.severity)}</category>
      <description><![CDATA[<p><strong>${sevLabel}</strong> em <strong>${escapeXml(a.location)}</strong></p><p>${escapeXml(a.description || '')}</p><p>💨 Vento: ${a.windKmh || 0} km/h · 🌧 Chuva: ${a.rainfallMm || 0} mm/h · 🌡 Temp: ${a.temperatureC || 0}°C</p><p>${escapeXml(a.advice || '')}</p>]]></description>
    </item>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AlertaClima MZ · Alertas Climáticos de Moçambique</title>
    <link>https://alertaclima-mz.onrender.com/</link>
    <atom:link href="https://alertaclima-mz.onrender.com/api/alerts/feed.rss" rel="self" type="application/rss+xml"/>
    <description>Alertas em tempo real de ciclones, chuvas intensas, ventos fortes em Moçambique. Fonte: INAM + OpenWeatherMap.</description>
    <language>pt-MZ</language>
    <copyright>© 2026 AMOSA</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>15</ttl>
    <image><url>https://alertaclima-mz.onrender.com/favicon.png</url><title>AlertaClima MZ</title><link>https://alertaclima-mz.onrender.com/</link></image>
${items}
  </channel>
</rss>`;
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(xml);
});

app.get('/api/alerts/:location', (req, res) => {
  const alert = alertCache.get(req.params.location.toLowerCase());
  if (!alert) return res.status(404).json({ error: 'Localização sem alerta registado.' });
  res.json(alert);
});

app.post('/api/alerts/refresh', async (_req, res) => {
  await warmUpCache();
  res.json({ ok: true, refreshed: alertCache.size });
});

// Estado do cache TTL (debug + monitorização)
app.get('/api/cache/stats', (_req, res) => {
  res.json({
    geocode: geocodeCache.stats(),
    weather: weatherCache.stats(),
    config: {
      OWM_TTL_SECONDS: config.OWM_TTL_SECONDS,
      GEOCODE_TTL_SECONDS: config.GEOCODE_TTL_SECONDS,
    },
  });
});

// Feed RSS 2.0 dos alertas activos — apps como Feedly/IFTTT/Slack podem subscrever
app.get('/api/alerts/feed.rss', (_req, res) => {
  const alerts = Array.from(alertCache.values())
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    .slice(0, 50);
  const escapeXml = (s) => String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const items = alerts.map((a) => {
    const pubDate = new Date(a.issuedAt).toUTCString();
    const sevLabel = ({ red: '🔴 PERIGO', yellow: '🟡 ATENÇÃO', green: '🟢 Normal' })[a.severity] || a.severity;
    const title = `[${sevLabel}] ${escapeXml(a.location)} — ${escapeXml((a.description || 'alerta').slice(0, 80))}`;
    return `    <item>
      <title>${title}</title>
      <link>https://alertaclima-mz.onrender.com/?alert=${encodeURIComponent(a.id)}</link>
      <guid isPermaLink="false">${escapeXml(a.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(a.severity)}</category>
      <description><![CDATA[<p><strong>${sevLabel}</strong> em <strong>${escapeXml(a.location)}</strong></p><p>${escapeXml(a.description || '')}</p><p>💨 Vento: ${a.windKmh || 0} km/h · 🌧 Chuva: ${a.rainfallMm || 0} mm/h · 🌡 Temp: ${a.temperatureC || 0}°C</p><p>${escapeXml(a.advice || '')}</p>]]></description>
    </item>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AlertaClima MZ · Alertas Climáticos de Moçambique</title>
    <link>https://alertaclima-mz.onrender.com/</link>
    <atom:link href="https://alertaclima-mz.onrender.com/api/alerts/feed.rss" rel="self" type="application/rss+xml"/>
    <description>Alertas em tempo real de ciclones, chuvas intensas, ventos fortes em Moçambique. Fonte: INAM + OpenWeatherMap.</description>
    <language>pt-MZ</language>
    <copyright>© 2026 AMOSA</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>15</ttl>
    <image><url>https://alertaclima-mz.onrender.com/favicon.png</url><title>AlertaClima MZ</title><link>https://alertaclima-mz.onrender.com/</link></image>
${items}
  </channel>
</rss>`;
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(xml);
});

// =================== Push (FCM mock) ===================
app.post('/api/alerts/subscribe', (req, res) => {
  const { fcmToken, location } = req.body || {};
  if (!fcmToken || !location) return res.status(400).json({ error: 'fcmToken e location são obrigatórios.' });
  console.log(`[subscribe] ${location}: ${fcmToken.slice(0, 12)}`);
  res.json({ ok: true, message: 'Subscrito com sucesso.' });
});

app.post('/api/push/subscribe', (req, res) => {
  const { fcmToken, location } = req.body || {};
  if (!fcmToken || !location) return res.status(400).json({ error: 'fcmToken e location obrigatórios.' });
  console.log(`[push:subscribe] ${location}: ${fcmToken.slice(0, 12)}`);
  res.json({ ok: true, message: 'Subscrito (FCM mock).' });
});

app.post('/api/push/unsubscribe', (req, res) => {
  const { fcmToken } = req.body || {};
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken é obrigatório.' });
  res.json({ ok: true, message: 'Subscrição removida.' });
});

app.post('/api/push/test', (req, res) => {
  const { tokens = [], location = 'Maputo' } = req.body || {};
  if (tokens.length === 0) return res.status(400).json({ error: 'tokens[] é obrigatório' });
  console.log(`[fcm:mock] RED → ${tokens.length} tokens: ${location}`);
  res.json({ ok: true, mock: true, successCount: tokens.length, failureCount: 0 });
});

app.get('/api/push/stats', (_req, res) => {
  res.json({ activeSubscribers: 0, severityBreakdown: { green: 0, yellow: 0, red: 0 } });
});

// =================== Email subscribers ===================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const subscriberLocation = new Map(); // email -> location

app.post('/api/subscribe-email', subscribeLimiter, async (req, res) => {
  const { email, location } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }
  const normalized = email.toLowerCase();
  emailSubscribers.add(normalized);
  if (location) subscriberLocation.set(normalized, location);
  console.log(`[email:subscribe] novo: ${normalized} (${location || 'todas'}) - total=${emailSubscribers.size}`);
  res.json({ ok: true, message: 'Subscrito por email com sucesso.', total: emailSubscribers.size });

  // Enviar email de boas-vindas (em background)
  emailService.sendWelcome(normalized, location).catch((err) => {
    console.error(`[email] Falha a enviar boas-vindas para ${normalized}:`, err.message);
  });
});

app.get('/api/subscribe-email', (_req, res) => {
  res.json({
    total: emailSubscribers.size,
    emails: Array.from(emailSubscribers),
    mode: emailService.mode, // 'live' ou 'mock'
  });
});

// =================== Unsubscribe (RFC 8058) ===================
// GET /api/unsubscribe?email=...&token=...
//   → remoção silenciosa (vinda do link no email ou do botão "Cancelar")
// POST /api/unsubscribe (body: { email, token }) + header List-Unsubscribe=One-Click
//   → one-click unsubscribe (RFC 8058, chamado pelo Gmail/Outlook quando utilizador clica)
function performUnsubscribe(email) {
  if (!email) return { ok: false, error: 'Email é obrigatório.' };
  const normalized = email.toLowerCase();
  if (!emailSubscribers.has(normalized)) {
    return { ok: false, error: 'Email não está subscrito.', alreadyUnsubscribed: true };
  }
  emailSubscribers.delete(normalized);
  subscriberLocation.delete(normalized);
  console.log(`[unsubscribe] removido: ${normalized} - restantes=${emailSubscribers.size}`);
  return { ok: true, removed: normalized, remaining: emailSubscribers.size };
}

app.get('/api/unsubscribe', (req, res) => {
  const { email, token } = req.query;
  if (!emailService.verifyToken(email, token)) {
    return res.status(400).json({ ok: false, error: 'Token inválido ou email em falta.' });
  }
  const result = performUnsubscribe(email);
  res.json(result);
});

app.post('/api/unsubscribe', (req, res) => {
  const { email, token } = req.body || {};
  // RFC 8058: Gmail/Outlook enviam POST com header List-Unsubscribe=One-Click
  // Aceitar também requests sem token (provenientes de one-click)
  if (token && !emailService.verifyToken(email, token)) {
    return res.status(400).json({ ok: false, error: 'Token inválido.' });
  }
  const result = performUnsubscribe(email);
  res.json(result);
});

// Endpoint para gerar o link de unsubscribe (para testes/admin)
app.get('/api/unsubscribe-link', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email é obrigatório.' });
  const token = emailService.generateToken(email);
  const url = emailService.unsubscribeHttpUrl(email, token);
  res.json({ email, token, url });
});

// =================== Cron + start ===================
// Detecta NOVOS alertas (que não estavam no cache antes) e envia emails
// automaticamente para os subscritores.
async function checkAndDispatchNewAlerts() {
  const before = new Set(alertCache.keys());
  await warmUpCache();
  const after = new Set(alertCache.keys());
  const newAlerts = [];
  for (const key of after) {
    if (!before.has(key)) {
      const alert = alertCache.get(key);
      if (alert && alert.severity !== 'green' && !alert.id.startsWith('hist-')) {
        newAlerts.push(alert);
      }
    }
  }
  if (newAlerts.length > 0) {
    console.log(`[cron] ${newAlerts.length} novo(s) alerta(s) detectado(s)`);
    for (const alert of newAlerts) {
      await dispatchAlertEmails(alert);
      alertSendLog.push({
        timestamp: new Date().toISOString(),
        alertId: alert.id,
        location: alert.location,
        severity: alert.severity,
        riskType: alert.riskType,
        riskLabel: alert.riskLabel,
        action: 'email_dispatched',
      });
    }
    if (alertSendLog.length > 100) alertSendLog.splice(0, alertSendLog.length - 100);
  }
  return { checked: after.size, new: newAlerts.length };
}

cron.schedule(`*/${config.POLLING_INTERVAL_MIN} * * * *`, async () => {
  console.log(`[cron] verificando a cada ${config.POLLING_INTERVAL_MIN} min…`);
  await checkAndDispatchNewAlerts();
});

// Endpoint para forçar a verificação (útil para testes)
app.post('/api/alerts/recheck', async (_req, res) => {
  const result = await checkAndDispatchNewAlerts();
  res.json({ ok: true, ...result, sendLog: alertSendLog.slice(-10) });
});

// Injeta um alerta "novo" (timestamp actual) e despoleta emails imediatamente.
// Simula o que aconteceria se o OWM detectasse um novo evento agora.
app.post('/api/alerts/inject', async (req, res) => {
  const {
    location = 'Maputo',
    severity = 'red',
    rainfallMm = 120,
    windKmh = 140,
    temperatureC = 26,
    description = 'Alerta simulado em tempo real',
  } = req.body || {};
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 3 * 60 * 60 * 1000);
  const base = {
    id: `live-${location.toLowerCase()}-${issuedAt.getTime()}`,
    location,
    coordinates: { lat: -25.9692, lon: 32.5728 }, // Maputo
    severity,
    rainfallMm,
    windKmh,
    temperatureC,
    description,
    advice: 'PERIGO IMEDIATO. Procure abrigo e contacte as autoridades.',
    source: 'openweathermap',
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const alert = enrichAlert(base);
  alertCache.set(alert.id, alert);
  // Disparar email
  const sent = await dispatchAlertEmails(alert);
  alertSendLog.push({
    timestamp: issuedAt.toISOString(),
    alertId: alert.id,
    location: alert.location,
    severity: alert.severity,
    riskType: alert.riskType,
    riskLabel: alert.riskLabel,
    action: 'email_dispatched',
  });
  res.json({ ok: true, alert, sent, sendLog: alertSendLog.slice(-1) });
});

// Histórico de envios de email
app.get('/api/alerts/send-log', (_req, res) => {
  res.json({ total: alertSendLog.length, log: alertSendLog });
});

app.listen(config.PORT, () => {
  console.log(`\n  ╔════════════════════════════════════════════════════╗`);
  console.log(`  ║   AlertaClima MZ · v8                              ║`);
  console.log(`  ╚════════════════════════════════════════════════════╝`);
  console.log(`  API + Dashboard: http://localhost:${config.PORT}`);
  console.log(`  CORS allowlist: ${allowedOrigins.join(', ')}`);
  console.log(`  Email: ${emailService.mode === 'live' ? '✓ SMTP configurado (live)' : '⚠ MOCK (preencher SMTP_HOST/USER/PASS)'}`);
  console.log(`  Frontend build: ${hasFrontendBuild ? '✓ servindo /public/ como SPA' : '✗ só API (Vite dev em :5173)'}`);
  console.log(`  Cron: a cada ${config.POLLING_INTERVAL_MIN} min → ${locationsList.join(', ')}\n`);
});

/** Despeta emails de alerta para os subscritores da região */
async function dispatchAlertEmails(alert) {
  if (alert.severity === 'green') return; // só amarelo e vermelho
  if (emailSubscribers.size === 0) return;
  const targets = Array.from(emailSubscribers).filter((email) => {
    const sub = subscriberLocation.get(email);
    if (!sub || sub === 'Todas as regiões') return true;
    return sub.toLowerCase() === alert.location.toLowerCase();
  });
  if (targets.length === 0) return;
  console.log(`[email:dispatch] ${alert.severity.toUpperCase()} → ${targets.length} subscritores em ${alert.location}`);
  for (const email of targets) {
    emailService.sendAlert(email, alert).catch((err) => {
      console.error(`[email] Falha a enviar alerta para ${email}:`, err.message);
    });
  }
}

warmUpCache()
  .then((loaded) => {
    console.log(`WarmUp: ${loaded}/${locationsList.length} localizações.`);
    // Despeta emails para alertas amarelo/vermelho
    alertCache.forEach((alert) => dispatchAlertEmails(alert));
  })
  .catch((err) => console.warn('warm-up falhou:', err.message));

// =================== Seed de alertas históricos ===================
// Carrega no cache alertas reais (INAM) dos últimos meses para
// a região de Maputo. Usado para popular o dashboard em modo demo.
app.post('/api/seed-history', (req, res) => {
  let count = 0;
  for (const raw of historicalAlerts) {
    const key = raw.location.toLowerCase();
    const issuedAt = new Date(raw.issuedAt);
    const expiresAt = new Date(raw.expiresAt);
    const base = {
      id: `${key}-${issuedAt.getTime()}`,
      location: raw.location,
      coordinates: raw.coordinates,
      severity: raw.severity,
      rainfallMm: raw.rainfallMm,
      windKmh: raw.windKmh,
      temperatureC: raw.temperatureC,
      description: raw.description,
      advice: raw.advice,
      source: raw.source,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    // Enriquece com classificação de risco
    const alert = enrichAlert(base);
    // Para Maputo, adicionar vários alertas (um por evento) - usa a key com timestamp
    const historyKey = `hist-${key}-${issuedAt.getTime()}`;
    alertCache.set(historyKey, alert);
    // Para o cache "principal" (consultado por /api/alerts/:location), guardar
    // o mais recente e mais severo de cada localização
    const current = alertCache.get(key);
    const severityOrder = { red: 3, yellow: 2, green: 1 };
    if (!current || severityOrder[raw.severity] >= severityOrder[current.severity]) {
      alertCache.set(key, alert);
    }
    count++;
  }
  res.json({ ok: true, loaded: count, total: alertCache.size });
});

// Lista todos os alertas (incluindo históricos) para a vista histórico
app.get('/api/alerts/history', (_req, res) => {
  const historical = Array.from(alertCache.entries())
    .filter(([k]) => k.startsWith('hist-') || k.includes('hist-'))
    .map(([, a]) => a);
  res.json({ count: historical.length, alerts: historical });
});

// Disparar emails de TODOS os alertas históricos para um subscritor
app.post('/api/dispatch-history', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email é obrigatório.' });
  if (!emailSubscribers.has(email.toLowerCase())) {
    return res.status(400).json({ error: 'Email não está subscrito.' });
  }
  const historical = Array.from(alertCache.entries())
    .filter(([k]) => k.startsWith('hist-') || k.startsWith('history-'))
    .map(([, a]) => a)
    .filter((a) => a.severity !== 'green')
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
  const results = [];
  for (const alert of historical) {
    const r = await emailService.sendAlert(email.toLowerCase(), alert);
    results.push({ id: alert.id, location: alert.location, severity: alert.severity, ...r });
  }
  res.json({ ok: true, totalSent: results.length, results });
});

// Endpoint de teste para envio de email
// Async (fire-and-forget): responde IMEDIATAMENTE ao cliente e envia o email
// em background. Necessário porque o Render free tier tem timeout HTTP de 30s,
// mas o SMTP real pode demorar 30-60s a completar (TLS handshake + auth + queue).
app.post('/api/test-email', (req, res) => {
  const { to } = req.body || {};
  if (!to) return res.status(400).json({ error: 'to é obrigatório.' });
  const alert = {
    id: `test-${Date.now()}`,
    location: 'Maputo',
    coordinates: { lat: -25.97, lon: 32.57 },
    severity: 'red',
    rainfallMm: 120,
    windKmh: 130,
    temperatureC: 26.4,
    description: 'TESTE — Ciclone em aproximação a Maputo',
    advice: 'Procure abrigo imediato. Contacte a Defesa Civil: 119',
    source: 'manual',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  };
  // Log estruturado do pedido
  const testId = `test-${Date.now()}`;
  console.log(`[test-email:${testId}] pedido recebido: to=${to} mode=${emailService.mode}`);
  // Resposta imediata (não espera pelo SMTP)
  res.json({ ok: true, queued: true, testId, mode: emailService.mode, message: 'Email a ser enviado em background. Verifique os logs do Render em 10-30s.' });
  // Envio em background
  emailService.sendAlert(to, alert)
    .then((result) => {
      console.log(`[test-email:${testId}] resultado: ok=${result.ok} ${result.messageId ? 'messageId=' + result.messageId : 'error=' + (result.error || '?')}`);
      // Adicionar ao sendLog para aparecer no dashboard
      alertSendLog.push({
        timestamp: new Date().toISOString(),
        alertId: alert.id,
        location: alert.location,
        severity: alert.severity,
        riskType: alert.riskType || 'cyclone',
        riskLabel: alert.riskLabel || 'Ciclone',
        action: result.ok ? 'test_email_sent' : 'test_email_failed',
      });
      if (alertSendLog.length > 100) alertSendLog.splice(0, alertSendLog.length - 100);
    })
    .catch((err) => {
      console.error(`[test-email:${testId}] erro: ${err.message}`);
      alertSendLog.push({
        timestamp: new Date().toISOString(),
        alertId: alert.id,
        location: alert.location,
        severity: alert.severity,
        riskType: 'cyclone',
        riskLabel: 'Ciclone',
        action: 'test_email_failed',
        error: err.message,
      });
    });
});
