#!/bin/sh
set -e

echo "🚛 FreteTruck — Iniciando..."

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não configurada!"
  echo "Configure a variável de ambiente DATABASE_URL com a URL do PostgreSQL."
  exit 1
fi

# Aplicar schema no banco (tabelas)
echo "🗄️  Aplicando schema do banco..."
npx drizzle-kit push --force 2>/dev/null || {
  echo "⚠️  drizzle-kit push falhou (pode já estar aplicado)"
}

# Popular dados demo se banco vazio
echo "🌱 Verificando dados demo..."
node scripts/seed.mjs 2>/dev/null || {
  echo "⚠️  Seed falhou (pode já estar populado)"
}

# Iniciar aplicação
echo "✅ Iniciando servidor na porta $PORT..."
exec npm start
