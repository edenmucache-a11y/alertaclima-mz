/**
 * useAlerts — consome GET /api/alerts.
 * Separa alertas em:
 *   - active   : alerts com expiresAt > now
 *   - inactive : alerts com expiresAt ≤ now (histórico)
 *
 * Prioridade: activos primeiro, depois inactivos (por data).
 */
import { useEffect, useMemo, useState } from 'react';

function isAlertActive(alert) {
  if (!alert || !alert.expiresAt) return false;
  return new Date(alert.expiresAt).getTime() > Date.now();
}

export function useAlerts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAlerts();
    const id = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const { active, inactive, totalActive, totalInactive } = useMemo(() => {
    const all = data?.alerts ?? [];
    const active = all.filter(isAlertActive).sort((a, b) => {
      // Vermelhos primeiro, depois amarelos
      const order = { red: 0, yellow: 1, green: 2 };
      return order[a.severity] - order[b.severity];
    });
    const inactive = all
      .filter((a) => !isAlertActive(a))
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
    return {
      active,
      inactive,
      totalActive: active.length,
      totalInactive: inactive.length,
    };
  }, [data]);

  return { data, error, loading, active, inactive, totalActive, totalInactive };
}
