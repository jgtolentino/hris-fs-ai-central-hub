# HRIS-FS-AI Central Hub - Migration Guide

This guide walks through migrating your existing mobile app to the new monorepo structure.

## 📋 Pre-Migration Checklist

- [ ] Backup your current repository
- [ ] Commit all pending changes
- [ ] Note any custom configurations
- [ ] Document environment variables
- [ ] Export any local databases

## 🚀 Migration Steps

### Step 1: Run the Scaffold Script

```bash
# Make the script executable
chmod +x scaffold-monorepo.sh

# Run the migration
./scaffold-monorepo.sh
```

This script will:
- Create the new monorepo directory structure
- Move your existing mobile app to `apps/mobile`
- Set up web app skeletons
- Create backend structure
- Configure monorepo tooling

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter issues, try:
npm install --legacy-peer-deps
```

### Step 3: Update Import Paths

Update imports in your mobile app to use the new structure:

```typescript
// Old
import { Button } from '../components/Button'
import { useAuth } from '../hooks/useAuth'

// New
import { Button } from '@shared/components/ui/Button'
import { useAuth } from '@shared/hooks/useAuth'
```

### Step 4: Configure Environment Variables

```bash
# Copy the example
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JASON_OCR_API_KEY`

### Step 5: Migrate Shared Components

Run the component migration script:

```bash
node scripts/migrate-shared-components.js
```

Then update imports in mobile app:

```typescript
// In apps/mobile/components files
export { Button } from '@shared/components/ui/Button'
```

### Step 6: Update Mobile Configuration

Update `apps/mobile/package.json` scripts:

```json
{
  "scripts": {
    "start": "expo start",
    "dev": "expo start --clear",
    "android": "expo start --android",
    "ios": "expo start --ios"
  }
}
```

Update `apps/mobile/metro.config.js` for monorepo:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

### Step 7: Set Up Backend API

Navigate to backend and set up the API:

```bash
cd backend/api
npm install

# Create initial route structure
mkdir -p src/routes
touch src/routes/auth.ts
touch src/routes/expenses.ts
touch src/routes/attendance.ts
```

### Step 8: Configure AI Agents

Set up agent configurations:

```bash
# In backend/agents/maya/config.ts
export const MAYA_CONFIG = {
  model: 'gpt-4',
  temperature: 0.7,
  systemPrompt: 'You are Maya, a helpful documentation assistant...'
}
```

### Step 9: Test the Migration

```bash
# Test mobile app
npm run mobile

# Test web admin
npm run web-admin

# Test API
npm run api

# Run all tests
npm test
```

## 🔧 Common Issues & Solutions

### Issue: Module Resolution Errors

**Solution**: Update `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../shared/*"],
      "@backend/*": ["../../backend/*"]
    }
  }
}
```

### Issue: Expo Metro Bundler Issues

**Solution**: Clear cache and restart:

```bash
cd apps/mobile
expo start --clear
rm -rf .expo
npm start -- --reset-cache
```

### Issue: Shared Component Types

**Solution**: Create index files in shared:

```typescript
// shared/components/index.ts
export * from './ui'
export * from './forms'
export * from './charts'
```

### Issue: Environment Variables Not Loading

**Solution**: Check workspace root:

```bash
# In apps/mobile
cp ../../.env.local .env.local

# Or use dotenv-cli
npm install -D dotenv-cli
```

## 📁 File Mapping Reference

| Old Location | New Location |
|--------------|--------------|
| `/app` | `/apps/mobile/app` |
| `/components` | `/apps/mobile/components` + `/shared/components` |
| `/services` | `/apps/mobile/services` |
| `/store` | `/apps/mobile/store` |
| `/types` | `/shared/types` |
| `/constants` | `/shared/constants` |
| `/hooks` | `/shared/hooks` |

## 🎯 Post-Migration Tasks

1. **Update CI/CD**:
   - Update GitHub Actions workflows
   - Configure deployment scripts
   - Set up environment secrets

2. **Documentation**:
   - Update README files
   - Document new structure
   - Create component documentation

3. **Team Onboarding**:
   - Share new development workflow
   - Update coding standards
   - Create contribution guide

4. **Performance Optimization**:
   - Set up Turborepo caching
   - Configure build optimization
   - Implement code splitting

## 🚀 Next Steps

1. Start building web applications
2. Implement shared component library
3. Set up AI agent integrations
4. Configure production deployments
5. Implement monitoring and analytics

## 📞 Support

If you encounter issues during migration:
1. Check the [PRD document](./PRD-monorepo-structure.md)
2. Review error logs carefully
3. Ensure all dependencies are installed
4. Verify environment variables

---

Migration typically takes 1-2 hours. Take your time and test thoroughly at each step!