import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import { Unsubscribe } from './Unsubscribe.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#dc2626' }}>
          <h1>⚠ Erro na aplicação</h1>
          <pre>{String(this.state.error)}</pre>
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
