/**
 * routes/push.ts
 *
 * Endpoints para gestão de subscritores e teste de envio.
 *
 *  - POST /api/push/subscribe     → registar/atualizar device
 *  - POST /api/push/unsubscribe   → remover device
 *  - POST /api/push/test          → enviar push de teste (admin)
 *  - GET  /api/push/stats         → nº de subscritores activos
 */
import { Router } from 'express';
import { z } from 'zod';
import { sendSevereWeatherAlert } from '../services/fcmService';
import { Alert, SEVERITY_LABELS } from '../models/Alert';

export const pushRouter = Router();

const SubscribeSchema = z.object({
  fcmToken: z.string().min(10),
  location: z.string().min(1),
  coordinates: z.object({ lat: z.number(), lon: z.number() }),
  radiusKm: z.number().positive().default(50),
  channels: z.array(z.enum(['push', 'sms', 'whatsapp'])).default(['push']),
  phoneNumber: z.string().optional(),
  consentSms: z.boolean().default(false),
});

pushRouter.post('/subscribe', async (req, res) => {
  const parsed = SubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido', details: parsed.error.format() });
  }
  // Em produção: persistir no MongoDB
  // await Subscriber.findOneAndUpdate({ fcmToken: parsed.data.fcmToken }, parsed.data, { upsert: true });
  console.log(`[push:subscribe] ${parsed.data.location} (${parsed.data.fcmToken.slice(0, 12)}…)`);
  res.json({ ok: true, message: 'Subscrito com sucesso.' });
});

pushRouter.post('/unsubscribe', (req, res) => {
  const { fcmToken } = req.body as { fcmToken?: string };
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken é obrigatório.' });
  console.log(`[push:unsubscribe] ${fcmToken.slice(0, 12)}…`);
  res.json({ ok: true, message: 'Subscrição removida.' });
});

pushRouter.post('/test', async (req, res) => {
  const { tokens, location } = req.body as { tokens?: string[]; location?: string };
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ error: 'tokens[] é obrigatório' });
  }
  const fakeAlert: Alert = {
    id: `test-${Date.now()}`,
    location: location ?? 'Maputo',
    coordinates: { lat: -25.97, lon: 32.57 },
    severity: 'red',
    rainfallMm: 120,
    windKmh: 130,
    temperatureC: 26.4,
    description: 'Teste de notificação — Ciclone em aproximação',
    advice: 'Procure abrigo imediato. Contacte a Defesa Civil: 119',
    source: 'manual',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  };
  const result = await sendSevereWeatherAlert({ tokens, alert: fakeAlert });
  res.json(result);
});

pushRouter.get('/stats', (_req, res) => {
  // Em produção: Subscriber.countDocuments({ active: true })
  res.json({
    activeSubscribers: 0,
    severityBreakdown: { green: 0, yellow: 0, red: 0 },
    note: 'Ligar ao MongoDB para dados reais.',
  });
});
