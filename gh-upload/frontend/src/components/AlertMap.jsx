/**
 * AlertMap — Mapa de Moçambique com marcadores por tipo de risco e severity.
 * Suporta:
 *  - Pan/zoom programático (props.centerOn, props.zoomTo)
 *  - Popups com tipo de risco, data/hora, métricas, conselho
 */
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';

const SEVERITY_HEX = {
  green: '#16a34a',
  yellow: '#eab308',
  red: '#dc2626',
};

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('pt-PT', {
      timeZone: 'Africa/Maputo',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(d);
  } catch (e) { return iso; }
}

/** Componente auxiliar para pan/zoom programático */
function MapController({ centerOn, zoomTo }) {
  const map = useMap();
  useEffect(() => {
    if (centerOn) {
      map.flyTo([centerOn.lat, centerOn.lon], zoomTo || 9, { duration: 0.8 });
    }
  }, [centerOn, zoomTo, map]);
  return null;
}

export function AlertMap({ alerts, centerOn, zoomTo }) {
  const center = [-18.665, 35.529];

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <MapController centerOn={centerOn} zoomTo={zoomTo} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {alerts.map((a) => {
          const sev = SEVERITY_HEX[a.severity] || '#64748b';
          const riskIcon = a.riskIcon || '⚠';
          const riskLabel = a.riskLabel || 'Alerta';
          return (
            <CircleMarker
              key={a.id}
              center={[a.coordinates.lat, a.coordinates.lon]}
              radius={a.severity === 'red' ? 16 : a.severity === 'yellow' ? 12 : 8}
              pathOptions={{
                color: sev,
                fillColor: sev,
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                <strong>{riskIcon} {a.location}</strong>
                <br />
                <small>{riskLabel}</small>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 240 }}>
                  <div
                    style={{
                      background: sev,
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: '4px 4px 0 0',
                      margin: '-10px -10px 8px -10px',
                    }}
                  >
                    <strong style={{ fontSize: '1rem' }}>
                      {riskIcon} {riskLabel}
                    </strong>
                    <br />
                    <span style={{ fontSize: '0.85rem' }}>{a.location}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6 }}>
                    🕐 <strong>Emitido:</strong> {formatDateTime(a.issuedAt)}
                    <br />
                    ⏳ <strong>Expira:</strong> {formatDateTime(a.expiresAt)}
                  </div>

                  <p style={{ fontSize: '0.85rem', margin: '6px 0' }}>{a.description}</p>

                  <table style={{ width: '100%', fontSize: '0.8rem', margin: '8px 0' }}>
                    <tbody>
                      <tr>
                        <td><strong>🌧 Chuva</strong></td>
                        <td style={{ textAlign: 'right' }}>{a.rainfallMm.toFixed(1)} mm/h</td>
                      </tr>
                      <tr>
                        <td><strong>💨 Vento</strong></td>
                        <td style={{ textAlign: 'right' }}>{a.windKmh} km/h</td>
                      </tr>
                      <tr>
                        <td><strong>🌡 Temp.</strong></td>
                        <td style={{ textAlign: 'right' }}>{a.temperatureC.toFixed(1)}°C</td>
                      </tr>
                    </tbody>
                  </table>

                  <div
                    style={{
                      background: '#f1f5f9',
                      borderLeft: `3px solid ${sev}`,
                      padding: '6px 8px',
                      fontSize: '0.8rem',
                      borderRadius: 4,
                    }}
                  >
                    <strong>🛡 O que fazer:</strong> {a.advice}
                  </div>

                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 8 }}>
                    Fonte: {a.source === 'openweathermap' ? 'OpenWeatherMap' : a.source}
                    {a.source === 'manual' && ' (INAM / dados reais)'}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
