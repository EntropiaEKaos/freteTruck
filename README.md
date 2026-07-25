# 🚛 FreteTruck — Marketplace de Fretes Brasileiro

> **O marketplace de fretes mais completo do Brasil.** Grátis, sem comissão, com chat interno, propostas online, rastreamento GPS, calculadora, mapa interativo e muito mais.

## 📖 Documentação

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [📘 Documentação Técnica](docs/DOCUMENTACAO_TECNICA.md) | Arquitetura, schema, API reference, deploy, segurança | Desenvolvedores |
| [📗 Manual do Usuário](docs/MANUAL_DO_USUARIO.md) | Guia completo passo a passo para usar a plataforma | Motoristas, embarcadores, admins |

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 📋 Indice

1. [O que é](#-o-que-e)
2. [Funcionalidades](#-funcionalidades)
3. [Stack Tecnologica](#-stack-tecnologica)
4. [Arquitetura](#-arquitetura)
5. [Instalacao Local](#-instalacao-local)
6. [Variaveis de Ambiente](#-variaveis-de-ambiente)
7. [Banco de Dados](#-banco-de-dados)
8. [Deploy em Producao](#-deploy-em-producao)
9. [Deploy Docker (Recomendado)](#deploy-docker-recomendado)
10. [Deploy Vercel](#deploy-vercel)
11. [Deploy Railway / Render / Fly.io](#deploy-railway--render--flyio)
12. [Deploy AWS / GCP / Azure](#deploy-aws--gcp--azure)
13. [Aplicativos Mobile (Planejamento)](#-aplicativos-mobile-planejamento)
14. [API Reference](#-api-reference)
15. [Seguranca](#-seguranca)
16. [Contribuicao](#-contribuicao)
17. [Licenca](#-licenca)

---

## 🎯 O que é

O **FreteTruck** é um clone evoluido do FreteBras — um marketplace que conecta caminhoneiros autônomos a embarcadores em todo o Brasil. Permite publicar fretes, buscar cargas, enviar propostas, negociar via chat e WhatsApp, calcular lucros da viagem, rastrear cargas e muito mais.

### O que o FreteTruck tem e o FreteBras NÃO tem:

| Funcionalidade | FreteTruck | FreteBras |
|---|---|---|
| 💬 Chat interno entre usuários | ✅ | ❌ |
| 📨 Propostas/lances online | ✅ | ❌ |
| ⭐ Avaliacoes e reputacao | ✅ | Parcial |
| 🧮 Calculadora de frete | ✅ | ❌ |
| 🔄 Sugestão de frete de retorno | ✅ | ❌ |
| 🗺️ Mapa interativo do Brasil | ✅ | ❌ |
| 📊 Tabela de preços por rota | ✅ | ❌ |
| 🌙 Modo escuro total | ✅ | ❌ |
| 🔔 Notificacoes in-app | ✅ | ❌ |
| ❤️ Favoritos | ✅ | ❌ |
| 🔔 Alertas de rota | ✅ | ❌ |
| 👤 Perfil publico com badges | ✅ | ❌ |
| 🎰 Leilões reversos (bidding) | ✅ | ❌ |
| 📋 Verificacao de documentos | ✅ | ❌ |
| 💰 Carteira/Creditos | ✅ | ❌ |
| 🎁 Programa de convites | ✅ | ❌ |
| 📍 Rastreamento GPS simulado | ✅ | ❌ |
| 🛡️ Painel administrativo | ✅ | ❌ |

---

## ✨ Funcionalidades

### Para Motoristas
- **Buscar fretes** com 12+ filtros (origem, destino, tipo de caminhao, carroceria, carga, etc.)
- **Enviar propostas online** com valor e mensagem
- **Chat integrado** para negociar antes de fechar
- **Calculadora de frete** - diesel, pedágio, manutenção, lucro liquido
- **Favoritos** - salvar fretes para ver depois
- **Alertas de rota** - receba notificações quando surgem cargas na sua rota
- **Fretes de retorno** - nunca mais volta vazio!
- **Carteira de creditos** - ganhe por convites, gaste no destaque

### Para Embarcadores
- **Publicar fretes** em segundos com todos os detalhes
- **Modo leilao** - defina preço mínimo e deixe motoristas dar lances
- **Gerenciar propostas** - aceite a melhor oferta com 1 clique
- **Chat com motoristas** - tudo dentro da plataforma
- **Destacar frete** (pago ou via creditos) - aparece no topo da busca
- **Rastreamento** - acompanhe carga em tempo real ate a entrega
- **Avaliar motoristas** apos a entrega

### Para Todos
- **Perfil publico** com estatisticas, avaliacoes e badges
- **Notificacoes** de proposta aceita, nova mensagem, etc.
- **Programa de convites** - ganhe R$25 por amigo cadastrado
- **Verificacao de documentos** - CNH, RNTC, CRVL com selo verde
- **Mapa interativo** - visualizacao geografica de fretes
- **Tabela de precos** - media de R$/km por rota no Brasil todo
- **Modo escuro** - interface adaptada para uso noturno
- **Compartilhar frete** - copie link ou share nativo
- **Responsivo** - funciona perfeitamente em desktop, tablet e mobile web

---

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | **Next.js 16** (App Router + React 19) |
| Linguagem | **TypeScript 5** (strict mode) |
| Estilo | **Tailwind CSS 4** (com dark mode custom) |
| Banco | **PostgreSQL 16** |
| ORM | **Drizzle ORM** (type-safe queries) |
| Autenticacao | Sessoes HMAC assinadas + scrypt |
| Deployment | **Node.js 20 Alpine** (Docker) |
| CI/CD | Compativel com Vercel, Railway, Fly, AWS ECS, GCP Cloud Run |

---

## 🏗 Arquitetura

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (serverless functions)
│   │   ├── auth/                  # Login, registro, logout, me
│   │   ├── freights/             # CRUD de fretes (GET list/POST new / PATCH close/DELETE)
│   │   ├── proposals/            # Propostas (POST / PATCH accept/reject / DELETE)
│   │   ├── messages/             # Chat (GET conversations/POST message)
│   │   ├── notifications/        # Notif (GET list/PATCH marcar lido/count unread)
│   │   ├── favorites/            # Favoritos (GET/POST toggle)
│   │   ├── alerts/               # Alertas de rota (GET/POST/DELETE)
│   │   ├── reviews/              # Avaliacoes (GET user stats/POST)
│   │   ├── wallet/               # Carteira de credits (GET saldo/POST debito/credito)
│   │   ├── referral/             # Convites (GET info/POST gerar code)
│   │   ├── tracking/[id]/        # GPS simulado GET
│   │   ├── documents/            # Upload de docs (GET mine/POST upload)
│   │   ├── profile/[id]/         # Perfil publico (GET stats)
│   │   ├── stats/                # Estatisticas globais (GET)
│   │   └── admin/                # Painel admin (GET dashboard/documents/users)
│   │       ├── users/[id]/role/  # Admin: alterar role/verificar/dar credits
│   │       └── documents/[id]/   # Admin: aprovar/rejeitar docs
│   │
│   ├── cadastro/                 # Pagina de registro
│   ├── entrar/                   # Pagina de login
│   ├── fretes/                   # Busca com filtros avancados
│   ├── fretes/[id]/              # Detalhes + propostas + favoritos + retornos + similares
│   ├── publicar/                 # Formulario de publicar frete
│   ├── painel/                   # Dashboard do usuario (abas)
│   ├── perfil/[id]/              # Perfil publico
│   ├── chat/                     # Mensagens internas
│   ├── mapa/                     # Mapa interativo do Brasil
│   ├── precos/                   # Tabela de precos por rota
│   ├── calculadora/              # Calc de custos e lucro
│   ├── documentos/               # Upload CNH/RNTC/CRVL
│   ├── carteira/                 # Saldo e historico de transacoes
│   ├── convite/                  # Programa de afiliados
│   ├── rastrear/[id]/           # Visualizacao GPS
│   ├── admin/                    # Painel administrativo
│   ├── ajuda/                    # Central de ajuda + FAQ
│   ├── sobre/                    # Sobre o projeto
│   └── page.tsx                  # Home page
│
├── components/
│   ├── Header.tsx                # Navbar global + dark mode + notifs
│   ├── FreightCard.tsx           # Card de frete com badge de qualidade
│   ├── FreightActions.tsx        # Proposta + favoritos + avaliacoes
│   └── ShareButton.tsx           # Compartilhar/copiar link
│
├── db/
│   ├── schema.ts                 # Schema Drizzle (11 tabelas!)
│   └── index.ts                  # Conexao PostgreSQL (pool singleton)
│
├── lib/
│   ├── auth.ts                   # Hash scrypt + sessoes HMAC
│   └── constants.ts              # UFs, veiculos, carrocerias, formatters
│
scripts/
└── seed.mjs                     # Dados demo (usuarios, fretes, propostas, msgs, notifs)
```

---

## 🚀 Instalacao Local

### Pre-requisitos
- **Node.js >= 20**
- **PostgreSQL >= 15** (ou use Docker)

### Passo a passo:

```bash
# 1. Clone o repositorio
git clone <seu-repo>
cd fretetruck

# 2. Instale as dependencias
npm install

# 3. Configure o banco de dados
cp .env.example .env
# Edite .env com sua string de conexao PostgreSQL:
# DATABASE_URL=postgresql://user:pass@localhost:5432/fretetruck

# 4. Crie as tabelas no banco
npx drizzle-kit push --force

# 5. Popule com dados de exemplo
node scripts/seed.mjs

# 6. Inicie o servidor de desenvolvimento
npm run dev

# 7. Abra http://localhost:3000
```

### Contas demo:
| Funcao | Email | Senha |
|--------|-------|-------|
| Embarcador Admin | `demo@fretetruck.com.br` | `demo123` |
| Motorista | `marcos@gmail.com` | `senha123` |
| Embarcadora | `fernanda@grancargo.com.br` | `senha123` |
| Transportadora | `roberto@sulfrete.com.br` | `senha123` |

---

## ⚙️ Variaveis de Ambiente

| Variavel | Obrigatorio? | Default | Descricao |
|----------|-------------|---------|-----------|
| `DATABASE_URL` | Sim | - | String de conexao PostgreSQL |
| `AUTH_SECRET` | Nao | `frete-truck-dev-secret` | Chave HMAC para sessoes (MUDAR EM PRODUCAO!) |
| `NEXT_PUBLIC_APP_URL` | Nao | `http://localhost:3000` | URL base para links de convite, compartilhamento |

---

## 🐘 Banco de Dados

O sistema usa **PostgreSQL** com **Drizzle ORM**. Apos o push inicial, o schema sera versionado.

### Tabelas:
```
users         → Usuarios (motoristas/embarcadores/admins)
freights      → Fretes publicados
proposals     → Propostas/lances de motoristas
messages      -> Mensagens do chat interno
notifications -> Notificacoes in-app
favorites     -> Fretes salvados/favoritados
alerts        -> Alertas de rota personalizados
reviews       -> Avaliacoes (1-5 estrelas + sub-metricas)
documents     -> Uploads de CNH/RNTC/CRVL/CLTM
transactions  -> Historico de creditos/debitos
referrals     -> Registros de convites e bonus
```

---

## 🚢 Deploy em Producao

### Opcao 1: Docker (Recomendado)

```bash
# Build e rode localmente com compose
docker compose up -d --build

# O app estara em http://localhost:3000
# O banco PostgreSQL estara em :5432
# Seeds automatico: adicione ao docker-compose.yml o comando seed
```

Para producao, configure:
1. **Dominio e SSL**: Use nginx com Let's Encrypt (config inclusa)
2. **DATABASE_URL real**: Substitua pela URL do seu provedor de BD (Neon, Supabase, AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL)
3. **AUTH_SECRET forte**: Use `openssl rand -hex 32`
4. **NEXT_PUBLIC_APP_URL**: `https://fretetruck.seudominio.com`

Exemplo de deploy em servidor VPS:
```bash
# No servidor
git pull origin main
docker compose down
docker compose up -d --build

# Configure Nginx como reverse proxy
sudo cp nginx.conf /etc/nginx/sites-available/fretetruck
sudo ln -sf /etc/nginx/sites-available/fretetruck /etc/nginx/sites-enabled/
sudo certbot --nginx -d fretetruck.app -d www.fretetruck.app
sudo systemctl reload nginx
```

### Opcao 2: Vercel (Serverless)
```bash
# 1. Adicione um banco PostgreSQL externo (Supabase, Neon, PlanetScale)
#    Atualize .env com a DATABASE_URL real

# 2. Instale o CLI Vercel
npm i -g vercel

# 3. Deploy
vercel

# 4. Configurar variaveis de ambiente no dashboard Vercel:
#    DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL

# Nota: Use 'next build' com output standalone para Vercel.
# Necessario rodar `npx drizzle-kit push` manualmente depois de mudancas de schema,
# pois o Drizzle Kit nao funciona em serverless Vercel (sem terminal TTY).
# Alternativa: use `npx drizzle-kit generate` para criar migration files
# e rode migrations no post-deploy script do Vercel.
```

### Opcao 3: Railway / Render / Fly.io
```bash
# Railway:
railway init          # or connect GitHub repo automaticamente
 railway up

# Render:
# Connect no render.com com seu repo GitHub
# Configurar command: npm run build && npm start
# Addons: PostgreSQL

# Fly.io:
fly launch            # configura tudo interativamente
fly deploy

# Todos os tres suportam:
# - Variaveis de ambiente
# - Auto-deploy por Git push
# - Postgres integrado
# - SSL automatico
```

### Opcao 4: AWS / GCP / Azure

#### AWS (ECS/Fargate + RDS):
```bash
# 1. Build Docker image
docker build -t fretetrack .
docker tag fretetrack <account>.dkr.ecr.<region>.amazonaws.com/fretetrack:latest
docker push ...

# 2. Criar infra via Terraform (terraform/main.tf):
#    - RDS PostgreSQL
#    - ECS Cluster (Fargate preferred)
#    - ALB + Route53 + ACM cert
#    - Secrets Manager para DATABASE_URL, AUTH_SECRET
#    - IAM role com politica SSM:GetParameter
#    - Target group com health check em /api/health

# 3. terraform apply
terraform plan
terraform apply

# Notas AWS:
# - Uso recomendado: t3.medium para app (minimo), db.t3.micro para dev, db.r6g.large para prod
# - RDS com multi-AZ para disponibilidade
# - CloudFront para CDN do next/image e arquivos estaticos
# - S3 para uploads de documentos futuros
```

#### GCP (Cloud Run + Cloud SQL):
```bash
# 1. Enable APIs: Cloud SQL, Cloud Run, Artifact Registry
gcloud services enable sqladmin.googleapis.com run.googleapis.com artifactregistry.googleapis.com

# 2. Criar Cloud SQL Postgres instance
gcloud sql instances create fretetruck-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=$(openssl rand -base64 24)

# 3. Build e push no Artifact Registry
gcloud builds submit --tag us-central1-docker.pkg.dev/<PROJECT>/fretetrack/app .

# 4. Deploy no Cloud Run
gcloud run deploy fretetrack \
  --image=us-central1-docker.pkg.dev/<PROJECT>/fretetrack/app \
  --platform=managed \
  --region=us-central1 \
  --add-cloudsql-instances=fretetrack-db \
  --set-env-vars DATABASE_URL="postgresql://...@/app_db",AUTH_SECRET="..." \
  --allow-unauthenticated \
  --min-instances=0 --max-instances=10

# Notas GCP:
# - Cloud Run auto-scale de 0 a N instantaneamente (paga soh o que usa)
# - Cloud SQL private IP com Serverless VPC Connector
# - Memorystore Redis opcional para caching futuro
# - Secret Manager para AUTH_SECRET
```

#### Azure (Container Apps + Flexible Server):
```bash
# 1. Criar grupo de recursos
az group create --name ft-group --location brazilsouth

# 2. PostgreSQL flexible server
az postgres flexible-server create \
  --name ft-db --resource-group ft-group --location brazilsouth \
  --admin-user admin --admin-password $(openssl rand -base64 24) \
  --sku-name Standard_B1ms --version 16

# 3. Container App Environment
az containerapp env create --name ft-env --resource-group ft-group --location brazilsouth

# 4. Deploy
az containerapp create --name fretetrack \
  --resource-group ft-group --image mcr.microsoft.com/azure-app/nodejs:18-lts \
  --environment ft-env --target-port 3000 \
  --env-vars DATABASE_URL="..." AUTH_SECRET="..."

# Notas Azure:
# - Free tier disponivel para Container Apps
   - Flex Subscription = free containers 180h/mes
   - App Service Plan B1 gratis
   - PostgreSQL B1ms = gratuito (5GB)
- Front Door ou Application Gateway para SSL
- CDN para assets estaticos (Azure Front Door)
```

---

## 📱 Aplicativos Mobile (Planejamento)

### Visao geral do roadmap mobile:

```
Phase 1 (Web PWA - ja disponivel agora!)
  ├─ PWABuilder manifest (web.app manifest) 
  ├─ Service Worker para cache offline
  └─ App-like experience no navegador

Phase 2: React Native (Q1 2025)
  ├─ Expo SDK v50+
  ├─ Screens: Auth | Busca | Frete Detail | Chat | Painel | Profile
  ├─ Push Notifications (via Firebase / OneSignal)
  ├─ Biometria (FaceID / TouchID)
  ├─ Background location tracking (GPS real)
  ├─ Camera integration (document upload CNH/RNTC)
  ├─ Deep linking (abrir freite via link)
  └─ Plataformas: iOS + Android (via EAS Build)

Phase 3: Features Nativas
  ├─ Geofencing (alertas de cargo proxima)
  ├─ Widgets iOS/Android (novos fretes no home screen)
  ├─ Apple Watch (notificacoes de proposta aceita)
  ├─ Siri Shortcuts ("Meus fretes hoje")
  ├─ Google Maps SDK (rota em tempo real)
  └─ Bluetooth para conectar dispositivos OBD-II do caminhao
```

### Estrutura planejada do app React Native:
```
mobile/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── freight/
│   │   ├── SearchScreen.tsx
│   │   ├── FreightDetailScreen.tsx
│   │   ├── PublishFreightScreen.tsx
│   │   └── AuctionBidScreen.tsx
│   ├── chat/
│   │   ├── ConversationListScreen.tsx
│   │   └── ChatRoomScreen.tsx
│   ├── dashboard/
│   │   └── DashboardScreen.tsx
│   ├── tracking/
│   │   └── TrackingMapScreen.tsx
│   └── profile/
│       ├── ProfileScreen.tsx
│       ├── DocumentsScreen.tsx
│       └── WalletScreen.tsx
├── components/
│   ├── FreightCard.tsx
│   ├── MessageBubble.tsx
│   ├── StarRating.tsx
│   └── SkeletonLoading.tsx
├── services/
│   ├── api.ts                    # Axios client (mesmos endpoints web)
│   ├── auth.ts                   # Token storage via SecureStore/Keychain
│   ├── notifications.ts           # Firebase/OneSignal
│   └── gps.ts                   # Location updates to backend
├── hooks/
│   ├── useAuth.ts
│   ├── useFreights.ts
│   ├── useMessages.ts
│   └── useLocation.ts
└── navigation/
    ├── RootNavigator.tsx (Tab Navigator)
    ├── AuthNavigator.tsx (Stack)
    └── ModalNavigators.tsx
```

---

## 📡 API Reference (Principais endpoints)

### Autenticacao
```
POST   /api/auth/register    -> { user } (201)  Cria conta motorista/embarcador
POST   /api/auth/login        -> { user }       Login com email/senha
POST   /api/auth/logout       -> { ok }
GET    /api/auth/me            -> { user | null }
```

### Fretes
```
GET    /api/freights           -> { freights[] }      Lista com filtros (originState, destState, vehicle, body, q, mine)
POST   /api/freights           -> { freight } (201)   Publicar novo frete
PATCH  /api/freights/:id       -> { freight }         Fechar/reabrir/alterar
DELETE /api/freights/:id      -> { ok }
```

### Propostas
```
GET    /api/proposals           -> { proposals[] }     Minhas propostas enviadas
GET    /api/proposals?received=1 -> { proposals[] }  Recebidas nos MEUS fretes
GET    /api/proposals?freightId=N -> { proposal }     Ja enviei nesse frete?
POST   /api/proposals           -> { proposal } (201) Enviar proposta
PATCH  /api/proposals/:id       -> { proposal }        Aceitar/recusar (fechar frete auto)
DELETE /api/proposals/:id      -> { ok }              Cancelar minha proposta
```

### Chat
```
GET    /api/messages            -> { conversations[] }  Conversas recentes
GET    /api/messages?with=U     -> { messages[] }      Mensagens com usuario U
POST   /api/messages            -> { message } (201)   Enviar mensagem (cria notif pro destinatario)
```

### Demais endpoints principais:
```
GET    /api/wallet              -> { credits, transactions[] }
POST   /api/wallet              -> { credits }           Debitar (destacar/comprar seguro)

GET    /api/referral            -> { code, link, referrals[], stats }
POST   /api/referral            -> { code }               Gerar novo code

GET    /api/tracking/:id        -> { position, progress, ETA, speed }
GET    /api/stats                -> { routeStats[], byOrigin[], byDest[] }

GET    /api/profile/:id          -> { user, stats, badges, level, reviews }

GET/POST /api/documents        -> Listar/enviar CNH/RNTC/CRVL
PATCH  /api/admin/documents/:id -> Aprovar/rejeitar (Admin)
GET    /api/admin               -> Dashboard admin (stats, users, pendingDocs)
PATCH  /api/admin/users/:id/role -> Alterar role/credits/verified

GET/POST /api/favorites         -> Toggle favorito
GET/POST /api/alerts             -> CRUD alertas de rota
GET/POST /api/reviews             -> Avaliacoes
GET/PATCH /api/notifications     -> Listar/marcar lidas/contar
```

### Rate Limiting (para producao)
Configurar no Nginx:
- `/api/*`: 30 req/s burst 50 (rate limiting basico)
- Endpoint de login: 5 req/min
- Document upload: 10 req/hora
- Chat messages: 60 req/min por usuario

---

## 🔒 Seguranca

### Implementada:
- ✅ **Senha hashada** com scrypt + salt aleatorio (128 bits)
- ✅ **Sessoes HMAC-SHA256 assinadas** com chave secreta configuravel
- ✅ **Autenticacao obrigatoria** em todas as APIs sensiveis
- ✅ **Owner check** — usuarios so podem modificar SEUS proprios recursos
- ✅ **Sanitizacao** de inputs (trim, lowercase email, validacao de enums)
- ✅ **SQL Injection prevention** — Drizzle ORM parametrizado (nunca string interpolation em queries)
- ✅ **XSS protection** — Next.js escape automático + CSP headers (adicionar em producao)

### Recomendacoes para producao:
- 🔲 Helmet.js para cabecalhos de seguranca HTTP (CSP, HSTS, X-Frame-Options, etc.)
- 🔲 CSRF tokens para forms nao-JS (se necessario)
- 🔲 Rate limiting (Nginx layer ou express-rate-limit middleware)
- 🔲 WAF (Cloudflare免费版, AWS WAF, ModSecurity)
- 🔲 Rotation de AUTH_SECRET periodicamente
- 🔲 Auditoria log de acessos criticos
- 🔲 Vulnerability scanning (Trivy, Snyk) no pipeline CI/CD
- 🔲 Backup diario automatizado do PostgreSQL (pg_dump ou WAL-E)
- 🔲 Failover multi-AZ para banco
- 🔲 SSL/TLS 1.3+ (TLS 1.0/1.1 desabilitados)
- 🔲 Content Security Policy stricto
- 🔲 Enforce HTTPS com redirecionamento HSTS

---

## 🤝 Contribuindo

1. Fork o repositorio
2. Create branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m "Add nova funcionalidade"`
4. Push: `git push origin feature/nova-funcionalidade`
5. Open Pull Request

### Padroes de codigo:
- TypeScript strict mode obrigatorio
- Componentes client: prefixo "use" (useState/useEffect hooks ou "useClient")
- Components server: export async function padrao
- Nomear variaveis em portugues (schema, variaveis, comentarios)
- Interface responsiva: mobile-first, breakpoints Tailwind (sm/md/lg/xl)
- Dark mode: sempre usar classes dark: variant

### Testes futuros:
- Unit tests (Vitest + @testing-library/react)
- Integration tests (Playwright e2e)
- API tests (supertest)
- Performance benchmarks (Lighthouse CI)

---

## 📄 Licenca

MIT License — sinta-se livre para usar, modificar e distribuir este codigo.

Copyright (c) 2024 FreteTruck. Todos os direitos reservados.

---

<p align="center">
  Feito com ❤️ para os caminhoneiros e embarcadores brasileiros.
</p>

<p align="center">
  <strong>🚛 FreteTruck — Transportando o futuro dos fretes.</strong>
</p>
