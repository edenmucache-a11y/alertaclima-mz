/**
 * routes/alerts.ts
 *
 * Endpoints REST:
 *  - GET  /api/alerts              → todos os alertas activos (do cache em memória)
 *  - GET  /api/alerts/:location    → alerta de uma cidade específica
 *  - POST /api/alerts/refresh      → força nova consulta às APIs
 *  - POST /api/alerts/subscribe    → registar dispositivo para push
 */
import { Router } from 'express';
import { locationsList } from '../config';
import { buildAlertForCoordinates } from '../services/alertService';
import { geocode } from '../services/weatherService';
import { Alert } from '../models/Alert';

export const alertsRouter = Router();
export const alertCache: Map<string, Alert> = new Map();

/** Carrega/actualiza um alerta individual no cache */
export async function refreshLocation(locationName: string): Promise<Alert | null> {
  const geo = await geocode(locationName);
  if (!geo) return null;
  const alert = await buildAlertForCoordinates(geo.lat, geo.lon, geo.name);
  alertCache.set(locationName.toLowerCase(), alert);
  return alert;
}

/** Inicializa o cache com todas as cidades monitorizadas */
export async function warmUpCache(): Promise<void> {
  await Promise.all(
    locationsList.map(async (city) => {
      try { await refreshLocation(city); } catch (err) {
        console.warn(`[warmUp] Falha a actualizar ${city}:`, (err as Error).message);
      }
    }),
  );
}

alertsRouter.get('/', (_req, res) => {
  res.json({
    count: alertCache.size,
    alerts: Array.from(alertCache.values()),
    generatedAt: new Date().toISOString(),
  });
});

alertsRouter.get('/:location', (req, res) => {
  const key = req.params.location.toLowerCase();
  const alert = alertCache.get(key);
  if (!alert) return res.status(404).json({ error: 'Localização sem alerta registado.' });
  res.json(alert);
});

alertsRouter.post('/refresh', async (_req, res) => {
  await warmUpCache();
  res.json({ ok: true, refreshed: alertCache.size });
});

/** Subscrição para receber push (FCM token) */
alertsRouter.post('/subscribe', (req, res) => {
  const { fcmToken, location } = req.body as { fcmToken?: string; location?: string };
  if (!fcmToken || !location) {
    return res.status(400).json({ error: 'fcmToken e location são obrigatórios.' });
  }
  // Em produção: persistir no MongoDB
  console.log(`[subscribe] novo token para ${location}: ${fcmToken.slice(0, 12)}…`);
  res.json({ ok: true, message: 'Subscrito com sucesso.' });
});
