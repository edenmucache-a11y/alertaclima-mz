/**
 * AboutAMOSA — Componente com dados reais da Associação Moçambicana
 * para Saúde e Ambiente (AMOSA).
 *
 * Fontes:
 *  - https://plasoc.org.mz/org/amosa/
 *  - https://www.worldhepatitisalliance.org/member/associacao-mocambicana-para-saude-e-ambiente/
 *  - https://aammh.org/mozambique-3/
 */
import { useState } from 'react';

const AMOSA = {
  name: 'Associação Moçambicana para Saúde e Ambiente',
  shortName: 'AMOSA',
  website: 'https://www.amosa.org.mz',
  email: 'amosa.associacao@gmail.com',
  phonePrimary: '+258 83 462 650',
  phoneAlt: '+258 83 462 657',
  address: 'Bairro Agostinho Neto, Q4, Casa 50, Marracuene, Maputo 1120, Moçambique',
  coords: { lat: -25.77605, lon: 32.62197 },
  mission:
    'Associação comunitária dedicada à promoção da saúde, prevenção de doenças, combate às alterações climáticas, fortalecimento das comunidades e desenvolvimento rural em Moçambique.',
  founded: 2020,
  contacts: [
    {
      role: 'Presidente',
      name: 'Eden Mucache',
      phone: '+258 84 242 4040',
      email: 'eden.mucache@gmail.com',
      linkedin: 'https://www.linkedin.com/in/edenmucache/',
    },
  ],
  socialLinks: [
    { label: 'LinkedIn do Presidente', url: 'https://www.linkedin.com/in/edenmucache/' },
    { label: 'PLASOC (rede de ONGs)', url: 'https://plasoc.org.mz/org/amosa/' },
    { label: 'World Hepatitis Alliance', url: 'https://www.worldhepatitisalliance.org/member/associacao-mocambicana-para-saude-e-ambiente/' },
    { label: 'AAMMH', url: 'https://aammh.org/mozambique-3/' },
  ],
};

export function AboutAMOSA() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card amosa-card">
      <div className="amosa-header" onClick={() => setOpen(!open)}>
        <div>
          <h2 className="card__title" style={{ margin: 0 }}>
            🌍 {AMOSA.shortName} · {AMOSA.name}
          </h2>
          <p className="amosa-tagline">
            Promotor da plataforma AlertaClima · <a href={AMOSA.website} target="_blank" rel="noreferrer">{AMOSA.website}</a>
          </p>
        </div>
        <button className="amosa-toggle" type="button" aria-label="Expandir">
          {open ? '▾' : '▸'}
        </button>
      </div>

      {open && (
        <div className="amosa-body">
          <p className="amosa-mission">{AMOSA.mission}</p>

          <div className="amosa-grid">
            <div className="amosa-section">
              <h3>📞 Contactos oficiais</h3>
              <ul>
                <li>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${AMOSA.email}`}>{AMOSA.email}</a>
                </li>
                <li>
                  <strong>Telefone principal:</strong>{' '}
                  <a href={`tel:${AMOSA.phonePrimary.replace(/\s/g, '')}`}>{AMOSA.phonePrimary}</a>
                </li>
                <li>
                  <strong>Telefone alternativo:</strong>{' '}
                  <a href={`tel:${AMOSA.phoneAlt.replace(/\s/g, '')}`}>{AMOSA.phoneAlt}</a>
                </li>
                <li>
                  <strong>Website:</strong>{' '}
                  <a href={AMOSA.website} target="_blank" rel="noreferrer">
                    www.amosa.org.mz
                  </a>
                </li>
                <li>
                  <strong>Endereço:</strong> {AMOSA.address}
                </li>
                <li>
                  <strong>Coordenadas sede:</strong>{' '}
                  {AMOSA.coords.lat.toFixed(4)}, {AMOSA.coords.lon.toFixed(4)}
                </li>
                <li>
                  <strong>Fundada em:</strong> {AMOSA.founded}
                </li>
              </ul>
            </div>

            <div className="amosa-section">
              <h3>👥 Pessoa de contacto</h3>
              <ul>
                {AMOSA.contacts.map((c) => (
                  <li key={c.email}>
                    <strong>{c.role}:</strong> {c.name}
                    <br />
                    📱 <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
                    <br />
                    ✉ <a href={`mailto:${c.email}`}>{c.email}</a>
                    {c.linkedin && (
                      <>
                        <br />
                        💼 <a href={c.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="amosa-section">
            <h3>🔗 Redes e parceiros</h3>
            <ul className="amosa-social">
              {AMOSA.socialLinks.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
