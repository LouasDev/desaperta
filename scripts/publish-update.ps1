param([Parameter(Mandatory=$true)][string]$Message)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$env:CI='1'
$env:PATH="$projectRoot\.tools\node-v22.23.4-win-x64;$env:PATH"
Push-Location $projectRoot
try {
    & node scripts/runtime-signature.cjs --check
    if($LASTEXITCODE -ne 0){throw 'Atualizacao bloqueada: o APK precisa ser atualizado.'}
    & node node_modules/typescript/bin/tsc --noEmit
    if($LASTEXITCODE -ne 0){throw 'Corrija os erros de TypeScript antes de publicar.'}
    & node scripts/test.cjs
    if($LASTEXITCODE -ne 0){throw 'Corrija os testes antes de publicar.'}
    & node .tools/eas-cli/node_modules/eas-cli/bin/run update --channel production --platform android --environment production --message $Message --non-interactive
    if($LASTEXITCODE -ne 0){throw 'Nao foi possivel publicar a atualizacao.'}
} finally {Pop-Location}
