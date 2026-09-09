# UptimeRobot — Monitoring 24/7 do AlertaClima MZ

> **Configuração em 5 minutos** para monitorizar a plataforma e receber
> alertas por email/SMS se o site cair.

## Porquê

Render free tier hiberna após 15 min sem uso. Pode falhar deploys. Sem
monitorização, a falha só é detectada quando alguém tenta usar o site.

## Setup

### 1 · Criar conta (1 min)

1. Abrir https://uptimerobot.com/signUp
2. Registar com email (grátis, sem cartão)
3. Confirmar email

### 2 · Adicionar monitor (1 min)

1. No dashboard, **"+ Add New Monitor"**
2. Configurar:

| Campo | Valor |
|---|---|
| **Monitor Type** | `HTTP(s)` |
| **Friendly Name** | `AlertaClima MZ · API` |
| **URL (or IP)** | `https://alertaclima-mz.onrender.com/api/health` |
| **Monitoring Interval** | `5 minutes` (free tier) |

3. Clicar **"Create Monitor"**

### 3 · Configurar alertas (1 min)

1. Clicar no monitor criado
2. **"Alert Contacts"** → **"+ Add Alert Contact"**
3. Adicionar:
   - **E-mail** (predefinido, grátis)
   - **Webhook** (opcional — para Slack, Discord, Telegram)

4. Configurar thresholds:
   - **When down**: alertar imediatamente
   - **When up**: notificar quando recupera
   - **When keyword not found**: opcional (para verificar conteúdo)

### 4 · Status page pública (bonus)

1. **"Status Pages"** → **"+ Create Status Page"**
2. Adicionar o monitor
3. Escolher subdomínio público: `stats.uptimerobot.com/<seu-id>`
4. Embed no site da AMOSA (canto inferior)

## Custos

- **Free tier**: 50 monitores, 5 min intervalo, email alerts ✓ suficiente

## Resultado

- Email imediato se o site cair
- Resumo semanal por email
- Status page pública com uptime histórico

## Verificar

Após configurar, abrir https://stats.uptimerobot.com/<seu-id> — deve
mostrar "Operational" se o Render estiver Live.
