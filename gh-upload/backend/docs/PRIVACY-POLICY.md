# Política de Privacidade — AlertaClima MZ

> **Última actualização**: Setembro 2026
> **Operador**: AMOSA — Associação Moçambicana para Saúde e Ambiente
> **Contacto DPO**: eden.mucache@gmail.com
> **Website**: https://www.amosa.org.mz

## 1 · Que dados recolhemos

Quando subscreve os alertas climáticos do AlertaClima MZ, recolhemos:

| Dado | Finalidade | Obrigatório? |
|---|---|---|
| **Endereço de email** | Enviar alertas climáticos | Sim |
| **Localização preferida** (cidade de Moçambique) | Filtrar alertas por região | Não (pode subscrever "Todas as regiões") |
| **Token de unsubscribe** (HMAC-SHA256) | Permitir cancelar subscrição via link | Sim (gerado automaticamente) |

Quando usa o dashboard (sem subscrever), **não recolhemos dados pessoais**.
O dashboard é anónimo — não há login, não há cookies de tracking.

## 2 · Como usamos os dados

Os emails são usados **exclusivamente** para:
1. Enviar alertas climáticos oficiais (ciclones, chuvas, ventos) da sua região
2. Enviar email de boas-vindas quando subscreve
3. Permitir cancelar a subscrição (token)

**Não usamos** para:
- Marketing ou comunicações não-relacionadas
- Venda ou partilha com terceiros
- Perfil de utilizador ou tracking

## 3 · Onde armazenamos os dados

| Componente | Onde |
|---|---|
| Backend / API | Render.com (USA) — servidor cloud |
| Emails (subscritores) | Memória do servidor (não persistido em disco) |
| Envio de emails | Nodemailer → SMTP (Gmail, Mailgun, ou Resend) |
| Dados climáticos | OpenWeatherMap (USA) e INAM Moçambique |

> ⚠️ **Importante**: os emails dos subscritores estão **apenas em memória**.
> Se o Render hibernar ou reiniciar, **a lista de subscritores é perdida**.
> Para persistência, ver roadmap item #9 (SQLite).

## 4 · Cookies

O AlertaClima MZ **não usa cookies** de tracking ou analytics. Apenas
utilizamos cookies técnicos essenciais do navegador (ex: CSP).

## 5 · Partilha com terceiros

Não partilhamos os seus dados com terceiros. Os dados climáticos exibidos
são públicos (OpenWeatherMap, INAM). O seu email **nunca** é partilhado.

## 6 · Os seus direitos (RGPD / Lei de Protecção de Dados de Moçambique)

Pode, a qualquer momento:

- ✅ **Aceder** aos dados que temos sobre si (responderemos em 30 dias)
- ✅ **Rectificar** dados incorrectos
- ✅ **Apagar** a sua conta (via unsubscribe ou email para DPO)
- ✅ **Portabilidade** (exportar os seus dados em JSON)
- ✅ **Oposição** ao processamento

Para exercer estes direitos, envie email para **eden.mucache@gmail.com**
com o assunto "AlertaClima MZ — Direitos RGPD".

## 7 · Segurança

- Tokens de unsubscribe: HMAC-SHA256 com `crypto.timingSafeEqual`
- Headers de segurança: `helmet` (CSP, X-Frame-Options, etc.)
- HTTPS obrigatório em produção
- Não armazenamos passwords (não há login)
- Email de unsubscribe usa one-click RFC 8058

## 8 · Retenção de dados

- **Subscritor activo**: até cancelar (unsubscribe)
- **Logs de envio**: 100 últimos envios (rolante, ~7 dias)
- **Alertas climáticos em cache**: até 3 horas (após isso expiram)
- **Logs do servidor (Render)**: 7 dias (política Render)

## 9 · Menores

O serviço não é direccionado a menores de 16 anos. Não recolhemos
deliberadamente dados de menores.

## 10 · Transferências internacionais

Os dados passam por serviços cloud fora de Moçambique (Render USA, OWM
USA). Usamos encriptação HTTPS em todas as comunicações. Os dados são
processados em conformidade com a **Lei n.º 2/2017** (Lei de Protecção
de Dados Pessoais de Moçambique) e o **RGPD** (UE) onde aplicável.

## 11 · Alterações a esta política

Notificaremos os subscritores por email se houver alterações
substanciais. Versões anteriores ficam arquivadas em:
`https://alertaclima-mz.onrender.com/privacy`

## 12 · Contacto

- **Email**: eden.mucache@gmail.com
- **Telefone**: +258 84 242 4040
- **Endereço**: AMOSA, Maputo, Moçambique
- **Website institucional**: https://www.amosa.org.mz

---

**Esta política é parte dos Termos de Uso. Ao subscrever os alertas do
AlertaClima MZ, concorda com esta política.**
