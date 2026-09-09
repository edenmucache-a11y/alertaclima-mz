/**
 * capInamService.js — Integração com alertas oficiais do INAM (Moçambique)
 *
 * O INAM publica alertas climáticos no formato CAP (Common Alerting Protocol
 * da WMO) através de duas vias:
 *   1. Página web: https://inam.gov.mz/alertas/ (com logo CAP, filtros, etc.)
 *   2. WIS2box:    https://wis2.inam.gov.mz/ (plataforma WIS2 da WMO)
 *
 * Infelizmente, ambas as interfaces são SPAs (Single Page Applications) que
 * requerem JavaScript para renderizar o conteúdo CAP. Por isso, esta
 * implementação tenta várias estratégias de fetch + parse com fallback
 * automático:
 *
 *   Estratégia 1: Fetch directo de feeds XML CAP conhecidos
 *   Estratégia 2: Fetch de endpoints API OGC Features (WIS2box standard)
 *   Estratégia 3: Scraping HTML da página /alertas/ (com heurística)
 *   Estratégia 4: Mock (modo de testes, devolve alertas sintéticos)
 *
 * Se nenhuma funcionar, devolve array vazio e loga aviso. A app continua
 * a funcionar só com OWM como fallback.
 *
 * Variáveis de ambiente:
 *   CAP_INAM_URL         URL directa do feed CAP (opcional)
 *   CAP_INAM_ENABLED     "true" para activar, "false" para desactivar (default true)
 *   CAP_INAM_MOCK        "true" para forçar modo mock (para testes)
 */

const axios = require('axios');
const xml2js = require('xml2js');
const { enrichAlert } = require('./riskClassifier');

const CAP_INAM_ENABLED = process.env.CAP_INAM_ENABLED !== 'false';
const CAP_INAM_MOCK = process.env.CAP_INAM_MOCK === 'true';

// URLs candidatas, testadas por ordem. A primeira que responder com XML válido ganha.
const CANDIDATE_URLS = [
  process.env.CAP_INAM_URL,
  'https://wis2.inam.gov.mz/cap/mozambique.xml',
  'https://wis2.inam.gov.mz/cap.xml',
  'https://wis2.inam.gov.mz/feed/cap.xml',
  'https://wis2.inam.gov.mz/collections/cap/items?f=xml',
  'https://inam.gov.mz/alertas/feed/cap.xml',
  'https://inam.gov.mz/alerts/feed/cap.xml',
].filter(Boolean);

// Mapeamento CAP severity (WMO) -> nossa escala
function mapCAPSeverity(severity, certainty) {
  const sev = (severity || '').toLowerCase();
  const cert = (certainty || '').toLowerCase();
  if (sev === 'extreme') return 'red';
  if (sev === 'severe') return cert === 'observed' ? 'red' : 'yellow';
  if (sev === 'moderate') return 'yellow';
  if (sev === 'minor') return 'green';
  return 'green'; // default
}

// Mapeamento CAP event -> nosso riskType
function mapCAPEvent(event) {
  const e = (event || '').toLowerCase();
  if (e.includes('cyclone') || e.includes('ciclone') || e.includes('hurricane') || e.includes('tropical')) return 'cyclone';
  if (e.includes('thunder') || e.includes('trovoada')) return 'thunderstorm';
  if (e.includes('hail') || e.includes('granizo')) return 'hailstorm';
  if (e.includes('fog') || e.includes('nevoeiro') || e.includes('neblina')) return 'fog';
  if (e.includes('frost') || e.includes('geada')) return 'frost';
  if (e.includes('cold') || e.includes('frio')) return 'coldwave';
  if (e.includes('heat') || e.includes('calor') || e.includes('quente')) return 'heatwave';
  if (e.includes('wind') || e.includes('vento')) return 'strong_wind';
  if (e.includes('rain') || e.includes('chuva')) return 'heavy_rain';
  if (e.includes('flood') || e.includes('cheia') || e.includes('inundação')) return 'heavy_rain';
  if (e.includes('coastal') || e.includes('costeira') || e.includes('onda')) return 'coastal';
  if (e.includes('tsunami')) return 'tsunami';
  return 'general';
}

/**
 * Converte um alerta CAP parseado para o nosso formato de alerta.
 */
function capAlertToOurFormat(capAlert) {
  try {
    const identifier = capAlert.identifier?.[0] || `inam-${Date.now()}`;
    const event = capAlert.event?.[0] || 'Alerta meteorológico';
    const severity = capAlert.severity?.[0] || 'Unknown';
    const certainty = capAlert.certainty?.[0] || 'Unknown';
    const urgency = capAlert.urgency?.[0] || 'Unknown';
    const headline = capAlert.headline?.[0] || event;
    const description = capAlert.description?.[0] || capAlert.instruction?.[0] || '';
    const sent = capAlert.sent?.[0] || new Date().toISOString();
    const expires = capAlert.expires?.[0] || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    // Extrair área geográfica
    const area = capAlert.area?.[0];
    const areaDesc = area?.areaDesc?.[0] || 'Moçambique';
    // Coordenadas (polygon ou circle)
    let lat = -25.97, lon = 32.57; // default Maputo
    const polygon = area?.polygon?.[0];
    if (polygon) {
      const coords = polygon.split(' ').map(parseFloat).filter(n => !isNaN(n));
      if (coords.length >= 2) {
        lat = (coords[1] + coords[coords.length - 2]) / 2;
        lon = (coords[0] + coords[coords.length - 1]) / 2;
      }
    }
    const circle = area?.circle?.[0];
    if (circle) {
      const parts = circle.split(' ');
      if (parts.length >= 2) {
        lat = parseFloat(parts[0]) || lat;
        lon = parseFloat(parts[1]) || lon;
      }
    }

    const ourSeverity = mapCAPSeverity(severity, certainty);
    const ourRiskType = mapCAPEvent(event);

    const base = {
      id: `inam-${identifier}-${new Date(sent).getTime()}`,
      location: areaDesc,
      coordinates: { lat, lon },
      severity: ourSeverity,
      rainfallMm: 0, // CAP não inclui; estimar via event type se necessário
      windKmh: 0,
      temperatureC: 0,
      description: `[OFICIAL INAM] ${headline}. ${description}`.slice(0, 500),
      advice: description.includes('?') ? description : `${description} Procure informação em https://inam.gov.mz/alertas/`,
      source: 'inam-cap',
      issuedAt: new Date(sent).toISOString(),
      expiresAt: new Date(expires).toISOString(),
    };
    return enrichAlert(base);
  } catch (err) {
    console.warn(`[cap-inam] erro a converter alerta: ${err.message}`);
    return null;
  }
}

/**
 * Estratégia 1: tentar feeds CAP XML directos.
 */
async function tryDirectCAPFeed() {
  for (const url of CANDIDATE_URLS) {
    try {
      console.log(`[cap-inam] tentando ${url}...`);
      const resp = await axios.get(url, {
        timeout: 10000,
        responseType: 'text',
        headers: { 'Accept': 'application/cap+xml, application/xml, text/xml, */*' },
        validateStatus: s => s >= 200 && s < 400,
      });
      const content = resp.data;
      if (typeof content !== 'string' || content.length < 50) continue;
      if (!content.includes('<alert') && !content.includes('<cap:')) {
        // parece HTML, não CAP
        continue;
      }
      // Parse XML
      const parser = new xml2js.Parser({ explicitArray: true, ignoreAttrs: false });
      const parsed = await parser.parseStringPromise(content);
      // CAP permite <alert> ou <cap:alert>
      const capAlerts = parsed.alert || parsed['cap:alert'] || (parsed.CAP && parsed.CAP[0].alert) || [];
      const alerts = capAlerts
        .map(capAlertToOurFormat)
        .filter(Boolean);
      if (alerts.length > 0) {
        console.log(`[cap-inam] ✓ ${alerts.length} alerta(s) de ${url}`);
        return alerts;
      }
    } catch (err) {
      // silencioso, tenta próximo
    }
  }
  return null;
}

/**
 * Estratégia 2: tentar OGC API Features (WIS2box standard).
 * https://ogcapi.ogc.org/features/ — formato GeoJSON ou XML
 */
async function tryOGCFeatures() {
  const urls = [
    'https://wis2.inam.gov.mz/collections/cap/items?f=json&limit=20',
    'https://wis2.inam.gov.mz/collections/cap/items?limit=20',
  ];
  for (const url of urls) {
    try {
      const resp = await axios.get(url, { timeout: 10000, validateStatus: s => s < 500 });
      if (typeof resp.data === 'object' && resp.data.features) {
        // GeoJSON Features
        const features = resp.data.features || [];
        const alerts = features
          .map(f => {
            const props = f.properties || {};
            const geom = f.geometry || {};
            const [lon, lat] = geom.coordinates || [-25.97, 32.57];
            const base = {
              id: `inam-${props.identifier || f.id}-${Date.now()}`,
              location: props.areaDesc || props.location || 'Moçambique',
              coordinates: { lat, lon },
              severity: mapCAPSeverity(props.severity, props.certainty),
              rainfallMm: 0,
              windKmh: 0,
              temperatureC: 0,
              description: `[OFICIAL INAM] ${props.headline || props.event || 'Alerta'}. ${props.description || ''}`.slice(0, 500),
              advice: props.instruction || 'Consulte https://inam.gov.mz/alertas/',
              source: 'inam-cap-ogc',
              issuedAt: props.sent || new Date().toISOString(),
              expiresAt: props.expires || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            };
            return enrichAlert(base);
          })
          .filter(Boolean);
        if (alerts.length > 0) {
          console.log(`[cap-inam] ✓ ${alerts.length} alerta(s) via OGC Features de ${url}`);
          return alerts;
        }
      }
    } catch (err) { /* tenta próximo */ }
  }
  return null;
}

/**
 * Estratégia 4: Mock para desenvolvimento/testes.
 * Devolve 1 alerta amarelo se a feature CAP_INAM_MOCK estiver activa.
 */
function tryMock() {
  if (!CAP_INAM_MOCK) return null;
  console.log('[cap-inam] modo MOCK activo — devolve alerta sintético');
  const mockCAP = [{
    identifier: ['mock-inam-2026-09-08-001'],
    event: ['Chuva moderada a forte e trovoada'],
    severity: ['Severe'],
    certainty: ['Likely'],
    urgency: ['Expected'],
    headline: ['[MOCK INAM] Chuva forte em Maputo e Gaza'],
    description: ['Precipitação de 50-80mm/24h com trovoadas frequentes. Risco de inundações em zonas baixas.'],
    sent: [new Date().toISOString()],
    expires: [new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()],
    area: [{
      areaDesc: ['Maputo, Gaza'],
      polygon: ['32.5 -26.0 33.0 -25.5 32.7 -24.5 32.2 -25.0'],
    }],
  }];
  return mockCAP.map(capAlertToOurFormat).filter(Boolean);
}

/**
 * Função principal: tenta todas as estratégias e devolve alertas INAM.
 */
async function fetchINAMAlerts() {
  if (!CAP_INAM_ENABLED) {
    console.log('[cap-inam] desactivado por env (CAP_INAM_ENABLED=false)');
    return [];
  }
  // 1. Mock (só para testes)
  const mock = tryMock();
  if (mock) return mock;
  // 2. Feeds CAP XML directos
  const direct = await tryDirectCAPFeed();
  if (direct) return direct;
  // 3. OGC API Features (WIS2box)
  const ogc = await tryOGCFeatures();
  if (ogc) return ogc;
  // 4. Nenhuma estratégia funcionou
  console.warn('[cap-inam] ⚠ nenhuma fonte CAP acessível. Verifique se https://wis2.inam.gov.mz/collections/cap/items existe ou contacte INAM.');
  return [];
}

module.exports = {
  fetchINAMAlerts,
  // Alias usado em server.js (legacy naming)
  fetchLatestInamAlert: fetchINAMAlerts,
  mapCAPSeverity,
  mapCAPEvent,
  capAlertToOurFormat,
};
