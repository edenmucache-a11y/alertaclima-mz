# Arquitectura — AlertaClima · Moçambique

## Visão de sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dispositivos do cidadão                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Web SPA      │  │ App Mobile   │  │ SMS / WhatsApp     │    │
│  │ (React)      │  │ (Flutter RN) │  │ (Twilio / Zenvia)  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────┘    │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          │ HTTPS           │ FCM Push             │ SMS / WA API
          │                 │                     │
┌─────────▼─────────────────▼─────────────────────▼───────────────┐
│                       BACKEND (Node.js)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Express API  +  Helmet  +  CORS  +  Rate-Limit         │   │
│  │  /api/alerts  /api/alerts/:location  /api/alerts/refresh│   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Cron 15 min  │  │ weatherService│  │ alertService        │  │
│  │ (node-cron)  │─▶│ OpenWeatherMap│─▶│ severity logic     │  │
│  └──────────────┘  └──────────────┘  └──────────┬──────────┘  │
│                                                  │             │
│  ┌──────────────────────────────────────────────▼──────────┐  │
│  │  alertCache (Map) — em memória; MongoDB em produção    │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ FCM sender   │  │ Twilio SMS   │  │ CAP-INAM parser     │  │
│  │ (firebase-   │  │ (emergency)  │  │ (boletins ciclones) │  │
│  │  admin)      │  │              │  │                     │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│               Fontes externas de dados                           │
│  ┌─────────────────┐ ┌────────────────┐ ┌─────────────────┐    │
│  │ OpenWeatherMap  │ │ Google Weather │ │ INAM Moçambique │    │
│  │ (REST + Geo)    │ │ (Public Alerts)│ │ (CAP/ATOM feed) │    │
│  └─────────────────┘ └────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo end-to-end

1. **Cron job** acorda a cada 15 min (`POLLING_INTERVAL_MIN`)
2. Para cada cidade em `MONITORED_LOCATIONS`:
   - `geocode()` → obtém (lat, lon)
   - `getCurrentWeather(lat, lon)` → dados brutos OWM
3. `buildAlertForCoordinates()` aplica a regra de severidade
4. `alertCache.set()` actualiza o estado em memória
5. Se `severity === 'red'` ou `'yellow'`, despoletar:
   - FCM push para tokens subscritos naquela região
   - SMS/WhatsApp para utilizadores com `consentimento_sms = true`
6. Frontend faz `GET /api/alerts` a cada 5 min e renderiza o mapa

## Modelo de dados (MongoDB)

```ts
// Colecção: alerts (histórico)
{
  _id: ObjectId,
  location: "Maputo",
  coordinates: { lat: -25.96, lon: 32.57 },
  severity: "red" | "yellow" | "green",
  rainfallMm: 120,
  windKmh: 130,
  temperatureC: 28.4,
  description: "Evento climático severo em curso.",
  advice: "PERIGO IMEDIATO. Procure abrigo…",
  source: "openweathermap",
  issuedAt: ISODate,
  expiresAt: ISODate
}

// Colecção: subscribers
{
  _id: ObjectId,
  fcmToken: "fK3...",
  location: "Beira",
  coords: { lat, lon },
  radiusKm: 50,
  channels: ["push", "sms"],
  createdAt: ISODate
}
```

## Modelo de severidade

| Nível | Chuva (mm/h) | Vento (km/h) | Notificação |
|---|---|---|---|
| 🟢 Green | < 50 | < 60 | nenhuma (apenas dashboard) |
| 🟡 Yellow | 50–99 | 60–117 | push + dashboard |
| 🔴 Red | ≥ 100 | ≥ 118 | push + SMS + WhatsApp |

> Os limiares são configuráveis em `.env` e devem ser calibrados com o INAM.

## Decisões arquitecturais

| Decisão | Porquê |
|---|---|
| TypeScript em todo o lado | Previne bugs em runtime; clareza dos contratos |
| Map em memória (MVP) → MongoDB (produção) | Velocidade de arranque; persistência em failover |
| Vite + React | Carregamento < 1s; ecossistema maduro |
| Leaflet (em vez de Google Maps) | Open-source, sem custo, tiles OpenStreetMap |
| node-cron | Simples, sem dependências externas |
| Helmet + CORS | Protecção mínima por defeito |

## Roadmap técnico

- **Fase 1 (MVP)**: backend + dashboard web ← **actual**
- **Fase 2**: FCM push + persistência MongoDB
- **Fase 3**: parser CAP-INAM
- **Fase 4**: app mobile (Flutter)
- **Fase 5**: SMS / WhatsApp para zonas rurais
- **Fase 6**: modelo de Machine Learning (Google Flood Hub) para previsão de cheias

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Falha de internet (comum em zonas rurais) | Modo offline com Service Worker + cache SQLite |
| Pico de acessos (ciclone aproxima-se) | Backend serverless (Lambda) com auto-scale |
| API keys expostas | `.env` + `gitignore`; rotação trimestral |
| Dados falsos / inaccurate | Combinar OWM + INAM + validação humana |
| Acessibilidade | Cores universais + texto alternativo + leitor de ecrã |
