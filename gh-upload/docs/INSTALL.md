# INSTALL.md — Instalação completa do AlertaClima

Esta máquina Windows **não tem Node, npm, Flutter, Java nem Git** instalados.
Para executar o projecto, instale primeiro as ferramentas (uma única vez).

## 1. Ferramentas a instalar (uma vez)

| Ferramenta | Versão | Para quê | Comando de instalação |
|---|---|---|---|
| **Node.js 18+** | LTS | Backend | https://nodejs.org (instalar o `.msi`) |
| **Flutter 3.10+** | Stable | App mobile | https://docs.flutter.dev/get-started/install/windows |
| **Android Studio** | Latest | Build APK | https://developer.android.com/studio |
| **Git** | Latest | Controlo de versão | https://git-scm.com/download/win |
| **MongoDB** (opcional) | 7.0 | Persistência | https://www.mongodb.com/try/download/community |

> 💡 Depois de instalar Node, **fechar e abrir um novo PowerShell** para o PATH atualizar.

## 2. Validar instalações

```powershell
node --version       # v18.x ou superior
npm --version        # 9.x ou superior
flutter --version    # 3.10 ou superior
git --version
```

## 3. Subir o backend (5 minutos)

```powershell
cd 'H:\My Drive\minmax code\Websiteminimax\backend'

# Instalar dependências
npm install

# Configurar .env (uma vez)
Copy-Item .env.example .env
notepad .env
# → Editar OPENWEATHER_API_KEY (obter grátis em https://openweathermap.org/api)

# Iniciar em modo dev (com hot-reload)
npm run dev
```

Saída esperada:
```
🌍 A inicializar WebsiteMiniMax Backend…
✓ 10 localizações carregadas no cache.
🚀 Backend a escutar em http://localhost:3001
📡 Endpoints:
   GET    /api/health
   GET    /api/alerts
   ...
```

## 4. Subir o frontend web (3 minutos, noutro terminal)

```powershell
cd 'H:\My Drive\minmax code\Websiteminimax\frontend'
npm install
npm run dev
```

Abrir `http://localhost:5173` → ver mapa de Moçambique com marcadores.

## 5. Teste end-to-end com script pronto

```powershell
# Backend tem de estar a correr
powershell -ExecutionPolicy Bypass -File 'H:\My Drive\minmax code\Websiteminimax\scripts\test-e2e.ps1'
```

O script `test-e2e.ps1` faz automaticamente:
1. `GET /api/health` → verifica que o backend está vivo
2. `GET /api/alerts` → lista os alertas
3. `POST /api/push/test` → simula envio de push (mock se FCM não estiver configurado)
4. `GET /api/push/stats` → mostra estatísticas de subscritores

## 6. Configurar Firebase Cloud Messaging (FCM)

Para que o push funcione:

1. Ir a https://console.firebase.google.com
2. **Add project** → `websiteminimax`
3. **Project settings** → **Service accounts** → **Generate new private key**
4. Abrir o JSON e copiar:
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY` (com `\n` literais!)
   - `client_email` → `FCM_CLIENT_EMAIL`
5. Para o Flutter:
   - Instalar `flutterfire_cli`: `dart pub global activate flutterfire_cli`
   - No directório `mobile/`: `flutterfire configure`
   - Isto cria `lib/firebase_options.dart` automaticamente

## 7. Subir o app Flutter (Android)

```powershell
cd 'H:\My Drive\minmax code\Websiteminimax\mobile'
flutter pub get
flutterfire configure   # gera lib/firebase_options.dart
flutter run             # ou: flutter build apk --release
```

> **Importante:** o emulador Android usa `10.0.2.2` para aceder ao `localhost` do host.
> Se for dispositivo físico, editar `mobile/lib/services/api_client.dart` e mudar para o IP da máquina.

## 8. Deploy em produção

| Componente | Serviço gratuito | Custo |
|---|---|---|
| Backend | Railway.app / Fly.io | $0–$5/mês |
| Frontend | Vercel / Netlify | grátis |
| Mobile | Play Store ($25 uma vez) + App Store ($99/ano) | $124 |
| MongoDB | Atlas free tier | grátis até 512MB |
| FCM | Firebase Spark | grátis |

## 9. Solução de problemas

| Sintoma | Causa | Solução |
|---|---|---|
| `npm: not recognized` | PATH desatualizado | Reiniciar PowerShell |
| `flutter: command not found` | Flutter não no PATH | Adicionar `C:\flutter\bin` ao PATH |
| `ANDROID_HOME not set` | Android Studio não instalado | Instalar Android Studio + SDK |
| Push não chega no telemóvel | FCM credenciais erradas | Verificar `FCM_PRIVATE_KEY` (tem de ter `\n`) |
| Mapa em branco | Backend offline | Iniciar backend com `npm run dev` |
| CORS error | `CORS_ORIGIN` errado | Ajustar `.env` |

## 10. Próximos passos (após MVP)

- [ ] Persistir subscritores em MongoDB Atlas
- [ ] Implementar SMS de emergência via Twilio
- [ ] Integrar feed CAP-INAM (boletins ciclones)
- [ ] Adicionar Google Flood Hub (ML previsão cheias)
- [ ] Modo offline com Hive/SQLite
- [ ] Tradução para Português de Moçambique (já é pt)
- [ ] Publicar app na Play Store
