# Generate zodiac deliverance PNGs via Chrome headless (proper UTF-8, clean upright layout)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path $PSScriptRoot -Parent
$contentPath = Join-Path $repoRoot 'data\zodiac-deliverance-content.json'
$outDir = Join-Path $repoRoot 'data\zodiac-deliverance-png'
$tmpDir = Join-Path $outDir '_html'
New-Item -ItemType Directory -Force -Path $outDir, $tmpDir | Out-Null

$chrome = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Chrome or Edge required for PNG rendering.' }

$sections = Get-Content -Path $contentPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Escape-Html([string]$s) {
    if (-not $s) { return '' }
    return [System.Net.WebUtility]::HtmlEncode($s)
}

function Convert-TextToHtmlBody([string]$text) {
    $sb = New-Object System.Text.StringBuilder
    $lines = $text -split "`n"
    $inList = $false
    $lineIndex = 0

    foreach ($line in $lines) {
        $trim = $line.TrimEnd()
        if ($trim -eq '') {
            if ($inList) { [void]$sb.AppendLine('</ul>'); $inList = $false }
            continue
        }

        $isBullet = $trim.StartsWith([char]0x2022) -or $trim.StartsWith('- ') -or $trim.StartsWith('* ')

        if ($trim -match '^IN THE MIGHTY NAME OF YESHUA') {
            if ($inList) { [void]$sb.AppendLine('</ul>'); $inList = $false }
            [void]$sb.AppendLine("<p class=""closing"">$(Escape-Html $trim)</p>")
            $lineIndex++
            continue
        }

        if ($trim -match '^In the Name of Messiah') {
            if ($inList) { [void]$sb.AppendLine('</ul>'); $inList = $false }
            [void]$sb.AppendLine("<p class=""proclaim"">$(Escape-Html $trim)</p>")
            $lineIndex++
            continue
        }

        if ($isBullet) {
            if (-not $inList) { [void]$sb.AppendLine('<ul>'); $inList = $true }
            $item = $trim.TrimStart([char]0x2022, '-', '*').TrimStart()
            [void]$sb.AppendLine("<li>$(Escape-Html $item)</li>")
            $lineIndex++
            continue
        }

        if ($inList) { [void]$sb.AppendLine('</ul>'); $inList = $false }

        if ($lineIndex -eq 0) {
            [void]$sb.AppendLine("<h1>$(Escape-Html $trim)</h1>")
            $lineIndex++
            continue
        }

        if ($trim -match '^(Physical [Rr]elation|I deny:)') {
            [void]$sb.AppendLine("<p class=""label"">$(Escape-Html $trim)</p>")
            $lineIndex++
            continue
        }

        if ($trim -match '^\(') {
            [void]$sb.AppendLine("<p class=""subtitle"">$(Escape-Html $trim)</p>")
            $lineIndex++
            continue
        }

        [void]$sb.AppendLine("<p>$(Escape-Html $trim)</p>")
        $lineIndex++
    }

    if ($inList) { [void]$sb.AppendLine('</ul>') }
    return $sb.ToString()
}

$css = @'
@charset "UTF-8";
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 1275px;
  background: #f8f8f6;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}
.page {
  width: 1275px;
  background: #fffef8;
  padding: 36px 44px 20px;
}
.frame {
  border: 3px solid #5c4033;
  padding: 32px 36px 17px;
  background: #ffffff;
}
h1 {
  font-size: 26px;
  line-height: 1.3;
  font-weight: 700;
  color: #1a1a1a;
  text-align: left;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #5c4033;
}
.subtitle {
  text-align: left;
  font-style: italic;
  color: #333333;
  margin: -6px 0 14px;
  font-size: 15px;
}
.label {
  font-weight: 700;
  color: #1a1a1a;
  margin: 12px 0 6px;
  font-size: 16px;
}
p {
  font-size: 15px;
  line-height: 1.45;
  margin: 0 0 10px;
  text-align: left;
}
ul {
  margin: 4px 0 10px 24px;
  padding: 0;
}
li {
  font-size: 15px;
  line-height: 1.4;
  margin: 0 0 4px;
}
.proclaim {
  margin-top: 14px;
  font-weight: 700;
  color: #1a1a1a;
}
.closing {
  margin-top: 16px;
  text-align: left;
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  margin-bottom: 0;
}
'@

function Test-SimilarBgColor([System.Drawing.Color]$c, [System.Drawing.Color[]]$bgColors) {
    foreach ($bg in $bgColors) {
        if ([Math]::Abs($c.R - $bg.R) -le 10 -and [Math]::Abs($c.G - $bg.G) -le 10 -and [Math]::Abs($c.B - $bg.B) -le 10) {
            return $true
        }
    }
    return $false
}

function Test-RowHasContent([System.Drawing.Bitmap]$bmp, [int]$y, [System.Drawing.Color[]]$bgColors) {
    $samples = @(24, 120, 400, 700, 1000, 1250)
    foreach ($x in $samples) {
        if ($x -ge $bmp.Width) { continue }
        if (-not (Test-SimilarBgColor $bmp.GetPixel($x, $y) $bgColors)) {
            return $true
        }
    }
    return $false
}

function Crop-BottomWhitespace([string]$pngPath) {
    $bgColors = @(
        [System.Drawing.Color]::FromArgb(248, 248, 246),
        [System.Drawing.Color]::FromArgb(255, 254, 248),
        [System.Drawing.Color]::FromArgb(255, 255, 255)
    )

    $src = [System.Drawing.Bitmap]::FromFile($pngPath)
    try {
        $contentBottom = 0
        for ($y = $src.Height - 1; $y -ge 0; $y--) {
            if (Test-RowHasContent $src $y $bgColors) {
                $contentBottom = $y
                break
            }
        }

        $currentBottomMargin = $src.Height - $contentBottom - 1
        $newBottomMargin = [int][Math]::Max(18, [Math]::Round($currentBottomMargin / 2))
        $newHeight = [Math]::Min($src.Height, $contentBottom + $newBottomMargin + 1)

        if ($newHeight -ge $src.Height) {
            return [PSCustomObject]@{ Width = $src.Width; Height = $src.Height }
        }

        $cropped = New-Object System.Drawing.Bitmap $src.Width, $newHeight
        $graphics = [System.Drawing.Graphics]::FromImage($cropped)
        try {
            $graphics.DrawImage($src, 0, 0, (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $newHeight), [System.Drawing.GraphicsUnit]::Pixel)
        }
        finally {
            $graphics.Dispose()
        }

        $width = $cropped.Width
        $heightOut = $cropped.Height
        $src.Dispose()
        $src = $null
        $tmpPath = "$pngPath.tmp"
        $cropped.Save($tmpPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
        $cropped = $null
        Move-Item -Force $tmpPath $pngPath
        return [PSCustomObject]@{ Width = $width; Height = $heightOut }
    }
    finally {
        if ($src) { $src.Dispose() }
    }
}

foreach ($prop in $sections.PSObject.Properties | Sort-Object Name) {
    $name = $prop.Name
    $text = [string]$prop.Value
    $body = Convert-TextToHtmlBody $text

    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1275">
<style>$css</style>
</head>
<body>
<div class="page">
  <div class="frame">
    $body
  </div>
</div>
</body>
</html>
"@

    $htmlPath = Join-Path $tmpDir "$name.html"
    [System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.UTF8Encoding]::new($false))

    $lineCount = ($text -split "`n").Count
    $height = [int][Math]::Max(700, [Math]::Min(1600, 260 + ($lineCount * 26) + ($text.Length / 7)))
    $pngPath = Join-Path $outDir "$name.png"
    $uri = ([Uri]((Resolve-Path $htmlPath).Path)).AbsoluteUri

    $proc = Start-Process -FilePath $chrome -ArgumentList @(
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        "--window-size=1275,$height",
        "--screenshot=$pngPath",
        $uri
    ) -Wait -PassThru -NoNewWindow

    if ($proc.ExitCode -ne 0 -or -not (Test-Path $pngPath)) {
        throw "Chrome failed rendering $name (exit $($proc.ExitCode))"
    }

    $dims = Crop-BottomWhitespace $pngPath
    Write-Host "Created $pngPath ($($dims.Width) x $($dims.Height))"
}

Write-Host "`nDone. Output: $outDir"
