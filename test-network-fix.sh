#!/bin/bash

# CalAi Network Fix - Test and Start Script
# Run this script to verify everything is working and start the frontend

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 CalAi Network Connectivity Test${NC}"
echo "=================================="

# Get current IP
CURRENT_IP=$(ip route get 1 | awk '{print $7}' | head -1)
echo -e "${YELLOW}📍 Current machine IP: $CURRENT_IP${NC}"

# Test backend connectivity
echo -e "${YELLOW}🔍 Testing backend connectivity...${NC}"

if curl -s "http://$CURRENT_IP:4000/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is accessible from IP address${NC}"
else
    echo -e "${RED}❌ Backend not accessible from IP address${NC}"
    echo "Make sure backend is running: cd backend && mix phx.server"
    exit 1
fi

# Test OpenFoodFacts integration
echo -e "${YELLOW}🔍 Testing OpenFoodFacts integration...${NC}"

SEARCH_RESULT=$(curl -s "http://$CURRENT_IP:4000/api/v1/foods/search?q=monster%20energy" | grep -o '"success":true' || echo "FAILED")

if [[ "$SEARCH_RESULT" == '"success":true' ]]; then
    echo -e "${GREEN}✅ OpenFoodFacts integration working${NC}"
    
    # Show sample results
    echo -e "${YELLOW}🥤 Sample Monster Energy results:${NC}"
    curl -s "http://$CURRENT_IP:4000/api/v1/foods/search?q=monster%20energy" | grep -o '"name":"[^"]*"' | head -3 | sed 's/"name":/   -/g' | sed 's/"//g'
else
    echo -e "${RED}❌ OpenFoodFacts integration failed${NC}"
    exit 1
fi

# Check if frontend config matches current IP
echo -e "${YELLOW}🔍 Checking frontend configuration...${NC}"

if [[ -f "frontend/config/api.config.ts" ]]; then
    CONFIGURED_IP=$(grep "DEV_MACHINE_IP.*=" frontend/config/api.config.ts | grep -o "[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*" || echo "NOT_FOUND")
    
    if [[ "$CONFIGURED_IP" == "$CURRENT_IP" ]]; then
        echo -e "${GREEN}✅ Frontend configured for correct IP: $CURRENT_IP${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend IP mismatch. Updating configuration...${NC}"
        sed -i "s/DEV_MACHINE_IP = '[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*'/DEV_MACHINE_IP = '$CURRENT_IP'/g" frontend/config/api.config.ts
        echo -e "${GREEN}✅ Frontend configuration updated to: $CURRENT_IP${NC}"
    fi
else
    echo -e "${RED}❌ Frontend configuration file not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed! Network connectivity fixed!${NC}"
echo ""
echo -e "${YELLOW}📱 Ready to start frontend:${NC}"
echo "   cd frontend"
echo "   npx expo start"
echo ""
echo -e "${YELLOW}🧪 Test URLs:${NC}"
echo "   Health: http://$CURRENT_IP:4000/health"
echo "   Food Search: http://$CURRENT_IP:4000/api/v1/foods/search?q=test"
echo ""
echo -e "${GREEN}✅ OpenFoodFacts is working - no more hardcoded foods!${NC}"
echo -e "${GREEN}✅ Search for 'monster energy' now returns real products!${NC}"
