@echo off
set "PROJECT_ROOT=%~dp0..\.."
cd /d "%PROJECT_ROOT%"
set "PATH=%CD%\.tools\node-v22.23.4-win-x64;%PATH%"
set "npm_config_cache=%CD%\.npm-cache"
set "__UNSAFE_EXPO_HOME_DIRECTORY=%CD%\.expo-user"
if not exist "%CD%\.tools\node-v22.23.4-win-x64\node.exe" (
  echo Node local nao encontrado. Consulte o README.
  exit /b 1
)
