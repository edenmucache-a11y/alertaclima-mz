/**
 * services/alertService.ts
 *
 * Lógica de decisão: converte dados brutos do OpenWeatherMap
 * em alertas de 3 níveis (verde / amarelo / vermelho).
 *
 * Tabela de decisão:
 *  - VERMELHO: chuva ≥100 mm/h OU vento ≥118 km/h (força ciclone)
 *  - AMARELO:  chuva ≥50 mm/h  OU vento ≥60 km/h
 *  - VERDE:    restantes
 */
import { config } from '../config';
import { Alert, Severity } from '../models/Alert';
import { OWMCurrentWeather, getCurrentWeather } from './weatherService';

function decideSeverity(rainfallMm: number, windKmh: number): Severity {
  if (rainfallMm >= config.RAIN_THRESHOLD_RED || windKmh >= config.WIND_THRESHOLD_RED) {
    return 'red';
  }
  if (rainfallMm >= config.RAIN_THRESHOLD_MM || windKmh >= config.WIND_THRESHOLD_KMH) {
    return 'yellow';
  }
  return 'green';
}

const ADVICE: Record<Severity, string> = {
  green: 'Condições normais. Mantenha-se atento aos boletins do INAM.',
  yellow: 'Atenção: proteja janelas, evite zonas ribeirinhas. Acompanhe boletins oficiais.',
  red: 'PERIGO IMEDIATO. Procure abrigo em local seguro e Contacte a Defesa Civil (119).',
};

const DESCRIPTION_BY_SEVERITY: Record<Severity, string> = {
  green: 'Condições climatéricas normais.',
  yellow: 'Risco moderado de chuvas fortes e ventos.',
  red: 'Evento climático severo em curso. Risco de ciclone ou inundação.',
};

export async function buildAlertForCoordinates(
  lat: number,
  lon: number,
  locationName: string,
): Promise<Alert> {
  const raw = await getCurrentWeather(lat, lon);

  // OpenWeatherMap devolve chuva em mm/h (campo rain.1h) e vento em m/s
  const rainfallMm = raw.rain?.['1h'] ?? 0;
  const windMs = raw.wind.speed;
  const windKmh = Math.round(windMs * 3.6);

  const severity = decideSeverity(rainfallMm, windKmh);
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 3 * 60 * 60 * 1000); // 3h

  return {
    id: `${locationName.toLowerCase()}-${issuedAt.getTime()}`,
    location: locationName,
    coordinates: { lat, lon },
    severity,
    rainfallMm,
    windKmh,
    temperatureC: raw.main.temp,
    description: `${DESCRIPTION_BY_SEVERITY[severity]} (${raw.weather[0]?.description ?? 'sem dados'})`,
    advice: ADVICE[severity],
    source: 'openweathermap',
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}
