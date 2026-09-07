/**
 * riskClassifier.js — Sistema de classificação de alertas por tipo de risco.
 *
 * Tipos de risco suportados (12):
 *   - cyclone     : Ciclone tropical / tempestade ciclónica (vento ≥ 118 km/h)
 *   - heavy_rain  : Chuvas intensas (≥ 50 mm/h) ou extremas (≥ 100 mm/h)
 *   - strong_wind : Ventos fortes sem chuva ciclónica (60-117 km/h)
 *   - heatwave    : Calor intenso (≥ 35°C) ou extremo (≥ 40°C)
 *   - coldwave    : Frio intenso (< 10°C)
 *   - thunderstorm: Trovoadas severas
 *   - coastal     : Alerta costeiro (vento + agitação marítima)
 *   - hailstorm   : Granizo
 *   - fog         : Nevoeiro
 *   - tsunami     : Tsunami / ondas extremas
 *   - frost       : Geada
 *   - general     : Meteorologia geral (severity green)
 *
 * Cada tipo tem:
 *   - label       : nome legível em português
 *   - icon        : emoji representativo
 *   - color       : cor hexadecimal para UI
 *   - threshold   : regras de classificação
 */

const RISK_TYPES = {
  cyclone: {
    label: 'Ciclone Tropical',
    icon: '🌀',
    color: '#7c3aed',
    description: 'Ciclone tropical ou tempestade ciclónica em curso',
  },
  heavy_rain: {
    label: 'Chuvas Intensas',
    icon: '🌧',
    color: '#0284c7',
    description: 'Precipitação forte ou muito forte',
  },
  strong_wind: {
    label: 'Ventos Fortes',
    icon: '💨',
    color: '#0891b2',
    description: 'Rajadas de vento significativas',
  },
  heatwave: {
    label: 'Calor Intenso',
    icon: '🔥',
    color: '#dc2626',
    description: 'Temperatura muito elevada (onda de calor)',
  },
  coldwave: {
    label: 'Frio Intenso',
    icon: '🥶',
    color: '#3b82f6',
    description: 'Temperatura muito baixa (onda de frio)',
  },
  thunderstorm: {
    label: 'Trovoada Severa',
    icon: '⛈',
    color: '#eab308',
    description: 'Actividade eléctrica intensa',
  },
  coastal: {
    label: 'Alerta Costeiro',
    icon: '🌊',
    color: '#06b6d4',
    description: 'Vento forte ou agitação marítima na costa',
  },
  hailstorm: {
    label: 'Granizo',
    icon: '🌨',
    color: '#0ea5e9',
    description: 'Precipitação em forma de gelo (granizo)',
  },
  fog: {
    label: 'Nevoeiro',
    icon: '🌫',
    color: '#94a3b8',
    description: 'Visibilidade reduzida por nevoeiro',
  },
  tsunami: {
    label: 'Tsunami',
    icon: '🌊',
    color: '#1e3a8a',
    description: 'Ondas gigantes de origem sísmica',
  },
  frost: {
    label: 'Geada',
    icon: '❄️',
    color: '#bae6fd',
    description: 'Formação de gelo no solo (geada)',
  },
  general: {
    label: 'Meteorologia Geral',
    icon: '☁️',
    color: '#64748b',
    description: 'Condições meteorológicas gerais',
  },
};

/**
 * Verifica se um alerta ainda está activo (não expirou).
 */
function isActive(alert) {
  if (!alert || !alert.expiresAt) return false;
  return new Date(alert.expiresAt).getTime() > Date.now();
}

/**
 * Classifica um alerta com base nos parâmetros meteorológicos.
 * Pode retornar múltiplos tipos (ex: cyclone + heavy_rain + coastal).
 */
function classify(alert) {
  const types = [];
  const { rainfallMm = 0, windKmh = 0, temperatureC = 20, description = '' } = alert;
  const desc = description.toLowerCase();

  // 1. CICLONE (prioridade máxima): vento ≥ 118 km/h
  if (windKmh >= 118 || desc.includes('ciclone') || desc.includes('cyclone')) {
    types.push('cyclone');
    if (rainfallMm >= 50) types.push('heavy_rain');
    if (desc.includes('costeira') || desc.includes('costeiro') || desc.includes('marítima')) {
      types.push('coastal');
    }
    return { primary: 'cyclone', types, severity: 'red' };
  }

  // 2. CHUVA EXTREMA (vermelho): ≥ 100 mm/h
  if (rainfallMm >= 100) {
    types.push('heavy_rain');
    if (windKmh >= 60) types.push('strong_wind');
    if (windKmh >= 40) types.push('thunderstorm');
    return { primary: 'heavy_rain', types, severity: 'red' };
  }

  // 3. VENTO FORTE (≥ 60 km/h) sem chuva ciclónica
  if (windKmh >= 60) {
    types.push('strong_wind');
    if (desc.includes('costeira') || desc.includes('costeiro') || desc.includes('marítima')) {
      types.push('coastal');
    }
    return { primary: 'strong_wind', types, severity: 'yellow' };
  }

  // 4. CHUVA INTENSA (amarelo): 50-99 mm/h
  if (rainfallMm >= 50) {
    types.push('heavy_rain');
    if (windKmh >= 30) types.push('thunderstorm');
    return { primary: 'heavy_rain', types, severity: 'yellow' };
  }

  // 5. GRANIZO
  if (desc.includes('granizo') || desc.includes('hail')) {
    return { primary: 'hailstorm', types: ['hailstorm'], severity: 'yellow' };
  }

  // 6. NEVOEIRO
  if (desc.includes('nevoeiro') || desc.includes('neblina') || desc.includes('fog')) {
    return { primary: 'fog', types: ['fog'], severity: 'yellow' };
  }

  // 7. TSUNAMI
  if (desc.includes('tsunami') || desc.includes('ondas gigantes')) {
    return { primary: 'tsunami', types: ['tsunami', 'coastal'], severity: 'red' };
  }

  // 8. GEADA
  if (desc.includes('geada') || desc.includes('frost')) {
    return { primary: 'frost', types: ['frost'], severity: 'yellow' };
  }

  // 9. CALOR EXTREMO (vermelho)
  if (temperatureC >= 40) {
    return { primary: 'heatwave', types: ['heatwave'], severity: 'red' };
  }

  // 10. CALOR INTENSO (amarelo)
  if (temperatureC >= 35) {
    return { primary: 'heatwave', types: ['heatwave'], severity: 'yellow' };
  }

  // 11. FRIO EXTENSO (vermelho)
  if (temperatureC <= 5) {
    return { primary: 'coldwave', types: ['coldwave'], severity: 'red' };
  }

  // 12. FRIO INTENSO (amarelo)
  if (temperatureC < 10) {
    return { primary: 'coldwave', types: ['coldwave'], severity: 'yellow' };
  }

  // 13. Trovoadas com chuva leve
  if (rainfallMm >= 10 && (windKmh >= 30 || desc.includes('trovoada'))) {
    return { primary: 'thunderstorm', types: ['thunderstorm'], severity: 'green' };
  }

  // 14. Default
  return { primary: 'general', types: ['general'], severity: 'green' };
}

/**
 * Enriquece um alerta com os campos riskType e riskLabel.
 * NÃO classifica alertas não activos (históricos) — deixa-os sem classificação.
 */
function enrichAlert(alert) {
  // Se o alerta já está expirado, não classificar
  if (!isActive(alert)) {
    return {
      ...alert,
      active: false,
      riskType: null,
      riskTypes: [],
      riskLabel: null,
      riskIcon: null,
      riskColor: null,
      riskDescription: null,
    };
  }
  const classification = classify(alert);
  const primaryType = classification.primary;
  const meta = RISK_TYPES[primaryType];
  return {
    ...alert,
    active: true,
    riskType: primaryType,
    riskTypes: classification.types,
    riskLabel: meta.label,
    riskIcon: meta.icon,
    riskColor: meta.color,
    riskDescription: meta.description,
    severity: classification.severity || alert.severity,
  };
}

module.exports = {
  RISK_TYPES,
  classify,
  enrichAlert,
  isActive,
};
