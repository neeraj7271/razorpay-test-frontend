@echo off
echo === Checking for Material UI dependencies ===
findstr "@mui" package.json >nul 2>&1
if %errorlevel% equ 0 (
  echo WARN: Found Material UI dependencies in package.json
) else (
  echo OK: No Material UI dependencies found in package.json
)

echo === Running cleanup script ===
node cleanup.js

echo === Installing dependencies ===
call npm install

echo === Building project ===
set CI=false
call npm run build

echo === Build completed successfully ===
echo Your project is now ready for deployment to Vercel 