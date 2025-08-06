# CalAi - Quick Start Guide

## 📱 What's Been Implemented

### ✅ Frontend (React Native + Expo)
- **5 Main Tabs**: Today, Scan, Stats, Meals, More
- **Modern UI**: Clean, intuitive interface with dark/light mode support  
- **Camera Integration**: Photo capture and barcode scanning for food recognition
- **Comprehensive Settings**: Hamburger menu with extensive options
- **Offline-First**: Local storage with cloud sync capabilities
- **AI-Powered**: Food recognition and calorie estimation

### ✅ Backend (Phoenix + Elixir)
- **REST API**: Full API endpoints for meals, nutrition, users
- **TimescaleDB**: Time-series database for nutrition tracking
- **Redis Cache**: Fast data access and real-time features
- **Background Jobs**: Automated reminders and data sync
- **AI Integration**: Food classification and nutrition analysis
- **Secure**: JWT authentication and data encryption

### ✅ Database Architecture
- **TimescaleDB**: Hypertables for meal data with time-series optimization
- **Continuous Aggregates**: Daily/weekly nutrition summaries
- **Redis**: Caching, sessions, and real-time notifications
- **Migrations**: Complete schema with proper relationships

### ✅ Development Environment
- **Docker Compose**: Easy setup with all services
- **Development Scripts**: Automated setup and deployment
- **Hot Reload**: Both frontend and backend development

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo>
cd CalAi
./setup-dev.sh
```

### 2. Start Services
```bash
# Terminal 1: Start databases
docker-compose up postgres redis

# Terminal 2: Start backend
cd backend
mix phx.server

# Terminal 3: Start frontend  
cd frontend
npx expo start
```

### 3. Access the App
- **Frontend**: Expo app on your device/emulator
- **Backend API**: http://localhost:4000
- **Database**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379

## 📱 App Features

### Today Tab
- Daily nutrition overview
- Recent meals and calories
- Progress toward daily goals
- Quick stats and charts

### Scan Tab (Camera)
- **Photo Mode**: Take pictures of food for AI analysis
- **Barcode Mode**: Scan product barcodes
- **Gallery Import**: Import existing photos
- **Real-time Processing**: Instant food recognition

### Stats Tab (Analytics)
- Nutrition trends and charts
- Weekly/monthly summaries
- Goal tracking and progress
- Historical data visualization

### Meals Tab
- Browse all logged meals
- Filter by date ranges
- Edit or delete entries
- View detailed nutrition info

### More Tab (Hamburger Menu)
Comprehensive settings organized into sections:

#### 📊 Tracking
- Goals & Targets
- Progress & History  
- Meal Reminders

#### 🍽️ Food & Database
- Favorite Foods
- Custom Foods
- Barcode History

#### ⚙️ App Settings
- Notifications
- Privacy Mode
- Units & Measurements
- Language

#### 💾 Data & Backup
- Export Data
- Sync Settings
- Reset All Data

#### 🆘 Support & Info
- Help & FAQ
- Send Feedback
- Privacy Policy
- Terms of Service
- About CalAi

#### 👤 Account
- Edit Profile
- Log Out

## 🔧 Technical Stack

### Frontend
- **React Native 0.74+**
- **Expo SDK 51+**
- **TypeScript**
- **React Navigation**
- **AsyncStorage**
- **Expo Camera**
- **Expo Image Picker**

### Backend
- **Phoenix 1.7+**
- **Elixir 1.15+**
- **TimescaleDB (PostgreSQL)**
- **Redis**
- **Oban (Background Jobs)**
- **Guardian (JWT Auth)**

### AI/ML
- **Python 3.9+**
- **TensorFlow/PyTorch**
- **ONNX Runtime**
- **Computer Vision**
- **Food Classification**

## 🗄️ Database Features

### TimescaleDB Benefits
- **Hypertables**: Automatic partitioning by time
- **Continuous Aggregates**: Pre-computed daily/weekly stats
- **Compression**: Automatic data compression over time
- **Analytics**: Built-in time-series analytics functions

### Sample Queries
```sql
-- Daily nutrition summary
SELECT * FROM daily_nutrition_summary 
WHERE user_id = $1 AND day >= NOW() - INTERVAL '7 days';

-- Weekly trends
SELECT * FROM weekly_nutrition_summary 
WHERE user_id = $1 ORDER BY week DESC LIMIT 12;
```

## 🔐 Security Features
- JWT-based authentication
- Data encryption at rest
- Privacy-first design
- On-device AI processing option
- GDPR compliance ready

## 📡 API Endpoints

### Core Endpoints
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/meals
POST   /api/v1/meals
PUT    /api/v1/meals/:id
DELETE /api/v1/meals/:id
POST   /api/v1/meals/analyze
GET    /api/v1/nutrition/summary
```

## 🎯 Next Steps
1. **Run the setup script**: `./setup-dev.sh`
2. **Start the services** as shown above
3. **Test the app** on your device/emulator
4. **Customize settings** and preferences
5. **Start logging meals** and tracking nutrition

## 🏗️ Architecture Highlights

### Offline-First Design
- Local SQLite for critical data
- Background sync when online
- Conflict resolution strategies
- Graceful offline handling

### Scalable Backend
- Microservices-ready architecture
- Background job processing
- Redis for caching and sessions
- TimescaleDB for analytics

### Modern Frontend
- Component-based architecture
- TypeScript for type safety
- Responsive design
- Accessibility support

---

**Your CalAi app is now ready to use! 🎉**

The app uses TimescaleDB and Redis as required, has a comprehensive hamburger menu with settings, and includes 5 tabs with modern functionality. Everything is connected to the Elixir backend for a complete full-stack solution.
