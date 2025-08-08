#!/bin/bash

echo "Testing CalAi Backend API Endpoints..."
echo "======================================"

BASE_URL="http://localhost:4000"

echo -e "\n1. Testing Health Check:"
curl -s "$BASE_URL/health" | jq '.' || curl -s "$BASE_URL/health"

echo -e "\n\n2. Testing Food Search (Public):"
curl -s "$BASE_URL/api/v1/foods/search?q=apple" | jq '.' || curl -s "$BASE_URL/api/v1/foods/search?q=apple"

echo -e "\n\n3. Testing Barcode Lookup (Public):"
curl -s -X POST "$BASE_URL/api/v1/foods/barcode" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"123456789"}' | jq '.' || curl -s -X POST "$BASE_URL/api/v1/foods/barcode" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"123456789"}'

echo -e "\n\n4. Testing User Registration (Public):"
curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}' | jq '.' || curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

echo -e "\n\nAPI Testing Complete!"
