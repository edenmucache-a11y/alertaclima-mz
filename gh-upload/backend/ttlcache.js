/**
 * ttlcache.js — cache em memória com TTL (Time-To-Live)
 *
 * Usado para:
 *  - Geocoding do OWM (cidades não movem — TTL longo)
 *  - Weather do OWM (dados climáticos — TTL curto)
 *
 * Vantagens:
 *  - Reduz chamadas à API externa (rate-limit, custo)
 *  - Resposta mais rápida se a fonte cai
 *  - Servir dados "stale-while-revalidate" se configurado
 *
 * Uso:
 *   const cache = new TTLCache(600); // 600s TTL
 *   cache.set('maputo', { temp: 25 });
 *   const data = cache.get('maputo'); // devolve {temp:25} se ainda válido, senão null
 */

class TTLCache {
  /**
   * @param {number} defaultTtl - TTL em segundos (pode ser overridden por set())
   * @param {object} opts
   * @param {boolean} opts.staleWhileRevalidate - se true, get() devolve valor expirado enquanto marca para refresh
   * @param {number} opts.maxEntries - limite de entradas (LRU eviction); 0 = sem limite
   */
  constructor(defaultTtl = 600, opts = {}) {
    this.defaultTtl = defaultTtl;
    this.store = new Map(); // key -> { value, expiresAt, staleAt? }
    this.staleWhileRevalidate = opts.staleWhileRevalidate || false;
    this.maxEntries = opts.maxEntries || 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  _now() {
    return Date.now();
  }

  /**
   * Obter valor; devolve null se expirado e não stale.
   * Se staleWhileRevalidate, devolve valor expirado mas marca como stale.
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }
    const now = this._now();
    if (now < entry.expiresAt) {
      this.hits += 1;
      return entry.value;
    }
    // Expirado
    if (this.staleWhileRevalidate && entry.staleAt && now < entry.staleAt) {
      this.hits += 1;
      entry._stale = true;
      return entry.value;
    }
    this.misses += 1;
    // remove entrada expirada
    this.store.delete(key);
    return null;
  }

  /**
   * Guardar valor.
   * @param {string} key
   * @param {any} value
   * @param {number} [ttl] - TTL em segundos; se omitido usa defaultTtl
   * @param {object} [opts]
   * @param {number} [opts.staleTtl] - TTL adicional para stale-while-revalidate
   */
  set(key, value, ttl, opts = {}) {
    const effectiveTtl = ttl || this.defaultTtl;
    const expiresAt = this._now() + effectiveTtl * 1000;
    const staleAt = opts.staleTtl ? expiresAt + opts.staleTtl * 1000 : null;
    this.store.set(key, { value, expiresAt, staleAt });
    // LRU: se excedeu maxEntries, remover o mais antigo
    if (this.maxEntries > 0 && this.store.size > this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
      this.evictions += 1;
    }
  }

  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    return this._now() < entry.expiresAt;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) + '%' : '0%',
      evictions: this.evictions,
    };
  }
}

module.exports = { TTLCache };
