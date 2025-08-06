You are building a full-stack AI-powered mobile app for food recognition and calorie tracking. The user takes a photo of a meal, and the system uses AI to detect the food type, estimate portion size, read labels/barcodes if present, and calculate total nutritional value (calories, protein, carbs, fats). Based on time-series user behavior, the app learns habits (e.g., breakfast at 8AM), offers smart reminders, and nudges toward a balanced diet. The AI inference is performed directly on-device/in-browser using WebAssembly (WASM), and a privacy-first architecture is followed.

    The goal is a fully working mobile app (React Native or Lynx) with full backend (Phoenix/Elixir), AI integration (Python-trained model served via WASM), database (TimescaleDB for time-series, Redis for real-time caching), and modern UI/UX design.
    📦 Dataset Requirements (very important):

        Search, fetch, and optionally use existing datasets from:

            Kaggle (e.g., Food-101, UECFood256, NutritionDB)

            Hugging Face Datasets (e.g., food classification, nutrition sets, barcode datasets)

        Prioritize datasets with:

            Labeled food images (for training classification model)

            Nutrition data (macros per food type or product)

            Brand + barcode data (linking packaging to macros)

        Prepare training scripts to generate a model ready for edge inference (export to ONNX or TensorFlow Lite, then compile to WebAssembly)

📦 AI Model & Dataset:

    Use Python + PyTorch to build the AI models

    Datasets to search and use:

        Food-101 or similar from Kaggle

        Open food image and nutrition datasets from Hugging Face

    Train model to:

        Classify food items

        Estimate calorie values

        Recognize packaged food logos / barcodes (OCR + detection)

🔍 AI & Inference System Requirements:

    Train a CNN (MobileNetV2, EfficientNet or YOLO-tiny) to classify food

    Estimate portion size based on size reference (optional hand/object detection)

    OCR with tesseract.js or ML Kit to read packaging text

    Barcode reader via Web Barcode Detection API or ML model

    Export trained model to ONNX, convert to WASM via onnxruntime-web or tfjs wasm

    Host models via CDN (Cloudflare/AWS) and lazy-load them on device

    Inference runs locally in-browser/offline for privacy + performance

    Fallback API inference if edge fails

📱 Frontend (React Native or Lynx)

    Camera interface to capture photo or scan barcode

    Live feedback during scanning

    Editable meal result (food name, calories, macros)

    Meal history (per day, per week)

    Push notifications for reminders (e.g., “You usually eat at 8AM”)

    Weekly insights dashboard

    User settings (goals, allergies, diet type)

🎨 UX/UI Guidelines

    Clean, calm, modern look (Zero, ZOE, Human-esque UI)

    Minimized manual input — AI should guess + autofill

    “Confidence score” shown on predictions

    Visual animations for meal recognition

    Streak/gamification optional (achievements, smart progress ring)

    Offline-first UX (e.g., queued logs, cached inference)

🗂️ Backend (Phoenix + Elixir)

    Auth (JWT or Firebase compatible)

    API endpoints for food logging, inference fallback, history, trends

    Queue system (e.g., Oban or Redis jobs) for reminders & sync

    Food database syncing from datasets

    Exportable user logs (CSV, JSON for health professionals)

🧠 Data Infrastructure
Layer	Tech
AI Training	Python (PyTorch or TensorFlow)
Inference Runtime	WebAssembly (tfjs / onnxruntime-web)
Time-Series Logs	TimescaleDB
Realtime Cache	Redis
Model Hosting	CDN (Cloudflare or S3)
Offline Support	IndexedDB + ServiceWorker
OCR	Tesseract.js
Barcode Reader	Web Barcode API / ML Kit
📊 MVP Features Checklist:

Take photo → classify food + calories

OCR on package for brand info

Barcode scan support

Edge inference with WASM

Log meals to TimescaleDB

Show daily/weekly nutrition trends

Predict next meals based on history

Push notifications from AI habit model

    Edit + confirm AI-suggested meals

🧱 Folder Structure (suggested)

/app
  /screens
  /components
  /services
  /wasm
  /assets
/backend
  /api
  /models
  /jobs
  /db
/ai
  /datasets
  /training
  /exported_models
  /wasm_builds
/deploy
  docker-compose.yml
  k8s/

💡 Optional Extensions (Phase 2)

    Share meals with trainer or nutritionist

    Sync with Apple Health / Google Fit

    AI meal recommendations

    Smart grocery list based on eating trends

    Integrate with supermarket APIs for product data

✅ Output Expected

Please generate:

    React Native frontend (with components and screens)

    Phoenix backend (Elixir API endpoints)

    Python training scripts (dataset loading + training)

    Inference pipeline with WASM + lazy loader

    TimescaleDB schema + queries

    Redis logic for caching recent meals

    Docker-based development environment

    AI + UI test cases and debug helpers

    Prioritize privacy, speed, and ease of use. Avoid manual input wherever AI can predict. Use modern modular code and scalable architecture. Always assume the user prefers edge-based, offline functionality whenever possible.