# Setup — AlertaClima · Moçambique

Guia completo para instalar e executar a plataforma em ambiente local.

## 1. Pré-requisitos

| Ferramenta | Versão | Verificar |
|---|---|---|
| Node.js | ≥ 18.0 | `node --version` |
| npm | ≥ 9 | `npm --version` |
| Git | ≥ 2.30 | `git --version` |

> 💡 Sem Node.js? Instale via [nvm-windows](https://github.com/coreybutler/nvm-windows) ou [nodejs.org](https://nodejs.org).

## 2. Chaves de API necessárias

| Serviço | Como obter | Custo |
|---|---|---|
| **OpenWeatherMap** | https://openweathermap.org/api (1.000 reqs/dia grátis) | Free tier |
| **Firebase Cloud Messaging** | https://console.firebase.google.com | Free (Spark) |
| **Google Weather API** | Google Cloud Console (requer cartão) | $0–$10/mês |
| **Twilio (SMS)** | https://www.twilio.com/try-twilio | Pay-as-you-go |
| **MongoDB Atlas** | https://www.mongodb.com/atlas | Free tier 512MB |

Para um MVP funcional, **basta a OpenWeatherMap** (grátis).

## 3. Instalação

```powershell
# Clonar ou extrair para
cd 'H:\My Drive\minmax code\Websiteminimax'

# Backend
cd backend
Copy-Item .env.example .env
# Editar .env e colocar a sua OPENWEATHER_API_KEY
notepad .env
npm install
npm run dev
# Deve mostrar: 🚀 Backend a escutar em http://localhost:3001

# Frontend (noutro terminal PowerShell)
cd 'H:\My Drive\minmax code\Websiteminimax\frontend'
npm install
npm run dev
# Deve abrir: http://localhost:5173
```

## 4. Verificação

```powershell
# 1. Health check
curl http://localhost:3001/api/health
# Esperado: { "ok": true, "env": "development", ... }

# 2. Listar alertas
curl http://localhost:3001/api/alerts
# Esperado: { "count": N, "alerts": [...] }

# 3. Abrir o dashboard
start http://localhost:5173
```

## 5. Configuração por variável de ambiente

| Variável | Descrição | Default |
|---|---|---|
| `OPENWEATHER_API_KEY` | Chave da API | **obrigatório** |
| `PORT` | Porto do backend | 3001 |
| `CORS_ORIGIN` | Origem permitida | http://localhost:5173 |
| `RAIN_THRESHOLD_MM` | Limite amarelo (mm/h) | 50 |
| `RAIN_THRESHOLD_RED` | Limite vermelho (mm/h) | 100 |
| `WIND_THRESHOLD_KMH` | Limite amarelo (km/h) | 60 |
| `WIND_THRESHOLD_RED` | Limite vermelho (km/h) | 118 |
| `MONITORED_LOCATIONS` | Cidades a monitorar | Maputo,Beira,Nampula |
| `POLLING_INTERVAL_MIN` | Intervalo do cron | 15 |

## 6. Próximos passos

1. **Substituir o array em memória por MongoDB**
   - Instalar `mongoose` (já vem no package.json)
   - Adicionar schema em `database/schemas/Alert.ts`
2. **Adicionar FCM**
   - `npm i firebase-admin`
   - Configurar service account key
3. **Deploy**
   - Frontend → Vercel / Netlify (grátis)
   - Backend → Railway / Fly.io / AWS Lambda
   - MongoDB → Atlas free tier

## 7. Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Error: OPENWEATHER_API_KEY is required` | Ficheiro `.env` ausente ou mal preenchido | Copiar `.env.example` → `.env` e preencher |
| `401 Unauthorized` da OWM | Chave inválida ou ainda a propagar | Esperar 10 min após gerar chave |
| `CORS policy: No 'Access-Control-Allow-Origin'` | `CORS_ORIGIN` errado | Verificar o URL do frontend |
| `Port 3001 already in use` | Outro processo no porto | Mudar `PORT` em `.env` ou `kill` o processo |
| Mapa em branco | Sem alertas no cache | Verificar `/api/alerts`; verificar `MONITORED_LOCATIONS` |
| Frontend em branco | Backend não está a correr | Iniciar backend com `npm run dev` |

## 8. Comandos úteis

```powershell
# Ver processos Node a correr
Get-Process node

# Parar tudo
Get-Process node | Stop-Process -Force

# Build de produção
cd backend; npm run build; npm start
cd frontend; npm run build; npm run preview

# Lint
npm run lint
```

## 9. Como adicionar uma nova cidade

Editar `backend/.env`:

```env
MONITORED_LOCATIONS=Maputo,Beira,Nampula,Quelimane,Inhambane,Xai-Xai,Chimoio,Tete,Lichinga,Pemba
```

Reiniciar o backend. A cidade será geocodificada e o alerta entra no cache.

## 10. Como adicionar uma nova fonte de dados (ex: INAM)

1. Criar `backend/src/services/inamService.ts` que faz parse de CAP/ATOM
2. Em `alertService.ts`, fundir dados: `const combined = { ...owm, ...inam }`
3. Adicionar testes em `alertService.spec.ts`

---

**Dúvidas?** Abrir uma issue ou contactar Eden Mucache.
