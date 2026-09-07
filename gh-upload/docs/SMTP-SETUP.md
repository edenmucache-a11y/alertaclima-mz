# Guia de Configuração SMTP — Envio Real de Emails

A plataforma AlertaClima suporta **envio real de emails** via SMTP. Sem configuração, o sistema opera em **modo MOCK** (apenas regista no log).

## 1. Configuração com Gmail (recomendado para testes)

### Passo 1: Ativar 2FA no Gmail
1. Ir a https://myaccount.google.com/security
2. Ativar **Verificação em 2 passos** (2FA)
3. Confirmar com o teu telefone

### Passo 2: Criar App Password
1. Ir a https://myaccount.google.com/apppasswords
2. Seleccionar app: **Mail**
3. Seleccionar dispositivo: **Other (AlertaClima)**
4. Clicar **Generate**
5. Copiar a senha de 16 caracteres (ex: `abcd efgh ijkl mnop`)

### Passo 3: Preencher `.env` do backend
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=teu.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
EMAIL_FROM_NAME=AlertaClima · AMOSA
EMAIL_FROM_ADDRESS=noreply@amosa.org.mz
```

### Passo 4: Reiniciar o backend
```bash
cd backend
npm run dev
```

No log deve aparecer: `Email: ✓ SMTP configurado para teu.email@gmail.com@smtp.gmail.com:587`

## 2. Outros provedores SMTP

### Outlook / Office 365
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=teu.email@outlook.com
SMTP_PASS=a_tua_senha
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=teu.email@yahoo.com
SMTP_PASS=app_password_aqui
```

### Mailgun (recomendado para produção)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@teu-dominio.mailgun.org
SMTP_PASS=key-xxxxxxxxxxxxxxx
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxx
```

## 3. Templates de email

O sistema envia 2 tipos de email:

### Email de boas-vindas (ao subscrever)
- **Assunto:** "Bem-vindo aos alertas climáticos da AMOSA"
- **Conteúdo:** Confirmação + explicação dos limiares + link para dashboard
- **HTML + texto** (multipart)

### Email de alerta (quando severity ≥ yellow)
- **Assunto:** "PERIGO IMEDIATO · Alerta de CICLONE · Maputo" (varia por severidade)
- **Conteúdo:** Detalhes técnicos + acções recomendadas + link para mapa
- **HTML escuro** (mesmo design do dashboard)
- **Envio automático** quando o cron job (15 min) detecta severity amarela/vermelha

## 4. Lógica de envio

```
Usuário subscreve email
        ↓
POST /api/subscribe-email
        ↓
[1] Adiciona ao Set de subscritores (em memória)
        ↓
[2] Envia email de boas-vindas (background)
        ↓
A cada 15 min (cron):
        ↓
Para cada cidade monitorizada:
        ↓
Consulta OpenWeatherMap
        ↓
Se severity = yellow ou red:
        ↓
Para cada subscritor (filtrado por região):
        ↓
Envia email de alerta
```

## 5. Filtro por região

Quando o utilizador subscreve, escolhe uma região:
- **"Todas as regiões"** → recebe TODOS os alertas do país
- **"Maputo"** → recebe apenas alertas de Maputo
- **"Beira"** → recebe apenas alertas de Beira
- (etc.)

## 6. Testar sem SMTP real

O backend tem um endpoint de teste:
```powershell
$body = @{ to = 'teu.email@exemplo.com' } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri 'http://localhost:3001/api/test-email' `
  -ContentType 'application/json' -Body $body -UseBasicParsing
```

Em modo mock, devolve:
```json
{ "ok": true, "mode": "mock", "mock": true }
```

Em modo live (SMTP configurado), devolve:
```json
{ "ok": true, "mode": "live", "messageId": "<abc123@gmail.com>" }
```

## 7. Limites e considerações

- **Gmail:** 500 emails/dia (conta pessoal), 2000/dia (Google Workspace)
- **SendGrid:** 100 emails/dia grátis
- **Mailgun:** 5000 emails/mês grátis
- **Em produção**, use Mailgun/SendGrid (não Gmail)
- **Persistência:** actualmente em memória (`Set`). Para produção, mover para MongoDB

## 8. Próximos passos

- [ ] Configurar SMTP real em produção
- [ ] Migrar subscritores para MongoDB
- [ ] Adicionar unsubscribe link (RFC 8058)
- [ ] Adicionar bounce handling
- [ ] Integrar com SendGrid/Mailgun templates
- [ ] Adicionar tracking de abertura (opcional)
