/**
 * App.jsx — Dashboard principal AlertaClima · AMOSA · Moçambique
 *
 * Layout:
 *  1. Header
 *  2. Mapa (apenas alertas activos)
 *  3. Alertas activos (cards detalhados)
 *  4. Histórico (alertas não activos, desde Janeiro)
 *  5. Subscrição por email
 *  6. Secção institucional AMOSA
 *  7. Footer
 */
import { useState } from 'react';
import { useAlerts } from './hooks/useAlerts.js';
import { AlertMap } from './components/AlertMap.jsx';
import { AlertList } from './components/AlertList.jsx';
import { AboutAMOSA } from './components/AboutAMOSA.jsx';
import { SubscribeForm } from './components/SubscribeForm.jsx';
import { SkeletonMap, SkeletonAlertList, SkeletonHeader } from './components/Skeleton.jsx';

function relativeDate(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d < 1) return 'hoje';
  if (d < 30) return `há ${d} dias`;
  if (d < 365) return `há ${Math.floor(d / 30)} meses`;
  return `há ${Math.floor(d / 365)} anos`;
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      timeZone: 'Africa/Maputo',
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(iso));
  } catch (e) { return iso; }
}

export function App() {
  const { data, error, loading, active, inactive, totalActive, totalInactive } = useAlerts();
  const reds = active.filter((a) => a.severity === 'red').length;
  const yellows = active.filter((a) => a.severity === 'yellow').length;

  const [centerOn, setCenterOn] = useState(null);
  const [zoomTo, setZoomTo] = useState(8);

  const focusOnMap = (alert) => {
    if (!alert || !alert.coordinates) return;
    setCenterOn({ ...alert.coordinates, _key: Date.now() });
    setZoomTo(9);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">
            <span>AlertaClima</span> · <span style={{ color: 'var(--c-accent)' }}>AMOSA</span> · Moçambique
          </h1>
          <p className="app__subtitle">
            Plataforma de alerta de chuvas intensas e ciclones · INAM + OpenWeatherMap
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {loading && !error && (
            <div style={{ minWidth: 200 }}>
              <SkeletonHeader />
            </div>
          )}
          {error && (
            <>
              <p style={{ color: 'var(--c-red)', margin: 0 }}>⚠ {error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 6,
                  padding: '4px 10px',
                  background: 'transparent',
                  color: 'var(--c-muted)',
                  border: '1px solid #475569',
                  borderRadius: 4,
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                Tentar novamente
              </button>
            </>
          )}
          {!loading && !error && (
            <>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                {totalActive}{' '}
                <small style={{ color: 'var(--c-muted)', fontWeight: 400 }}>
                  alertas activos
                </small>
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--c-red)' }}>● {reds} críticos</span>
                {' · '}
                <span style={{ color: 'var(--c-yellow)' }}>● {yellows} atenção</span>
                {totalInactive > 0 && (
                  <span style={{ color: 'var(--c-muted)' }}> · {totalInactive} antigos</span>
                )}
              </p>
            </>
          )}
        </div>
      </header>

      <main className="dashboard">
        <section className="card">
          <h2 className="card__title">
            Mapa de Moçambique
            {centerOn && (
              <button
                onClick={() => { setCenterOn(null); setZoomTo(6); }}
                style={{
                  marginLeft: 12,
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: 'var(--c-muted)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                ↻ Ver Moçambique
              </button>
            )}
          </h2>
          {/* Apenas alertas activos no mapa (fáceis de clicar) */}
          {loading && !error ? <SkeletonMap /> : <AlertMap alerts={active} centerOn={centerOn} zoomTo={zoomTo} />}
        </section>
        <aside className="card">
          <h2 className="card__title">
            Alertas activos{' '}
            <span style={{ color: 'var(--c-muted)', fontWeight: 400, fontSize: '0.8rem' }}>
              ({totalActive})
            </span>
          </h2>
          {loading && !error ? <SkeletonAlertList count={4} /> : <AlertList alerts={active} onFocusAlert={focusOnMap} />}
        </aside>
      </main>

      {/* Histórico de alertas não activos (não têm classificação de risco) */}
      {totalInactive > 0 && (
        <section className="history-section">
          <div className="card">
            <h2 className="card__title">
              🕘 Histórico de alertas{' '}
              <span style={{ color: 'var(--c-muted)', fontWeight: 400, fontSize: '0.8rem' }}>
                ({totalInactive} expirados · desde Janeiro)
              </span>
            </h2>
            <ul className="alert-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {inactive.slice(0, 15).map((a) => (
                <li key={a.id} className="alert alert--inactive" style={{ cursor: 'pointer', opacity: 0.7 }}
                  onClick={() => focusOnMap(a)}>
                  <span className="alert__bar" style={{ background: '#475569' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '1.2rem', filter: 'grayscale(0.5)' }}>📜</span>
                      <span className="alert__location" style={{ flex: 1 }}>{a.location}</span>
                      <span className="severity-tag" style={{ background: '#475569' }}>
                        EXPIRADO
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--c-muted)',
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                      <span>🕐 {formatDate(a.issuedAt)}</span>
                      <span>· {relativeDate(a.issuedAt)}</span>
                    </div>
                    <div className="alert__desc" style={{ marginTop: 4, fontSize: '0.8rem' }}>
                      {a.description.length > 100 ? a.description.slice(0, 97) + '…' : a.description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {inactive.length > 15 && (
              <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: 8 }}>
                +{inactive.length - 15} alertas antigos no histórico
              </p>
            )}
          </div>
        </section>
      )}

      <section className="subscribe-section">
        <SubscribeForm />
      </section>

      <section className="about-section">
        <AboutAMOSA />
      </section>

      <footer className="app__footer">
        <p>
          © 2026 AlertaClima MZ · Uma iniciativa da{' '}
          <a href="https://www.amosa.org.mz" target="_blank" rel="noreferrer">AMOSA</a>{' '}
          (Associação Moçambicana para Saúde e Ambiente) ·{' '}
          <a href="mailto:amosa.associacao@gmail.com">amosa.associacao@gmail.com</a>{' '}
          · <a href="tel:+25883462650">+258 83 462 650</a> /{' '}
          <a href="tel:+25883462657">+258 83 462 657</a>
        </p>
        <p style={{ marginTop: 8, fontSize: '0.8rem' }}>
          <a href="/faq">FAQ</a> · <a href="/privacy">Privacidade</a> ·{' '}
          <a href="/api/alerts/feed.rss" target="_blank" rel="noreferrer">RSS</a> ·{' '}
          <a href="/api/health" target="_blank" rel="noreferrer">Status</a> ·{' '}
          <a href="/unsubscribe">Cancelar subscrição</a>
        </p>
      </footer>
    </div>
  );
}
