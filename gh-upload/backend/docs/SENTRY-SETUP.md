# Sentry — Error Tracking para AlertaClima MZ

> **Setup em 10 minutos** para receber alertas por email/Slack quando há
> erros em produção.

## Porquê

- Render free tier não tem error tracking
- Sem Sentry, só sabemos dos erros quando alguém reporta
- Sentry dá contexto completo: stack trace, browser, user actions

## Setup

### 1 · Criar conta (2 min)

1. Abrir https://sentry.io/signup/
2. Registar com email (grátis até 5K events/mês)
3. Criar project "AlertaClima MZ" → plataforma "Node.js"

### 2 · Obter DSN (1 min)

1. Project Settings → Client Keys (DSN)
2. Copiar o DSN (formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 3 · Adicionar ao Render (1 min)

Em **Environment**:
| Key | Value |
|---|---|
| `SENTRY_DSN` | `<o DSN que copiou>` |
| `SENTRY_ENVIRONMENT` | `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` (10% das transacções) |

Clicar **"Save Changes"** → redeploy 1 min.

### 4 · Verificar

Após deploy, em https://sentry.io → Issues, deve ver eventos a aparecer.
Para forçar um evento de teste:

```bash
curl -X POST https://alertaclima-mz.onrender.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"invalid"}'
```

Em Sentry, deve aparecer um erro de validação.

## Custos

- **Free tier**: 5.000 eventos/mês ✓ suficiente para uma app pequena
- **Team**: 26 USD/mês — 50K eventos, mais features

## O que é trackado

Com Sentry activado:
- ✅ Erros 500 do backend
- ✅ Unhandled exceptions
- ✅ Performance das requests (com traces)
- ❌ (não recomendado) Não trackamos dados pessoais (email é removido via beforeSend)

## Configuração no código

O `server.js` suporta Sentry opcionalmente. Se `SENTRY_DSN` estiver definido,
o `@sentry/node` é carregado. Senão, é no-op.

Para activar o pacote:
```bash
cd backend
npm install @sentry/node --no-audit --no-fund
```

E reiniciar o serviço.

## Resultado

- Email quando há erro crítico
- Stack trace completo no dashboard
- Gráficos de frequência
- Alertas para Slack/Discord/PagerDuty

## Limpeza

- Retenção de eventos: 30 dias (free) / 90 dias (pago)
- PII (Personally Identifiable Information) é removido via `beforeSend`
