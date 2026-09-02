# Upload Bold Love MP3s to Cloudflare R2
param(
    [string]$SourceDir = "C:\Users\tweed\Downloads\Music\Bold Love\r2-pieces",
    [string]$Bucket = "living-word-map-downloads",
    [string]$Prefix = "audio/bold-love"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Wrangler = Join-Path $Root "node_modules\.bin\wrangler.cmd"
if (-not (Test-Path $Wrangler)) { throw "wrangler not found: $Wrangler" }
if (-not (Test-Path $SourceDir)) { throw "Source dir not found: $SourceDir" }

$files = Get-ChildItem -LiteralPath $SourceDir -Filter "*.mp3" | Sort-Object Name
if ($files.Count -eq 0) { throw "No mp3 files in $SourceDir" }

Write-Host "Uploading $($files.Count) files to R2 bucket $Bucket ..."
$n = 0
foreach ($f in $files) {
    $n++
    $key = "$Prefix/$($f.Name)"
    Write-Host "[$n/$($files.Count)] $key ($([math]::Round($f.Length/1MB,1)) MB)"
    & $Wrangler r2 object put "$Bucket/$key" --file="$($f.FullName)" --content-type="audio/mpeg" --remote
    if ($LASTEXITCODE -ne 0) { throw "Upload failed: $($f.Name)" }
}
Write-Host "Done. Uploaded $($files.Count) files."
