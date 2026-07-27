# 📱 FreteTruck Mobile — Manual Completo de Build & Conexão

## Índice
1. [Pré-requisitos](#1-pré-requisitos)
2. [Setup Inicial](#2-setup-inicial)
3. [Conectar ao Backend](#3-conectar-ao-backend)
4. [Rodar em Desenvolvimento](#4-rodar-em-desenvolvimento)
5. [Telas do App](#5-telas-do-app)
6. [Build para Android (APK)](#6-build-para-android-apk)
7. [Build para iOS](#7-build-para-ios)
8. [Publicar nas Lojas](#8-publicar-nas-lojas)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pré-requisitos

### No seu computador:
- **Node.js 20+**: https://nodejs.org
- **Git**: https://git-scm.com
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (para builds): `npm install -g eas-cli`

### No celular:
- **Expo Go** (para testar): Baixe na Play Store ou App Store
- Mesma rede Wi-Fi que o computador

### Contas necessárias:
- **Expo**: https://expo.dev (grátis)
- **Google Play Console** (para Android): https://play.google.com/console ($25 taxa única)
- **Apple Developer** (para iOS): https://developer.apple.com ($99/ano)

---

## 2. Setup Inicial

```bash
# 1. Entre na pasta mobile
cd mobile

# 2. Instale as dependências
npm install

# 3. Configure a URL da API
cp .env.example .env
```

### Edite o `.env`:
```env
# IMPORTANTE: Use o IP da sua máquina na rede local, NÃO localhost!
# Para descobrir seu IP:
#   macOS/Linux: ifconfig | grep inet
#   Windows: ipconfig

# Desenvolvimento local:
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# Produção (após deploy do backend):
# EXPO_PUBLIC_API_URL=https://fretetruck.app
```

### Configure o `app.json`:
Edite `mobile/app.json` e altere:
- `expo.extra.eas.projectId`: Seu ID do projeto EAS (obtido com `eas init`)
- `expo.owner`: Seu usuário Expo

---

## 3. Conectar ao Backend

### Backend local (desenvolvimento):
```bash
# Na pasta raiz do projeto (NÃO na pasta mobile)
npm run dev
# O backend roda em http://localhost:3000
```

### Backend em produção:
Se o backend já está no Vercel/Railway/Fly.io, use a URL pública:
```env
EXPO_PUBLIC_API_URL=https://fretetruck.app
```

### Testar a conexão:
```bash
# No terminal, teste se a API responde
curl http://192.168.1.100:3000/api/health
# Deve retornar: {"status":"healthy",...}
```

---

## 4. Rodar em Desenvolvimento

```bash
cd mobile

# Opção 1: Expo Go (mais rápido para testar)
npx expo start

# Opção 2: Expo Go com tunnel (se rede Wi-Fi bloquear)
npx expo start --tunnel

# Opção 3: Emulador Android
npx expo start --android

# Opção 4: Simulador iOS (apenas macOS)
npx expo start --ios
```

### Após rodar `npx expo start`:
1. Aparece um **QR Code** no terminal
2. No celular, abra o app **Expo Go**
3. Escaneie o QR Code
4. O app abre no seu celular!

---

## 5. Telas do App

### Autenticação (sem login):
| Tela | Arquivo | Funcionalidade |
|------|---------|----------------|
| Login | `screens/auth/LoginScreen.tsx` | Email + senha, link para cadastro |
| Cadastro | `screens/auth/RegisterScreen.tsx` | Role picker, formulário completo |
| Esqueci senha | `screens/auth/ForgotPasswordScreen.tsx` | Envio de link por email |

### Principal (após login):
| Tela | Tab | Funcionalidade |
|------|-----|----------------|
| Buscar Fretes | Fretes | Lista com busca, pull-to-refresh, cards |
| Chat | Chat | Lista de conversas, badge de não lidas |
| Publicar | Publicar | Formulário completo de frete |
| Comunidade | Comunidade | Posts, likes, categorias |
| Perfil | Perfil | Dados, logout, links para Trucks e Analytics |

### Telas internas (navegação por stack):
| Tela | Funcionalidade |
|------|----------------|
| Detalhe do Frete | Todos os dados, WhatsApp, proposta online |
| Sala de Chat | Mensagens em tempo real, polling 5s |
| Carteira de Trucks | Saldo, cupons, compra de pacotes |
| Analytics | Métricas, rotas mais lucrativas |

---

## 6. Build para Android (APK)

### Primeira vez (configuração):
```bash
cd mobile

# Login no Expo
eas login

# Inicializar projeto EAS
eas init

# Configurar build
eas build:configure
```

### Gerar APK para teste (Preview):
```bash
eas build --platform android --profile preview
# Aguarde 10-15 minutos
# Baixe o APK gerado e instale no celular
```

### Gerar AAB para Play Store (Produção):
```bash
eas build --platform android --profile production
```

### Arquivo `eas.json` (criado automaticamente):
```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

---

## 7. Build para iOS

### Pré-requisitos:
- macOS (obrigatório para iOS)
- Conta Apple Developer ($99/ano)
- Xcode instalado

### Build:
```bash
# Preview (TestFlight)
eas build --platform ios --profile preview

# Produção (App Store)
eas build --platform ios --profile production
```

---

## 8. Publicar nas Lojas

### Google Play Store:
```bash
# 1. Build de produção
eas build --platform android --profile production

# 2. Submeter automaticamente
eas submit --platform android

# 3. Ou manualmente:
# - Baixe o arquivo .aab gerado
# - Acesse https://play.google.com/console
# - Crie o app → Upload do .aab → Publicar
```

### Apple App Store:
```bash
# 1. Build de produção
eas build --platform ios --profile production

# 2. Submeter automaticamente
eas submit --platform ios

# 3. Ou manualmente via Xcode/Transporter
```

---

## 9. Troubleshooting

| Problema | Solução |
|----------|---------|
| `Network request failed` | Verifique se `EXPO_PUBLIC_API_URL` usa o IP da máquina (não `localhost`) |
| QR Code não escaneia | Use `npx expo start --tunnel` |
| Expo Go fecha ao abrir | Atualize o Expo Go para a versão mais recente |
| Build falha no EAS | Verifique `eas.json` e `app.json` |
| Cookie de sessão não persiste | Verifique se o backend usa `secure: false` em dev |
| Imagens não carregam | Verifique se a URL da API está correta no `.env` |
| Erro de permissão GPS | Aceite a permissão de localização no celular |
| Android: "App not installed" | Desinstale versão anterior antes de instalar o APK |

### Verificar logs:
```bash
# Logs do Expo
npx expo start --clear

# Logs do build EAS
eas build:list
eas build:view <build-id>
```

---

## Arquitetura da Conexão

```
┌─────────────────────┐
│   App Mobile (Expo)  │
│   React Native       │
│   - Login/Cadastro   │
│   - Buscar Fretes    │
│   - Chat             │
│   - Publicar         │
│   - Comunidade       │
│   - Trucks           │
└──────────┬──────────┘
           │ HTTP/HTTPS (axios)
           │ Cookie: ft_session
┌──────────▼──────────┐
│  Backend Next.js     │
│  (Vercel/Railway)    │
│  /api/auth/*         │
│  /api/freights/*     │
│  /api/messages/*     │
│  /api/community/*    │
│  /api/trucks/*       │
└──────────┬──────────┘
           │ TCP :5432
┌──────────▼──────────┐
│  PostgreSQL (Neon)   │
└─────────────────────┘
```

O app mobile consome **exatamente as mesmas APIs** do frontend web. Não precisa de nenhum backend adicional.
