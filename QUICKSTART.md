# HRIS-FS-AI Central Hub - Quick Start Guide

Get your monorepo up and running in 5 minutes!

## 🚀 Quick Setup

```bash
# 1. Run the scaffold script to create structure
chmod +x scaffold-monorepo.sh
./scaffold-monorepo.sh

# 2. Run bootstrap script for sample files
chmod +x bootstrap-samples.sh
./bootstrap-samples.sh

# 3. Install all dependencies
npm install

# 4. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 5. Start everything!
npm run dev
```

## 🌐 Access Points

Once running, access your apps at:

- **Mobile App**: Expo Go app or http://localhost:8081
- **Web Admin**: http://localhost:3001
- **Web Manager**: http://localhost:3002
- **AI Dashboard**: http://localhost:3000
- **API Server**: http://localhost:4000
- **API Health**: http://localhost:4000/health

## 📱 Mobile Development

```bash
# Start mobile app only
npm run mobile

# Run on iOS simulator
cd apps/mobile && npm run ios

# Run on Android
cd apps/mobile && npm run android
```

## 🖥️ Web Development

```bash
# Start specific web app
npm run web-admin
npm run web-manager
npm run ai-dashboard

# Build for production
cd apps/web-admin && npm run build
```

## 🤖 AI Agents

The platform includes 4 AI agents:

1. **Maya** - Documentation assistant
   - Helps with SOPs and policies
   - Answers how-to questions

2. **LearnBot** - Training assistant
   - Interactive tutorials
   - Onboarding guidance

3. **YaYo** - UX optimization
   - UI tips and shortcuts
   - Workflow improvements

4. **Jason** - OCR processing
   - Receipt scanning
   - Document extraction

## 📊 Sample Data

The bootstrap script includes sample data for:
- Expenses
- Attendance records
- Support tickets
- User profiles

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific app tests
cd apps/mobile && npm test
cd apps/web-admin && npm test

# Run E2E tests
npm run test:e2e
```

## 🔧 Common Tasks

### Add a new shared component

1. Create component in `shared/components/ui/`
2. Export from `shared/components/index.ts`
3. Import in any app: `import { MyComponent } from '@shared/components'`

### Add a new API endpoint

1. Create router in `backend/api/src/routes/`
2. Add to main router in `backend/api/src/router.ts`
3. Use in frontend: `trpc.myEndpoint.query()`

### Deploy to production

```bash
# Build all apps
npm run build

# Deploy web apps to Vercel
cd apps/web-admin && vercel

# Deploy API to Railway
cd backend/api && railway up

# Build mobile app
cd apps/mobile && eas build
```

## 🆘 Troubleshooting

### "Module not found" errors
```bash
# Clear all caches
npm run clean
rm -rf node_modules
npm install
```

### Metro bundler issues (mobile)
```bash
cd apps/mobile
npx expo start --clear
```

### Port already in use
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Database connection issues
- Check `.env.local` has correct Supabase credentials
- Ensure Supabase project is running
- Check network connectivity

## 📚 Next Steps

1. **Customize Components**: Modify shared components in `shared/components/`
2. **Add Features**: Implement new features in respective apps
3. **Configure AI Agents**: Adjust agent configs in `backend/agents/configs/`
4. **Set Up CI/CD**: Configure GitHub Actions in `.github/workflows/`
5. **Deploy**: Follow deployment guides for each platform

## 🎯 Pro Tips

- Use `npm run dev` to start everything at once
- Keep shared code in `/shared` for maximum reuse
- Follow the established patterns in sample files
- Use TypeScript for type safety
- Test on both mobile and web regularly

---

Need help? Check the full documentation:
- [Migration Guide](./MIGRATION-GUIDE.md)
- [PRD Document](./PRD-monorepo-structure.md)
- [Architecture Overview](./README.md)