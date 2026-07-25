# 🚛 FreteTruck — Documentação Técnica Completa

> Versão 1.0 | Última atualização: Janeiro 2025

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Banco de Dados](#4-banco-de-dados)
5. [Sistema de Autenticação](#5-sistema-de-autenticação)
6. [API Reference Completa](#6-api-reference-completa)
7. [Componentes Frontend](#7-componentes-frontend)
8. [Páginas da Aplicação](#8-páginas-da-aplicação)
9. [Fluxos de Negócio](#9-fluxos-de-negócio)
10. [Variáveis de Ambiente](#10-variáveis-de-ambiente)
11. [Instalação e Desenvolvimento](#11-instalação-e-desenvolvimento)
12. [Deploy em Produção](#12-deploy-em-produção)
13. [Segurança](#13-segurança)
14. [Performance e Escalabilidade](#14-performance-e-escalabilidade)
15. [Roadmap Mobile](#15-roadmap-mobile)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Visão Geral da Arquitetura

O FreteTruck é uma aplicação **fullstack monolítica** construída com Next.js 16 (App Router), que serve tanto o frontend React quanto a API REST no mesmo processo Node.js.

```
┌────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                │
│  React 19 + Tailwind CSS 4 + Dark Mode            │
│  SSR (Server Components) + CSR (Client Components) │
└─────────────────────┬──────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼──────────────────────────────┐
│              NEXT.JS 16 (App Router)               │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ Server       │  │ API Routes                 │  │
│  │ Components   │  │ /api/auth/*                │  │
│  │ (SSR pages)  │  │ /api/freights/*            │  │
│  │              │  │ /api/proposals/*           │  │
│  │ Client       │  │ /api/messages/*            │  │
│  │ Components   │  │ /api/community/*           │  │
│  │ (CSR interac)│  │ /api/admin/*  + 20 mais    │  │
│  └──────────────┘  └─────────────┬──────────────┘  │
│                                  │                 │
│  ┌───────────────────────────────▼──────────────┐  │
│  │           Drizzle ORM (Type-safe)            │  │
│  │  Schema: 16 tabelas, 146 colunas totais      │  │
│  └───────────────────────────────┬──────────────┘  │
└──────────────────────────────────┼──────────────────┘
                                   │ TCP :5432
┌──────────────────────────────────▼──────────────────┐
│               PostgreSQL 16                         │
│  Banco: app_db                                      │
│  16 tabelas com foreign keys e constraints          │
└─────────────────────────────────────────────────────┘
```

### Padrões de Comunicação

| Tipo | Descrição |
|------|-----------|
| **SSR** | Páginas como `/`, `/fretes`, `/fretes/[id]` são Server Components — fazem queries diretas no banco via Drizzle |
| **CSR + API** | Páginas como `/chat`, `/painel`, `/calculadora` são Client Components que fazem `fetch()` para as API Routes |
| **Polling** | Chat (5s), Notificações (15s), Rastreamento (10s) usam `setInterval` no client |

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão | Motivo |
|--------|------------|--------|--------|
| Runtime | Node.js | 20+ | LTS, performance |
| Framework | Next.js | 16.2.6 | App Router, SSR+CSR, API Routes |
| UI | React | 19.2.6 | Server Components, Hooks |
| Linguagem | TypeScript | 5.9.3 | Type safety em todo o codebase |
| CSS | Tailwind CSS | 4.1.17 | Utility-first, dark mode custom variant |
| ORM | Drizzle ORM | 0.45.2 | Type-safe queries, zero overhead |
| DB | PostgreSQL | 16 | ACID, JSON, full-text search |
| Gráficos | Recharts | latest | Barras, linhas, pizza no Analytics |
| Build | Turbopack | integrado | Fast builds no Next.js 16 |

### Dependências de Produção
```
next, react, react-dom, drizzle-orm, pg, dotenv, recharts
```

### Dependências de Desenvolvimento
```
typescript, @types/*, tailwindcss, @tailwindcss/postcss,
postcss, eslint, eslint-config-next, drizzle-kit
```

---

## 3. Estrutura de Diretórios

```
fretetruck/
├── public/
│   ├── images/
│   │   └── hero.jpg                 # Hero background (AI generated)
│   └── uploads/                     # Document uploads (runtime)
│
├── scripts/
│   └── seed.mjs                     # Script de dados demo
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Layout raiz (Header + Footer + dark mode)
│   │   ├── globals.css              # Tailwind + dark mode custom variant
│   │   ├── page.tsx                 # Home (SSR)
│   │   │
│   │   ├── api/                     # 32 arquivos de API Route
│   │   │   ├── health/route.ts      # GET healthcheck
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts  # POST cadastro + referral
│   │   │   │   ├── login/route.ts     # POST login
│   │   │   │   ├── logout/route.ts    # POST logout
│   │   │   │   └── me/route.ts        # GET sessão atual
│   │   │   ├── freights/
│   │   │   │   ├── route.ts           # GET lista + POST criar (leilão/featured/wallet)
│   │   │   │   └── [id]/route.ts      # GET detalhe + PATCH + DELETE
│   │   │   ├── proposals/
│   │   │   │   ├── route.ts           # GET lista + POST criar (+ notificação)
│   │   │   │   └── [id]/route.ts      # PATCH aceitar/recusar (+ auto-close) + DELETE
│   │   │   ├── messages/route.ts      # GET conversas/msgs + POST enviar (+ notif)
│   │   │   ├── notifications/route.ts # GET lista/count + PATCH marcar lido
│   │   │   ├── favorites/route.ts     # GET lista/ids + POST toggle
│   │   │   ├── alerts/route.ts        # GET + POST + DELETE
│   │   │   ├── reviews/route.ts       # GET stats + POST (com sub-métricas)
│   │   │   ├── wallet/route.ts        # GET saldo + POST débito/crédito
│   │   │   ├── referral/route.ts      # GET info + POST gerar código
│   │   │   ├── documents/route.ts     # GET meus docs + POST upload (base64→disk)
│   │   │   ├── tracking/[id]/route.ts # GET posição GPS simulada
│   │   │   ├── ai-price/route.ts      # GET recomendação de preço IA
│   │   │   ├── analytics/route.ts     # GET dashboard métricas
│   │   │   ├── rankings/route.ts      # GET leaderboard
│   │   │   ├── stats/route.ts         # GET estatísticas globais
│   │   │   ├── insurance/route.ts     # GET cotações + POST calcular
│   │   │   ├── community/
│   │   │   │   ├── route.ts           # GET posts + POST criar
│   │   │   │   └── like/route.ts      # POST toggle like
│   │   │   ├── fleet/
│   │   │   │   ├── route.ts           # GET frotas + POST criar
│   │   │   │   └── drivers/route.ts   # POST add + DELETE remove + PATCH status
│   │   │   ├── profile/[id]/route.ts  # GET perfil público + badges + nível
│   │   │   └── admin/
│   │   │       ├── route.ts           # GET dashboard stats
│   │   │       ├── documents/
│   │   │       │   ├── route.ts       # GET docs pendentes
│   │   │       │   └── [id]/route.ts  # PATCH aprovar/rejeitar
│   │   │       └── users/[id]/role/route.ts  # PATCH role/credits/verified
│   │   │
│   │   ├── fretes/
│   │   │   ├── page.tsx               # Busca com 7 filtros (SSR)
│   │   │   └── [id]/page.tsx          # Detalhe + retorno + similares (SSR)
│   │   ├── publicar/page.tsx          # Formulário (CSR) com leilão + destaque
│   │   ├── cadastro/
│   │   │   ├── page.tsx               # Wrapper Suspense
│   │   │   └── CadastroContent.tsx    # Formulário com ?ref= support
│   │   ├── entrar/page.tsx            # Login (CSR)
│   │   ├── painel/page.tsx            # Dashboard 5 abas (CSR)
│   │   ├── chat/
│   │   │   ├── page.tsx               # Wrapper Suspense
│   │   │   └── ChatContent.tsx        # Chat com polling (CSR)
│   │   ├── perfil/[id]/page.tsx       # Perfil público (CSR)
│   │   ├── mapa/page.tsx              # Mapa SVG interativo (CSR)
│   │   ├── precos/page.tsx            # Tabela de preços por rota (CSR)
│   │   ├── calculadora/page.tsx       # Calculadora de frete (CSR)
│   │   ├── ia/page.tsx                # IA de precificação (CSR)
│   │   ├── analytics/page.tsx         # Dashboard com Recharts (CSR)
│   │   ├── rankings/page.tsx          # Leaderboard (CSR)
│   │   ├── comunidade/page.tsx        # Mural comunitário (CSR)
│   │   ├── documentos/page.tsx        # Upload documentos (CSR)
│   │   ├── carteira/page.tsx          # Carteira de créditos (CSR)
│   │   ├── convite/page.tsx           # Programa de convites (CSR)
│   │   ├── seguro/page.tsx            # Cotação de seguro (CSR)
│   │   ├── frota/page.tsx             # Gestão de frota (CSR)
│   │   ├── rastrear/[id]/page.tsx     # Rastreamento GPS (CSR)
│   │   ├── admin/page.tsx             # Painel admin (CSR)
│   │   ├── ajuda/page.tsx             # FAQ + ajuda (SSR)
│   │   └── sobre/page.tsx             # Sobre o projeto (SSR)
│   │
│   ├── components/
│   │   ├── Header.tsx                 # Navbar global + dark mode + notificações + mobile menu
│   │   ├── FreightCard.tsx            # Card de frete com R$/km, badges, dark mode
│   │   ├── FreightActions.tsx         # Proposta + favorito + avaliação detalhada
│   │   └── ShareButton.tsx            # Compartilhar/copiar link (navigator.share)
│   │
│   ├── db/
│   │   ├── schema.ts                  # 16 tabelas Drizzle (282 linhas)
│   │   └── index.ts                   # Pool PostgreSQL singleton
│   │
│   └── lib/
│       ├── auth.ts                    # Hash scrypt + sessões HMAC-SHA256
│       └── constants.ts               # UFs, veículos, carrocerias, formatters
│
├── Dockerfile                         # Multi-stage build Alpine
├── docker-compose.yml                 # App + PostgreSQL
├── nginx.conf                         # Reverse proxy + SSL + rate limiting
├── drizzle.config.json                # Config do Drizzle Kit
├── tsconfig.json                      # TypeScript strict
├── package.json                       # Dependencies
└── .env                               # DATABASE_URL
```

**Métricas do codebase:**
- **6.829 linhas** de código TypeScript/TSX
- **25 páginas** frontend
- **32 arquivos** de API Route
- **4 componentes** compartilhados
- **16 tabelas** no banco (146 colunas totais)
- **0 erros** TypeScript (strict mode)

---

## 4. Banco de Dados

### 4.1 Diagrama de Entidade-Relacionamento

```
users (20 cols)
├── 1:N → freights (30 cols)
│         ├── 1:N → proposals (7 cols)
│         ├── 1:N → favorites (4 cols)
│         └── 1:N → insurance_quotes (8 cols)
├── 1:N → proposals (como driver)
├── 1:N → messages (como sender/receiver)
├── 1:N → notifications (8 cols)
├── 1:N → reviews (9 cols) (como rated/author)
├── 1:N → alerts (6 cols)
├── 1:N → documents (10 cols)
├── 1:N → transactions (7 cols)
├── 1:N → referrals (7 cols) (como inviter/invited)
├── 1:N → posts (9 cols)
├── 1:N → post_likes (4 cols)
├── 1:N → fleets (4 cols)
└── 1:N → fleet_drivers (7 cols)
```

### 4.2 Esquema Detalhado de Cada Tabela

#### `users` — Usuários (20 colunas)
| Coluna | Tipo | Null? | Descrição |
|--------|------|-------|-----------|
| `id` | serial PK | NO | ID auto-incremento |
| `name` | varchar(120) | NO | Nome completo |
| `email` | varchar(160) UNIQUE | NO | Email (lowercase) |
| `password_hash` | text | NO | Hash scrypt (salt:hash) |
| `phone` | varchar(20) | NO | WhatsApp (apenas dígitos) |
| `role` | varchar(20) | NO | `motorista`, `embarcador` ou `admin` |
| `company` | varchar(160) | YES | Empresa/transportadora |
| `city` | varchar(120) | YES | Cidade |
| `state` | varchar(2) | YES | UF |
| `vehicle_type` | varchar(40) | YES | Tipo de caminhão (motorista) |
| `body_type` | varchar(40) | YES | Tipo de carroceria (motorista) |
| `plate_number` | varchar(15) | YES | Placa do veículo |
| `avatar_url` | varchar(300) | YES | URL do avatar |
| `bio` | varchar(500) | YES | Biografia |
| `credits` | numeric(12,2) | YES | Saldo de créditos (R$) |
| `verified` | boolean | YES | Conta verificada? |
| `referral_code` | varchar(12) UNIQUE | YES | Código de convite |
| `referred_by` | integer | YES | ID de quem convidou |
| `invited_count` | integer | YES | Quantos convidou |
| `created_at` | timestamp | NO | Data de cadastro |

#### `freights` — Fretes (30 colunas)
| Coluna | Tipo | Null? | Descrição |
|--------|------|-------|-----------|
| `id` | serial PK | NO | ID |
| `user_id` | integer FK→users | NO | Quem publicou |
| `cargo_type` | varchar(120) | NO | Tipo de carga |
| `description` | text | YES | Observações |
| `origin_city` | varchar(120) | NO | Cidade origem |
| `origin_state` | varchar(2) | NO | UF origem |
| `dest_city` | varchar(120) | NO | Cidade destino |
| `dest_state` | varchar(2) | NO | UF destino |
| `distance_km` | integer | YES | Distância em km |
| `weight_kg` | integer | NO | Peso em kg |
| `price` | numeric(12,2) | YES | Valor (null = a combinar) |
| `price_type` | varchar(20) | NO | `total`, `tonelada` ou `combinar` |
| `vehicle_types` | text | NO | CSV de tipos de caminhão aceitos |
| `body_types` | text | NO | CSV de carrocerias aceitas |
| `needs_tracker` | boolean | NO | Exige rastreador? |
| `needs_tarp` | boolean | NO | Exige lona? |
| `toll` | boolean | NO | Pedágio incluso? |
| `load_date` | varchar(20) | YES | Data de carregamento |
| `contact_name` | varchar(120) | NO | Nome do contato |
| `contact_phone` | varchar(20) | NO | WhatsApp do contato |
| `status` | varchar(20) | YES | `ativo`, `fechado` ou `cancelado` |
| `views` | integer | NO | Contador de visualizações |
| `is_auction` | boolean | YES | É leilão reverso? |
| `min_price` | numeric(12,2) | YES | Preço mínimo (leilão) |
| `auction_ends_at` | timestamp | YES | Fim do leilão |
| `featured` | boolean | YES | Destacado (pago)? |
| `insurance_quote` | jsonb | YES | Cotação de seguro |
| `tracking_data` | jsonb | YES | Dados GPS |
| `tracking_active` | boolean | YES | Rastreamento ativo? |
| `created_at` | timestamp | NO | Data de publicação |

#### `proposals` — Propostas/Lances (7 colunas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | serial PK | ID |
| `freight_id` | FK→freights | Frete alvo |
| `driver_id` | FK→users | Motorista que propôs |
| `amount` | numeric(12,2) | Valor proposto (null = a combinar) |
| `message` | text | Mensagem do motorista |
| `status` | varchar(20) | `pendente`, `aceita` ou `recusada` |
| `created_at` | timestamp | Data |

#### `messages` — Chat (7 colunas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | serial PK | ID |
| `sender_id` | FK→users | Quem enviou |
| `receiver_id` | FK→users | Quem recebe |
| `freight_id` | FK→freights | Frete relacionado (opcional) |
| `content` | text | Conteúdo da mensagem |
| `read` | boolean | Lida? |
| `created_at` | timestamp | Data |

#### `reviews` — Avaliações (9 colunas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | serial PK | ID |
| `rated_user_id` | FK→users | Quem está sendo avaliado |
| `author_id` | FK→users | Quem avalia |
| `rating` | integer | Nota geral (1-5) |
| `comment` | text | Comentário |
| `punctuality` | integer | Nota pontualidade (1-5) |
| `communication` | integer | Nota comunicação (1-5) |
| `payment_speed` | integer | Nota velocidade pagamento (1-5) |
| `created_at` | timestamp | Data |

#### `documents` — Documentos (10 colunas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | serial PK | ID |
| `user_id` | FK→users | Dono do doc |
| `doc_type` | varchar(30) | `cnh`, `rntc`, `crvl` ou `cltm` |
| `file_url` | varchar(300) | Path do arquivo salvo |
| `status` | varchar(20) | `pendente`, `aprovado` ou `rejeitado` |
| `review_comment` | text | Motivo da rejeição |
| `reviewed_by` | integer | Admin que revisou |
| `reviewed_at` | timestamp | Data da revisão |
| `expires_at` | timestamp | Validade do documento |
| `created_at` | timestamp | Data do upload |

#### `transactions` — Transações de créditos (7 colunas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | serial PK | ID |
| `user_id` | FK→users | Usuário |
| `amount` | numeric(12,2) | Valor (+crédito / -débito) |
| `type` | varchar(40) | `referral_bonus`, `featured`, `insurance`, `purchase`, `admin_grant`, `refund` |
| `description` | varchar(200) | Descrição legível |
| `ref_id` | integer | ID de referência (ex: freight_id) |
| `created_at` | timestamp | Data |

#### Tabelas auxiliares (resumo)

| Tabela | Colunas | Descrição |
|--------|---------|-----------|
| `favorites` | 4 | user_id + freight_id (toggle) |
| `alerts` | 6 | user_id + origin_state + dest_state + vehicle_type |
| `notifications` | 8 | user_id + type + title + body + link + read |
| `referrals` | 7 | inviter_id + invited_id + status + bonus_amount |
| `posts` | 9 | Mural comunitário (título, conteúdo, categoria, likes) |
| `post_likes` | 4 | user_id + post_id |
| `fleets` | 4 | owner_id + name |
| `fleet_drivers` | 7 | fleet_id + driver_id + plate + vehicle + status |
| `insurance_quotes` | 8 | freight_id + user_id + cargo_value + premium + coverage |

---

## 5. Sistema de Autenticação

### 5.1 Hash de Senha

```
Algoritmo: scrypt (Node.js crypto.scryptSync)
Salt: 16 bytes aleatórios (crypto.randomBytes)
Key length: 64 bytes
Formato armazenado: "{salt_hex}:{hash_hex}"
```

### 5.2 Sessões

```
Tipo: Cookie HTTP-only assinado com HMAC-SHA256
Nome: "ft_session"
Payload: "{userId}.{timestamp}"
Assinatura: HMAC-SHA256(payload, AUTH_SECRET)
Token final: "{userId}.{timestamp}.{signature}"
Max-Age: 30 dias
SameSite: Lax
```

### 5.3 Fluxo de Autenticação

```
1. POST /api/auth/register
   → Valida campos obrigatórios
   → Verifica email único
   → Hash senha com scrypt
   → Insere no banco
   → Processa referral code (se houver)
   → Set-Cookie: ft_session={token}
   → Response: { user }

2. POST /api/auth/login
   → Busca por email
   → Verifica senha com timingSafeEqual
   → Set-Cookie: ft_session={token}
   → Response: { user }

3. GET /api/auth/me
   → Lê cookie ft_session
   → Valida assinatura HMAC
   → Busca user no banco
   → Response: { user } ou { user: null }

4. POST /api/auth/logout
   → Deleta cookie ft_session
   → Response: { ok: true }
```

### 5.4 Autorização

Cada API protegida chama `getCurrentUser()` que:
1. Lê o cookie `ft_session`
2. Valida a assinatura HMAC
3. Busca o usuário no banco
4. Retorna `null` se inválido

Verificações de ownership:
- Fretes: `freight.userId === user.id`
- Propostas: `proposal.driverId === user.id` (motorista) ou `freight.userId === user.id` (embarcador)
- Admin: `user.role === "admin"`

---

## 6. API Reference Completa

### 6.1 Autenticação

#### `POST /api/auth/register`
Cria uma nova conta de usuário.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "phone": "65999990001",
  "role": "motorista",
  "company": null,
  "city": "Cuiabá",
  "state": "MT",
  "vehicleType": "Carreta",
  "bodyType": "Graneleiro",
  "refCode": "247C0056"
}
```

**Resposta 201:**
```json
{
  "user": { "id": 5, "name": "João Silva", "email": "joao@email.com", "role": "motorista" }
}
```

**Fluxo de referral (se `refCode` fornecido):**
1. Busca convidante por `referral_code`
2. Cria registro em `referrals` (status: confirmed)
3. Credita R$25 para convidante + novo usuário
4. Cria transação `referral_bonus` para ambos
5. Envia notificação ao convidante

#### `POST /api/auth/login`
**Body:** `{ "email": "...", "password": "..." }`
**Resposta 200:** `{ "user": { ... } }`
**Resposta 401:** `{ "error": "E-mail ou senha incorretos." }`

#### `GET /api/auth/me`
**Resposta:** `{ "user": { id, name, email, role, phone, company, city, state, verified, credits } }` ou `{ "user": null }`

#### `POST /api/auth/logout`
**Resposta:** `{ "ok": true }`

---

### 6.2 Fretes

#### `GET /api/freights`
Lista fretes com filtros. Resultados ordenados por `featured DESC, created_at DESC`.

**Query params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `originState` | string | Filtrar por UF origem |
| `originCity` | string | Filtrar por cidade origem (ILIKE) |
| `destState` | string | Filtrar por UF destino |
| `destCity` | string | Filtrar por cidade destino (ILIKE) |
| `vehicle` | string | Filtrar por tipo de caminhão (ILIKE) |
| `body` | string | Filtrar por carroceria (ILIKE) |
| `q` | string | Busca livre (cargo, origem ou destino) |
| `mine` | `1` | Retorna apenas meus fretes (requer auth) |

**Resposta:** `{ "freights": [{ freight, ownerName, ownerCompany }] }`

#### `POST /api/freights`
Publica um novo frete. Requer autenticação.

**Body:**
```json
{
  "cargoType": "Grãos",
  "originCity": "Sorriso", "originState": "MT",
  "destCity": "Santos", "destState": "SP",
  "distanceKm": 1980, "weightKg": 37000,
  "price": "9500", "priceType": "total",
  "vehicleTypes": ["Carreta", "Bitrem"],
  "bodyTypes": ["Graneleiro"],
  "needsTracker": true, "needsTarp": true, "toll": true,
  "loadDate": "2025-02-15",
  "contactName": "João", "contactPhone": "65999990001",
  "isAuction": false,
  "minPrice": null,
  "featured": true
}
```

**Se `featured=true`:** debita 15 créditos automaticamente. Retorna erro 402 se saldo insuficiente.

**Se `isAuction=true`:** salva como leilão reverso. `price` é ignorado, `minPrice` é o piso.

#### `GET /api/freights/:id`
Retorna detalhes do frete e incrementa `views`.

#### `PATCH /api/freights/:id`
Atualiza status, preço ou descrição. Requer ser o dono.

**Body:** `{ "status": "fechado" }` ou `{ "price": "10000" }`

#### `DELETE /api/freights/:id`
Exclui o frete. Requer ser o dono.

---

### 6.3 Propostas

#### `GET /api/proposals`
| Param | Descrição |
|-------|-----------|
| (nenhum) | Minhas propostas enviadas |
| `received=1` | Propostas recebidas nos MEUS fretes |
| `freightId=N` | Já enviei proposta neste frete? |

#### `POST /api/proposals`
**Body:** `{ "freightId": 1, "amount": "9200", "message": "Tenho carreta disponível" }`

**Validações:**
- Não pode ser no próprio frete
- Frete deve estar ativo
- Máximo 1 proposta por motorista por frete
- Gera notificação para o embarcador

#### `PATCH /api/proposals/:id`
Aceitar ou recusar. Requer ser dono do frete.

**Body:** `{ "status": "aceita" }` ou `{ "status": "recusada" }`

**Se aceita:**
1. Frete fecha automaticamente (`status: "fechado"`)
2. Outras propostas pendentes são recusadas
3. Notificação enviada ao motorista

#### `DELETE /api/proposals/:id`
Cancela proposta. Requer ser o motorista que criou.

---

### 6.4 Chat

#### `GET /api/messages`
| Param | Descrição |
|-------|-----------|
| (nenhum) | Lista de conversas (últimas msgs com cada pessoa) |
| `with=userId` | Mensagens com usuário específico (marca como lidas) |

#### `POST /api/messages`
**Body:** `{ "receiverId": 4, "content": "Olá!" }`
Gera notificação para o destinatário.

---

### 6.5 Notificações

#### `GET /api/notifications`
| Param | Descrição |
|-------|-----------|
| (nenhum) | Lista últimas 30 notificações |
| `count=1` | Retorna apenas contagem de não lidas |

#### `PATCH /api/notifications`
**Body:** `{ "readAll": true }` — marca tudo como lido
**Body:** `{ "id": 5 }` — marca uma específica

---

### 6.6 Favoritos e Alertas

#### `GET/POST /api/favorites`
- `GET ?ids=1` → retorna array de freight_ids favoritados
- `GET` → retorna fretes favoritados com detalhes
- `POST { "freightId": 1 }` → toggle (add/remove)

#### `GET/POST/DELETE /api/alerts`
- `GET` → meus alertas
- `POST { "originState": "MT", "destState": "SP", "vehicleType": "Carreta" }` → criar
- `DELETE ?id=1` → excluir

---

### 6.7 Avaliações

#### `GET /api/reviews?userId=1`
**Resposta:**
```json
{
  "reviews": [{ "review": { rating, punctuality, communication, paymentSpeed, comment, ... }, "authorName": "..." }],
  "avgRating": 4.5,
  "total": 3
}
```

#### `POST /api/reviews`
**Body:**
```json
{
  "ratedUserId": 1,
  "rating": 5,
  "punctuality": 5,
  "communication": 4,
  "paymentSpeed": 5,
  "comment": "Excelente embarcador!"
}
```
Se já avaliou o mesmo usuário, atualiza em vez de duplicar.

---

### 6.8 IA de Precificação

#### `GET /api/ai-price`

| Param | Descrição |
|-------|-----------|
| `originState` | UF origem (obrigatório) |
| `destState` | UF destino (obrigatório) |
| `cargoType` | Tipo de carga |
| `distanceKm` | Distância |
| `weightKg` | Peso |
| `vehicleType` | Tipo de caminhão |

**Resposta:**
```json
{
  "suggestedPrice": 9500,
  "floorPrice": 7600,
  "ceilingPrice": 11400,
  "avgMarketPrice": 9200,
  "perKm": "4.80",
  "confidence": "alta",
  "sampleSize": 12,
  "minMarket": 2100,
  "maxMarket": 14500,
  "factors": [
    { "label": "Rota longa", "impact": "-8% R$/km (economia de escala)", "icon": "🛣️" }
  ],
  "recommendation": "Valor dentro da faixa de mercado!"
}
```

**Algoritmo de cálculo:**
1. Consulta fretes similares no banco (mesma rota/carga/veículo)
2. Calcula média, min e max de preço
3. Ajusta por fatores:
   - **Distância**: rotas curtas +15%/km, longas -8%/km
   - **Peso**: pesado +10%, leve -15%
   - **Sazonalidade**: safra +5-15%, feriados -8%
4. Define confiança: alta (10+ fretes), média (5+), baixa (<5)

---

### 6.9 Demais endpoints

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `GET /api/wallet` | GET | Saldo + últimas 30 transações |
| `POST /api/wallet` | POST | Débito (featured/insurance) ou crédito |
| `GET /api/referral` | GET | Código, link, lista de convidados, total bônus |
| `POST /api/referral` | POST | Gerar novo código de convite |
| `GET /api/documents` | GET | Meus documentos + status verificado |
| `POST /api/documents` | POST | Upload de documento (base64 ou simulado) |
| `GET /api/tracking/:id` | GET | Posição GPS simulada (interpolação lat/lng) |
| `GET /api/analytics` | GET | Métricas do usuário (fretes/dia, views, rotas, propostas) |
| `GET /api/rankings` | GET | Top embarcadores, motoristas e avaliados |
| `GET /api/stats` | GET | Estatísticas globais (preço médio por rota, fretes por estado) |
| `GET/POST /api/insurance` | GET/POST | Cotações de seguro (cálculo: valor_carga × taxa × distância) |
| `GET/POST /api/community` | GET/POST | Posts do mural (filtro por categoria) |
| `POST /api/community/like` | POST | Toggle like em post |
| `GET/POST /api/fleet` | GET/POST | Frotas (listar/criar) |
| `POST/DELETE/PATCH /api/fleet/drivers` | POST/DELETE/PATCH | Adicionar/remover/atualizar motoristas da frota |
| `GET /api/profile/:id` | GET | Perfil público (stats, badges, nível, fretes, reviews) |
| `GET /api/admin` | GET | Dashboard admin (10 métricas + lista usuários) |
| `GET /api/admin/documents` | GET | Docs pendentes para aprovação |
| `PATCH /api/admin/documents/:id` | PATCH | Aprovar/rejeitar documento |
| `PATCH /api/admin/users/:id/role` | PATCH | Alterar role, créditos, verificação |
| `GET /api/health` | GET | Healthcheck |

---

## 7. Componentes Frontend

### 7.1 `Header.tsx`
Navbar global com:
- Logo + navegação desktop (ícones) + mobile (hamburger)
- Toggle dark mode (☀️/🌙) com localStorage
- Sino de notificações 🔔 com badge de não lidas + dropdown
- Polling automático (15s) para contagem
- Menu mobile responsivo com todas as seções
- Sessão do usuário (Olá, nome + Sair)

### 7.2 `FreightCard.tsx`
Card de frete reutilizável:
- Rota (origem → destino)
- Preço + R$/km com indicador de qualidade (🟢🟡🔴)
- Tags: peso, distância, veículos, rastreador
- Publicador + views
- Dark mode completo

### 7.3 `FreightActions.tsx`
Painel interativo na página de detalhe:
- Toggle favorito (❤️)
- Formulário de proposta online (valor + mensagem)
- Status da proposta (⏳/✅/❌)
- Sistema de avaliações com 4 métricas:
  - ⭐ Geral (obrigatório)
  - ⏱ Pontualidade
  - 💬 Comunicação
  - 💰 Velocidade de pagamento
- Listagem de reviews existentes

### 7.4 `ShareButton.tsx`
- `navigator.share()` no mobile
- `navigator.clipboard.writeText()` no desktop
- Feedback "✅ Link copiado!" por 2.5s

---

## 8. Páginas da Aplicação

### Páginas Públicas (sem login)
| Página | URL | Tipo | Descrição |
|--------|-----|------|-----------|
| Home | `/` | SSR | Hero, busca rápida, stats, últimos fretes, features |
| Busca | `/fretes` | SSR | 7 filtros, cards, featured primeiro |
| Detalhe | `/fretes/[id]` | SSR | Tudo + proposta + retorno + similares + chat |
| Login | `/entrar` | CSR | Email + senha |
| Cadastro | `/cadastro` | CSR | Role picker + formulário + ?ref= |
| Calculadora | `/calculadora` | CSR | Diesel, pedágio, manutenção, lucro |
| Mapa | `/mapa` | CSR | SVG Brasil, bolhas por estado |
| Preços | `/precos` | CSR | Tabela R$/km por rota |
| Rankings | `/rankings` | CSR | Top embarcadores/motoristas/avaliados |
| IA Preço | `/ia` | CSR | Recomendação de preço inteligente |
| Comunidade | `/comunidade` | CSR | Mural de posts com likes |
| Sobre | `/sobre` | SSR | História, features, CTA |
| Ajuda | `/ajuda` | SSR | 8 FAQs + links |

### Páginas Autenticadas
| Página | URL | Descrição |
|--------|-----|-----------|
| Publicar | `/publicar` | Formulário com leilão + destaque |
| Painel | `/painel` | 5 abas: fretes, propostas, favoritos, alertas |
| Chat | `/chat` | Conversas + mensagens em tempo real |
| Perfil | `/perfil/[id]` | Público com badges, nível, stats |
| Analytics | `/analytics` | 4 gráficos Recharts |
| Documentos | `/documentos` | Upload CNH/RNTC/CRVL/CLTM |
| Carteira | `/carteira` | Saldo + histórico |
| Convites | `/convite` | Código + link + stats |
| Seguro | `/seguro` | Cotação 3 planos |
| Frota | `/frota` | Criar + add/remove motoristas |
| Rastrear | `/rastrear/[id]` | GPS simulado |

### Páginas Admin
| Página | URL | Descrição |
|--------|-----|-----------|
| Admin | `/admin` | Dashboard + docs pendentes + ações |

---

## 9. Fluxos de Negócio

### 9.1 Fluxo de Publicação de Frete
```
Embarcador acessa /publicar
  → Preenche formulário (rota, carga, valor, veículos)
  → Escolhe modo: Normal ou Leilão
  → [Opcional] Marca como Destacado (15 créditos)
  → POST /api/freights
    → Valida campos obrigatórios
    → Se featured: verifica saldo → debita 15 créditos → cria transação
    → Insere no banco com isAuction/minPrice/featured
  → Redireciona para /fretes/{id}
```

### 9.2 Fluxo de Proposta
```
Motorista vê frete em /fretes/{id}
  → Clica "Enviar proposta online"
  → Preenche valor + mensagem
  → POST /api/proposals
    → Verifica: não é dono, frete ativo, não duplicata
    → Insere proposta
    → Cria notificação para embarcador
  → Embarcador vê no /painel aba "Propostas recebidas"
    → Clica "Aceitar" ou "Recusar"
    → PATCH /api/proposals/{id}
      → Se aceita: frete fecha, outras rejeitadas, notificação ao motorista
      → Se recusada: notificação ao motorista
```

### 9.3 Fluxo de Convite
```
Usuário acessa /convite
  → Vê seu código + link
  → Compartilha via WhatsApp/Telegram/copiar
  → Amigo acessa /cadastro?ref=CODIGO
    → Banner verde: "🎁 Você foi convidado!"
    → Preenche cadastro normalmente
    → POST /api/auth/register com refCode
      → Busca convidante por código
      → Cria referral (confirmed)
      → Credita R$25 para AMBOS
      → Transações registradas
      → Notificação ao convidante
```

### 9.4 Fluxo de Verificação de Documentos
```
Motorista acessa /documentos
  → Clica "Enviar arquivo" no tipo desejado
  → Seleciona JPG/PNG/PDF (max 5MB)
  → POST /api/documents com base64
    → Decodifica, salva em public/uploads/
    → Cria registro (status: pendente)
  → Admin acessa /admin
    → Vê documentos pendentes
    → Clica ✅ (aprovar) ou ❌ (rejeitar)
    → PATCH /api/admin/documents/{id}
      → Se todos aprovados: user.verified = true
```

### 9.5 Fluxo de Gestão de Frota
```
Embarcador acessa /frota
  → Cria frota (nome)
  → Clica "+ Adicionar motorista"
  → Informa email + placa + veículo
    → POST /api/fleet/drivers
      → Verifica se email existe e é motorista
      → Verifica duplicata
      → Insere
  → Muda status do motorista (dropdown)
    → PATCH /api/fleet/drivers
  → Remove motorista
    → DELETE /api/fleet/drivers?id=N
```

---

## 10. Variáveis de Ambiente

| Variável | Obrigatória | Default | Descrição |
|----------|-------------|---------|-----------|
| `DATABASE_URL` | **Sim** | — | String de conexão PostgreSQL |
| `AUTH_SECRET` | Não | `frete-truck-dev-secret-2024` | Chave HMAC para sessões. **MUDAR EM PRODUÇÃO** |
| `NEXT_PUBLIC_APP_URL` | Não | — | URL base para links de convite |

**Arquivo `.env`:**
```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

---

## 11. Instalação e Desenvolvimento

### Pré-requisitos
- Node.js >= 20
- PostgreSQL >= 15

### Setup rápido
```bash
# 1. Clone
git clone <repo>
cd fretetruck

# 2. Instale dependências
npm install

# 3. Configure .env
cp .env.example .env
# Edite DATABASE_URL

# 4. Crie tabelas
npx drizzle-kit push --force

# 5. Popule com dados demo
node scripts/seed.mjs

# 6. Rode
npm run dev

# 7. Abra http://localhost:3000
```

### Com Docker
```bash
docker compose up -d --build
# App: http://localhost:3000
# DB: localhost:5432
```

### Comandos úteis
```bash
npm run dev          # Desenvolvimento (hot reload)
npm run build        # Build de produção
npm start            # Servidor de produção
npm run typecheck    # Verificar TypeScript
npx drizzle-kit push # Aplicar mudanças de schema
node scripts/seed.mjs # Popular dados demo
```

### Contas demo
| Perfil | Email | Senha | Role |
|--------|-------|-------|------|
| Admin/Embarcador | `demo@fretetruck.com.br` | `demo123` | admin |
| Embarcadora | `fernanda@grancargo.com.br` | `senha123` | embarcador |
| Transportadora | `roberto@sulfrete.com.br` | `senha123` | embarcador |
| Motorista | `marcos@gmail.com` | `senha123` | motorista |

---

## 12. Deploy em Produção

### Docker (Recomendado)
```bash
docker compose up -d --build
# Configurar nginx como reverse proxy (nginx.conf incluso)
# Obter SSL com certbot
```

### Vercel
```bash
vercel
# Variáveis de ambiente no dashboard
# Banco externo (Neon, Supabase)
```

### Railway
```bash
railway init && railway up
# Postgres add-on integrado
```

### Render
- Connect GitHub repo
- Build command: `npm run build`
- Start command: `npm start`
- PostgreSQL add-on

### AWS (ECS + RDS)
- Dockerfile → ECR → ECS Fargate
- RDS PostgreSQL (Multi-AZ em produção)
- ALB + ACM + Route53

### GCP (Cloud Run + Cloud SQL)
```bash
gcloud builds submit --tag ...
gcloud run deploy ...
```

### Azure (Container Apps + Flexible Server)
```bash
az containerapp create ...
```

---

## 13. Segurança

### Implementada
- ✅ Senhas com scrypt + salt aleatório 128-bit
- ✅ Sessões HMAC-SHA256 assinadas
- ✅ Cookies HttpOnly, SameSite=Lax
- ✅ Owner check em todas as APIs de mutação
- ✅ SQL injection prevenida (Drizzle parametrizado)
- ✅ XSS prevenido (React escape automático)
- ✅ Validação de inputs (trim, enums, limites)
- ✅ Upload limitado a 5MB com validação de formato

### Recomendado em Produção
- AUTH_SECRET forte: `openssl rand -hex 32`
- HTTPS obrigatório (HSTS)
- Rate limiting (nginx ou middleware)
- CSP headers
- Backup diário PostgreSQL
- WAF (Cloudflare, AWS WAF)
- Monitoring (Sentry, Datadog)

---

## 14. Performance e Escalabilidade

### Atual
- Build com Turbopack (~4s compilação)
- Server Components para páginas de listagem (zero JS client)
- Client Components apenas para interatividade
- Connection pooling PostgreSQL (singleton)
- Queries otimizadas com Drizzle (sem N+1)

### Recomendações para escalar
- Redis para cache de sessões e queries frequentes
- CDN para assets estáticos (images, CSS, JS)
- Read replicas PostgreSQL para queries pesadas
- Queue (BullMQ/SQS) para notificações e emails
- WebSocket (Socket.io) para chat em tempo real (substituir polling)
- Elasticsearch para busca full-text de fretes

---

## 15. Roadmap Mobile

### Phase 1: PWA (Pronto para implementar)
- Service Worker + manifest.json
- Cache offline para listagem de fretes
- Install prompt

### Phase 2: React Native (Expo)
- Mesmas APIs REST do backend
- Push notifications (Firebase/OneSignal)
- GPS tracking real (expo-location)
- Camera para upload de documentos
- Biometria (FaceID/TouchID)

### Phase 3: Features Nativas
- Geofencing (alertas de carga próxima)
- Widgets iOS/Android
- Apple Watch
- Integração OBD-II

---

## 16. Painel Administrativo (Acesso Secreto)

### Atalho de teclado
O painel admin é acessível de qualquer página via:

```
Ctrl + Shift + A
```

### Requisitos
- Usuário logado com `role = "admin"` no banco
- Conta demo admin: `demo@fretetruck.com.br` / `demo123`

### Funcionalidades do painel
- Dashboard com 5 métricas em tempo real (usuários, verificados, fretes ativos/fechados, docs pendentes)
- Lista de usuários recentes com botões de ação:
  - **Verificar/Desverificar** conta
  - **+R$50** créditos instantâneo
- Documentos pendentes de aprovação com botões aprovar/rejeitar
- Ao aprovar todos os docs de um usuário → conta ganha selo verificado automaticamente

### Como criar um admin
```sql
UPDATE users SET role='admin' WHERE email='seu@email.com';
```

---

## 17. Ícones SVG Profissionais

O sistema usa ícones SVG inline via componente `src/components/Icons.tsx` — 35+ ícones vetoriais leves, sem dependência externa (Lucide-style). Exportados como componentes React com prop `className` para sizing via Tailwind.

Exemplo de uso:
```tsx
import { IcTruck, IcSearch, IcBell } from "@/components/Icons";

<IcTruck className="w-6 h-6 text-orange-500" />
```

---

## 18. Troubleshooting

| Problema | Solução |
|----------|---------|
| `DATABASE_URL is required` | Verificar se `.env` existe na raiz |
| Erro de conexão com banco | PostgreSQL rodando na porta 5432? |
| Tabelas não existem | Rodar `npx drizzle-kit push --force` |
| Build falha com `useSearchParams` | Wrapper com `<Suspense>` (já implementado) |
| Dark mode não persiste | Verificar localStorage (ft_dark) |
| Notificações não aparecem | Verificar se está logado + polling ativo |
| Upload de documento falha | Verificar permissão de escrita em `public/uploads/` |
| Admin inacessível | Verificar se role é `admin` no banco |
| Credits não debitam | Verificar saldo antes de publicar featured |
| Referral não credita | Verificar se código existe em `users.referral_code` |

---

*Documentação gerada para o FreteTruck v1.0 — 25 páginas, 32 APIs, 16 tabelas, 6.829 linhas de código.*
