@echo off
setlocal

echo ==========================================
echo Restarting PM2 Applications...
echo ==========================================

REM Go to the folder containing this BAT file
cd /d "%~dp0"

REM ==========================================
REM FRONTEND
REM ==========================================

echo.
echo Restarting Frontend...

cd frontend

pm2 stop frontend >nul 2>&1
pm2 delete frontend >nul 2>&1

pm2 start node --name frontend -- .\node_modules\next\dist\bin\next start --hostname 127.0.0.1 --port 3000

cd ..

REM ==========================================
REM BACKEND
REM ==========================================

echo.
echo Restarting Backend...

cd backend

pm2 stop backend >nul 2>&1
pm2 delete backend >nul 2>&1

pm2 start cmd --name backend -- /c "uvicorn src.main:backend_app --host 0.0.0.0 --port 8001"

cd ..

REM ==========================================
REM SAVE PM2
REM ==========================================

echo.
echo Saving PM2 configuration...

pm2 save

echo.
echo ==========================================
echo PM2 Status
echo ==========================================

pm2 list

echo.
echo Done.
pause