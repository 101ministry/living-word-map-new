# Stamp exact Telegram topic titles onto a blank 16:9 template.
# Do not let an image model invent or soften labels.
param(
  [int[]]$Days = 1..33,
  [string]$GroupedList = "C:\Users\tweed\Downloads\Telegram Desktop\grouped by 20s list of topics.txt",
  [string]$Topics666 = (Join-Path $PSScriptRoot "..\data\TOPICS-666.txt"),
  [string]$Template = "C:\Users\tweed\.cursor\projects\c-Users-tweed-living-word-map\assets\repentance-2026-r1s1-blank-template.png",
  [string]$OutDir = "C:\Users\tweed\.cursor\projects\c-Users-tweed-living-word-map\assets"
)

Add-Type -AssemblyName System.Drawing

function Get-TopicMap {
  $map = @{}
  Get-Content -LiteralPath $GroupedList -Encoding UTF8 | ForEach-Object {
    if ($_ -notmatch '^\s*(\d{1,3})\.\s*(.+?)\s*$') { return }
    $n = [int]$Matches[1]
    $t = $Matches[2].Trim()
    if ($t -match '^(.*?)\s{2,}\d+\.') { $t = $Matches[1].Trim() }
    $t = [regex]::Replace($t, '\s+Day\s+\d+\s*$', '')
    $map[$n] = $t
  }
  $max = ($map.Keys | Measure-Object -Maximum).Maximum
  if ($max -ge 666) { return $map }
  Get-Content -LiteralPath $Topics666 -Encoding UTF8 | ForEach-Object {
    if ($_ -notmatch '^\s*(\d{3})\.\s*(.+)$') { return }
    $n = [int]$Matches[1]
    if ($n -le $max) { return }
    if ($n -gt 666) { return }
    $raw = ($Matches[2] -split ', from a root')[0].Trim()
    $map[$n] = $raw
  }
  return $map
}

$topics = Get-TopicMap
$missing = @()
1..666 | ForEach-Object { if (-not $topics.ContainsKey($_)) { $missing += $_ } }
if ($missing.Count) { throw "Missing topic numbers: $($missing -join ', ')" }

$srcImg = [System.Drawing.Image]::FromFile($Template)
$W = $srcImg.Width
$H = $srcImg.Height

foreach ($day in $Days) {
  $start = (($day - 1) * 20) + 1
  $end = [Math]::Min($start + 19, 666)
  if ($start -gt 666) { continue }

  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.TextRenderingHint = 'ClearTypeGridFit'
  $g.DrawImage($srcImg, 0, 0, $W, $H)

  $overlay = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(210, 18, 16, 12))
  $g.FillRectangle($overlay, 0, [int]($H * 0.11), $W, [int]($H * 0.77))
  $overlay.Dispose()

  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 212, 175, 55))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 240, 230))
  $red = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 196, 72, 62))

  $fontDay = New-Object System.Drawing.Font 'Segoe UI', ([Math]::Max(22, $H / 22)), ([System.Drawing.FontStyle]::Bold)
  $fontSub = New-Object System.Drawing.Font 'Segoe UI', ([Math]::Max(13, $H / 42)), ([System.Drawing.FontStyle]::Bold)
  $g.DrawString("Day $day", $fontDay, $gold, [float]($W * 0.78), [float]($H * 0.125))
  $g.DrawString("Round 1  |  Set 1  |  You and your bloodline  |  20 Topics", $fontSub, $red, [float]($W * 0.05), [float]($H * 0.20))

  $family = 'Segoe UI'
  $maxPt = [Math]::Max(10, [int]($H / 52))
  $colW = [float]($W * 0.455)
  $leftX = [float]($W * 0.04)
  $rightX = [float]($W * 0.51)
  $y0 = [float]($H * 0.255)
  $rowH = [float](($H * 0.60) / 10)
  $nums = $start..$end
  for ($i = 0; $i -lt $nums.Count; $i++) {
    $num = $nums[$i]
    $label = '{0:D3}. {1}' -f $num, $topics[$num]
    $x = if ($i -lt 10) { $leftX } else { $rightX }
    $y = $y0 + (($i % 10) * $rowH)
    $rect = New-Object System.Drawing.RectangleF $x, $y, $colW, ($rowH - 1)
    $itemFont = $null
    for ($pt = $maxPt; $pt -ge 7; $pt--) {
      $try = New-Object System.Drawing.Font $family, $pt
      $sz = $g.MeasureString($label, $try, [int]$colW)
      if ($sz.Height -le ($rowH - 1)) {
        $itemFont = $try
        break
      }
      $try.Dispose()
    }
    if (-not $itemFont) { $itemFont = New-Object System.Drawing.Font $family, 7 }
    $g.DrawString($label, $itemFont, $white, $rect)
    $itemFont.Dispose()
  }

  $name = 'repentance-2026-day-{0:D3}-r1s1.png' -f $day
  $dest = Join-Path $OutDir $name
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)

  $fontDay.Dispose(); $fontSub.Dispose()
  $gold.Dispose(); $white.Dispose(); $red.Dispose()
  $g.Dispose(); $bmp.Dispose()
}

$srcImg.Dispose()
Write-Host "Stamped days $($Days -join ',') into $OutDir"
