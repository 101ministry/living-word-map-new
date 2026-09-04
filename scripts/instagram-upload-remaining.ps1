# Upload the next pending Reel from the Instagram queue (Meta Graph API).
# Skips files already marked ok in _instagram-upload-log.jsonl.
# Default interval ~60 min — Meta limits API publishes (~25–100 / 24h depending on account).
$ErrorActionPreference = "Continue"
$repo = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $repo "scripts\instagram-upload\upload.mjs"))) {
    $repo = "C:\Users\tweed\living-word-map"
}
$drop = "C:\Users\tweed\Downloads\Video\R&R\shorts and text"
$dir = Join-Path $drop "instagram-uploads"
$node = "C:\Program Files\nodejs\node.exe"
$js = Join-Path $repo "scripts\instagram-upload\upload.mjs"
$stamp = Get-Date -Format "yyyy-MM-dd"
$log = Join-Path $dir "_instagram-scheduled-$stamp.log"

if (-not (Test-Path -LiteralPath $dir)) {
    "=== start $(Get-Date -Format o) missing queue folder: $dir ===" | Out-File -FilePath (Join-Path $drop "_instagram-scheduled-$stamp.log") -Append -Encoding utf8
    exit 1
}

$config = Join-Path $env:USERPROFILE ".living-word-map\instagram\config.json"
if (-not (Test-Path -LiteralPath $config)) {
    "=== start $(Get-Date -Format o) missing config: $config ===" | Out-File -FilePath $log -Append -Encoding utf8
    "Run once: node scripts\instagram-upload\upload.mjs discover --token `"YOUR_TOKEN`"" | Out-File -FilePath $log -Append -Encoding utf8
    exit 1
}

"=== start $(Get-Date -Format o) ===" | Out-File -FilePath $log -Append -Encoding utf8
& $node $js upload-dir --dir $dir --limit 1 --delete-after *>> $log
$code = $LASTEXITCODE
"=== end $(Get-Date -Format o) exit=$code ===" | Out-File -FilePath $log -Append -Encoding utf8
exit $code
