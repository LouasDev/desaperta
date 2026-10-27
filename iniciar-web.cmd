@echo off
call "%~dp0ambiente.cmd"
if errorlevel 1 exit /b 1
call npm run web
pause
