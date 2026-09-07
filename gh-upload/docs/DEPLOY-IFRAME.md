# AlertaClima MZ · Guia de deploy como sub-página do amosa.org.mz (iframe)

> **Quando usar este guia**: você quer que o AlertaClima apareça dentro de uma
> página do site WordPress existente em `https://www.amosa.org.mz/`, sem mexer
> no servidor do WordPress. A app continua a ser servida por um serviço
> externo (Render free tier) e é embebida via `<iframe>`.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│  https://www.amosa.org.mz/alertas-clima/        (página WordPress)  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Banner AMOSA verde                                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  <iframe src="https://alerta-clima-mz.onrender.com">    │  │  │
│  │  │   · React + Vite dashboard                               │  │  │
│  │  │   · Leaflet map                                          │  │  │
│  │  │   · Lista de alertas activos + histórico                 │  │  │
│  │  │  </iframe>                                               │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │  Footer com links para INAM, unsubscribe, contacto            │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  https://alerta-clima-mz.onrender.com      (Render — free tier)     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Express Node.js                                              │  │
│  │  · Serve /api/*  (alerts, push, subscribe, unsubscribe)       │  │
│  │  · Serve /public/*  (build estático do React)                 │  │
│  │  · Cron a cada 15 min → OpenWeatherMap → diff → email         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

O iframe e a app vivem em **domínios diferentes**, mas como o iframe
carrega o React app inteiro (que fala com a API no **mesmo** URL), não há
problema de CORS para o utilizador final. O CORS só importa se outro
site embedar a API directamente — e neste caso o `CORS_ORIGIN` no `.env`
já restringe as origens permitidas a `amosa.org.mz`.

---

## Passo 1 · Subir o código para o GitHub

1. Crie um repositório novo (pode ser **privado**) em https://github.com/new
   - Nome sugerido: `alertaclima-mz`
2. No PowerShell, dentro da pasta do projecto:

```powershell
cd 'C:\Temp\websiteminimax-backend'   # use a cópia C:\Temp\ (H:\ corrompe npm)
# confirmar que está na pasta certa
Get-ChildItem -Name
# deve ver: server.js, package.json, render.yaml, docs/, deploy/, ...

# inicializar git
git init
git add .
git commit -m "AlertaClima MZ v8 — deploy iframe"
git branch -M main
git remote add origin https://github.com/<seu-user>/alertaclima-mz.git
git push -u origin main
```

> ⚠ Se aparecer erro de `git: command not found`, use o **GitHub Desktop**
> ou arraste a pasta para https://github.com/new (criar via web UI).

---

## Passo 2 · Criar conta no Render (grátis)

1. Vá a https://render.com/register
2. Registe-se com GitHub (mais simples).
3. Confirme o email.

---

## Passo 3 · Deploy com 1-clique via Blueprint

1. No dashboard do Render: **New** → **Blueprint**.
2. Ligue o repositório GitHub `alertaclima-mz`.
3. O Render vai detectar `backend/render.yaml` automaticamente.
4. Reveja o plano:
   - Service name: `alerta-clima-mz`
   - Plan: **Free** (0 USD/mês)
5. Clique **Apply**.
6. O Render vai:
   - Instalar deps do frontend (`npm install`)
   - Fazer `npm run build` no React → `frontend/dist/`
   - Copiar `dist/` para `backend/public/`
   - Instalar deps do backend
   - Iniciar `node server.js`
7. A primeira build demora ~5-8 min. Acompanhe em **Logs**.
8. Quando terminar, vai ter um URL tipo: `https://alerta-clima-mz.onrender.com`
9. **Teste**: abra esse URL no browser — deve ver o dashboard completo.

---

## Passo 4 · Configurar SMTP (para emails reais)

No dashboard do Render → serviço `alerta-clima-mz` → **Environment**:

| Key | Value (exemplo Gmail) |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `alertas@amosa.org.mz` |
| `SMTP_PASS` | *(App Password de 16 chars)* |
| `SMTP_FROM` | `AlertaClima MZ <alertas@amosa.org.mz>` |

Como gerar a App Password do Gmail:
1. Conta Google → Segurança → Verificação em 2 passos (activar)
2. https://myaccount.google.com/apppasswords
3. App = "Mail", Device = "Outro (AlertaClima)"
4. Copiar os 16 caracteres para `SMTP_PASS`

Clique **Save Changes** → o Render reinicia o serviço. Nos logs deve
aparecer: `Email: ✓ SMTP configurado (live)`.

> Se não quiser configurar SMTP agora, o sistema continua a funcionar
> em modo MOCK (logs no terminal do Render). Pode activar depois.

---

## Passo 5 · Criar a página no WordPress da AMOSA

1. Entre em `https://www.amosa.org.mz/wp-admin` (utilizador: Eden Mucache).
2. **Páginas** → **Adicionar nova**.
3. **Título**: `AlertaClima — Alertas Climáticos em Moçambique`
4. **Slug** (permalink): `alertas-clima`
   (gera URL `https://www.amosa.org.mz/alertas-clima/`)
5. No editor **Divi**:
   - Adicione um módulo **"Code"** (Code Module).
   - Abra o ficheiro `backend/deploy/wordpress-iframe-snippet.html` e copie
     **todo o conteúdo**.
   - Cole dentro do módulo Code.
   - Se o seu domínio final não for `alerta-clima-mz.onrender.com`,
     troque o `src="..."` do `<iframe>` para o URL real.
6. **Publique**.
7. **Aparência** → **Menus** → adicione a página "AlertaClima" ao menu
   principal. Sugestão: entre "Projectos" e "Galeria" (já que é um
   projecto de impacto).

---

## Passo 6 · Testar end-to-end

1. Abra `https://www.amosa.org.mz/alertas-clima/` em aba anónima.
2. Verifique:
   - O dashboard React carrega dentro do iframe.
   - O mapa mostra os alertas activos.
   - Pode subscrever um email e receber o alerta simulado.
3. Em outra aba: `https://alerta-clima-mz.onrender.com/api/health`
   → deve mostrar `{ ok: true, env: "production", ts: "..." }`.

---

## Custos

| Componente | Custo |
|---|---|
| Render free tier | **0 USD/mês** (1 web service, 1GB RAM) |
| Domínio `alerta-clima-mz.onrender.com` | incluído |
| HTTPS (certificado automático) | incluído |
| Limite: spin-down após 15 min sem acesso | volta em ~1 min |
| Custo para spin-up permanente (sempre acordado) | 7 USD/mês (Starter) |

**Total: 0 USD/mês enquanto o volume de acessos for baixo.**

---

## Próximos passos opcionais

| Objectivo | Como |
|---|---|
| Domínio próprio `alertas.amosa.org.mz` | Render → Settings → Custom Domain → adicionar CNAME `alertas` → apontar para `alerta-clima-mz.onrender.com` |
| Enviar SMS em vez de email | Adicionar `twilio` ao backend, criar endpoint `/api/sms/subscribe` |
| Receber alertas CAP-INAM oficiais | Implementar parser de `https://www.inam.gov.mz/feed.xml` (task separada) |
| Painel admin para gerir subscritores | Criar `/admin` com auth (próxima sprint) |

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npm install` falha com "no such file" | Cache corrompido no H: drive | Fazer `npm install` em `C:\Temp\websiteminimax-backend` |
| Iframe em branco | CSP do WordPress a bloquear | Verificar headers → LiteSpeed Cache → desabilitar para a página |
| Iframe em branco + erro Mixed Content | URL do iframe é `http://` | Trocar para `https://` (o Render já serve https) |
| Emails não chegam | SMTP mal configurado | Ver logs no Render: `Email: ⚠ MOCK` significa que SMTP está em falta |
| `CORS blocked` no browser console | Origem não está em `CORS_ORIGIN` | Adicionar à variável de ambiente, fazer redeploy |
| 502 após deploy | Ainda a buildar | Esperar 5-8 min e recarregar |

---

**Contacto técnico**: Eden Mucache · `eden.mucache@gmail.com` ·
https://www.linkedin.com/in/edenmucache/
