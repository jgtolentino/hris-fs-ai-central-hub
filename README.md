# TBWA HRIS AI Central Hub

🤖 Complete AI-powered HR management system with intelligent automation and employee self-service capabilities.

## 🎯 Core Features

### 🤖 AI Assistant
- Intelligent HR support and guidance
- Natural language expense processing
- Automated time tracking assistance
- Smart ticket routing and resolution
- Real-time employee insights

### 💰 Expense Management
- Camera-enabled receipt capture with OCR
- Multi-category expense tracking
- Automated approval workflows
- Real-time expense analytics
- Multi-currency support

### ⏰ Time Tracking
- Biometric clock-in/out with selfie verification
- GPS-based location tracking
- Automated timesheet generation
- Overtime calculation and alerts
- Schedule management and conflicts

### 🎫 Support Ticketing
- ServiceNow-inspired ticketing system
- AI-powered ticket classification
- Priority-based routing
- SLA tracking and escalation
- Knowledge base integration

### 📊 Analytics & Insights
- Real-time dashboard with KPIs
- Predictive analytics for HR trends
- Automated reporting and compliance
- Employee engagement metrics
- Budget tracking and forecasting

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Central Hub                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Mobile    │  │    Web      │  │    API      │  │  Database   │ │
│  │   App       │  │  Dashboard  │  │   Gateway   │  │  (Supabase) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           │                │                │                │
           └────────────────┴────────────────┴────────────────┘
                            AI Layer (Claude, GPT)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/jgtolentino/hris-fs-ai-central-hub.git
cd hris-fs-ai-central-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm start
```

### Environment Configuration
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
EXPO_PUBLIC_CLAUDE_API_KEY=your-anthropic-key

# App Configuration
EXPO_PUBLIC_API_URL=https://your-api-url.com
EXPO_PUBLIC_ENV=development
```

## 📱 Mobile App Features

### Dashboard
- Real-time employee metrics
- AI-powered insights and recommendations
- Quick action buttons
- Notification center

### Expense Management
- **Smart Receipt Capture**: OCR-powered receipt scanning
- **Auto-categorization**: AI-based expense classification
- **Approval Workflow**: Manager notifications and approvals
- **Budget Tracking**: Real-time budget vs. actual spending

### Time Tracking
- **Biometric Verification**: Selfie + GPS verification
- **Smart Scheduling**: AI-powered schedule optimization
- **Break Tracking**: Automated break detection
- **Overtime Alerts**: Proactive overtime notifications

### Support System
- **Intelligent Routing**: AI-powered ticket classification
- **Self-Service**: Knowledge base with AI search
- **Escalation Management**: Automated SLA tracking
- **Multi-channel Support**: In-app, email, and SMS

## 🗄️ Database Schema

### Core Tables
```sql
-- User Management
profiles (employee profiles)
departments (organizational structure)
roles (role-based permissions)

-- Expense Management
expenses (expense records)
expense_categories (expense types)
expense_policies (approval rules)
expense_attachments (receipt storage)

-- Time Tracking
time_entries (clock in/out records)
time_adjustments (manual corrections)
work_schedules (employee schedules)
time_policies (overtime rules)

-- Support System
tickets (support requests)
ticket_categories (issue types)
ticket_comments (conversation history)
ticket_attachments (file uploads)

-- AI & Analytics
ai_interactions (conversation logs)
analytics_events (user behavior)
predictions (AI insights)
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Session management

### Data Protection
- Row-level security (RLS)
- Data encryption at rest
- API rate limiting
- Input validation and sanitization

### Compliance
- GDPR compliance
- SOC 2 Type II ready
- Audit logging
- Data retention policies

## 🤖 AI Integration

### Natural Language Processing
- Expense description parsing
- Time tracking commands
- Support ticket analysis
- Employee sentiment analysis

### Machine Learning
- Expense fraud detection
- Time pattern recognition
- Predictive analytics
- Anomaly detection

### Automation
- Automated approvals
- Smart notifications
- Workflow optimization
- Report generation

## 📊 Analytics & Reporting

### Real-time Dashboards
- Employee productivity metrics
- Expense trend analysis
- Time utilization reports
- Support ticket analytics

### Predictive Analytics
- Budget forecasting
- Attendance predictions
- Employee turnover risk
- Capacity planning

### Custom Reports
- Executive summaries
- Compliance reports
- Department analytics
- Employee scorecards

## 🌐 Deployment Options

### Cloud Platforms
- **Vercel** (Recommended for web)
- **Expo Application Services** (Mobile)
- **Supabase** (Database & Auth)
- **Cloudflare** (CDN & Security)

### On-Premise
- Docker containerization
- Kubernetes orchestration
- Private cloud deployment
- Hybrid cloud setup

## 🔧 Development

### Project Structure
```
hris-fs-ai-central-hub/
├── app/                    # React Native screens
│   ├── (tabs)/            # Tab navigation
│   ├── expense/           # Expense management
│   ├── time/              # Time tracking
│   ├── tickets/           # Support system
│   └── services/          # API services
├── components/            # Reusable components
├── constants/             # App constants
├── store/                 # State management
├── types/                 # TypeScript types
└── database/              # Database schemas
```

### Tech Stack
- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Supabase, PostgreSQL
- **AI/ML**: OpenAI GPT, Anthropic Claude
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Styling**: NativeWind, Tailwind CSS

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 🚀 Production Deployment

### Mobile App
1. Build production app with EAS
2. Submit to App Store and Google Play
3. Configure push notifications
4. Set up crash reporting

### Web Dashboard
1. Deploy to Vercel or Netlify
2. Configure custom domain
3. Set up SSL certificates
4. Enable CDN

### Database
1. Configure production Supabase
2. Set up automated backups
3. Configure monitoring
4. Enable audit logging

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Basic expense management
- ✅ Time tracking with GPS
- ✅ Support ticketing system
- ✅ AI assistant integration

### Phase 2 (Next)
- 🔄 Advanced analytics dashboard
- 🔄 Performance management
- 🔄 Learning management system
- 🔄 Employee engagement surveys

### Phase 3 (Future)
- 📅 Recruitment pipeline
- 📅 Talent management
- 📅 Payroll integration
- 📅 Benefits administration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary to TBWA. All rights reserved.

## 🔗 Links

- [API Documentation](./docs/api.md)
- [User Guide](./docs/user-guide.md)
- [Admin Guide](./docs/admin-guide.md)
- [Deployment Guide](./docs/deployment.md)

---

Built with ❤️ by the TBWA Digital Team