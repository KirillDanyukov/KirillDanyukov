@echo off
echo Запуск сервера...
start "" "http://localhost:8080"
py -m http.server 8080
pause
