/**
 * SubscribeForm — Formulário de subscrição por email aos alertas climáticos.
 *
 * Envia para POST /api/subscribe-email
 * Inclui validação client-side e mensagens de estado.
 */
import { useState } from 'react';

const LOCATIONS = [
  'Todas as regiões',
  'Maputo',
  'Beira',
  'Nampula',
  'Quelimane',
  'Inhambane',
  'Xai-Xai',
  'Chimoio',
  'Tete',
  'Lichinga',
  'Pemba',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('Todas as regiões');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus('error');
      setMessage('Por favor insere um email válido.');
      return;
    }
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, location }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro a subscrever.');
      setStatus('success');
      setMessage(`${json.message} (${json.total} subscritor(es) no total)`);
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="card subscribe-card">
      <h2 className="card__title">📬 Subscrever alertas por email</h2>
      <p className="subscribe-tagline">
        Recebe avisos de ciclones e chuvas intensas directamente no teu email. Sem spam.
      </p>
      <form onSubmit={handleSubmit} className="subscribe-form">
        <div className="subscribe-row">
          <label className="subscribe-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teu.email@exemplo.com"
              required
              autoComplete="email"
              disabled={status === 'submitting'}
            />
          </label>
          <label className="subscribe-field">
            <span>Região</span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={status === 'submitting'}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="subscribe-btn"
            disabled={status === 'submitting' || !email}
          >
            {status === 'submitting' ? 'A subscrever…' : 'Subscrever'}
          </button>
        </div>
        {message && (
          <p className={`subscribe-msg subscribe-msg--${status}`} role="status">
            {status === 'success' ? '✓ ' : status === 'error' ? '✗ ' : '⏳ '}
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
