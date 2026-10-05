# Build Familiar Identities recap video (9:16) with Be Filled pitched to A=444Hz
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$root = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\48-56-presentation'
$outDir = Join-Path $root 'recap-video'
$cardsDir = Join-Path $outDir 'cards'
$mp3In = 'C:\Users\tweed\Downloads\Music\Be Filled - World Edition.mp3'
$mp3Out = Join-Path $outDir 'be-filled-444hz.mp3'
$listFile = Join-Path $outDir 'concat.txt'
$videoOut = Join-Path $outDir 'Familiar-Identities-Recap-Be-Filled.mp4'

New-Item -ItemType Directory -Force -Path $cardsDir | Out-Null

$W = 1080
$H = 1920

function New-TextCard {
  param(
    [string]$path,
    [string[]]$lines,
    [string]$eyebrow = '',
    [string]$footer = 'EPHESIANS 5:11',
    [string]$accent = 'gold' # gold | red | spirit
  )

  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0,0),
    (New-Object System.Drawing.Point 0,$H),
    [System.Drawing.Color]::FromArgb(10,10,14),
    [System.Drawing.Color]::FromArgb(28,16,20)
  )
  $g.FillRectangle($bg, 0, 0, $W, $H)

  $gold = [System.Drawing.Color]::FromArgb(201,162,39)
  $spirit = [System.Drawing.Color]::FromArgb(120,190,255)
  $red = [System.Drawing.Color]::FromArgb(200,40,40)
  $accentColor = switch ($accent) {
    'red' { $red }
    'spirit' { $spirit }
    default { $gold }
  }

  $pen = New-Object System.Drawing.Pen $accentColor, 6
  $g.DrawRectangle($pen, 28, 28, ($W-56), ($H-56))
  $pen2 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, $accentColor.R, $accentColor.G, $accentColor.B)), 2
  $g.DrawRectangle($pen2, 42, 42, ($W-84), ($H-84))

  $brushWhite = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $brushMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180,180,180))
  $brushAccent = New-Object System.Drawing.SolidBrush $accentColor
  $brushBlack = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
  $brushYellow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,210,70))

  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Near

  # Top brand + bottom footer match main presentation text size (42pt)
  $fontBrand = New-Object System.Drawing.Font('Arial', 42, [System.Drawing.FontStyle]::Bold)
  $fontEye = New-Object System.Drawing.Font('Arial', 42, [System.Drawing.FontStyle]::Bold)
  $fontMain = New-Object System.Drawing.Font('Arial', 42, [System.Drawing.FontStyle]::Bold)
  $fontFooter = New-Object System.Drawing.Font('Arial', 42, [System.Drawing.FontStyle]::Bold)

  # Brand wraps at 42pt so it is not clipped
  $brandY = 60
  foreach ($bl in @('R&R  |  REPENTANCE', 'AND REDEMPTION')) {
    $g.DrawString($bl, $fontBrand, $brushMuted, (New-Object System.Drawing.RectangleF 40, $brandY, ($W-80), 55), $fmt)
    $brandY += 52
  }
  if ($eyebrow) {
    $g.DrawString($eyebrow, $fontEye, $brushAccent, (New-Object System.Drawing.RectangleF 40, ($brandY + 8), ($W-80), 60), $fmt)
  }

  # Wrap main lines
  $y = 420
  foreach ($line in $lines) {
    $words = $line -split '\s+'
    $cur = ''
    $wrapped = New-Object System.Collections.Generic.List[string]
    foreach ($word in $words) {
      $test = if ($cur) { "$cur $word" } else { $word }
      if ($g.MeasureString($test, $fontMain).Width -gt ($W - 140) -and $cur) {
        $wrapped.Add($cur) | Out-Null
        $cur = $word
      } else { $cur = $test }
    }
    if ($cur) { $wrapped.Add($cur) | Out-Null }
    foreach ($wl in $wrapped) {
      $g.DrawString($wl, $fontMain, $brushWhite, (New-Object System.Drawing.RectangleF 70, $y, ($W-140), 80), $fmt)
      $y += 70
    }
    $y += 30
  }

  # Footer banner (taller for 42pt body-matched type; lines pre-wrapped to fit width)
  $fy = 1420
  $g.FillRectangle($brushYellow, 0, $fy, $W, ($H - $fy))
  $footerLines = @(
    'TAKE NO PART IN THE',
    'UNFRUITFUL WORKS OF',
    'DARKNESS, BUT INSTEAD',
    'EXPOSE THEM.'
  )
  $ffy = $fy + 28
  foreach ($fl in $footerLines) {
    $g.DrawString($fl, $fontFooter, $brushBlack, (New-Object System.Drawing.RectangleF 30, $ffy, ($W-60), 55), $fmt)
    $ffy += 56
  }
  $g.DrawString($footer, $fontFooter, (New-Object System.Drawing.SolidBrush $red), (New-Object System.Drawing.RectangleF 30, ($ffy + 10), ($W-60), 55), $fmt)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $bg.Dispose()
}

Write-Output 'Creating title / bridge / closing cards...'
New-TextCard -path (Join-Path $cardsDir '00-title.png') -eyebrow 'FAMILIAR IDENTITIES RECAP' -lines @(
  'Filled With Familiar Spirits',
  '- or -',
  'Filled With the Holy Spirit'
) -accent 'gold' -footer 'EPHESIANS 5:18'

New-TextCard -path (Join-Path $cardsDir '00-filled-familiar.png') -eyebrow 'THE WARNING' -lines @(
  'A believer walks either filled',
  'with Holy Spirit or with',
  'familiar spirits...'
) -accent 'red' -footer 'EPHESIANS 5:11'

# Closing repeats the key line so it never "disappears" at the end
New-TextCard -path (Join-Path $cardsDir 'zz-closing.png') -eyebrow 'BE FILLED' -lines @(
  'A believer walks either filled',
  'with Holy Spirit or with',
  'familiar spirits...',
  '',
  'Be filled with the Spirit.'
) -accent 'spirit' -footer 'EPHESIANS 5:18'

# Collect all scene slides in day order
$sceneFiles = New-Object System.Collections.Generic.List[string]
foreach ($day in 45..56) {
  $dayDir = Join-Path $root ('day-{0:D2}' -f $day)
  Get-ChildItem $dayDir -Filter '*.png' |
    Where-Object { $_.Name -match '^\d{2}\.png$' } |
    Sort-Object Name |
    ForEach-Object { $sceneFiles.Add($_.FullName) | Out-Null }
}
Write-Output ("Scene slides: {0}" -f $sceneFiles.Count)

# Ordered playlist: title + warning + scenes + closing (key line bookends the presentation)
$playlist = New-Object System.Collections.Generic.List[string]
$playlist.Add((Join-Path $cardsDir '00-title.png')) | Out-Null
$playlist.Add((Join-Path $cardsDir '00-filled-familiar.png')) | Out-Null
foreach ($f in $sceneFiles) { $playlist.Add($f) | Out-Null }
$playlist.Add((Join-Path $cardsDir 'zz-closing.png')) | Out-Null
Write-Output ("Total frames: {0}" -f $playlist.Count)

# Pitch audio 440 -> 444 Hz (ratio 444/440), preserve duration via rubberband
$ratio = 444.0 / 440.0
if (Test-Path $mp3Out) {
  Write-Output "Reusing pitched audio: $mp3Out"
} else {
  Write-Output ("Pitching audio to A=444Hz (ratio {0:N6})..." -f $ratio)
  & ffmpeg -y -i $mp3In -af "rubberband=pitch=${ratio}:tempo=1" -c:a libmp3lame -q:a 2 $mp3Out
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg pitch failed" }
}

$audioDur = [double](& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $mp3Out)
Write-Output ("Audio duration: {0:N3}s" -f $audioDur)

$frameCount = $playlist.Count
# Fixed 5 seconds per picture (intros, scenes, closing) — loop music to cover
$hold = 5.0
$durations = @(1..$frameCount | ForEach-Object { $hold })
$videoDur = $frameCount * $hold
$loopsNeeded = [math]::Ceiling($videoDur / $audioDur)
Write-Output ("Hold: {0:N1}s per picture x {1} = {2:N1}s video" -f $hold, $frameCount, $videoDur)
Write-Output ("Music loops needed: {0} (song is {1:N1}s)" -f $loopsNeeded, $audioDur)
Write-Output ("Scenes start at {0:N1}s (after title + warning)" -f (2 * $hold))

# Normalize any JPEG-masquerading-as-PNG so concat demuxer can decode every frame
$normDir = Join-Path $outDir 'normalized'
New-Item -ItemType Directory -Force -Path $normDir | Out-Null
$normPlaylist = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $playlist.Count; $i++) {
  $src = $playlist[$i]
  $hdr = [IO.File]::ReadAllBytes($src)[0..2]
  $dest = Join-Path $normDir ('frame-{0:D4}.png' -f $i)
  $isJpeg = ($hdr[0] -eq 0xFF -and $hdr[1] -eq 0xD8)
  $isPng = ($hdr[0] -eq 0x89 -and $hdr[1] -eq 0x50)
  $needWrite = $true  # always refresh so text-card edits are never stale in normalized/
  if ($needWrite) {
    if ($isPng -and -not $isJpeg) {
      Copy-Item -Force $src $dest
    } else {
      & ffmpeg -y -hide_banner -loglevel error -i $src -frames:v 1 $dest
      if ($LASTEXITCODE -ne 0 -or -not (Test-Path $dest)) { throw "Failed to normalize: $src" }
    }
  }
  $normPlaylist.Add($dest) | Out-Null
}
$playlist = $normPlaylist

# Build concat list with per-file durations (image2 demuxer style)
# Use concat demuxer with duration directives
$sb = New-Object System.Text.StringBuilder
for ($i = 0; $i -lt $playlist.Count; $i++) {
  $p = $playlist[$i] -replace '\\', '/'
  [void]$sb.AppendLine("file '$p'")
  [void]$sb.AppendLine(("duration {0:N3}" -f $durations[$i]))
}
# concat demuxer needs last file repeated without duration for stills
$last = $playlist[$playlist.Count - 1] -replace '\\', '/'
[void]$sb.AppendLine("file '$last'")
[System.IO.File]::WriteAllText($listFile, $sb.ToString())

Write-Output 'Rendering video (this may take several minutes)...'
# Loop pitched music until video ends (-stream_loop -1 + -shortest)
& ffmpeg -y `
  -f concat -safe 0 -i $listFile `
  -stream_loop -1 -i $mp3Out `
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fps=30" `
  -c:v libx264 -preset medium -crf 20 `
  -c:a aac -b:a 192k `
  -shortest `
  -movflags +faststart `
  $videoOut

if ($LASTEXITCODE -ne 0) { throw "ffmpeg video render failed" }

Get-Item $videoOut, $mp3Out | Format-Table Name, Length, LastWriteTime -AutoSize
Write-Output ("DONE: $videoOut ({0:N1}s, music x{1})" -f $videoDur, $loopsNeeded)
