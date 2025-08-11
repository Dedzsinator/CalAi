# CalAi Network Connectivity Fix - Complete Solution

## 🎯 Problem Summary

The frontend was showing **"Network request failed"** errors when searching for foods manually because:

1. **Backend was only binding to localhost** (`127.0.0.1`), not accessible from mobile devices
2. **Frontend was configured for localhost only**, which doesn't work on physical devices/emulators
3. **CORS configuration didn't include IP addresses** for local network access

## ✅ Solutions Applied

### 1. Backend Configuration (`backend/config/dev.exs`)

**Changed from:**
```elixir
http: [ip: {127, 0, 0, 1}, port: 4000],  # Localhost only
```

**To:**
```elixir
http: [ip: {0, 0, 0, 0}, port: 4000],    # All interfaces
```

### 2. CORS Configuration (`backend/config/config.exs`)

**Added IP address support:**
```elixir
config :cors_plug,
  origin: [
    "http://localhost:3000", 
    "http://localhost:8081",
    "http://192.168.1.9:4000",              # Your machine's IP
    ~r/^https?:\/\/192\.168\.1\.\d+:\d+$/,  # Local network range
    ~r/^https?:\/\/.*\.ngrok\.io$/
  ]
```

### 3. Frontend API Configuration

**Created smart platform-aware configuration:**
- **Web (Expo web):** Uses `http://localhost:4000`
- **Mobile (devices/emulators):** Uses `http://192.168.1.9:4000`
- **Production:** Uses `https://api.calai.app`

### 4. Fixed Compilation Error

Removed duplicate Guardian module file that was causing compilation errors.

## 🚀 Current Status

✅ **Backend API:** Running and accessible on both localhost and IP address  
✅ **OpenFoodFacts Integration:** Working - returns real "monster energy" products  
✅ **Network Configuration:** Mobile devices can now reach the backend  
✅ **CORS:** Properly configured for local development  

## 🧪 Test Results

```bash
# Backend health check
curl -s http://192.168.1.9:4000/health
# ✅ {"status":"ok","services":{"api":"running"}}

# Food search test
curl -s "http://192.168.1.9:4000/api/v1/foods/search?q=monster%20energy"
# ✅ Returns 20+ real Monster Energy products from OpenFoodFacts
```

## 📱 Next Steps

1. **Start the frontend development server:**
   ```bash
   cd frontend
   npx expo start
   ```

2. **Test on your device/emulator:**
   - The app should now connect successfully to the backend
   - Search for "monster energy" should return real products
   - No more "Network request failed" errors

## 🔧 Configuration Files Created/Modified

### New Files:
- `frontend/config/api.config.ts` - Smart API configuration helper

### Modified Files:
- `backend/config/dev.exs` - Network binding configuration
- `backend/config/config.exs` - CORS configuration
- `frontend/services/api.ts` - Updated to use new config

## 🌐 IP Address Note

**Your current machine IP:** `192.168.1.9`

If your IP address changes (different network/DHCP renewal), update:
- `frontend/config/api.config.ts` (line with `DEV_MACHINE_IP`)
- `backend/config/config.exs` (CORS origins)

## 🎉 Expected Behavior

After these fixes, when you search for "monster energy" in the app:

1. ✅ **No network errors**
2. ✅ **Real OpenFoodFacts products returned**
3. ✅ **Proper nutrition data displayed**
4. ✅ **Brand information and images**

The integration with OpenFoodFacts is now working correctly, and you should see real food products instead of hardcoded data!

---

## 🚨 Troubleshooting

If you still get network errors:

1. **Check your IP address:**
   ```bash
   ip route get 1 | awk '{print $7}'
   ```

2. **Update the IP in the config files if it changed**

3. **Restart both servers:**
   ```bash
   # Backend
   cd backend && mix phx.server
   
   # Frontend  
   cd frontend && npx expo start
   ```

4. **Test direct API access:**
   ```bash
   curl -s http://YOUR_IP:4000/api/v1/foods/search?q=test
   ```
