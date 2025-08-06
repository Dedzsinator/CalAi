# CalAi - AI-Powered Food Recognition & Calorie Tracking

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Backend: Phoenix](https://img.shields.io/badge/Backend-Phoenix%201.7-orange)](https://phoenixframework.org/)
[![Frontend: React Native](https://img.shields.io/badge/Frontend-React%20Native-blue)](https://reactnative.dev/)
[![AI: PyTorch](https://img.shields.io/badge/AI-PyTorch-red)](https://pytorch.org/)
[![Database: TimescaleDB](https://img.shields.io/badge/Database-TimescaleDB-green)](https://www.timescale.com/)

## 🎯 Quick Start (5 minutes)

```bash
# Clone and setup
git clone <your-repo-url>
cd CalAi
./scripts/setup.sh

# Start development environment
docker-compose up -d

# Run mobile app
cd app && npm run ios  # or npm run android
```

## � What is CalAi?

CalAi is a privacy-first, AI-powered mobile app that makes nutrition tracking effortless:

- **📸 Snap & Track**: Take a photo of any meal - AI recognizes food and calculates nutrition
- **🔍 Smart Scanning**: Barcode and packaging text recognition for packaged foods  
- **🧠 Habit Learning**: AI learns your eating patterns and suggests optimal meal times
- **📊 Insights**: Beautiful analytics showing nutrition trends and habit patterns
- **🔒 Privacy First**: All AI inference runs on-device using WebAssembly - your data stays private
- **🌐 Offline Ready**: Full functionality without internet connection

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │  Phoenix/Elixir  │    │   AI Training   │
│    Frontend     │◄──►│     Backend      │◄──►│   (Python)      │
│                 │    │                  │    │                 │
│ • Camera UI     │    │ • REST API       │    │ • PyTorch       │
│ • WASM AI       │    │ • Auth & Users   │    │ • Food-101      │
│ • Offline Sync  │    │ • Time-series DB │    │ • ONNX Export   │
│ • Push Notifs   │    │ • Background Jobs│    │ • WASM Runtime  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │     Data Layer          │
                    │                         │
                    │ • TimescaleDB (metrics) │
                    │ • Redis (cache)         │
                    │ • S3/CDN (models)       │
                    └─────────────────────────┘
```

## 📁 Project Structure

```
/app                    # React Native mobile app
  /src
    /screens           # App screens
    /components        # Reusable components
    /services          # API and AI services
    /wasm             # WebAssembly models
    /assets           # Images, fonts, etc.
/backend               # Phoenix/Elixir API
  /lib
    /calai
      /api            # API endpoints
      /models         # Data models
      /jobs           # Background jobs
    /calai_web        # Web interface
  /priv
    /repo/migrations  # Database migrations
/ai                    # AI training and inference
  /datasets          # Dataset loading scripts
  /training          # Model training scripts
  /models            # Trained models
  /export            # ONNX/WASM exports
/deploy               # Deployment configs
  docker-compose.yml
  /k8s              # Kubernetes configs
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Elixir 1.14+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

### Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repo-url>
   cd CalAi
   ./scripts/setup.sh
   ```

2. **Start development environment:**
   ```bash
   docker-compose up -d
   ```

3. **Run the app:**
   ```bash
   # Backend
   cd backend && mix phx.server
   
   # Frontend
   cd app && npm start
   
   # AI Training (optional)
   cd ai && python train.py
   ```

## 📊 AI Models & Datasets

### Datasets Used
- **Food-101**: 101 food categories, 1000 images each
- **UECFood256**: Asian food dataset
- **Open Food Facts**: Nutrition and barcode database
- **Hugging Face**: Additional food classification datasets

### Model Pipeline
1. **Classification**: MobileNetV2/EfficientNet for food recognition
2. **OCR**: Tesseract.js for packaging text
3. **Barcode**: Web Barcode Detection API
4. **Portion**: Object detection for size estimation
5. **Export**: ONNX → WebAssembly for edge inference

## 🔒 Privacy & Security

- ✅ On-device AI inference (no data sent to cloud)
- ✅ Local storage with encryption
- ✅ Optional cloud sync with end-to-end encryption
- ✅ No personal data in training datasets
- ✅ GDPR/CCPA compliant data handling

## 📱 Mobile Features

- **Camera Integration**: Real-time food scanning
- **Offline Support**: Full functionality without internet
- **Smart Notifications**: AI-powered meal reminders
- **Habit Learning**: Personalized eating pattern recognition
- **Export Data**: Health professional integration
- **Gamification**: Achievement system and progress tracking

## 🌐 API Endpoints

```
POST /api/v1/meals              # Log a meal
GET  /api/v1/meals              # Get meal history
GET  /api/v1/analytics          # Nutrition analytics
POST /api/v1/inference          # Fallback AI inference
GET  /api/v1/foods/search       # Search food database
POST /api/v1/barcodes           # Barcode lookup
```

## 🧪 Testing

```bash
# Backend tests
cd backend && mix test

# Frontend tests
cd app && npm test

# AI model tests
cd ai && python -m pytest tests/
```

## 🚀 Deployment

### Production
```bash
# Build and deploy
./scripts/deploy.sh production
```

### Staging
```bash
./scripts/deploy.sh staging
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📞 Support

- Documentation: [docs/](./docs/)
- Issues: GitHub Issues
- Discussion: GitHub Discussions
