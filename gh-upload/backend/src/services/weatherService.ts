/**
 * services/weatherService.ts
 * Cliente HTTP para a OpenWeatherMap API.
 *
 * Funções:
 *  - getCurrentWeather(lat, lon): dados actuais
 *  - getForecast(lat, lon): previsão 5 dias / 3 horas
 *  - getWeatherAlerts(lat, lon): alertas oficiais (Gov API)
 *  - geocode(cityName): converte nome de cidade em coordenadas
 */
import axios from 'axios';
import { config } from '../config';

const owClient = axios.create({
  baseURL: config.OPENWEATHER_BASE_URL,
  timeout: 10_000,
  params: {
    appid: config.OPENWEATHER_API_KEY,
    units: 'metric', // °C, m/s
    lang: 'pt',
  },
});

export interface OWMCurrentWeather {
  name: string;
  coord: { lat: number; lon: number };
  main: { temp: number; humidity: number; pressure: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  wind: { speed: number; deg: number; gust?: number };
  rain?: { '1h'?: number; '3h'?: number };
  dt: number;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<OWMCurrentWeather> {
  const { data } = await owClient.get<OWMCurrentWeather>('/weather', {
    params: { lat, lon },
  });
  return data;
}

export interface OWMForecastEntry {
  dt: number;
  main: { temp: number; humidity: number };
  weather: Array<{ main: string; description: string }>;
  wind: { speed: number; gust?: number };
  rain?: { '3h': number };
}

export interface OWMForecast {
  list: OWMForecastEntry[];
  city: { name: string; coord: { lat: number; lon: number } };
}

export async function getForecast(lat: number, lon: number): Promise<OWMForecast> {
  const { data } = await owClient.get<OWMForecast>('/forecast', {
    params: { lat, lon },
  });
  return data;
}

export interface OWMGeocodeResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
}

export async function geocode(cityName: string): Promise<OWMGeocodeResult | null> {
  const url = 'https://api.openweathermap.org/geo/1.0/direct';
  const { data } = await axios.get<OWMGeocodeResult[]>(url, {
    params: { q: cityName, limit: 1, appid: config.OPENWEATHER_API_KEY },
  });
  return data[0] ?? null;
}
