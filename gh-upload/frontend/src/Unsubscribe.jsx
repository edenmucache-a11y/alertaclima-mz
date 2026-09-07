/**
 * Unsubscribe.jsx — Página de cancelamento de subscrição.
 * Acessível via /unsubscribe?email=...&token=...
 *
 * Mostra confirmação, remove o utilizador da lista, e oferece
 * link para voltar ao dashboard.
 */
import { useEffect, useRef, useState } from 'react';

export function Unsubscribe() {
  const [status, setStatus] = useState('loading'); // loading | success | error | already
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  // Garante que o fetch só corre uma vez (evita duplicação em React StrictMode)
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const e = params.get('email') || '';
    const t = params.get('token') || '';
    setEmail(e);
    if (!e || !t) {
      setStatus('error');
      setMessage('Link inválido. Faltam o email ou o token.');
      return;
    }
    // RFC 8058 one-click: enviar POST com header List-Unsubscribe=One-Click
    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'List-Unsubscribe': 'One-Click',
      },
      body: JSON.stringify({ email: e, token: t }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus('success');
          setMessage(`Subscrição cancelada para ${e}. Não vais receber mais emails.`);
        } else if (data.alreadyUnsubscribed) {
          setStatus('already');
          setMessage(`${e} já não estava subscrito.`);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro desconhecido.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(`Erro de rede: ${err.message}`);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg)',
        padding: '1.5rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          background: 'var(--c-card)',
          borderRadius: 16,
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--c-text)',
        }}
      >
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48 }}>⏳</div>
            <h1>A cancelar a tua subscrição…</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48 }}>✓</div>
            <h1 style={{ color: 'var(--c-green)' }}>Subscrição cancelada</h1>
            <p style={{ color: 'var(--c-muted)' }}>{message}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)' }}>
              Se foi engano, podes voltar a subscrever a partir do dashboard.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                background: 'var(--c-accent)',
                color: '#0f172a',
                padding: '0.6rem 1.25rem',
                borderRadius: 6,
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: 12,
              }}
            >
              Voltar ao dashboard
            </a>
          </>
        )}
        {status === 'already' && (
          <>
            <div style={{ fontSize: 48 }}>ℹ</div>
            <h1>Já não estavas subscrito</h1>
            <p style={{ color: 'var(--c-muted)' }}>{message}</p>
            <a
              href="/"
              style={{ color: 'var(--c-accent)', textDecoration: 'none' }}
            >
              Voltar ao dashboard
            </a>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48 }}>✗</div>
            <h1 style={{ color: 'var(--c-red)' }}>Não foi possível cancelar</h1>
            <p style={{ color: 'var(--c-muted)' }}>{message}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)' }}>
              Se o problema persistir, contacta{' '}
              <a href="mailto:amosa.associacao@gmail.com" style={{ color: 'var(--c-accent)' }}>
                amosa.associacao@gmail.com
              </a>
            </p>
          </>
        )}
        {email && (
          <p style={{ marginTop: 24, fontSize: '0.75rem', color: 'var(--c-muted)' }}>
            Email: <code>{email}</code>
          </p>
        )}
      </div>
    </div>
  );
}
