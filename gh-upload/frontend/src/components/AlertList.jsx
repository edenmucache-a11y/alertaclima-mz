/**
 * AlertList — lista de alertas activos.
 * Cada card mostra:
 *  - Ícone do tipo de risco (ciclone, chuva, vento, calor, ...)
 *  - Localização
 *  - Data e hora do alerta (em Africa/Maputo)
 *  - Métricas: chuva, vento, temperatura
 *  - Severity tag
 *  - Botão "Ver no mapa" (faz pan/zoom no mapa)
 */
import { SEVERITY_LABELS } from '../lib/types.js';

const SEVERITY_HEX = { green: '#16a34a', yellow: '#eab308', red: '#dc2626' };

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('pt-PT', {
      timeZone: 'Africa/Maputo',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(d);
  } catch (e) {
    return iso;
  }
}

function relativeTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dias`;
  return formatDateTime(iso);
}

export function AlertList({ alerts, onFocusAlert }) {
  if (!alerts || alerts.length === 0) {
    return <p style={{ color: 'var(--c-muted)' }}>Sem alertas activos no momento.</p>;
  }
  // Ordenar: vermelhos primeiro, depois amarelos, depois verdes
  const sorted = [...alerts].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <ul className="alert-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {sorted.map((a) => {
        const sev = SEVERITY_HEX[a.severity] || '#64748b';
        const riskIcon = a.riskIcon || '⚠';
        const riskLabel = a.riskLabel || 'Alerta';
        return (
          <li
            key={a.id}
            className={`alert alert--${a.severity}`}
            style={{
              cursor: onFocusAlert ? 'pointer' : 'default',
            }}
            onClick={() => onFocusAlert && onFocusAlert(a)}
          >
            <span className="alert__bar" style={{ background: sev }} />
            <div style={{ flex: 1 }}>
              {/* Cabeçalho: ícone + localização + tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.4rem' }}>{riskIcon}</span>
                <span className="alert__location" style={{ flex: 1 }}>{a.location}</span>
                {a.official && (
                  <span
                    title="Alerta oficial do INAM"
                    style={{
                      background: 'linear-gradient(135deg, #22772e 0%, #0b771a 100%)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    🏛️ OFICIAL INAM
                  </span>
                )}
                <span
                  className={`severity-tag severity-tag--${a.severity}`}
                  style={{ background: sev }}
                >
                  {SEVERITY_LABELS[a.severity] || a.severity}
                </span>
              </div>

              {/* Tipo de risco + data/hora */}
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--c-muted)',
                  marginBottom: 6,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#7dd3fc',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {riskLabel.toUpperCase()}
                </span>
                <span title={formatDateTime(a.issuedAt)}>
                  🕐 {relativeTime(a.issuedAt)}
                </span>
                <span style={{ color: 'var(--c-muted)', fontSize: '0.7rem' }}>
                  ({formatDateTime(a.issuedAt)})
                </span>
              </div>

              {/* Descrição resumida */}
              <div className="alert__desc" style={{ marginBottom: 6 }}>
                {a.description.length > 120 ? a.description.slice(0, 117) + '…' : a.description}
              </div>

              {/* Métricas */}
              <div className="alert__desc" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>🌧 {a.rainfallMm.toFixed(1)} mm/h</span>
                <span>💨 {a.windKmh} km/h</span>
                <span>🌡 {a.temperatureC.toFixed(1)}°C</span>
              </div>

              {/* Advice (sempre presente) */}
              <div
                className="alert__desc"
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: '1px dashed #334155',
                  color: sev,
                  fontWeight: 500,
                }}
              >
                🛡 {a.advice.length > 100 ? a.advice.slice(0, 97) + '…' : a.advice}
              </div>

              {/* Acções */}
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFocusAlert && onFocusAlert(a); }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #475569',
                    color: 'var(--c-text)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  🗺 Ver no mapa
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
