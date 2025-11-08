@echo off
echo ========================================
echo AUB Angel Investor - Installation
echo ========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo Node.js is installed
node -v
npm -v
echo.

REM Clean everything
echo Cleaning old installations...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist client\node_modules rmdir /s /q client\node_modules
if exist client\package-lock.json del client\package-lock.json
echo Cleaned
echo.

REM Install root dependencies
echo Installing server dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Server installation failed!
    pause
    exit /b 1
)
echo Server dependencies installed
echo.

REM Install client dependencies
echo Installing client dependencies...
cd client
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Client installation failed!
    pause
    exit /b 1
)
cd ..
echo Client dependencies installed
echo.

REM Seed database
echo Loading AIM startups into database...
call npm run seed
if %ERRORLEVEL% NEQ 0 (
    echo Database seeding failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo INSTALLATION COMPLETE!
echo ========================================
echo.
echo Your 5 AIM Startups are loaded:
echo   1. Mina Canaan (EnergyTech)
echo   2. IGT (GreenTech)
echo   3. Impersonas (Digital Humans)
echo   4. Schedex (B2B SaaS)
echo   5. Bilo (AdTech)
echo.
echo To start the app, run:
echo   npm run dev
echo.
echo Then open:
echo   Players: http://localhost:5173
echo   Admin:   http://localhost:5173/admin
echo.
echo Admin login:
echo   Username: admin
echo   Password: demo123
echo.
echo IMPORTANT: Change password in .env before deploying!
echo.
pause
