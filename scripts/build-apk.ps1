param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '../../android'),
    [string]$BuildDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex/apk'),
    [string]$AndroidToolsDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex/android-tools')
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$javaDirectory = Get-ChildItem (Join-Path $projectRoot '.tools/java') -Directory -Filter 'jdk-*' | Select-Object -First 1
if (!$javaDirectory) { throw 'Java local nao encontrado em .tools/java.' }
$env:JAVA_HOME = $javaDirectory.FullName
$env:ANDROID_HOME = Join-Path $AndroidToolsDirectory 'sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = Join-Path $AndroidToolsDirectory 'gradle'
$env:PATH = "$projectRoot\.tools\node-v22.23.4-win-x64;$env:JAVA_HOME\bin;$env:PATH"
$env:CI = '1'
$env:NODE_ENV = 'production'
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $projectRoot '.expo-user'
$signingRoot = Join-Path $projectRoot '.tools/signing'
$passwordFile = Join-Path $signingRoot 'password.txt'
if (!(Test-Path $passwordFile)) { throw 'Chave de assinatura local nao encontrada em .tools/signing.' }
$env:DESAPERTA_KEY_PASSWORD = [IO.File]::ReadAllText($passwordFile)
$env:DESAPERTA_KEYSTORE = (Join-Path $signingRoot 'desaperta.jks').Replace('\', '/')

# Use a real, short path on the same Windows drive. SUBST conflicts with codegen's canonical paths.
$buildMarker = Join-Path $BuildDirectory '.desaperta-build'
if ((Test-Path $BuildDirectory) -and !(Test-Path $buildMarker)) {
    throw 'A pasta de compilacao ja existe e nao pertence a este script. Escolha outra com -BuildDirectory.'
}
New-Item -ItemType Directory -Force $BuildDirectory | Out-Null
[IO.File]::WriteAllText($buildMarker, $projectRoot)
foreach ($sourceFile in @('App.tsx', 'app.json', 'index.ts', 'package.json', 'package-lock.json', 'tsconfig.json')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $sourceFile) -Destination (Join-Path $BuildDirectory $sourceFile) -Force
}
foreach ($sourceDirectory in @('src', 'assets', 'node_modules')) {
    & robocopy.exe (Join-Path $projectRoot $sourceDirectory) (Join-Path $BuildDirectory $sourceDirectory) /E /XD .cxx .gradle /NFL /NDL /NJH /NJS /NP
    if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar $sourceDirectory para a pasta de compilacao." }
}
Push-Location $BuildDirectory
try {
    $packageFile = Join-Path (Get-Location) 'package.json'
    $packageText = [IO.File]::ReadAllText($packageFile)
    try {
        & node node_modules/expo/bin/cli prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o projeto Android.' }
    } finally {
        [IO.File]::WriteAllText($packageFile, $packageText, (New-Object Text.UTF8Encoding $false))
    }
    $gradleFile = Join-Path (Get-Location) 'android/app/build.gradle'
    $gradleText = [IO.File]::ReadAllText($gradleFile)
    $releaseSigning = @'
    signingConfigs {
        release {
            storeFile file(System.getenv('DESAPERTA_KEYSTORE'))
            storePassword System.getenv('DESAPERTA_KEY_PASSWORD')
            keyAlias 'desaperta'
            keyPassword System.getenv('DESAPERTA_KEY_PASSWORD')
        }
'@
    if (!$gradleText.Contains("keyAlias 'desaperta'")) {
        $gradleText = $gradleText.Replace('    signingConfigs {', $releaseSigning)
    }
    $gradleText = $gradleText.Replace("// Caution! In production, you need to generate your own keystore file.", '// Release is signed with the private local Desaperta keystore.')
    $gradleText = [regex]::Replace($gradleText, '(?s)(buildTypes\s*\{.*?release\s*\{.*?)signingConfig signingConfigs.debug', '${1}signingConfig signingConfigs.release')
    [IO.File]::WriteAllText($gradleFile, $gradleText, (New-Object Text.UTF8Encoding $false))
    Push-Location android
    try {
        & .\gradlew.bat :app:assembleRelease '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a' '--max-workers=2' '--console=plain' '--no-daemon' '-Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m'
        if ($LASTEXITCODE -ne 0) { throw 'Falha na compilacao do APK.' }
    } finally { Pop-Location }
    New-Item -ItemType Directory -Force $OutputDirectory | Out-Null
    $appVersion = (Get-Content app.json -Raw | ConvertFrom-Json).expo.version
    $outputApk = Join-Path $OutputDirectory "Desaperta-$appVersion.apk"
    Copy-Item -LiteralPath 'android/app/build/outputs/apk/release/app-release.apk' -Destination $outputApk -Force
    & "$env:ANDROID_HOME\build-tools\36.0.0\apksigner.bat" verify --verbose $outputApk
    if ($LASTEXITCODE -ne 0) { throw 'Assinatura do APK invalida.' }
    Get-FileHash -LiteralPath $outputApk -Algorithm SHA256
} finally {
    Pop-Location
    Remove-Item Env:DESAPERTA_KEY_PASSWORD -ErrorAction SilentlyContinue
}
