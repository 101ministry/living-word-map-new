# Extract Bold Love MP4s to MP3 and upload each file to R2 when ready.
param(
    [string]$SourceDir = "C:\Users\tweed\Downloads\Video\BOLD LOVE",
    [string]$OutDir = "C:\Users\tweed\Downloads\Music\Bold Love\r2-pieces",
    [string]$Bucket = "living-word-map-downloads",
    [string]$Prefix = "audio/bold-love",
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Wrangler = Join-Path $Root "node_modules\.bin\wrangler.cmd"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$meta = @{
    "1"   = @{ slug = "01-introduction-mixed-feelings-part-1.mp3"; title = "Introduction + Mixed Feelings, Part 1" }
    "2"   = @{ slug = "02-mixed-feelings.mp3"; title = "Mixed Feelings" }
    "3"   = @{ slug = "03-why-dont-we-love-better.mp3"; title = "Why Don't We Love Better" }
    "4"   = @{ slug = "04-taking-out-hatred-stunned-into-silence.mp3"; title = "Taking Out Hatred + Stunned Into Silence" }
    "5"   = @{ slug = "05-stunned-into-silence-facing-a-war.mp3"; title = "Stunned Into Silence + Facing a War" }
    "6"   = @{ slug = "06-facing-a-war.mp3"; title = "Facing a War" }
    "7"   = @{ slug = "07-our-divine-warrior.mp3"; title = "Our Divine Warrior" }
    "8"   = @{ slug = "08-divine-warrior-resume-of-a-warrior.mp3"; title = "Divine Warrior + Resume of a Warrior" }
    "9"   = @{ slug = "09-resume-of-a-warrior.mp3"; title = "Resume of a Warrior" }
    "10"  = @{ slug = "10-hungering-for-restoration.mp3"; title = "Hungering for Restoration" }
    "11"  = @{ slug = "11-hungering-for-restoration-revoking-revenge.mp3"; title = "Hungering for Restoration and Revoking Revenge" }
    "12"  = @{ slug = "12-revoking-revenge.mp3"; title = "Revoking Revenge" }
    "13a" = @{ slug = "13-giving-good-gifts-part-1.mp3"; title = "Giving Good Gifts, Part 1" }
    "13b" = @{ slug = "13-giving-good-gifts-part-2.mp3"; title = "Giving Good Gifts, Part 2" }
    "14"  = @{ slug = "14-loving-an-evil-person.mp3"; title = "Loving an Evil Person" }
    "15"  = @{ slug = "15-loving-an-evil-and-loving-a-foolish-person.mp3"; title = "Loving an Evil Person and Loving a Foolish Person" }
    "16"  = @{ slug = "16-loving-a-foolish-person.mp3"; title = "Loving a Foolish Person" }
    "17"  = @{ slug = "17-loving-a-normal-sinner.mp3"; title = "Loving a Normal Sinner" }
}

function Get-DurationSeconds([string]$Path) {
    $raw = cmd /c "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 `"$Path`" 2>nul"
    if (-not $raw) { return 0 }
    $text = ($raw | Select-Object -First 1).ToString().Trim()
    $n = 0.0
    if ([double]::TryParse($text, [ref]$n)) { return $n }
    return 0
}

function Get-PieceKey([string]$Name) {
    if ($Name -match '13\.1') { return "13a" }
    if ($Name -match '13\.2') { return "13b" }
    if ($Name -match '(?i)Day\s+(\d+)') { return [string][int]$Matches[1] }
    if ($Name -match '^01\s') { return "1" }
    return $null
}

if (-not $SkipUpload -and -not (Test-Path $Wrangler)) { throw "wrangler not found: $Wrangler" }

$files = @(Get-ChildItem -LiteralPath $SourceDir -Filter "*.mp4" | Sort-Object Name)
if ($files.Count -eq 0) { throw "No MP4 files in $SourceDir" }

$uploadedMarker = Join-Path $OutDir ".uploaded.txt"
$already = @{}
if (Test-Path $uploadedMarker) {
    Get-Content -LiteralPath $uploadedMarker | ForEach-Object { if ($_) { $already[$_] = $true } }
}

$i = 0
foreach ($f in $files) {
    $i++
    $key = Get-PieceKey $f.Name
    if (-not $key -or -not $meta.ContainsKey($key)) {
        throw "Could not map: $($f.Name)"
    }
    $slug = $meta[$key].slug
    $dest = Join-Path $OutDir $slug
    $needExtract = $true
    if (Test-Path -LiteralPath $dest) {
        $vidDur = Get-DurationSeconds $f.FullName
        $mp3Dur = Get-DurationSeconds $dest
        if ($mp3Dur -gt 10 -and ($vidDur - $mp3Dur) -lt 3) {
            $needExtract = $false
            Write-Host "[$i/$($files.Count)] audio ready $slug"
        } else {
            Write-Host "[$i/$($files.Count)] re-extract incomplete $slug (video ${vidDur}s / mp3 ${mp3Dur}s)"
        }
    }
    if ($needExtract) {
        Write-Host "[$i/$($files.Count)] extract $($f.Name) -> $slug"
        & ffmpeg -y -hide_banner -loglevel error -i $f.FullName -vn -acodec libmp3lame -q:a 4 $dest
        if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed: $($f.Name)" }
    }
    if (-not $SkipUpload -and -not $already.ContainsKey($slug)) {
        $r2key = "$Prefix/$slug"
        $mb = [math]::Round((Get-Item -LiteralPath $dest).Length / 1MB, 1)
        Write-Host "[$i/$($files.Count)] upload $r2key ($mb MB)"
        & $Wrangler r2 object put "$Bucket/$r2key" --file="$dest" --content-type="audio/mpeg" --remote
        if ($LASTEXITCODE -ne 0) { throw "Upload failed: $slug" }
        Add-Content -LiteralPath $uploadedMarker -Value $slug
        $already[$slug] = $true
    }
}

Write-Host "Done. $($files.Count) sessions processed."
