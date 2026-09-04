# Upload a local MP4 to YouTube (Google Cloud OAuth).
# First time: save client_secret.json, then:
#   powershell -File scripts\youtube-upload.ps1 auth
# Then:
#   powershell -File scripts\youtube-upload.ps1 upload -File clip.mp4 -Title "..." -Hashtags "#A #B" -DescriptionFile desc.txt

param(
    [Parameter(Position = 0)]
    [ValidateSet("auth", "upload", "help")]
    [string]$Command = "help",

    [string]$File,
    [string]$Title,
    [string]$Hashtags,
    [string]$DescriptionFile,
    [string]$Meta,
    [ValidateSet("private", "unlisted", "public")]
    [string]$Privacy = "private",
    [switch]$NoShorts
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$app = Join-Path $here "youtube-upload"
$npm = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
$node = (Get-Command node -ErrorAction Stop).Source

if (-not (Test-Path (Join-Path $app "node_modules\googleapis"))) {
    if (-not (Test-Path $npm)) { throw "npm.cmd not found at $npm" }
    Write-Host "Installing googleapis in $app"
    Push-Location $app
    try {
        & $npm install --omit=dev
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    } finally {
        Pop-Location
    }
}

$js = Join-Path $app "upload.mjs"
$argv = @($js, $Command)
if ($File) { $argv += @("--file", $File) }
if ($Title) { $argv += @("--title", $Title) }
if ($Hashtags) { $argv += @("--hashtags", $Hashtags) }
if ($DescriptionFile) { $argv += @("--description-file", $DescriptionFile) }
if ($Meta) { $argv += @("--meta", $Meta) }
if ($Privacy) { $argv += @("--privacy", $Privacy) }
if ($NoShorts) { $argv += "--no-shorts" }

& $node @argv
exit $LASTEXITCODE
