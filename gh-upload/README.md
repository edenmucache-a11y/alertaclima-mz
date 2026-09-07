# AlertaClima · Moçambique

> Plataforma de alerta de chuvas intensas e ciclones em Moçambique — Website + App Mobile (Flutter) + Backend Node.js + Push Notifications (FCM).

[![Status](https://img.shields.io/badge/status-MVP-yellow)]() [![License](https://img.shields.io/badge/license-MIT-blue)]() [![Mozambique](https://img.shields.io/badge/Mo%C3%A7ambique-%F0%9F%87%B5%F0%9F%87%BA-green)]()

## 🎯 Visão

Fornecer à população moçambicana **alertas climáticos em tempo real** (chuvas intensas, ciclones, ventos fortes) com:

- 🗺️ **Mapa interactivo** de Moçambique com severity por cidade (web + mobile)
- 🔔 **Notificações push** (FCM) e SMS/WhatsApp para zonas com fraca conectividade
- 📶 **Modo offline** com cache local
- 🟢🟡🔴 **Cores universais** (Seguro / Atenção / Perigo Imediato)
- 📱 **App nativo** (Flutter — Android + iOS com uma base de código)

## 🏗️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend web | React 18 + Vite + TypeScript + Leaflet |
| App mobile | Flutter 3 + flutter_map + Firebase Messaging |
| Backend | Node.js 18 + Express + TypeScript + Helmet |
| Push | Firebase Cloud Messaging (FCM) |
| APIs clima | OpenWeatherMap + Google Weather + CAP-INAM |
| Geoespacial | MongoDB Atlas (PostGIS-ready) |
| SMS | Twilio / Zenvia (opcional) |

## 📁 Estrutura (3 componentes)

```
Websiteminimax/
├── backend/                          # API Node.js + Express + FCM
│   ├── src/
│   │   ├── config.ts                 # validação Zod das .env
│   │   ├── server.ts                 # bootstrap + cron + dispatch push
│   │   ├── models/
│   │   │   ├── Alert.ts              # severidade green/yellow/red
│   │   │   └── Subscriber.ts         # MongoDB schema
│   │   ├── routes/
│   │   │   ├── alerts.ts             # GET /api/alerts
│   │   │   └── push.ts               # /subscribe, /unsubscribe, /test
│   │   └── services/
│   │       ├── weatherService.ts     # OpenWeatherMap
│   │       ├── alertService.ts       # lógica de severidade
│   │       └── fcmService.ts         # envio de push
│   ├── .env.example
│   └── package.json
├── frontend/                         # SPA React
│   └── src/
│       ├── App.tsx + main.tsx
│       ├── hooks/useAlerts.ts
│       └── components/{AlertMap,AlertList}.tsx
├── mobile/                           # App Flutter (Android + iOS)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/alert.dart
│   │   ├── services/
│   │   │   ├── api_client.dart       # Dio HTTP
│   │   │   └── fcm_service.dart      # Firebase Messaging
│   │   ├── screens/
│   │   │   ├── dashboard_screen.dart # mapa
│   │   │   └── alerts_screen.dart    # lista
│   │   └── widgets/severity_badge.dart
│   ├── android/                      # manifest + build.gradle
│   ├── ios/                          # Info.plist
│   ├── pubspec.yaml
│   └── analysis_options.yaml
├── database/seed.ts                  # 10 cidades MZ + índice 2dsphere
├── scripts/test-e2e.ps1              # teste end-to-end PowerShell
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   └── INSTALL.md                    # ← como instalar Node/Flutter
└── README.md
```

## 🚀 Quick start

Esta máquina **não tem Node/Flutter instalados**. Ver [docs/INSTALL.md](docs/INSTALL.md).

```powershell
# 1. Backend
cd 'H:\My Drive\minmax code\Websiteminimax\backend'
Copy-Item .env.example .env
# → editar .env: OPENWEATHER_API_KEY (e FCM_* se quiseres push real)
npm install
npm run dev

# 2. Frontend (noutro terminal)
cd 'H:\My Drive\minmax code\Websiteminimax\frontend'
npm install
npm run dev          # http://localhost:5173

# 3. App mobile (requer Flutter instalado)
cd 'H:\My Drive\minmax code\Websiteminimax\mobile'
flutter pub get
flutter run          # em emulador/device

# 4. Teste end-to-end (backend tem de estar a correr)
powershell -ExecutionPolicy Bypass -File 'H:\My Drive\minmax code\Websiteminimax\scripts\test-e2e.ps1'
```

## 📡 Endpoints REST

| Método | URL | Descrição |
|---|---|---|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/alerts` | Lista todos os alertas activos |
| `GET`  | `/api/alerts/:location` | Alerta de uma cidade |
| `POST` | `/api/alerts/refresh` | Força refresh do cache |
| `POST` | `/api/alerts/subscribe` | Subscrição legacy |
| `POST` | `/api/push/subscribe` | Regista device (FCM token + localização) |
| `POST` | `/api/push/unsubscribe` | Remove subscrição |
| `POST` | `/api/push/test` | Envia push de teste |
| `GET`  | `/api/push/stats` | Estatísticas de subscritores |

## 🧠 Lógica de severidade

| Nível | Chuva (mm/h) | Vento (km/h) | Notificação |
|---|---|---|---|
| 🟢 Verde | < 50 | < 60 | nenhuma |
| 🟡 Amarelo | 50–99 | 60–117 | push |
| 🔴 Vermelho | ≥ 100 | ≥ 118 | push + som alarme |

## 🔔 Firebase Cloud Messaging (push)

Backend → `services/fcmService.ts`
Mobile → `services/fcm_service.dart`

Para activar push real:
1. Criar projecto em https://console.firebase.google.com
2. Service Account → Generate Private Key
3. Colar `FCM_PROJECT_ID`, `FCM_PRIVATE_KEY`, `FCM_CLIENT_EMAIL` em `backend/.env`
4. Mobile: `flutterfire configure` (gera `lib/firebase_options.dart`)

Sem credenciais → o backend faz **log mock** em vez de enviar (útil em dev).

## 🌪 Fontes oficiais

- **INAM Moçambique** — Instituto Nacional de Meteorologia
- **OpenWeatherMap** — previsões globais minuto a minuto
- **Google Weather API** — alertas governamentais oficiais
- **NHC (EUA)** — feeds CAP para ciclones no Índico

## 📋 Roadmap

- [x] Backend com OpenWeatherMap
- [x] Frontend web com mapa Leaflet
- [x] Cores universais de severidade
- [x] FCM push notifications
- [x] App Flutter (Android + iOS)
- [x] Modo offline (Hive)
- [ ] Persistência MongoDB completa
- [ ] SMS/WhatsApp via Twilio
- [ ] Parser CAP-INAM
- [ ] Google Flood Hub (ML)
- [ ] Publicação Play Store / App Store

## 🤝 Contribuir

1. Fork
2. Branch feature (`git checkout -b feat/ciclone-tracking`)
3. Commit
4. Push + PR

## 📜 Licença

MIT © 2026 — Eden Mucache
