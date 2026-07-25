# 🚀 Deploy FreteTruck — Fly.io (App + PostgreSQL)

> Guia passo a passo para colocar o FreteTruck no ar usando Fly.io com container Docker + PostgreSQL gerenciado.

---

## 📋 Por que Fly.io?

| Vercel | Fly.io |
|--------|--------|
| Ótimo para frontend Next.js | Ótimo para fullstack (API + DB) |
| Serverless (cold starts) | VMs sempre ligadas (sem cold start) |
| PostgreSQL externo necessário | PostgreSQL integrado |
| Grátis limitado | Grátis generoso (3 VMs shared) |
| Deploy automático Git | Deploy via CLI |

---

## 📋 Pré-requisitos

| Ferramenta | Link | Instalação |
|------------|------|------------|
| Fly CLI | https://fly.io/docs/hands-on/install-flyctl/ | `curl -L https://fly.io/install.sh \| sh` |
| Conta Fly.io | https://fly.io/app/sign-up | Grátis |
| Docker Desktop | https://docker.com/products/docker-desktop | Opcional (CLI basta) |

---

## 🔧 Passo 1 — Instalar e autenticar Fly CLI

```bash
# macOS / Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Login
fly auth login

# Verificar
fly status
```

---

## 🚀 Passo 2 — Criar app no Fly.io

```bash
# Na raiz do projeto fretetruck
fly launch

# Responda:
# - Copy configuration from current directory? → Yes
# - App name: fretetruck (ou fretetruck-api)
# - Region: gru (São Paulo) ou iad (EUA)
# - Deploy now? → No (vamos configurar primeiro)
```

---

## 🗄️ Passo 3 — Criar banco PostgreSQL

```bash
# Criar cluster PostgreSQL (gratuito)
fly postgres create --name fretetruck-db

# Responda:
# - name: fretetruck-db
# - region: gru (São Paulo)
# - configuration: development (gratuito)
# - cluster size: 1 node

# Conectar ao app
fly postgres attach --app fretetruck fretetruck-db

# Isso cria automaticamente DATABASE_URL
```

---

## 🔑 Passo 4 — Configurar secrets

```bash
# Gerar AUTH_SECRET
export SECRET=$(openssl rand -hex 32)

# Configurar secrets no Fly
fly secrets set \
  AUTH_SECRET=$SECRET \
  NEXT_PUBLIC_APP_URL=https://fretetruck.fly.dev \
  MP_ACCESS_TOKEN=TEST-xxxxxxxx \
  MP_PUBLIC_KEY=TEST-xxxxxxxx \
  RESEND_API_KEY=re_xxxxxxxx \
  EMAIL_FROM="FreteTruck <nao-responder@fretetruck.app>"

# Verificar
fly secrets list
```

---

## 📄 Passo 5 — Configurar fly.toml

O arquivo `fly.toml` foi criado pelo `fly launch`. Ajuste:

```toml
app = "fretetruck"
primary_region = "gru"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[http_service.checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "get"
  path = "/api/health"
  protocol = "http"

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"

[deploy]
  release_command = "npx drizzle-kit push --force"
  strategy = "rolling"
```

---

## 🚀 Passo 6 — Deploy

```bash
# Primeiro deploy
fly deploy

# Acompanhar logs
fly logs

# Ver status
fly status

# Healthcheck
curl https://fretetruck.fly.dev/api/health
```

---

## 🌐 Passo 7 — Configurar domínio customizado

```bash
# Alocar IP estátio
fly ips allocate-v4

# Adicionar domínio
fly certs add fretetruck.app
fly certs add www.fretetruck.app

# Configurar DNS no registrador:
# A → (IP alocado)
# CNAME www → fretetruck.fly.dev

# Verificar certificados
fly certs show fretetruck.app
```

---

## 🗄️ Passo 8 — Popular banco de dados

```bash
# Executar seed no container remoto
fly ssh console -C "node scripts/seed.mjs"

# Ou conectar ao banco diretamente
fly postgres connect -a fretetruck-db
```

---

## 🔄 Deploy contínuo

```bash
# Cada deploy
fly deploy

# Com watch (desenvolvimento)
fly deploy --watch

# Rollback
fly deployments
fly rollback
```

---

## 📊 Monitoramento

```bash
# Logs em tempo real
fly logs

# Métricas
fly metrics

# Status das máquinas
fly machine list

# Console remoto
fly ssh console
```

---

## 💰 Custos estimados

| Recurso | Plano | Custo/mês |
|---------|-------|-----------|
| App (shared 1x) | Free | R$ 0 |
| PostgreSQL (dev) | Free | R$ 0 |
| Bandwidth | 100GB grátis | R$ 0 |
| Domínio .app | — | ~R$ 5/ano |
| **Total** | | **R$ 0** |

> Nota: Fly.io dá 3 VMs shared gratuitas. Após isso, ~$5/VM/mês.

---

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha | `fly logs` para ver erro |
| DB connection refused | Verificar `DATABASE_URL` com `fly secrets list` |
| App não inicia | `fly machine list` → `fly machine start <id>` |
| 502 Bad Gateway | Verificar healthcheck: `curl /api/health` |
| Migrações não rodam | `fly ssh console -C "npx drizzle-kit push --force"` |

---

## ✅ Checklist pós-deploy

- [ ] `fly status` mostra app rodando
- [ ] `curl https://fretetruck.fly.dev/api/health` retorna 200
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Mercado Pago configurado
- [ ] Domínio com HTTPS ativo
- [ ] Logs sem erros: `fly logs`

---

## 🔗 Comandos úteis

```bash
# Abrir app no browser
fly open

# SSH no container
fly ssh console

# Conectar ao banco
fly postgres connect -a fretetruck-db

# Escalar máquinas
fly machine scale count 2

# Destruir tudo (cuidado!)
fly apps destroy fretetruck
```
