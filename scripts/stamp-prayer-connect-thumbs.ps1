# Stamp Part 1–82 titles onto the How the Prayers Connect collage.
# Titles come from data/prayer-connect-bsb/manifest.json (same as Day-01.pdf … Day-82.pdf).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$Root = Split-Path $PSScriptRoot -Parent
$ManifestPath = Join-Path $Root 'data\prayer-connect-bsb\manifest.json'
$Template = Join-Path $Root 'data\prayer-connect-bsb\series-thumb.jpg'
$OutDir = Join-Path $Root 'data\prayer-connect-bsb\thumbs'

if (-not (Test-Path -LiteralPath $Template)) {
  throw "Missing collage: $Template"
}

$days = Get-Content -LiteralPath $ManifestPath -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $Template).Path)
$W = $srcImg.Width
$H = $srcImg.Height

function Wrap-Title([string]$title) {
  $t = $title.Trim()
  if ($t -match '^I\.\s+') { $t = $t.Substring(3).Trim() }
  return $t
}

foreach ($d in $days) {
  $n = [int]$d.day
  $title = Wrap-Title ([string]$d.title)
  $label = "Part $n - $title"

  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.TextRenderingHint = 'ClearTypeGridFit'
  $g.DrawImage($srcImg, 0, 0, $W, $H)

  $bandY = if ($title.Length -gt 160) { [int]($H * 0.50) }
           elseif ($title.Length -gt 90) { [int]($H * 0.58) }
           else { [int]($H * 0.72) }
  $bandH = $H - $bandY
  $overlay = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 10, 8, 6))
  $g.FillRectangle($overlay, 0, $bandY, $W, $bandH)
  $overlay.Dispose()

  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 245, 245))
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $fmt.Trimming = [System.Drawing.StringTrimming]::None

  $rect = New-Object System.Drawing.RectangleF ([float]($W * 0.04), [float]($bandY + 8), [float]($W * 0.92), [float]($bandH - 16))
  $pt = if ($title.Length -le 24) { [Math]::Max(28, [int]($H / 14)) }
        elseif ($title.Length -le 80) { [Math]::Max(20, [int]($H / 18)) }
        else { [Math]::Max(16, [int]($H / 22)) }
  $font = $null
  while ($pt -ge 12) {
    if ($font) { $font.Dispose() }
    $font = New-Object System.Drawing.Font 'Segoe UI', $pt, ([System.Drawing.FontStyle]::Bold)
    $sz = $g.MeasureString($label, $font, $rect.Size, $fmt)
    if ($sz.Height -le $rect.Height -and $sz.Width -le $rect.Width * 1.02) { break }
    $pt -= 1
  }

  $g.DrawString($label, $font, $gold, $rect, $fmt)

  $out = Join-Path $OutDir ("Part-{0:D2}.jpg" -f $n)
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]90)
  $bmp.Save($out, $enc, $ep)

  $font.Dispose()
  $gold.Dispose()
  $fmt.Dispose()
  $g.Dispose()
  $bmp.Dispose()
  Write-Host $out
}

$srcImg.Dispose()
Write-Host "Wrote $($days.Count) thumbs to $OutDir"
