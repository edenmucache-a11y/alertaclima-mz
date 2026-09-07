# AlertaClima MZ · Deploy no Render (sem git local)

> **Quando usar este guia**: você NÃO tem `git` instalado na sua máquina.
> O Render aceita apenas repositórios Git, então vamos criar um repositório
> no GitHub via browser (sem linha de comandos) e depois ligar o Render a ele.

**Tempo total: 10-15 minutos**
**Custo: 0 USD/mês** (plano free do Render)

---

## 0 · Antes de começar

Confirme que tem:
- [ ] Conta de email válida
- [ ] Navegador web (Chrome, Firefox, Edge, etc.)
- [ ] Os 56 ficheiros do v8 ZIP extraídos em `C:\Temp\gh-upload\`
- [ ] ~15 minutos disponíveis

> Tudo o que precisa fazer é clicar botões no browser. Não há linhas de comando.

---

## 1 · Criar conta no GitHub (se ainda não tem)

1. Abrir https://github.com/signup
2. Username sugerido: `edenmucache` (ou use o seu)
3. Email: o seu email
4. Password
5. Resolver o puzzle de verificação
6. Confirmar email (a GitHub envia um código)

---

## 2 · Criar o repositório

1. Abrir https://github.com/new
2. Preencher:
   - **Repository name**: `alertaclima-mz`
   - **Description**: `Plataforma de alertas climáticos para Moçambique — AMOSA`
   - Visibilidade: **Public** ← importante para o free tier do Render
   - **NÃO** marcar "Add a README file"
   - **NÃO** marcar "Add .gitignore"
   - **NÃO** escolher license
3. Clicar **"Create repository"** (botão verde no fim da página).
4. Vai aparecer uma página com instruções. **Ignore** essas instruções e vá para o Passo 3.

---

## 3 · Upload dos ficheiros (drag-and-drop)

Na página do repositório recém-criado:

1. Procure a secção **"uploading an existing file"** (link perto do meio da página, ou no botão **"Add file"** → **"Upload files"**).
2. Abrir o **Explorador de Ficheiros** do Windows (tecla Windows + E).
3. Navegar até `C:\Temp\gh-upload\`.
4. **Arrastar TODA a pasta `gh-upload`** (não só os ficheiros individuais) para a zona de upload no GitHub.
5. Esperar o upload terminar (~30-60 segundos para 56 ficheiros pequenos).
6. Scroll para baixo → escrever mensagem de commit: `v8 initial deploy`
7. Clicar **"Commit changes"** (botão verde).
8. Vai voltar à página principal do repositório. Deve ver todos os ficheiros.

> 💡 **Truque**: se o GitHub recusar o drag-and-drop da pasta, comprima o conteúdo
> da pasta `gh-upload` num novo ZIP e arraste o ZIP. O GitHub descompacta automaticamente.

---

## 4 · Criar conta no Render

1. Abrir https://render.com/register
2. Recomendado: **"Sign up with GitHub"** (mais rápido, conecta automaticamente).
3. Autorizar o Render a aceder aos seus repositórios GitHub (pode escolher "All repositories" ou só "Only select repositories" → seleccionar `alertaclima-mz`).

---

## 5 · Deploy via Blueprint (1-clique)

1. No dashboard do Render: https://dashboard.render.com
2. Na barra lateral: **"Blueprints"** → clicar **"New Blueprint Instance"**.
3. **"Connect a repository"** → procurar **`alertaclima-mz`**.
4. Clicar **"Connect"**.
5. O Render vai ler o `render.yaml` e mostrar um resumo:
   - Service name: `alerta-clima-mz`
   - Plan: **Free**
   - Region: **Oregon** (pode deixar)
6. Clicar **"Apply"** (ou **"Create Blueprint"**).
7. O Render vai:
   - Clonar o repo
   - Instalar deps do frontend
   - Fazer `npm run build` (gera `frontend/dist/`)
   - Copiar `dist/` para `backend/public/`
   - Instalar deps do backend
   - Iniciar `node server.js`
8. A primeira build demora **5-8 minutos**. Acompanhe em **"Events"** ou **"Logs"**.

---

## 6 · Testar a app

Quando a build terminar (status = **"Live"**):

1. Abrir `https://alerta-clima-mz.onrender.com` no browser.
2. Deve ver o dashboard AlertaClima completo (mapa, alertas, formulário).
3. Testar:
   - `https://alerta-clima-mz.onrender.com/api/health` → `{"ok": true, "env": "production", "ts": "..."}`
   - `https://alerta-clima-mz.onrender.com/api/alerts` → lista de 21+ alertas
4. Se ver tudo OK, **anote este URL** — vai precisar dele para o iframe no WordPress.

---

## 7 · (Opcional) Configurar SMTP para emails reais

1. No dashboard do Render → serviço `alerta-clima-mz` → **"Environment"**.
2. Clicar **"Add Environment Variable"** para cada uma:

| Key | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `alertas@amosa.org.mz` |
| `SMTP_PASS` | `<App Password de 16 chars>` |
| `SMTP_FROM` | `AlertaClima MZ <alertas@amosa.org.mz>` |

Como gerar a App Password do Gmail:
- https://myaccount.google.com/apppasswords (precisa de 2FA activo)
- App = "Mail", Device = "Outro (AlertaClima)"
- Copiar os 16 chars

3. Clicar **"Save Changes"**. O Render reinicia o serviço em ~1 min.
4. Verificar nos Logs: deve aparecer `Email: ✓ SMTP configurado (live)`.

---

## 8 · Actualizar o iframe src no WordPress

1. Voltar ao wp-admin da AMOSA → Páginas → "AlertaClima — Alertas Climáticos em Moçambique" → Editar.
2. No módulo Code do Divi, substituir o placeholder:
   ```
   https://SUBSTITUIR-PELO-URL-PUBLICO.onrender.com
   ```
   pelo URL real:
   ```
   https://alerta-clima-mz.onrender.com
   ```
   (Usar Ctrl+H dentro do módulo para substituir todos de uma vez.)
3. **Publicar** (ou "Update" se a página já estava publicada).
4. Purgar cache: **LiteSpeed Cache → Toolbox → Purge All**.

---

## 9 · (Mais tarde) Adicionar ao menu principal

Quando estiver pronto:

1. No wp-admin: **Divi → Theme Builder**
2. Editar o **Default Website Template**
3. No módulo "Menu", adicionar a página AlertaClima (ver `DEPLOY-WORDPRESS-ONLY.md`)
4. Save

---

## 🆘 Resolução de problemas

| Problema | Causa | Solução |
|---|---|---|
| "Repository not found" no Render | Repo não é público OU Render não tem permissão | Tornar repo público OU ir a https://github.com/settings/installations e dar permissão ao Render |
| Build falha com "Cannot find module" | Algum ficheiro de config está em falta | Verificar que `render.yaml`, `package.json` (backend e frontend) e `vite.config.js` foram commitados |
| Build demora >15 min | Cold start + npm install | Esperar. Builds seguintes são mais rápidas (~3 min) |
| `502 Bad Gateway` após deploy | App ainda a iniciar ou erro de runtime | Ver Logs no Render. Esperar 1 min se acabou de deploy |
| Site demora 30s a carregar no 1º acesso | Render free tier hiberna após 15 min sem uso | Upgrade para Starter ($7/mês) ou aceitar o delay |
| Email não chega | SMTP mal configurado OU em modo MOCK | Ver Logs: `Email: ⚠ MOCK` significa que SMTP vars estão em falta |

---

**Próximo passo**: depois do deploy estar Live, vá ao WordPress e actualize o iframe src.
Para ajuda, contacte Eden Mucache · `eden.mucache@gmail.com`
