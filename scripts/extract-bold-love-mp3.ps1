# Extract MP3 audio from Bold Love MP4s for R2 upload.
param(
    [string]$SourceDir = "C:\Users\tweed\Downloads\Video\BOLD LOVE",
    [string]$OutDir = "C:\Users\tweed\Downloads\Music\Bold Love\r2-pieces"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$meta = @{
    1  = @{ slug = "01-introduction-mixed-feelings-part-1.mp3"; title = "Introduction + Mixed Feelings, Part 1"; download = "01 Introduction + Mixed Feelings Part 1.mp3" }
    2  = @{ slug = "02-mixed-feelings.mp3"; title = "Mixed Feelings"; download = "02 Mixed Feelings.mp3" }
    3  = @{ slug = "03-why-dont-we-love-better.mp3"; title = "Why Don't We Love Better"; download = "03 Why Don't We Love Better.mp3" }
    4  = @{ slug = "04-taking-out-hatred-stunned-into-silence.mp3"; title = "Taking Out Hatred + Stunned Into Silence"; download = "04 Taking Out Hatred + Stunned Into Silence.mp3" }
    5  = @{ slug = "05-stunned-into-silence-facing-a-war.mp3"; title = "Stunned Into Silence + Facing a War"; download = "05 Stunned Into Silence + Facing a War.mp3" }
    6  = @{ slug = "06-facing-a-war.mp3"; title = "Facing a War"; download = "06 Facing a War.mp3" }
    7  = @{ slug = "07-our-divine-warrior.mp3"; title = "Our Divine Warrior"; download = "07 Our Divine Warrior.mp3" }
    8  = @{ slug = "08-divine-warrior-resume-of-a-warrior.mp3"; title = "Divine Warrior + Resume of a Warrior"; download = "08 Divine Warrior + Resume of a Warrior.mp3" }
    9  = @{ slug = "09-resume-of-a-warrior.mp3"; title = "Resume of a Warrior"; download = "09 Resume of a Warrior.mp3" }
    11 = @{ slug = "11-hungering-for-restoration-revoking-revenge.mp3"; title = "Hungering for Restoration and Revoking Revenge"; download = "11 Hungering for Restoration and Revoking Revenge.mp3" }
    13 = @{ slug = "13-giving-good-gifts-part-2.mp3"; title = "Giving Good Gifts, Part 2"; download = "13 Giving Good Gifts Part 2.mp3" }
    15 = @{ slug = "15-loving-an-evil-and-loving-a-foolish-person.mp3"; title = "Loving an Evil Person and Loving a Foolish Person"; download = "15 Loving an Evil and Loving a Foolish Person.mp3" }
    17 = @{ slug = "17-loving-a-normal-sinner.mp3"; title = "Loving a Normal Sinner"; download = "17 Loving a Normal Sinner.mp3" }
}

$files = Get-ChildItem -LiteralPath $SourceDir -Filter "*.mp4"
if ($files.Count -eq 0) { throw "No MP4 files in $SourceDir" }

$n = 0
foreach ($f in $files) {
    $day = $null
    if ($f.Name -match '(?i)Day\s+(\d+)') {
        $day = [int]$Matches[1]
    } elseif ($f.Name -match '^01\s') {
        $day = 1
    }
    if (-not $day -or -not $meta.ContainsKey($day)) {
        throw "Could not map day for: $($f.Name)"
    }
    $dest = Join-Path $OutDir $meta[$day].slug
    $n++
    if ((Test-Path -LiteralPath $dest) -and ((Get-Item -LiteralPath $dest).Length -gt 100000)) {
        Write-Host "[$n/$($files.Count)] skip existing $($meta[$day].slug)"
        continue
    }
    Write-Host "[$n/$($files.Count)] $($f.Name) -> $($meta[$day].slug)"
    & ffmpeg -y -hide_banner -loglevel error -i $f.FullName -vn -acodec libmp3lame -q:a 4 $dest
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed: $($f.Name)" }
}

Write-Host "Done. MP3s in $OutDir"
Get-ChildItem -LiteralPath $OutDir -Filter *.mp3 | Sort-Object Name | ForEach-Object {
    "{0,8:N1} MB  {1}" -f ($_.Length / 1MB), $_.Name
}
