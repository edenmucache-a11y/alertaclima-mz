/**
 * config.ts — Configuração central do backend
 */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  OPENWEATHER_API_KEY: z.string().min(1, 'OPENWEATHER_API_KEY é obrigatória'),
  OPENWEATHER_BASE_URL: z.string().url().default('https://api.openweathermap.org/data/2.5'),

  RAIN_THRESHOLD_MM: z.coerce.number().default(50),
  RAIN_THRESHOLD_RED: z.coerce.number().default(100),
  WIND_THRESHOLD_KMH: z.coerce.number().default(60),
  WIND_THRESHOLD_RED: z.coerce.number().default(118),

  MONITORED_LOCATIONS: z.string().default('Maputo,Beira,Nampula'),

  FCM_PROJECT_ID: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),

  MONGODB_URI: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  POLLING_INTERVAL_MIN: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export const locationsList = config.MONITORED_LOCATIONS.split(',').map(s => s.trim()).filter(Boolean);
