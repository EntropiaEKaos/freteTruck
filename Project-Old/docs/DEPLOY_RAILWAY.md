# 🚂 Deploy FreteTruck — Railway (Mais Fácil)

> Guia passo a passo para colocar o FreteTruck no ar usando Railway + PostgreSQL integrado.
> Tempo estimado: **5 minutos**.

---

## ✅ Por que Railway?

| Vantagem | Detalhe |
|----------|---------|
| **PostgreSQL integrado** | Cria banco com 1 clique, sem configurar externo |
| **Zero config** | Detecta Next.js automaticamente |
| **Domínio grátis** | Gera URL pública instantânea |
| **Deploys automáticos** | A cada push no GitHub |
| **Plano grátis** | $5 de crédito/mês (trial), depois $5/mês |

---

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app) (login com GitHub)
2. Código no GitHub (faça `git push`)
3. Chave `AUTH_SECRET` gerada:
   ```bash
   openssl rand -hex 32
   # Copie o resultado (ex: 7f3a8b2c1d9e4f6a5b8c7d2e1f0a9b8c...)
   ```

---

## 🚀 Passo a Passo

### Passo 1 — Criar projeto no Railway

1. Acesse https://railway.app → **Login** (com GitHub)
2. Clique **"New Project"**
3. Escolha **"Deploy from GitHub repo"**
4. Selecione o repositório do **FreteTruck**

---

### Passo 2 — Adicionar PostgreSQL

1. No painel do projeto, clique **"+ New"**
2. Selecione **"Database" → "PostgreSQL"**
3. Railway cria o banco automaticamente
4. Clique no PostgreSQL → aba **"Connect"**
5. Copie a **"Postgres Connection URL"** (formato: `postgresql://postgres:SENHA@HOST.railway.app:PORT/railway`)

---

### Passo 3 — Configurar Variáveis de Ambiente

No seu serviço **FreteTruck** (não no PostgreSQL) → aba **"Variables"**:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Cole a URL do PostgreSQL do Railway |
| `AUTH_SECRET` | Cole a chave gerada com `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://fretetruck-production.up.railway.app` (sua URL gerada) |
| `NODE_ENV` | `production` |

**Opcionais (pagamentos e e-mail):**
| Variável | Valor |
|----------|-------|
| `MP_ACCESS_TOKEN` | `APP_USR-xxxx` (do Mercado Pago) |
| `MP_PUBLIC_KEY` | `APP_USR-xxxx` (do Mercado Pago) |
| `RESEND_API_KEY` | `re_xxxx` (do Resend) |
| `EMAIL_FROM` | `FreteTruck <nao-responder@fretetruck.app>` |

---

### Passo 4 — Configurar Build

Na aba **"Settings"** do serviço FreteTruck:

| Configuração | Valor |
|-------------|-------|
| **Builder** | `Dockerfile` (detectado automaticamente) |
| **Port** | `3000` |
| **Healthcheck Path** | `/api/health` |

> O Railway detecta o `Dockerfile` automaticamente e faz o build.

---

### Passo 5 — Deploy Inicial

1. Clique **"Deploy"**
2. Aguarde o build (2-4 minutos)
3. Quando terminar, clique na URL gerada:
   ```
   https://fretetruck-production.up.railway.app
   ```

---

### Passo 6 — Aplicar Schema e Popular Banco (CRÍTICO!)

O banco foi criado mas está **vazio**. Você precisa criar as tabelas:

**Opção A — Pelo Railway CLI:**
```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Linkar projeto (selecione seu projeto)
railway link

# Aplicar schema do banco
railway run npx drizzle-kit push

# Popular com dados demo
railway run node scripts/seed.mjs
```

**Opção B — Pelo Terminal do Railway:**
1. No painel do Railway → seu serviço FreteTruck
2. Aba **"Settings"** → **"Start Command"** → mude para:
   ```
   sh -c "npx drizzle-kit push --force && node scripts/seed.mjs && npm start"
   ```
3. Salve e faça redeploy
4. **Depois do primeiro deploy**, volte o Start Command para:
   ```
   npm start
   ```
   (para não recriar o banco a cada deploy)

---

### Passo 7 — Configurar Domínio Customizado

1. Aba **"Settings"** → **"Networking"**
2. Clique **"Generate Domain"** (gera URL gratuita)
3. Ou **"Custom Domain"**: adicione `fretetruck.app`
4. Configure DNS no seu registrador:

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | @ | `fretetruck-production.up.railway.app` |

5. Railway configura HTTPS automaticamente

---

## ✅ Checklist Pós-Deploy

- [ ] URL do Railway carrega sem erro
- [ ] `/api/health` retorna status healthy
- [ ] Login funciona (`demo@fretetruck.com.br` / `demo123`)
- [ ] Busca de fretes retorna resultados
- [ ] Cadastro de novo usuário funciona
- [ ] Mercado Pago configurado (opcional)

---

## 💰 Custos

| Período | Custo |
|---------|-------|
| Trial (500h) | **R$ 0** |
| Após trial | **~$5/mês** (inclui app + banco) |

---

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha | Verificar se `package.json` está na raiz |
| Página em branco | Rodar `railway run npx drizzle-kit push` |
| Login não persiste | Verificar `AUTH_SECRET` nas variáveis |
| Erro de banco | Verificar `DATABASE_URL` copiada do PostgreSQL |
| 502 Bad Gateway | Aguardar 30s após deploy (cold start) |

---

## 🔄 Deploy Automático

A cada `git push` para `main`, o Railway detecta e faz redeploy automaticamente:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
# Railway detecta e faz deploy em 2-3 minutos
```

---

## 📊 Comandos Úteis

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Ver logs em tempo real
railway logs

# Abrir app no browser
railway open

# Rodar comando no ambiente Railway
railway run npx drizzle-kit push
railway run node scripts/seed.mjs

# Conectar ao banco
railway connect postgresql
```
