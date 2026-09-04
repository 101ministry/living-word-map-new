# Upload the next pending MP4 from the uploads queue, then remove it.
# Default --privacy public for sidecars without a privacy field (legacy queue).
# New sidecars with "privacy": "private" upload private instead.
# Skips files already marked ok in _upload-log.jsonl.
# Designed to be triggered every 14.4 minutes (14 min 24 sec).
$ErrorActionPreference = "Continue"
$repo = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $repo "scripts\youtube-upload\upload.mjs"))) {
    $repo = "C:\Users\tweed\living-word-map"
}
$drop = "C:\Users\tweed\Downloads\Video\R&R\shorts and text"
$dir = Join-Path $drop "uploads"
$node = "C:\Program Files\nodejs\node.exe"
$js = Join-Path $repo "scripts\youtube-upload\upload.mjs"
$stamp = Get-Date -Format "yyyy-MM-dd"
$log = Join-Path $dir "_upload-scheduled-$stamp.log"

if (-not (Test-Path -LiteralPath $dir)) {
    "=== start $(Get-Date -Format o) missing queue folder: $dir ===" | Out-File -FilePath (Join-Path $drop "_upload-scheduled-$stamp.log") -Append -Encoding utf8
    exit 1
}

"=== start $(Get-Date -Format o) ===" | Out-File -FilePath $log -Append -Encoding utf8
& $node $js upload-dir --dir $dir --privacy public --limit 1 --delete-after *>> $log
$code = $LASTEXITCODE
"=== end $(Get-Date -Format o) exit=$code ===" | Out-File -FilePath $log -Append -Encoding utf8
exit $code
