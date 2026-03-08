@echo off
echo Starting Next.js development server...
echo Server will run on http://localhost:3001
echo.
echo To open in Cursor's Simple Browser:
echo 1. Press Ctrl+Shift+P
echo 2. Type 'Simple Browser'
echo 3. Enter: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
npm run dev

pause


