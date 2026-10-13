[CmdletBinding()]
param(
    [ValidateSet('Setup', 'Build', 'Debug', 'Release', 'Install')]
    [string]$Action = 'Setup',
    [string]$StorageRoot = 'F:/AniroBuild',
    [string]$AndroidSdk = 'F:/AniroBuild/android-sdk'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$StorageRoot = [IO.Path]::GetFullPath($StorageRoot)
if ([IO.Path]::GetPathRoot($StorageRoot).TrimEnd('\') -ne 'F:') {
    throw 'StorageRoot must be on F: to keep build caches off C:.'
}
if ([IO.Path]::GetPathRoot($projectRoot).TrimEnd('\') -ne 'F:') {
    throw 'Keep the Aniro checkout on F: so build outputs and node_modules stay there.'
}

$folders = @{
    TEMP = 'temp'
    TMP = 'temp'
    npm_config_cache = 'npm-cache'
    GRADLE_USER_HOME = 'gradle'
    ANDROID_USER_HOME = 'android-user'
    ANDROID_EMULATOR_HOME = 'android-user'
    ANDROID_AVD_HOME = 'android-avd'
    PLAYWRIGHT_BROWSERS_PATH = 'playwright'
}
foreach ($entry in $folders.GetEnumerator()) {
    $path = Join-Path $StorageRoot $entry.Value
    New-Item -ItemType Directory -Path $path -Force | Out-Null
    [Environment]::SetEnvironmentVariable($entry.Key, $path, 'Process')
}
# Gradle's Java processes need their own temporary-directory override.
$javaTemp = $env:TEMP.Replace('\', '/')
$javaOption = '-Djava.io.tmpdir="' + $javaTemp + '"'
if ($env:JAVA_TOOL_OPTIONS -notlike "*$javaOption*") {
    $env:JAVA_TOOL_OPTIONS = ($env:JAVA_TOOL_OPTIONS + ' ' + $javaOption).Trim()
}
Write-Host "Aniro build storage: $StorageRoot"

function Invoke-BuildStep {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program failed with exit code $LASTEXITCODE."
    }
}

if ($Action -eq 'Setup') {
    Write-Host 'Environment configured for this PowerShell session. Child commands will use F:.'
    return
}

Push-Location $projectRoot
try {
    if ($Action -eq 'Install') {
        Invoke-BuildStep 'npm.cmd' @('ci')
        return
    }
    if ($Action -in @('Debug', 'Release')) {
        $AndroidSdk = [IO.Path]::GetFullPath($AndroidSdk)
        if ([IO.Path]::GetPathRoot($AndroidSdk).TrimEnd('\') -ne 'F:') {
            throw 'AndroidSdk must be on F: so SDK downloads stay off C:.'
        }
        if (!(Test-Path (Join-Path $AndroidSdk 'platforms/android-36/android.jar')) -or
            !(Test-Path (Join-Path $AndroidSdk 'build-tools'))) {
            throw "Android SDK missing at $AndroidSdk. Install Android platform 36 and build-tools on F:, or pass -AndroidSdk with an existing F: SDK path."
        }
        $env:ANDROID_HOME = $AndroidSdk
        $env:ANDROID_SDK_ROOT = $AndroidSdk
        # local.properties takes precedence over environment variables.
        $localProperties = Join-Path $projectRoot 'android/local.properties'
        $lines = if (Test-Path $localProperties) {
            @(Get-Content $localProperties | Where-Object { $_ -notmatch '^\s*sdk\.dir\s*=' })
        } else { @() }
        $sdkProperty = $AndroidSdk.Replace('\', '/').Replace(':', '\:')
        Set-Content -Path $localProperties -Value (@($lines) + "sdk.dir=$sdkProperty") -Encoding ASCII
    }
    Invoke-BuildStep 'npm.cmd' @('run', 'build')
    if ($Action -in @('Debug', 'Release')) {
        Invoke-BuildStep (Join-Path $projectRoot 'node_modules/.bin/cap.cmd') @('sync', 'android')
        Push-Location (Join-Path $projectRoot 'android')
        try {
            $task = if ($Action -eq 'Release') { ':app:assembleRelease' } else { ':app:assembleDebug' }
            Invoke-BuildStep './gradlew.bat' @('--no-daemon', $task)
        } finally { Pop-Location }
    }
} finally { Pop-Location }
