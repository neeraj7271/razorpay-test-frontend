#!/bin/bash

# Exit on error
set -e

echo "=== 🔍 Checking for Material UI dependencies ==="
if grep -q "@mui" package.json; then
  echo "⚠️ Found Material UI dependencies in package.json. Removing..."
  sed -i '/@mui/d' package.json
else
  echo "✅ No Material UI dependencies found in package.json"
fi

echo "=== 🧹 Running cleanup script ==="
node cleanup.js

echo "=== 📦 Installing dependencies ==="
npm install

echo "=== 🏗️ Building project ==="
CI=false npm run build

echo "=== ✅ Build completed successfully ==="
echo "Your project is now ready for deployment to Vercel" 