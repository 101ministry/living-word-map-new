# Upload Repentance Project stitched topic MP3s to Cloudflare R2
param(
    [string]$SourceDir = "C:\Users\tweed\Downloads\Documents\redemption\prayer\stitched",
    [string]$Bucket = "living-word-map-downloads",
    [int]$Round = 0,
    [int]$StartRound = 1,
    [int]$StartNum = 1,
    [int]$Retries = 5
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Wrangler = Join-Path $Root "node_modules\.bin\wrangler.cmd"
if (-not (Test-Path $Wrangler)) { throw "wrangler not found: $Wrangler" }
if (-not (Test-Path $SourceDir)) { throw "Source dir not found: $SourceDir" }

$rounds = if ($Round -in 1, 2, 3) { @($Round) } else { @(1, 2, 3) }
foreach ($r in $rounds) {
  if ($r -lt $StartRound) { continue }
  $files = Get-ChildItem -LiteralPath $SourceDir -Filter ("round{0}-*.mp3" -f $r) |
    Where-Object { $_.Name -notmatch '-play\.mp3$' -and $_.Name -match ("^round{0}-\d{{3}}-.+\.mp3$" -f $r) } |
    Sort-Object Name
  if ($files.Count -eq 0) { throw "No mp3 files for round $r" }
  Write-Host ("Uploading Round {0}: {1} files to {2}" -f $r, $files.Count, $Bucket)
  $n = 0
  foreach ($f in $files) {
    $n++
    $num = 0
    if ($f.Name -match 'round\d-(\d{3})-') { $num = [int]$Matches[1] }
    if ($r -eq $StartRound -and $num -lt $StartNum) { continue }
    $key = "audio/repentance-project/round-$r/$($f.Name)"
    Write-Host ("[{0}/{1}] {2} ({3} MB)" -f $n, $files.Count, $key, [math]::Round($f.Length / 1MB, 1))
    $ok = $false
    for ($try = 1; $try -le $Retries; $try++) {
      & $Wrangler r2 object put "$Bucket/$key" --file="$($f.FullName)" --content-type="audio/mpeg" --remote
      if ($LASTEXITCODE -eq 0) { $ok = $true; break }
      Write-Host ("retry {0}/{1} after failure: {2}" -f $try, $Retries, $f.Name)
      Start-Sleep -Seconds (8 * $try)
    }
    if (-not $ok) { throw "Upload failed: $($f.Name)" }
  }
}
Write-Host "Done."
