/**
 * models/Alert.ts — Modelo de domínio de um alerta climático
 *
 * Representa um alerta gerado pelo sistema após processamento
 * de dados brutos do OpenWeatherMap (ou CAP-INAM).
 */

export type Severity = 'green' | 'yellow' | 'red';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Alert {
  id: string;
  location: string;
  coordinates: Coordinates;
  severity: Severity;
  rainfallMm: number;        // mm/h previstos
  windKmh: number;            // km/h
  temperatureC: number;       // °C
  description: string;        // descrição em linguagem humana (pt-PT/MZ)
  advice: string;             // o que o cidadão deve fazer
  source: 'openweathermap' | 'cap-inam' | 'manual';
  issuedAt: string;           // ISO 8601
  expiresAt: string;          // ISO 8601
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  green: 'Seguro',
  yellow: 'Atenção',
  red: 'Perigo Imediato',
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  green: '#16a34a',
  yellow: '#eab308',
  red: '#dc2626',
};
