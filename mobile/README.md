# 📱 FreteTruck Mobile — React Native + Expo

> Aplicativo mobile oficial do FreteTruck para caminhoneiros e embarcadores.

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências
cd mobile
npm install

# 2. Configurar API URL
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" > .env

# 3. Iniciar
npx expo start

# 4. Escanear QR Code com o app Expo Go (Android/iOS)
```

---

## 📁 Estrutura

```
mobile/
├── src/
│   ├── screens/          # Telas do app
│   │   ├── auth/         # Login, Registro, Reset senha
│   │   ├── freight/      # Lista, Detalhe, Publicar
│   │   ├── chat/         # Conversas, Chat
│   │   ├── community/    # Mural, Posts
│   │   ├── profile/      # Perfil, Analytics
│   │   ├── fiscal/       # CT-e, MDF-e
│   │   └── trucks/       # Carteira, Compras
│   ├── components/       # Componentes reutilizáveis
│   ├── services/         # API client (axios)
│   ├── hooks/            # useAuth, useFreights, etc
│   ├── navigation/       # React Navigation
│   ├── utils/            # Formatters, helpers
│   └── constants/        # Cores, URLs
├── assets/               # Imagens, fontes
├── app.json              # Config Expo
└── package.json
```

---

## 🔧 Configuração

### Variáveis de ambiente (`.env`)

```env
EXPO_PUBLIC_API_URL=https://api.fretetruck.app
```

### Alterar URL da API

Edite `mobile/src/services/api.ts`:

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
```

---

## 📦 Build & Deploy

### Desenvolvimento (Expo Go)

```bash
npx expo start
# Escaneie o QR Code com o app Expo Go
```

### Build de produção (EAS)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas build:configure

# Build Android (APK/AAB)
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview

# Submeter para lojas
eas submit --platform android
eas submit --platform ios
```

### Build local (Android APK)

```bash
npx expo run:android
```

---

## 📱 Funcionalidades

| Feature | Status |
|---------|--------|
| Login/Registro | ✅ |
| Buscar fretes | ✅ |
| Detalhe do frete | ✅ |
| Publicar frete | ✅ |
| Propostas online | ✅ |
| Chat em tempo real | ✅ |
| Comunidade (posts) | ✅ |
| Comentários | ✅ |
| Perfil público | ✅ |
| CT-e / MDF-e | ✅ |
| Carteira de Trucks | ✅ |
| Comprar Trucks | ✅ |
| Notificações push | 🔜 |
| Rastreamento GPS | 🔜 |
| Câmera (docs) | 🔜 |
| Modo offline | 🔜 |

---

## 🔗 Integração com Backend

O app consome as mesmas APIs do frontend web:

| Endpoint | Uso |
|----------|-----|
| `/api/auth/*` | Autenticação |
| `/api/freights/*` | Fretes |
| `/api/proposals/*` | Propostas |
| `/api/messages/*` | Chat |
| `/api/community/*` | Posts |
| `/api/trucks/*` | Carteira |
| `/api/fiscal/*` | Documentos fiscais |

---

## 🎨 Design System

- **Cores:** Navy (#0f172a), Orange (#f97316), Emerald (#10b981)
- **Fonte:** System default (iOS/Android)
- **Ícones:** Emoji + SVG (react-native-svg)
- **Tema:** Dark mode por padrão

---

## 📊 Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Framework | React Native 0.76 |
| Runtime | Expo SDK 52 |
| Rota | React Navigation 7 |
| Estado | Zustand |
| HTTP | Axios |
| Cache | TanStack Query |
| Storage | Expo SecureStore |
| Notificações | Expo Notifications |
| Localização | Expo Location |
| Mapas | react-native-maps |

---

## 📄 Licença

MIT — FreteTruck 2025
