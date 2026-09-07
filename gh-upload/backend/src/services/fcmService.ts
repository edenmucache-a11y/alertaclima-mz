/**
 * services/fcmService.ts
 *
 * Envio de push notifications via Firebase Cloud Messaging (FCM).
 * Activado apenas quando há credenciais em .env.
 *
 * Canais de notificação:
 *  - data:  payload estruturado (app trata)
 *  - notification: visível na bandeja do sistema
 *  - android.priority: high para emergências
 */
import admin from 'firebase-admin';
import { config } from '../config';
import { Alert, SEVERITY_COLORS } from '../models/Alert';

let app: admin.app.App | null = null;

function init() {
  if (app) return app;
  if (!config.FCM_PROJECT_ID || !config.FCM_PRIVATE_KEY || !config.FCM_CLIENT_EMAIL) {
    console.warn('[fcm] Credenciais ausentes — push desativado.');
    return null;
  }
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FCM_PROJECT_ID,
        privateKey: config.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: config.FCM_CLIENT_EMAIL,
      }),
    });
    console.log('[fcm] Inicializado com sucesso.');
    return app;
  } catch (err) {
    console.error('[fcm] Falha a inicializar:', (err as Error).message);
    return null;
  }
}

export interface PushPayload {
  tokens: string[];
  alert: Alert;
}

export async function sendSevereWeatherAlert({ tokens, alert }: PushPayload) {
  const a = init();
  if (!a) {
    console.log(`[fcm:mock] ${alert.severity.toUpperCase()} → ${tokens.length} tokens: ${alert.location}`);
    return { ok: true, mock: true };
  }

  // Mapear severidade → prioridade Android
  const priority = alert.severity === 'red' ? 'high' : 'normal';
  const color = SEVERITY_COLORS[alert.severity];

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: `⚠ ${alert.severity === 'red' ? 'PERIGO IMEDIATO' : 'ATENÇÃO'} · ${alert.location}`,
      body: `${alert.description} — ${alert.advice}`,
    },
    data: {
      alertId: alert.id,
      severity: alert.severity,
      location: alert.location,
      lat: String(alert.coordinates.lat),
      lon: String(alert.coordinates.lon),
      rainfallMm: String(alert.rainfallMm),
      windKmh: String(alert.windKmh),
      issuedAt: alert.issuedAt,
    },
    android: {
      priority,
      notification: {
        color,
        sound: alert.severity === 'red' ? 'alarm' : 'default',
        channelId: 'severe_weather',
      },
    },
    apns: {
      headers: { 'apns-priority': priority === 'high' ? '10' : '5' },
      payload: { aps: { sound: alert.severity === 'red' ? 'alarm.caf' : 'default' } },
    },
  };

  try {
    const res = await admin.messaging().sendEachForMulticast(message);
    console.log(`[fcm] enviado: ${res.successCount} ok, ${res.failureCount} falhas`);
    return { ok: true, successCount: res.successCount, failureCount: res.failureCount };
  } catch (err) {
    console.error('[fcm] erro a enviar:', (err as Error).message);
    return { ok: false, error: (err as Error).message };
  }
}
