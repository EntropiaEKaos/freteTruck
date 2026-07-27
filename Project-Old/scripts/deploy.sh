#!/bin/bash
# ==========================================
# FreteTruck — Deploy Beta Público
# ==========================================
# 
# OPÇÃO 1: Docker (VPS / servidor próprio)
#   bash scripts/deploy.sh docker
#
# OPÇÃO 2: Node.js direto (Railway, Render, VPS)
#   bash scripts/deploy.sh node
#
# PRÉ-REQUISITOS:
#   - Arquivo .env configurado (cp .env.production .env)
#   - DATABASE_URL e AUTH_SECRET preenchidos
# ==========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

MODE=${1:-docker}

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🚛 FreteTruck — Deploy Beta        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# 1. Validar .env
if [ ! -f .env ]; then
  if [ -f .env.production ]; then
    echo -e "${YELLOW}Copiando .env.production para .env...${NC}"
    cp .env.production .env
  else
    echo -e "${RED}ERRO: Arquivo .env não encontrado.${NC}"
    echo "  Execute: cp .env.production .env"
    echo "  E preencha DATABASE_URL e AUTH_SECRET"
    exit 1
  fi
fi

source .env 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERRO: DATABASE_URL não definida.${NC}"
  echo "  Edite o .env com a URL do seu PostgreSQL."
  echo "  Bancos gratuitos: neon.tech, supabase.com, railway.app"
  exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL configurada${NC}"

if [ -z "$AUTH_SECRET" ] || [ "$AUTH_SECRET" = "COLE_AQUI_O_RESULTADO_DO_OPENSSL" ]; then
  NEW_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | tr -d '\n' | head -c 64)
  echo "AUTH_SECRET=$NEW_SECRET" >> .env
  echo -e "${GREEN}✓ AUTH_SECRET gerado automaticamente${NC}"
else
  echo -e "${GREEN}✓ AUTH_SECRET configurado${NC}"
fi

# ==========================================
# DOCKER DEPLOY
# ==========================================
if [ "$MODE" = "docker" ]; then
  echo ""
  echo -e "${CYAN}Modo: Docker Compose${NC}"
  echo ""

  if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERRO: Docker não instalado.${NC}"
    echo "  Instale: https://docs.docker.com/get-docker/"
    exit 1
  fi

  echo -e "${YELLOW}Parando containers anteriores...${NC}"
  docker compose down 2>/dev/null || true

  echo -e "${YELLOW}Buildando e subindo containers...${NC}"
  docker compose up -d --build

  echo -e "${YELLOW}Aguardando PostgreSQL...${NC}"
  for i in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
      echo -e "${GREEN}✓ PostgreSQL pronto${NC}"
      break
    fi
    [ $i -eq 30 ] && { echo -e "${RED}PostgreSQL timeout${NC}"; exit 1; }
    sleep 1
  done

  echo -e "${YELLOW}Populando dados demo...${NC}"
  docker compose exec -T app node scripts/seed.mjs 2>/dev/null || echo "(seed já executado)"

  echo -e "${YELLOW}Verificando healthcheck...${NC}"
  sleep 3
  for i in $(seq 1 10); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
      echo -e "${GREEN}✓ App online!${NC}"
      break
    fi
    [ $i -eq 10 ] && { echo -e "${RED}App não respondeu${NC}"; docker compose logs --tail=20 app; exit 1; }
    sleep 2
  done

# ==========================================
# NODE DEPLOY (Railway, Render, VPS direto)
# ==========================================
elif [ "$MODE" = "node" ]; then
  echo ""
  echo -e "${CYAN}Modo: Node.js direto${NC}"
  echo ""

  echo -e "${YELLOW}Instalando dependências...${NC}"
  npm ci --production=false

  echo -e "${YELLOW}Buildando...${NC}"
  npm run build

  echo -e "${YELLOW}Aplicando schema no banco...${NC}"
  npx drizzle-kit push --force 2>/dev/null || echo "(schema já aplicado)"

  echo -e "${YELLOW}Populando dados demo...${NC}"
  node scripts/seed.mjs 2>/dev/null || echo "(seed já executado)"

  echo -e "${YELLOW}Iniciando servidor...${NC}"
  npm start &
  sleep 4

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ App online!${NC}"
  else
    echo -e "${RED}App não respondeu. Verifique os logs.${NC}"
    exit 1
  fi
else
  echo -e "${RED}Modo inválido. Use: bash scripts/deploy.sh docker  OU  bash scripts/deploy.sh node${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   FreteTruck BETA está no ar!            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "  App:        http://localhost:3000"
echo "  Health:     http://localhost:3000/api/health"
echo "  Sitemap:    http://localhost:3000/sitemap.xml"
echo "  Admin:      Ctrl+Shift+A (após login)"
echo ""
echo "  Contas BETA:"
echo "    Admin:      demo@fretetruck.com.br / demo123"
echo "    Embarcador: fernanda@grancargo.com.br / senha123"
echo "    Motorista:  marcos@gmail.com / senha123"
echo ""
echo -e "  ${YELLOW}Para parar:${NC}"
if [ "$MODE" = "docker" ]; then
  echo "    docker compose down"
  echo "    docker compose logs -f app  (ver logs)"
else
  echo "    kill \$(lsof -ti:3000)"
fi
echo ""
echo -e "${CYAN}Próximos passos:${NC}"
echo "  1. Aponte seu domínio para o IP deste servidor"
echo "  2. Configure SSL com: sudo certbot --nginx -d seudominio.com"
echo "  3. Divulgue o link para motoristas e embarcadores!"
echo ""
