@echo off
cd /d "%~dp0"
set "PATH=%~dp0.tools\node-v22.23.4-win-x64;%PATH%"
set "npm_config_cache=%~dp0.npm-cache"
set "__UNSAFE_EXPO_HOME_DIRECTORY=%~dp0.expo-user"
if not exist "%~dp0.tools\node-v22.23.4-win-x64\node.exe" (
  echo Node local nao encontrado. Consulte o README.
  exit /b 1
)
