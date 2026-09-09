import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import { Unsubscribe } from './Unsubscribe.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    // Em produção, enviar para Sentry/Loggly/etc. Aqui só console.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }
  handleReset = () => {
    this.setState({ error: null, info: null });
    // Forçar reload se for erro persistente
    if (this.state.error) {
      window.location.reload();
    }
  };
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#e2e8f0',
          padding: 24,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: 480,
            background: '#1e293b',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            border: '1px solid #dc2626',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ margin: 0, fontSize: 22, color: '#fca5a5' }}>
              Algo correu mal
            </h1>
            <p style={{ color: '#94a3b8', marginTop: 8, marginBottom: 16 }}>
              A aplicação encontrou um erro inesperado. Pode tentar
              recarregar a página. Se o problema persistir, contacte
              a equipa técnica.
            </p>
            {this.state.error && (
              <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', color: '#94a3b8' }}>
                  Detalhes técnicos
                </summary>
                <pre style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#0f172a',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#fca5a5',
                  overflow: 'auto',
                  maxHeight: 160,
                }}>
                  {String(this.state.error?.message || this.state.error)}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#22772e',
                  color: '#fff',
                  border: 0,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔄 Recarregar
              </button>
              <a
                href="mailto:eden.mucache@gmail.com?subject=Erro%20AlertaClima%20MZ&body=Erro:%20URL%20%3D%20"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #475569',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                📧 Reportar
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Roteamento client-side simples
const path = window.location.pathname;
const Page = path.startsWith('/unsubscribe') ? Unsubscribe : App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Page />
    </ErrorBoundary>
  </React.StrictMode>
);
