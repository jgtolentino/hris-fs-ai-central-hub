#!/bin/bash

# HRIS-FS-AI Central Hub - Monorepo Scaffold Script
# This script restructures the existing mobile app into a production-scale monorepo

set -e  # Exit on error

echo "🚀 Starting HRIS-FS-AI Central Hub Monorepo Restructure..."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to create directory with message
create_dir() {
    mkdir -p "$1"
    echo -e "${GREEN}✓${NC} Created: $1"
}

# Function to move files/directories if they exist
move_if_exists() {
    if [ -e "$1" ]; then
        mv "$1" "$2"
        echo -e "${BLUE}→${NC} Moved: $1 to $2"
    fi
}

# 1. Create new monorepo structure
echo -e "\n${YELLOW}Step 1: Creating monorepo structure...${NC}"

# Create apps directories
create_dir "apps/mobile"
create_dir "apps/web-admin"
create_dir "apps/web-manager"
create_dir "apps/web-employee"
create_dir "apps/ai-dashboard"

# Create backend directories
create_dir "backend/api/src"
create_dir "backend/api/routes"
create_dir "backend/agents/maya"
create_dir "backend/agents/learnbot"
create_dir "backend/agents/yayo"
create_dir "backend/agents/jason-ocr"
create_dir "backend/db/migrations"
create_dir "backend/db/schemas"
create_dir "backend/utils"

# Create shared directories
create_dir "shared/components/ui"
create_dir "shared/components/forms"
create_dir "shared/components/charts"
create_dir "shared/lib/hooks"
create_dir "shared/lib/utils"
create_dir "shared/design-system/tokens"
create_dir "shared/design-system/themes"
create_dir "shared/types/api"
create_dir "shared/types/models"

# Create scripts directory
create_dir "scripts/deploy"
create_dir "scripts/migrate"
create_dir "scripts/test"

# Create .github workflows
create_dir ".github/workflows"

# 2. Move existing mobile app files
echo -e "\n${YELLOW}Step 2: Moving existing mobile app to apps/mobile...${NC}"

# Move key mobile app directories
move_if_exists "app" "apps/mobile/app"
move_if_exists "assets" "apps/mobile/assets"
move_if_exists "components" "apps/mobile/components"
move_if_exists "constants" "apps/mobile/constants"
move_if_exists "hooks" "apps/mobile/hooks"
move_if_exists "services" "apps/mobile/services"
move_if_exists "store" "apps/mobile/store"
move_if_exists "types" "apps/mobile/types"
move_if_exists "utils" "apps/mobile/utils"

# Move mobile config files
move_if_exists "app.json" "apps/mobile/app.json"
move_if_exists "babel.config.js" "apps/mobile/babel.config.js"
move_if_exists "metro.config.js" "apps/mobile/metro.config.js"
move_if_exists "tsconfig.json" "apps/mobile/tsconfig.json"
move_if_exists "tailwind.config.js" "apps/mobile/tailwind.config.js"
move_if_exists ".expo" "apps/mobile/.expo"

# Move the Power BI dashboard to ai-dashboard
if [ -d "apps/dashboard" ]; then
    echo -e "\n${YELLOW}Moving Power BI dashboard to ai-dashboard...${NC}"
    mv apps/dashboard/* apps/ai-dashboard/ 2>/dev/null || true
    rm -rf apps/dashboard
fi

# 3. Create root configuration files
echo -e "\n${YELLOW}Step 3: Creating root configuration files...${NC}"

# Create root package.json for monorepo
cat > package.json << 'EOF'
{
  "name": "hris-fs-ai-central-hub",
  "version": "1.0.0",
  "private": true,
  "description": "Enterprise HRIS/ERP Platform with AI Agents",
  "workspaces": [
    "apps/*",
    "backend/*",
    "shared/*",
    "scripts/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "mobile": "npm run dev --workspace=apps/mobile",
    "web-admin": "npm run dev --workspace=apps/web-admin",
    "web-manager": "npm run dev --workspace=apps/web-manager",
    "ai-dashboard": "npm run dev --workspace=apps/ai-dashboard",
    "api": "npm run dev --workspace=backend/api",
    "prepare": "husky install",
    "clean": "turbo run clean && rm -rf node_modules",
    "migrate": "npm run migrate --workspace=backend/db"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.4",
    "turbo": "^1.11.3",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: package.json"

# Create Turborepo configuration
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    },
    "test": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: turbo.json"

# Create root tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "dom"],
    "module": "commonjs",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "paths": {
      "@shared/*": ["./shared/*"],
      "@backend/*": ["./backend/*"]
    }
  },
  "exclude": ["node_modules"],
  "include": ["**/*.ts", "**/*.tsx"]
}
EOF
echo -e "${GREEN}✓${NC} Created: tsconfig.json"

# 4. Create app-specific configurations
echo -e "\n${YELLOW}Step 4: Creating app-specific configurations...${NC}"

# Create mobile package.json if it doesn't exist
if [ ! -f "apps/mobile/package.json" ]; then
cat > apps/mobile/package.json << 'EOF'
{
  "name": "@hris/mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "dev": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo export",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.0",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "zustand": "^4.4.7",
    "nativewind": "^2.0.11"
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: apps/mobile/package.json"
fi

# Create web-admin Next.js app
cat > apps/web-admin/package.json << 'EOF'
{
  "name": "@hris/web-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: apps/web-admin/package.json"

# Create basic Next.js structure for web-admin
create_dir "apps/web-admin/src/app"
create_dir "apps/web-admin/src/components"
create_dir "apps/web-admin/public"

# Create web-admin layout
cat > apps/web-admin/src/app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HRIS Admin Portal',
  description: 'Enterprise HRIS Administration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
EOF

# Create web-admin page
cat > apps/web-admin/src/app/page.tsx << 'EOF'
export default function AdminDashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">HRIS Admin Portal</h1>
      <p className="mt-4 text-xl">Enterprise administration dashboard</p>
    </main>
  )
}
EOF

# Create web-admin globals.css
cat > apps/web-admin/src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Similar setup for web-manager
cp -r apps/web-admin apps/web-manager
sed -i '' 's/web-admin/web-manager/g' apps/web-manager/package.json 2>/dev/null || sed -i 's/web-admin/web-manager/g' apps/web-manager/package.json
sed -i '' 's/3001/3002/g' apps/web-manager/package.json 2>/dev/null || sed -i 's/3001/3002/g' apps/web-manager/package.json
sed -i '' 's/Admin Portal/Manager Portal/g' apps/web-manager/src/app/layout.tsx 2>/dev/null || sed -i 's/Admin Portal/Manager Portal/g' apps/web-manager/src/app/layout.tsx
echo -e "${GREEN}✓${NC} Created: web-manager app"

# 5. Create backend API structure
echo -e "\n${YELLOW}Step 5: Creating backend API structure...${NC}"

cat > backend/api/package.json << 'EOF'
{
  "name": "@hris/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@trpc/server": "^10.45.0",
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: backend/api/package.json"

# Create API index file
cat > backend/api/src/index.ts << 'EOF'
import express from 'express'
import cors from 'cors'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { appRouter } from './router'
import { createContext } from './context'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// tRPC endpoint
const server = createHTTPServer({
  router: appRouter,
  createContext,
})

app.use('/trpc', (req, res) => {
  server(req, res)
})

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
})
EOF
echo -e "${GREEN}✓${NC} Created: backend/api/src/index.ts"

# 6. Create shared components structure
echo -e "\n${YELLOW}Step 6: Creating shared components...${NC}"

cat > shared/package.json << 'EOF'
{
  "name": "@hris/shared",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "dependencies": {
    "react": "^18.2.0"
  }
}
EOF

# Create design tokens
cat > shared/design-system/tokens/colors.ts << 'EOF'
export const colors = {
  brand: {
    yellow: '#FFD700',
    yellowDark: '#FFC700',
    yellowLight: '#FFED4E',
    black: '#000000',
    white: '#FFFFFF',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  semantic: {
    success: '#4ECDC4',
    warning: '#FFD700',
    error: '#FF6B6B',
    info: '#45B7D1',
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: shared/design-system/tokens/colors.ts"

# 7. Create agent structures
echo -e "\n${YELLOW}Step 7: Creating AI agent structures...${NC}"

# Maya agent
cat > backend/agents/maya/index.ts << 'EOF'
export class MayaAgent {
  name = 'Maya'
  role = 'Documentation & SOP Assistant'
  
  async processQuery(query: string): Promise<string> {
    // Maya agent logic for documentation help
    return `Maya: I can help you with documentation and SOPs. You asked: "${query}"`
  }
}
EOF

# LearnBot agent
cat > backend/agents/learnbot/index.ts << 'EOF'
export class LearnBotAgent {
  name = 'LearnBot'
  role = 'Training & Learning Assistant'
  
  async processQuery(query: string): Promise<string> {
    // LearnBot agent logic for training
    return `LearnBot: I can help you learn new features. You asked: "${query}"`
  }
}
EOF

# YaYo agent
cat > backend/agents/yayo/index.ts << 'EOF'
export class YaYoAgent {
  name = 'YaYo'
  role = 'UX/UI Optimization Assistant'
  
  async processQuery(query: string): Promise<string> {
    // YaYo agent logic for UX tips
    return `YaYo: I can help optimize your user experience. You asked: "${query}"`
  }
}
EOF

# Jason OCR agent
cat > backend/agents/jason-ocr/index.ts << 'EOF'
export class JasonOCRAgent {
  name = 'Jason OCR'
  role = 'Receipt & Document Processing'
  
  async processImage(imageData: string): Promise<any> {
    // Jason OCR logic for receipt processing
    return {
      merchant: 'Detected Merchant',
      amount: 0,
      date: new Date().toISOString(),
      items: []
    }
  }
}
EOF

echo -e "${GREEN}✓${NC} Created: AI agent structures"

# 8. Create GitHub Actions workflow
echo -e "\n${YELLOW}Step 8: Creating CI/CD workflows...${NC}"

cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build all apps
        run: npm run build
EOF
echo -e "${GREEN}✓${NC} Created: .github/workflows/ci.yml"

# 9. Create migration script
echo -e "\n${YELLOW}Step 9: Creating utility scripts...${NC}"

cat > scripts/migrate-shared-components.js << 'EOF'
#!/usr/bin/env node

// Script to migrate components from mobile to shared
const fs = require('fs');
const path = require('path');

const componentsToShare = [
  'Button',
  'Card',
  'Input',
  'Modal',
  'LoadingSpinner',
  // Add more components to migrate
];

console.log('🔄 Migrating components to shared library...');

componentsToShare.forEach(component => {
  const sourcePath = path.join('apps/mobile/components', component);
  const targetPath = path.join('shared/components/ui', component);
  
  if (fs.existsSync(sourcePath)) {
    fs.cpSync(sourcePath, targetPath, { recursive: true });
    console.log(`✓ Migrated: ${component}`);
  }
});

console.log('✅ Component migration complete!');
EOF
chmod +x scripts/migrate-shared-components.js
echo -e "${GREEN}✓${NC} Created: migration scripts"

# 10. Create .env.example
cat > .env.example << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
API_PORT=4000
API_URL=http://localhost:4000

# Mobile
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Jason OCR
JASON_OCR_API_KEY=your-jason-ocr-key
JASON_OCR_API_URL=https://api.jason-ocr.com

# Environment
NODE_ENV=development
EOF

# Create updated README
cat > README.md << 'EOF'
# HRIS-FS-AI Central Hub

Enterprise-grade HRIS/ERP platform with AI agents, mobile-first design, and comprehensive web portals.

## 🏗️ Monorepo Structure

```
hris-fs-ai-central-hub/
├── apps/
│   ├── mobile/          # React Native mobile app
│   ├── web-admin/       # Admin portal (Next.js)
│   ├── web-manager/     # Manager portal (Next.js)
│   ├── web-employee/    # Employee self-service (Next.js)
│   └── ai-dashboard/    # PowerBI-style analytics
├── backend/
│   ├── api/            # tRPC API server
│   ├── agents/         # AI agents (Maya, LearnBot, YaYo, Jason)
│   └── db/             # Database schemas and migrations
├── shared/
│   ├── components/     # Shared UI components
│   ├── design-system/  # TBWA brand tokens
│   └── types/          # TypeScript types
└── scripts/            # Build and deployment scripts
```

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start development servers**
   ```bash
   # Start all apps
   npm run dev

   # Or start specific apps
   npm run mobile
   npm run web-admin
   npm run ai-dashboard
   npm run api
   ```

## 📱 Apps

### Mobile App (`apps/mobile`)
- React Native with Expo
- NativeWind for styling
- Zustand for state management
- Offline-first architecture

### Web Admin (`apps/web-admin`)
- Next.js 14 with App Router
- Full organizational management
- Audit and compliance tools
- Advanced analytics

### AI Dashboard (`apps/ai-dashboard`)
- PowerBI-style analytics
- Real-time data visualization
- Role-based dashboards
- Export capabilities

## 🤖 AI Agents

- **Maya**: Documentation and SOP assistance
- **LearnBot**: Training and onboarding
- **YaYo**: UX/UI optimization tips
- **Jason**: OCR for receipts and documents

## 🛠️ Development

### Commands
- `npm run dev` - Start all development servers
- `npm run build` - Build all apps
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - TypeScript validation

### Tech Stack
- **Frontend**: React, React Native, Next.js
- **Backend**: Node.js, tRPC, Express
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, NativeWind
- **State**: Zustand, React Query
- **Monorepo**: Turborepo

## 🚢 Deployment

See individual app README files for deployment instructions:
- [Mobile Deployment](./apps/mobile/README.md)
- [Web Admin Deployment](./apps/web-admin/README.md)
- [API Deployment](./backend/api/README.md)

## 📄 License

Proprietary - TBWA. All rights reserved.
EOF

echo -e "\n${GREEN}✅ Monorepo scaffold complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Run: npm install"
echo "2. Copy .env.example to .env.local and configure"
echo "3. Run: npm run dev to start all services"
echo "4. Visit http://localhost:3000 (ai-dashboard), :3001 (admin), :3002 (manager)"
echo -e "\n${BLUE}Happy coding! 🚀${NC}"