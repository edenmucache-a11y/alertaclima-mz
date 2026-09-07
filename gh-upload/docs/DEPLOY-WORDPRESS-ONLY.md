# AlertaClima MZ · Como adicionar a sub-página no WordPress da AMOSA

> **Quando usar este guia**: você já tem ou vai ter a app AlertaClima a
> correr algures (Render, VPS, outro). Este guia trata **apenas** do
> lado WordPress — ou seja, criar a página `amosa.org.mz/alertas-clima/`
> com o iframe que carrega a app.

---

## ⚠️ Antes de começar — o URL público

O iframe do snippet aponta para um **URL público** (ex: `https://alerta-clima-mz.onrender.com`).
Sem este URL, a página vai mostrar o loader "A carregar…" para sempre.

**Opções para obter o URL público** (escolha UMA):

| Opção | Tempo | Custo | URL resultante |
|---|---|---|---|
| **A) Render free tier** (mais fácil) | 10 min | 0 USD/mês | `https://alerta-clima-mz.onrender.com` |
| **B) Seu próprio VPS** (mais controlo) | 1-2 h | 5–10 USD/mês | `https://alertas.amosa.org.mz` (com DNS) |
| **C) Servidor actual da AMOSA** (se tiver) | depende | 0 | depende |

> 💡 **Recomendação**: opção A. O `render.yaml` no v8 ZIP faz tudo com 1-clique.

Quando tiver o URL público, anote-o — vai precisar no Passo 4 abaixo.

---

## 1 · Entrar no wp-admin

1. Abrir https://www.amosa.org.mz/wp-admin
2. Autenticar-se com a sua conta (provavelmente `eden.mucache`).
3. Se tiver 2FA activo, completar o segundo factor.

---

## 2 · Criar a página

1. No menu lateral esquerdo: **Páginas** → **Adicionar nova** (ou **Add New**).
2. No topo do editor, no campo **Título**, escrever:
   ```
   AlertaClima — Alertas Climáticos em Moçambique
   ```
3. À direita, no painel **Permalink** (ou **Definições de página**),
   clicar em **Editar** ao lado do slug e mudar para:
   ```
   alertas-clima
   ```
   O URL final será: `https://www.amosa.org.mz/alertas-clima/`

---

## 3 · Adicionar o módulo Code (Divi)

> O site usa o tema Divi, por isso o método abaixo é o recomendado.
> Se o Divi não estiver activo, salte para o método alternativo no fim.

1. No editor Divi, clicar no botão **"+ Use Divi Builder"** (ou "Construir com Divi").
2. Escolher **"Build From Scratch"** (Construir do zero).
3. Procurar na lista de módulos: **"Code"** (ícone `</>`).
4. Arrastar o módulo **Code** para a área de conteúdo (primeira secção / primeira linha).
5. Clicar no ícone de **lápis** do módulo Code para o editar.
6. Na janela que abrir, no campo **"Code"** (não "Code title"!), colar
   TODO o conteúdo do ficheiro `backend/deploy/wordpress-iframe-snippet.html`
   (do `<style>` até ao último `</div>`).

> ⚠️ **NÃO** cole os comentários HTML no topo do ficheiro (aqueles com `⚠️ ATENÇÃO`).
> Cole só a partir da linha `<style>`.

---

## 4 · Editar o URL público do iframe

1. Ainda na janela do módulo Code, procure a linha:
   ```html
   <iframe
     src="https://SUBSTITUIR-PELO-URL-PUBLICO.onrender.com"
   ```
2. Apague `https://SUBSTITUIR-PELO-URL-PUBLICO.onrender.com` e escreva
   o URL público da sua app (ex: `https://alerta-clima-mz.onrender.com`).
3. Mais abaixo no snippet, há um **outro** sítio com o mesmo placeholder
   (no link "Cancelar subscrição"). Substitua também:
   ```html
   <a href="https://SUBSTITUIR-PELO-URL-PUBLICO.onrender.com/unsubscribe" ...>
   ```
4. Clicar **"Save"** (ou ✅) para gravar o módulo.

> 💡 Pode usar **Ctrl+H** (Find & Replace) dentro do módulo Code para
> substituir todos os `SUBSTITUIR-PELO-URL-PUBLICO` de uma só vez.

---

## 5 · Publicar

1. No canto superior direito do editor Divi, clicar no botão **"Publish"**
   (ou **"Publicar"** — pode ter de rolar a página para cima para ver).
2. Aguardar ~10 segundos para o WordPress processar.

---

## 6 · Adicionar ao menu principal

1. No menu lateral: **Aparência** → **Menus** (ou **Appearance** → **Menus**).
2. Escolher o menu **"Menu Principal"** (ou "Primary" / "Main Menu") na dropdown.
3. Clicar **"Select"** para carregar os itens.
4. No painel esquerdo **"Páginas"** (Pages), marcar a checkbox
   ao lado de **"AlertaClima — Alertas Climáticos em Moçambique"**.
5. Clicar **"Adicionar ao menu"** (Add to Menu).
6. Arrastar o item "AlertaClima" para a posição desejada (sugestão: depois
   de "Projectos" e antes de "Galeria").
7. Clicar **"Guardar menu"** (Save Menu).

---

## 7 · Limpar a cache do LiteSpeed

Para que a nova página apareça imediatamente:

1. No menu lateral: **LiteSpeed Cache** → **Dashboard** (ou **Toolbox**).
2. Clicar em **"Purge All"** (ou **"Limpar tudo"**).
3. Aguardar 5-10 segundos.

Alternativa mais simples: **Plugin** → **LiteSpeed Cache** → **Purge All** no topo da barra admin.

---

## 8 · Testar em aba anónima

1. Abrir uma nova janela em modo anónimo/privado (Ctrl+Shift+N no Chrome).
2. Ir a `https://www.amosa.org.mz/alertas-clima/`.
3. Verificar:
   - [ ] Banner azul "🌪 AlertaClima MZ" aparece
   - [ ] Loader desaparece e o dashboard carrega dentro da box
   - [ ] Mapa do Leaflet aparece com os marcadores coloridos
   - [ ] Lista de alertas activos no topo
   - [ ] Secção de histórico mais abaixo
   - [ ] Formulário de subscrição no rodapé funciona
   - [ ] Botão "🗺 Ver no mapa" foca o mapa no alerta clicado
4. Testar também `https://www.amosa.org.mz/` → clicar no item de menu "AlertaClima" — deve levar à nova página.

---

## 9 · Se algo correr mal

| Sintoma | Causa | Solução |
|---|---|---|
| Página em branco | Iframe src errado | Voltar ao Passo 4, verificar URL |
| Banner azul aparece mas iframe fica em "A carregar…" | URL público não responde (404, timeout, CORS) | Abrir o URL público noutra aba. Se der erro, a app ainda não está deployada |
| Erro "Refused to display in a frame" | CSP a bloquear iframe | O WordPress/LiteSpeed pode ter CSP restrictiva. Pedir ao admin do hosting para adicionar o domínio à CSP |
| Página aparece mas mapa não carrega | API key OWM inválida ou quota | Não-bloqueante — o resto funciona. Configurar OPENWEATHER_API_KEY no backend |
| 404 no URL público | App não deployed | Voltar à opção A/B/C e fazer deploy da app primeiro |

---

## Próximos passos opcionais

- Adicionar um **ícone** (📡 ou 🌪) ao item de menu "AlertaClima" — em **Aparência → Menus → Abrir o item "AlertaClima" → Navigation Label**, prefixe com o emoji.
- Traduzir a página para inglês/inhambane/emakhuwa via WPML ou Polylang (plugin pago).
- Adicionar a página ao **sitemap** (Yoast SEO / Rank Math detecta automaticamente).
- Adicionar **Open Graph image** com printscreen do dashboard para partilha em redes sociais.

---

**Contacto técnico**: Eden Mucache · `eden.mucache@gmail.com` · https://www.linkedin.com/in/edenmucache/
