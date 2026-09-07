/**
 * server.ts — Bootstrap do backend
 *
 *  - Express + Helmet + CORS
 *  - Cron job que refresca o cache a cada POLLING_INTERVAL_MIN minutos
 *  - Integra push notifications (FCM) quando há alerta amarelo/vermelho
 *  - Lança warmUpCache no arranque
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { config, locationsList } from './config';
import { alertsRouter, warmUpCache, alertCache } from './routes/alerts';
import { pushRouter } from './routes/push';
import { sendSevereWeatherAlert } from './services/fcmService';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: config.NODE_ENV, ts: new Date().toISOString() });
});

app.use('/api/alerts', alertsRouter);
app.use('/api/push', pushRouter);

/** Despeta push para todos os tokens subscritos numa localização */
async function dispatchPushForAlert(locationName: string) {
  // Em produção: ir ao MongoDB buscar tokens daquela região
  // const subs = await Subscriber.find({ location: locationName, active: true });
  // const tokens = subs.filter(s => s.channels.includes('push')).map(s => s.fcmToken);
  const tokens: string[] = []; // mock — substituir por tokens reais
  const alert = alertCache.get(locationName.toLowerCase());
  if (!alert || tokens.length === 0) return;
  if (alert.severity === 'green') return; // só amarelo/vermelho
  console.log(`[dispatch] ${alert.severity.toUpperCase()} → ${tokens.length} devices (${locationName})`);
  await sendSevereWeatherAlert({ tokens, alert });
}

// Cron job — refresca alertas e despoleta push
cron.schedule(`*/${config.POLLING_INTERVAL_MIN} * * * *`, async () => {
  console.log(`[cron] refrescando a cada ${config.POLLING_INTERVAL_MIN} min…`);
  await warmUpCache();
  for (const loc of locationsList) {
    await dispatchPushForAlert(loc);
  }
});

const start = async () => {
  console.log('🌍 A inicializar WebsiteMiniMax Backend…');
  try {
    await warmUpCache();
    console.log(`✓ ${locationsList.length} localizações carregadas no cache.`);
  } catch (err) {
    console.warn('⚠️  Falha no warm-up (continua mesmo assim):', (err as Error).message);
  }
  app.listen(config.PORT, () => {
    console.log(`🚀 Backend a escutar em http://localhost:${config.PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   GET    /api/health`);
    console.log(`   GET    /api/alerts`);
    console.log(`   GET    /api/alerts/:location`);
    console.log(`   POST   /api/alerts/refresh`);
    console.log(`   POST   /api/alerts/subscribe`);
    console.log(`   POST   /api/push/subscribe`);
    console.log(`   POST   /api/push/test`);
    console.log(`   GET    /api/push/stats`);
  });
};

start();
