# 🚀 FreteTruck — Guia Completo de Deploy (8 Plataformas)

> Escolha a plataforma que melhor se adapta ao seu bolso e necessidade.

---

## 📊 Comparativo Rápido

| Plataforma | Dificuldade | Custo Inicial | Banco Integrado | Melhor Para |
|------------|-------------|---------------|-----------------|-------------|
| **Render** | ⭐ Muito fácil | Grátis (limitado) | Sim (add-on) | Testar de graça |
| **Koyeb** | ⭐⭐ Fácil | Grátis (1 instância) | Externo | Projetos pequenos |
| **Coolify** | ⭐⭐ Fácil | Custo do VPS (~R$15/mês) | Sim (integrado) | Controle total |
| **DigitalOcean** | ⭐⭐ Fácil | $5/mês (Droplet) | Sim (add-on) | Estabilidade |
| **Hetzner VPS** | ⭐⭐⥁ Médio | €4/mês (~R$22) | Via Docker | Melhor custo |
| **Contabo VPS** | ⭐⭐⥁ Médio | €6/mês (~R$33) | Via Docker | Mais RAM grátis |
| **Vercel** | ⭐ Muito fácil | Grátis (limitado) | Não (usar Neon) | Frontend |
| **Railway** | ⭐ Muito fácil | Grátis ($5 crédito) | Sim | Tudo integrado |
| **Fly.io** | ⭐⥁ Médio | Grátis (3 VMs) | Sim | Baixa latência |

---

## 1️⃣ RENDER (Mais fácil depois do Railway)

> Site: https://render.com

### Por que usar?
- Plano **grátis** permanente (com limites)
- PostgreSQL grátis por 90 dias (depois $7/mês)
- Detecta Docker/Next.js automaticamente
- Deploys automáticos por GitHub

### Passo a passo:
1. Acesse https://dashboard.render.com → **New +** → **Web Service**
2. Conecte seu repositório GitHub
3. Configurações:
   - **Name:** `fretetruck`
   - **Runtime:** `Docker` (detecta o Dockerfile)
   - **Instance Type:** `Free` ou `Starter ($7/mês)`
4. Variáveis de Ambiente:
   ```
   DATABASE_URL=postgresql://user:pass@host/render_db
   AUTH_SECRET=sua-chave-openssl
   NEXT_PUBLIC_APP_URL=https://fretetruck.onrender.com
   ```
5. Adicionar banco: **New +** → **PostgreSQL** → copie a `Internal Database URL`
6. **Create Web Service**
7. Após o deploy, rode o schema:
   - **Shell** (no painel Render): `npx drizzle-kit push && node scripts/seed.mjs`

---

## 2️⃣ KOYEB (Alternativa ao Vercel com containers)

> Site: https://koyeb.com

### Por que usar?
- **Grátis para sempre:** 1 Web Service (512MB RAM)
- Suporte nativo a Docker
- Deploy por GitHub ou CLI

### Passo a passo:
1. Acesse https://app.koyeb.com → **Create Service**
2. Escolha **GitHub** → selecione o repo
3. Configurações:
   - **Builder:** `Dockerfile`
   - **Port:** `3000`
   - **Healthcheck:** `/api/health`
4. Variáveis de Ambiente:
   ```
   DATABASE_URL=postgresql://... (use Neon.tech grátis)
   AUTH_SECRET=sua-chave
   NEXT_PUBLIC_APP_URL=https://fretetruck-koyeb.koyeb.app
   ```
5. **Deploy**
6. Banco: crie grátis em https://neon.tech e cole a URL

---

## 3️⃣ COOLIFY (Self-hosted = Controle Total)

> Site: https://coolify.io

### Por que usar?
- **Sem limite** de apps, domínios ou tráfego
- Você instala no seu VPS (Hetzner, Contabo, DigitalOcean)
- PostgreSQL, Redis, e até MongoDB integrados
- Interface igual ao Railway/Vercel, mas no seu servidor
- **Custo:** só o VPS (€4-6/mês para um servidor bom)

### Passo a passo:
1. Alugue um VPS (recomendo Hetzner CX22: 4GB RAM, €4/mês)
2. Acesse o VPS via SSH
3. Instale o Coolify com 1 comando:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
4. Acesse `http://IP-DO-SEU-VPS:8000`
5. Crie conta de administrador
6. **+ New Resource** → **PostgreSQL** (cria banco automaticamente)
7. **+ New Resource** → **Application** → conecte seu GitHub
8. Configure:
   - **Build Pack:** Dockerfile
   - **Port:** 3000
9. Variáveis de ambiente (Database URL vem automática do PostgreSQL do Coolify)
10. **Deploy**

---

## 4️⃣ DIGITALOCEAN APP PLATFORM

> Site: https://digitalocean.com/products/app-platform

### Por que usar?
- Crédito grátis de $200 (60 dias)
- Detecta Next.js + Docker automaticamente
- PostgreSQL gerenciado integrado

### Passo a passo:
1. https://cloud.digitalocean.com → **Apps** → **Create App**
2. **GitHub** → selecione o repo
3. O DO detecta Dockerfile automaticamente:
   - **HTTP Port:** 3000
   - **Run Command:** `npm start`
4. **Add Database** → PostgreSQL (gerenciado)
5. Variáveis de ambiente:
   ```
   DATABASE_URL=${db.DATABASE_URL}  (auto-preenchido)
   AUTH_SECRET=sua-chave
   ```
6. **Deploy**
7. Rode migrações via Console (no painel da DO):
   ```
   npx drizzle-kit push && node scripts/seed.mjs
   ```

---

## 5️⃣ SELF-HOSTED VPS + DOCKER (Mais barato a longo prazo)

> Melhor opção para quem quer estabilidade sem depender de PaaS.

### Recomendação de VPS:

| Provedor | Config | Preço | Link |
|----------|--------|-------|------|
| **Hetzner** | 2 vCPU / 4GB RAM | €4,5/mês (~R$25) | https://hetzner.cloud |
| **Contabo** | 4 vCPU / 8GB RAM | €6/mês (~R$33) | https://contabo.com |
| **DigitalOcean** | 1 vCPU / 1GB RAM | $6/mês (~R$30) | https://digitalocean.com |

### Passo a passo (Hetzner + Docker):

```bash
# 1. Crie um VPS (Ubuntu 22.04 ou 24.04)

# 2. Acesse via SSH
ssh root@IP_DO_SERVIDOR

# 3. Instale Docker
apt update && apt install -y docker.io docker-compose-v2

# 4. Clone o projeto
git clone https://github.com/SEU_USER/fretetruck.git
cd fretetruck

# 5. Configure variáveis
cp .env.production .env
nano .env  # Edite DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL

# 6. Suba tudo (App + PostgreSQL)
docker compose up -d --build

# 7. Aplique schema e seed
docker compose exec app npx drizzle-kit push --force
docker compose exec app node scripts/seed.mjs

# 8. Instale Nginx + SSL (HTTPS gratuito)
apt install -y nginx certbot python3-certbot-nginx

# Copie a config do nginx
cp nginx.conf /etc/nginx/sites-available/fretetruck
ln -sf /etc/nginx/sites-available/fretetruck /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# SSL gratuito com Let's Encrypt
certbot --nginx -d fretetruck.app -d www.fretetruck.app

# Pronto! Acesse https://fretetruck.app
```

---

## 6️⃣ SELF-HOSTED COM COOLIFY (O melhor dos dois mundos)

Se você quer controle total mas com interface gráfica:

```bash
# 1. Alugue VPS na Hetzner ou Contabo
# 2. Instale Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 3. Acesse http://IP:8000
# 4. Crie seu PostgreSQL com 1 clique
# 5. Conecte seu GitHub e faça deploy com Dockerfile
# 6. Configure domínio + SSL (automático pelo Coolify)
```

---

## 🏆 MINHA RECOMENDAÇÃO POR PERFIL

### Para começar grátis e rápido:
**Render** ou **Vercel** (com banco no Neon)

### Para produção estável sem gastar muito:
**Coolify** em um VPS Hetzner/Contabo (~R$25/mês, sem limites)

### Para quem quer zero manutenção:
**Railway** ($5/mês, tudo automático)

### Para quem quer o mais barato possível:
**Self-hosted Docker** na Hetzner (~R$25/mês, controle total)

---

## 🔄 Tabela de Variáveis (Para qualquer plataforma)

Todas as plataformas precisam destas variáveis:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ Sim | URL do PostgreSQL |
| `AUTH_SECRET` | ✅ Sim | Chave de sessões (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Recomendada | URL pública do app |
| `NODE_ENV` | Automática | `production` |
| `MP_ACCESS_TOKEN` | Opcional | Mercado Pago |
| `MP_PUBLIC_KEY` | Opcional | Mercado Pago |
| `RESEND_API_KEY` | Opcional | E-mails |
| `EMAIL_FROM` | Opcional | Remetente dos e-mails |

---

## ✅ Checklist Universal (Para qualquer plataforma)

- [ ] Código no GitHub
- [ ] `DATABASE_URL` configurada (apontando para PostgreSQL real)
- [ ] `AUTH_SECRET` gerada com `openssl rand -hex 32`
- [ ] `npx drizzle-kit push` executado contra o banco de produção
- [ ] `node scripts/seed.mjs` executado para dados demo
- [ ] Login funciona (`demo@fretetruck.com.br` / `demo123`)
- [ ] `/api/health` retorna status 200
- [ ] HTTPS ativo (automático na maioria das plataformas)
