# 🚀 Deploy FreteTruck — Vercel (Web) + Neon (DB)

> Guia passo a passo para colocar o FreteTruck no ar em produção usando Vercel + PostgreSQL (Neon).

---

## 📋 Pré-requisitos

| Ferramenta | Link | Custo |
|------------|------|-------|
| Conta GitHub | https://github.com | Grátis |
| Conta Vercel | https://vercel.com | Grátis (Hobby) |
| Conta Neon | https://neon.tech | Grátis (512MB) |
| Conta Mercado Pago | https://mercadopago.com.br | Grátis (taxas por transação) |
| Conta Resend | https://resend.com | Grátis (100 e-mails/dia) |

---

## 🗄️ Passo 1 — Criar banco de dados (Neon)

1. Acesse https://neon.tech e crie uma conta
2. Clique **"New Project"**
3. Nome: `fretetruck-prod`
4. Region: **US East (N. Virginia)** ou **South America (São Paulo)**
5. PostgreSQL version: **16**
6. Clique **"Create Project"**
7. Copie a **Connection String** (formato: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)

---

## 🔑 Passo 2 — Gerar chaves de segurança

```bash
# AUTH_SECRET (sessões)
openssl rand -hex 32
# Cole o resultado

# No Vercel, configure também:
# NEXT_PUBLIC_APP_URL = https://seudominio.com
```

---

## 🔗 Passo 3 — Conectar repositório ao Vercel

1. Acesse https://vercel.com/new
2. Importe seu repositório GitHub
3. Framework: **Next.js** (detectado automaticamente)
4. Root Directory: `./`
5. Build Command: `npm run build` (padrão)
6. Output Directory: `.next` (padrão)

---

## ⚙️ Passo 4 — Configurar variáveis de ambiente

No dashboard do Vercel: **Settings → Environment Variables**

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Production, Preview |
| `AUTH_SECRET` | (resultado do openssl) | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://seudominio.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview.seudominio.com` | Preview |
| `MP_ACCESS_TOKEN` | `APP_USR-xxxxxxxx` | Production |
| `MP_PUBLIC_KEY` | `APP_USR-xxxxxxxx` | Production |
| `RESEND_API_KEY` | `re_xxxxxxxx` | Production |
| `EMAIL_FROM` | `FreteTruck <nao-responder@fretetruck.app>` | Production |

---

## 🗄️ Passo 5 — Aplicar schema no banco

```bash
# Localmente, aponte para o banco Neon
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Aplica todas as tabelas
npx drizzle-kit push

# Popula dados demo (opcional)
node scripts/seed.mjs
```

---

## 🚀 Passo 6 — Deploy

1. No Vercel, clique **"Deploy"**
2. Aguarde o build (~2-3 minutos)
3. Acesse a URL gerada: `https://projeto-xyz.vercel.app`

---

## 🌐 Passo 7 — Configurar domínio customizado

1. Vercel → **Settings → Domains**
2. Adicione: `fretetruck.app`
3. Configure os DNS no seu registrador:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

4. Aguarde propagação (5-30 min)
5. Habilite HTTPS (automático)

---

## 🔄 Deploy automático (CI/CD)

Cada push para `main` → deploy automático em produção.
Cada PR → deploy de preview com URL única.

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
# Vercel detecta e faz deploy automático
```

---

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha | Verificar `DATABASE_URL` e `AUTH_SECRET` nas env vars |
| Erro de conexão DB | Adicionar `?sslmode=require` na URL |
| Cookie não funciona | Verificar `NEXT_PUBLIC_APP_URL` correto |
| Webhook MP não chega | Configurar URL no painel Mercado Pago |

---

## 📊 Custos estimados (início)

| Serviço | Plano | Custo/mês |
|---------|-------|-----------|
| Vercel | Hobby | R$ 0 |
| Neon | Free | R$ 0 |
| Mercado Pago | — | Só taxa por transação (~2-4%) |
| Resend | Free | R$ 0 |
| Domínio .app | — | ~R$ 40-60/ano |
| **Total** | | **R$ 0-5/mês** |

---

## ✅ Checklist pós-deploy

- [ ] Login funciona (`demo@fretetruck.com.br` / `demo123`)
- [ ] Cadastro de novo usuário funciona
- [ ] Busca de fretes retorna resultados
- [ ] Mercado Pago redireciona para checkout
- [ ] Webhook confirma pagamento e credita Trucks
- [ ] E-mails são enviados (se Resend configurado)
- [ ] HTTPS ativo no domínio
- [ ] Sitemap acessível: `/sitemap.xml`
- [ ] Healthcheck: `/api/health`
