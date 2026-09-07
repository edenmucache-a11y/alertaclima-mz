/**
 * historicalAlerts.js — Alertas climáticos reais que afectaram Maputo
 * nos últimos meses (fontes: INAM Moçambique, AIM News, idolo.co.mz).
 *
 * Dados utilizados para popular o dashboard em modo demo.
 */

const historicalAlerts = [
  // ============================================================
  // Ciclone Tropical Intenso "Dudzai" — 15 a 17 Janeiro 2026
  // (Fonte: idolo.co.mz, INAM)
  // ============================================================
  {
    location: 'Maputo',
    coordinates: { lat: -25.9692, lon: 32.5728 },
    severity: 'red',
    rainfallMm: 218,         // pico de precipitação previsto
    windKmh: 145,             // rajadas ciclónicas
    temperatureC: 27.5,
    description: 'Ciclone Tropical Intenso "Dudzai" — chuva muito forte (acima de 100mm/24h) com acumulados até 218mm. Ventos com rajadas ciclónicas na zona costeira. (INAM, 15 Jan 2026)',
    advice: 'PERIGO IMEDIATO. Risco extremo de inundações urbanas em zonas baixas. Retire-se preventivamente de áreas de risco. Evite circular. Contacte a Defesa Civil: 119',
    source: 'manual',          // (dados reais do INAM, marcados como manual para distingui-los do OWM)
    issuedAt: '2026-01-15T14:00:00+02:00',
    expiresAt: '2026-01-17T23:59:00+02:00',
  },
  {
    location: 'Matola',
    coordinates: { lat: -25.9625, lon: 32.4589 },
    severity: 'red',
    rainfallMm: 195,
    windKmh: 130,
    temperatureC: 27.2,
    description: 'Ciclone Tropical Intenso "Dudzai" — influência directa. Inundações e queda de árvores em zonas residenciais. (INAM, 15 Jan 2026)',
    advice: 'PERIGO IMEDIATO. Reforce estruturas de habitação. Evite contacto com equipamentos eléctricos durante trovoadas.',
    source: 'manual',
    issuedAt: '2026-01-15T14:00:00+02:00',
    expiresAt: '2026-01-17T23:59:00+02:00',
  },
  {
    location: 'Marracuene',
    coordinates: { lat: -25.7333, lon: 32.6833 },
    severity: 'red',
    rainfallMm: 178,
    windKmh: 125,
    temperatureC: 27.0,
    description: 'Ciclone Tropical Intenso "Dudzai" — trovoadas severas e persistentes. Caudais dos rios em subida crítica. (INAM, 15 Jan 2026)',
    advice: 'PERIGO IMEDIATO. Afaste-se de bacias hidrográficas. Risco de cheias rápidas.',
    source: 'manual',
    issuedAt: '2026-01-15T14:00:00+02:00',
    expiresAt: '2026-01-17T23:59:00+02:00',
  },
  {
    location: 'Xai-Xai',
    coordinates: { lat: -25.0519, lon: 33.6472 },
    severity: 'yellow',
    rainfallMm: 88,
    windKmh: 85,
    temperatureC: 26.8,
    description: 'Ciclone Tropical Intenso "Dudzai" — chuva forte a muito forte (>50mm/24h). Vento moderado a forte. (INAM, 15 Jan 2026)',
    advice: 'ATENÇÃO. Acompanhe boletins. Preparekit de emergência.',
    source: 'manual',
    issuedAt: '2026-01-15T14:00:00+02:00',
    expiresAt: '2026-01-17T23:59:00+02:00',
  },

  // ============================================================
  // Chuvas extremas — 2 a 5 Janeiro 2026
  // (Fonte: INAM Boletim Provincial Maputo, Fevereiro 2026)
  // Janeiro 2026 foi o mais húmido em Maputo desde 1981
  // 200.3mm registados em Changalane no dia 16
  // ============================================================
  {
    location: 'Maputo',
    coordinates: { lat: -25.9692, lon: 32.5728 },
    severity: 'yellow',
    rainfallMm: 95,
    windKmh: 45,
    temperatureC: 24.8,
    description: 'Chuvas extremas em sequência (5 dias consecutivos). Excesso hídrico afecta culturas e infraestruturas. (INAM, Jan 2026)',
    advice: 'ATENÇÃO. Evite zonas de acumulação de água. Limpe valas de drenagem.',
    source: 'manual',
    issuedAt: '2026-01-03T18:00:00+02:00',
    expiresAt: '2026-01-06T18:00:00+02:00',
  },
  {
    location: 'Changalane',
    coordinates: { lat: -26.3142, lon: 32.1833 },
    severity: 'red',
    rainfallMm: 200.3,
    windKmh: 55,
    temperatureC: 25.1,
    description: 'Pico de precipitação registado: 200.3mm em 24h. Janeiro 2026 é o mais chuvoso em Maputo desde 1981. (INAM, 16 Jan 2026)',
    advice: 'PERIGO IMEDIATO. Inundações severas em zonas agrícolas. Avaliar danos em habitações precárias.',
    source: 'manual',
    issuedAt: '2026-01-16T08:00:00+02:00',
    expiresAt: '2026-01-19T08:00:00+02:00',
  },

  // ============================================================
  // Alerta vento costeiro — 24 Julho 2026
  // (Fonte: inam.gov.mz/alertas/)
  // ============================================================
  {
    location: 'Maputo',
    coordinates: { lat: -25.9692, lon: 32.5728 },
    severity: 'yellow',
    rainfallMm: 12,
    windKmh: 68,
    temperatureC: 22.5,
    description: 'Ventos moderados a fortes na zona costeira. Rajadas podem atingir 70 km/h. (INAM, 24 Jul 2026)',
    advice: 'ATENÇÃO. Evite actividades marítimas. Proteja embarcações pequenas.',
    source: 'manual',
    issuedAt: '2026-07-24T08:55:00+02:00',
    expiresAt: '2026-07-25T18:00:00+02:00',
  },

  // ============================================================
  // Chuvas moderadas a fortes — 5 Maio 2026
  // (Fonte: inam.gov.mz/alertas/)
  // ============================================================
  {
    location: 'Maputo',
    coordinates: { lat: -25.9692, lon: 32.5728 },
    severity: 'yellow',
    rainfallMm: 65,
    windKmh: 42,
    temperatureC: 23.2,
    description: 'Chuvas moderadas a fortes com trovoadas. Possibilidade de granizo. (INAM, 5 Mai 2026)',
    advice: 'ATENÇÃO. Acompanhe evolução. Evite zonas com risco de inundação.',
    source: 'manual',
    issuedAt: '2026-05-05T14:01:00+02:00',
    expiresAt: '2026-05-07T23:59:00+02:00',
  },

  // ============================================================
  // Alerta vento costeiro — 22 Abril 2026
  // ============================================================
  {
    location: 'Maputo',
    coordinates: { lat: -25.9692, lon: 32.5728 },
    severity: 'yellow',
    rainfallMm: 8,
    windKmh: 75,
    temperatureC: 24.0,
    description: 'Ventos fortes na zona costeira de Maputo, Gaza e Inhambane. Ondas até 3 metros. (INAM, 22 Abr 2026)',
    advice: 'ATENÇÃO. Suspenda actividades de pesca. Vigie embarcações em marinas.',
    source: 'manual',
    issuedAt: '2026-04-22T14:25:00+02:00',
    expiresAt: '2026-04-24T20:00:00+02:00',
  },

  // ============================================================
  // Chuvas extremas — 20 Março 2026 (Thunderstorms)
  // ============================================================
  {
    location: 'Maputo',
    coordinates: { lat: -25.9692, lon: 32.5728 },
    severity: 'yellow',
    rainfallMm: 72,
    windKmh: 58,
    temperatureC: 25.3,
    description: 'Trovoadas severas e linhas de instabilidade (squall lines). Chuva forte de curta duração. (INAM, 20 Mar 2026)',
    advice: 'ATENÇÃO. Procure abrigo. Desligue equipamentos eléctricos durante trovoadas.',
    source: 'manual',
    issuedAt: '2026-03-20T14:06:00+02:00',
    expiresAt: '2026-03-22T06:00:00+02:00',
  },

  // ============================================================
  // ALERTAS ACTIVOS RECENTES (vão aparecer como "Activos" no dashboard)
  // ============================================================

  // Ciclone activo — Set 2026
  {
    location: 'Beira',
    coordinates: { lat: -19.8436, lon: 34.8386 },
    severity: 'red',
    rainfallMm: 165,
    windKmh: 135,
    temperatureC: 26.0,
    description: 'Ciclone tropical a 250km da costa. INAM prevê impacto directo em 12-24h. Chuvas torrenciais e ventos ciclónicos.',
    advice: 'PERIGO IMEDIATO. Evacuação preventiva de zonas costeiras. Procure abrigo em estruturas sólidas.',
    source: 'manual',
    issuedAt: '2026-09-05T08:00:00+02:00',
    expiresAt: '2026-09-08T20:00:00+02:00',
  },

  // Calor intenso activo
  {
    location: 'Tete',
    coordinates: { lat: -16.1500, lon: 33.5833 },
    severity: 'yellow',
    rainfallMm: 0,
    windKmh: 15,
    temperatureC: 42.5,
    description: 'Onda de calor. Temperaturas acima de 42°C na província de Tete. INAM recomenda evitar exposição solar entre 11h-16h.',
    advice: 'ATENÇÃO. Beba muita água. Evite exercício físico ao ar livre nas horas de pico.',
    source: 'manual',
    issuedAt: '2026-09-06T10:00:00+02:00',
    expiresAt: '2026-09-09T20:00:00+02:00',
  },

  // Nevoeiro activo (testa o novo tipo)
  {
    location: 'Chimoio',
    coordinates: { lat: -19.1167, lon: 33.4833 },
    severity: 'yellow',
    rainfallMm: 0,
    windKmh: 5,
    temperatureC: 14.2,
    description: 'Nevoeiro denso na região de Manica. Visibilidade inferior a 50 metros nas estradas.',
    advice: 'ATENÇÃO. Conduza com extrema precaução. Use faróis de nevoeiro.',
    source: 'manual',
    issuedAt: '2026-09-07T05:00:00+02:00',
    expiresAt: '2026-09-07T20:00:00+02:00',
  },
];

module.exports = { historicalAlerts };
