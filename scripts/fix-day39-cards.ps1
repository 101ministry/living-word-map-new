# Day 39: foreground topic banner + header on top; large readable type, no truncation.
Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\36-40\day 39.png'
$tmp = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\36-40\day 39-fixed-tmp.png'

$topics = @(
    'Bastard Children Born Outside The Protection Of Marriage',
    'Being Polluted By The Leaven Of The Herodians',
    'Participating In Fornication',
    'Participating In Molestation',
    'Participating In Incest',
    'Participating In Orgies',
    'Participating In Masturbation',
    'Participating In Bestiality',
    'Participating In Homosexuality',
    'Participating In Lesbianism',
    'Participating In Gender Confusion',
    'Participating In Pornography',
    'Serving The Spirit Spouse Gods And Inviting Others To Do The Same'
)

$bmp = [System.Drawing.Bitmap]::FromFile($src)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$headerH = 44
$bannerTop = $headerH
$bannerH = 210
$cardW = [int][math]::Floor($bmp.Width / 13)

$bg = [System.Drawing.Color]::FromArgb(8, 8, 8)
$gold = [System.Drawing.Color]::FromArgb(201, 162, 39)
$white = [System.Drawing.Color]::White
$red = [System.Drawing.Color]::FromArgb(230, 50, 50)
$yellow = [System.Drawing.Color]::FromArgb(255, 200, 40)

$brushBg = New-Object System.Drawing.SolidBrush($bg)
$brushWhite = New-Object System.Drawing.SolidBrush($white)
$brushRed = New-Object System.Drawing.SolidBrush($red)
$brushYellow = New-Object System.Drawing.SolidBrush($yellow)
$brushShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 0, 0, 0))
$penGold = New-Object System.Drawing.Pen($gold, 2.5)
$penRed = New-Object System.Drawing.Pen($red, 2)

# Shadow under banner (reads as foreground over scene)
$g.FillRectangle($brushShadow, 0, ($bannerTop + $bannerH), $bmp.Width, 22)

# Foreground banner plate over the scene
$g.FillRectangle($brushBg, 0, $bannerTop, $bmp.Width, $bannerH)

function Measure-LineWidth {
    param($graphics, [string]$text, $font)
    return [float]$graphics.MeasureString($text, $font).Width
}

function Get-WrappedLines {
    param($graphics, [string]$text, $font, [float]$maxWidth)
    $words = $text -split '\s+'
    $lines = [System.Collections.Generic.List[string]]::new()
    $current = ''
    foreach ($w in $words) {
        $test = if ($current) { "$current $w" } else { $w }
        $wWidth = Measure-LineWidth -graphics $graphics -text $test -font $font
        if ($wWidth -gt $maxWidth -and $current) {
            $lines.Add($current) | Out-Null
            $current = $w
        } else {
            $current = $test
        }
    }
    if ($current) { $lines.Add($current) | Out-Null }
    return ,$lines.ToArray()
}

function Get-BestFont {
    param($graphics, [string]$text, [float]$maxWidth, [float]$maxHeight)
    for ($size = 16.0; $size -ge 8.0; $size -= 0.25) {
        $font = New-Object System.Drawing.Font('Arial', $size, [System.Drawing.FontStyle]::Bold)
        $lines = Get-WrappedLines -graphics $graphics -text $text -font $font -maxWidth $maxWidth
        $lineH = $font.GetHeight($graphics)
        $totalH = $lines.Count * $lineH
        $ok = $true
        foreach ($line in $lines) {
            if ((Measure-LineWidth -graphics $graphics -text $line -font $font) -gt ($maxWidth + 1.5)) {
                $ok = $false
                break
            }
        }
        if ($ok -and $totalH -le $maxHeight) {
            return @{ Font = $font; Lines = $lines; LineH = $lineH; TotalH = $totalH }
        }
        $font.Dispose()
    }
    $font = New-Object System.Drawing.Font('Arial', 8.0, [System.Drawing.FontStyle]::Bold)
    $lines = Get-WrappedLines -graphics $graphics -text $text -font $font -maxWidth $maxWidth
    $lineH = $font.GetHeight($graphics)
    return @{ Font = $font; Lines = $lines; LineH = $lineH; TotalH = ($lines.Count * $lineH) }
}

$fontNum = New-Object System.Drawing.Font('Arial Black', 18, [System.Drawing.FontStyle]::Bold)

for ($i = 0; $i -lt 13; $i++) {
    $x = $i * $cardW
    $rect = New-Object System.Drawing.Rectangle -ArgumentList @($x, $bannerTop, $cardW, $bannerH)

    $g.FillRectangle($brushBg, $rect)
    $g.DrawRectangle($penGold, ($rect.X + 1), ($rect.Y + 1), ($rect.Width - 2), ($rect.Height - 2))

    $num = [string]($i + 1)
    $g.DrawString($num, $fontNum, $brushRed, [float]($rect.X + 4), [float]($rect.Y + 4))

    $padX = 4
    $textTopMin = $rect.Y + 32
    $textMaxW = [float]($rect.Width - ($padX * 2) - 2)
    $textMaxH = [float]($rect.Bottom - $textTopMin - 8)

    $fit = Get-BestFont -graphics $g -text $topics[$i] -maxWidth $textMaxW -maxHeight $textMaxH
    $y = [float]($textTopMin + [math]::Max(0, ($textMaxH - $fit.TotalH) / 2))
    foreach ($line in $fit.Lines) {
        if ($y + $fit.LineH -gt $rect.Bottom - 3) { break }
        $g.DrawString($line, $fit.Font, $brushWhite, [float]($rect.X + $padX), $y)
        $y += $fit.LineH
    }
    $fit.Font.Dispose()
}

# HEADER redrawn LAST so it stays in front of banner
$g.FillRectangle($brushBg, 0, 0, $bmp.Width, $headerH)
$fontSmall = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
$fontTitle = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Bold)
$fontDay = New-Object System.Drawing.Font('Arial Black', 20, [System.Drawing.FontStyle]::Bold)
$fontBox = New-Object System.Drawing.Font('Arial', 12, [System.Drawing.FontStyle]::Bold)

$g.DrawString('R&R TEMPLATE | R&R', $fontSmall, $brushWhite, 10, 12)
$g.DrawString('REPENTANCE AND REDEMPTION', $fontTitle, $brushWhite, 220, 10)
$g.DrawString('Day 39', $fontDay, $brushYellow, 620, 6)

$boxText = 'Thirteen Topics of Sexual Perversion'
$boxW = [int][math]::Ceiling((Measure-LineWidth -graphics $g -text $boxText -font $fontBox) + 24)
$boxX = $bmp.Width - $boxW - 12
$boxRect = New-Object System.Drawing.Rectangle -ArgumentList @($boxX, 8, $boxW, 28)
$g.DrawRectangle($penRed, $boxRect)
$g.DrawString($boxText, $fontBox, $brushRed, [float]($boxX + 10), 12)

$bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

Copy-Item -Force $tmp $src
Remove-Item -Force $tmp
Write-Output "Saved: $src"
