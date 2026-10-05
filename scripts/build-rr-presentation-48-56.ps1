# Generate 9:16 R&R topic cards + click-through slideshows for Days 48-56
Add-Type -AssemblyName System.Drawing

$outRoot = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\48-56-presentation'
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null

$days = [ordered]@{
  48 = @(
    'Familiar Identity Of Envy',
    'Familiar Identity Of Escapism',
    'Familiar Identity Of Fantasy',
    'Familiar Identity Of Fatigue',
    'Familiar Identity Of Faultfinding',
    'Familiar Identity Of Fear',
    'Familiar Identity Of Fear Of Accusation',
    'Familiar Identity Of Fear Of Condemnation',
    'Familiar Identity Of Fear Of Disapproval',
    'Familiar Identity Of Fear Of Failure',
    'Familiar Identity Of Fear Of Judgment'
  )
  49 = @(
    'Familiar Identity Of Fear Of Man',
    'Familiar Identity Of Fear Of Reproof',
    'Familiar Identity Of Fighting',
    'Familiar Identity Of Forgetfulness',
    'Familiar Identity Of Frigidity',
    'Familiar Identity Of Gluttony',
    'Familiar Identity Of Gossip',
    'Familiar Identity Of Greed',
    'Familiar Identity Of Hallucinations',
    'Familiar Identity Of Hatred',
    'Familiar Identity Of Headache'
  )
  50 = @(
    'Familiar Identity Of Heartbreak',
    'Familiar Identity Of Heaviness',
    'Familiar Identity Of Hopelessness',
    'Familiar Identity Of Hurt',
    'Familiar Identity Of Inadequacy',
    'Familiar Identity Of Incubus',
    'Familiar Identity Of Indifference',
    'Familiar Identity Of Inferiority',
    'Familiar Identity Of Infirmity',
    'Familiar Identity Of Insanity',
    'Familiar Identity Of Insomnia',
    'Familiar Identity Of Intellectualism'
  )
  51 = @(
    'Familiar Identity Of Jealousy',
    'Familiar Identity Of Kleptomania',
    'Familiar Identity Of Laziness',
    'Familiar Identity Of Legalism',
    'Familiar Identity Of Listlessness',
    'Familiar Identity Of Loneliness',
    'Familiar Identity Of Lying Spirit',
    'Familiar Identity Of Mania',
    'Familiar Identity Of Materialism',
    'Familiar Identity Of Mockery',
    'Familiar Identity Of Molestation',
    'Familiar Identity Of Moonstruck'
  )
  52 = @(
    'Familiar Identity Of Murder',
    'Familiar Identity Of Nervousness',
    'Familiar Identity Of Nightmares',
    'Familiar Identity Of Obesity',
    'Familiar Identity Of Occult Spirits',
    'Familiar Identity Of Overburden',
    'Familiar Identity Of Paranoia',
    'Familiar Identity Of Passivity',
    'Familiar Identity Of Persecution',
    'Familiar Identity Of Playacting',
    'Familiar Identity Of Possessiveness'
  )
  53 = @(
    'Familiar Identity Of Pride',
    'Familiar Identity Of Procrastination',
    'Familiar Identity Of Quarreling',
    'Familiar Identity Of Rape',
    'Familiar Identity Of Rationalism',
    'Familiar Identity Of Rebellion',
    'Familiar Identity Of Religiosity',
    'Familiar Identity Of Resentment',
    'Familiar Identity Of Restlessness',
    'Familiar Identity Of Retaliation',
    'Familiar Identity Of Retardation'
  )
  54 = @(
    'Familiar Identity Of Revenge',
    'Familiar Identity Of Ritualism',
    'Familiar Identity Of Sadness And Crying',
    'Familiar Identity Of Schizophrenia',
    'Familiar Identity Of Selfishness',
    'Familiar Identity Of Self-pity',
    'Familiar Identity Of Senility',
    'Familiar Identity Of Sensitivity',
    'Familiar Identity Of Sexual Perversion',
    'Familiar Identity Of Shyness',
    'Familiar Identity Of Sorrow'
  )
  55 = @(
    'Familiar Identity Of Spirit Of Error',
    'Familiar Identity Of Spiritism',
    'Familiar Identity Of Spite',
    'Familiar Identity Of Stoicism',
    'Familiar Identity Of Strife',
    'Familiar Identity Of Stubbornness',
    'Familiar Identity Of Succubus',
    'Familiar Identity Of Suicide',
    'Familiar Identity Of Suspicion',
    'Familiar Identity Of Temper',
    'Familiar Identity Of Tension'
  )
  56 = @(
    'Familiar Identity Of Timidity',
    'Familiar Identity Of Unfairness',
    'Familiar Identity Of Unforgiveness',
    'Familiar Identity Of Vanity',
    'Familiar Identity Of Violence',
    'Familiar Identity Of Weary In Well Doing',
    'Familiar Identity Of Witchcraft',
    'Familiar Identity Of Worry'
  )
}

$W = 1080
$H = 1920

function Get-WrappedLines {
  param($graphics, [string]$text, $font, [float]$maxWidth)
  $words = $text -split '\s+'
  $lines = [System.Collections.Generic.List[string]]::new()
  $current = ''
  foreach ($w in $words) {
    $test = if ($current) { "$current $w" } else { $w }
    if ($graphics.MeasureString($test, $font).Width -gt $maxWidth -and $current) {
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
  param($graphics, [string]$text, [float]$maxWidth, [float]$maxHeight, [float]$startSize)
  for ($size = $startSize; $size -ge 28; $size -= 2) {
    $font = New-Object System.Drawing.Font('Arial', $size, [System.Drawing.FontStyle]::Bold)
    $lines = Get-WrappedLines -graphics $graphics -text $text -font $font -maxWidth $maxWidth
    $lineH = $font.GetHeight($graphics)
    $totalH = $lines.Count * $lineH
    $ok = $true
    foreach ($line in $lines) {
      if ($graphics.MeasureString($line, $font).Width -gt ($maxWidth + 2)) { $ok = $false; break }
    }
    if ($ok -and $totalH -le $maxHeight) {
      return @{ Font = $font; Lines = $lines; LineH = $lineH; TotalH = $totalH }
    }
    $font.Dispose()
  }
  $font = New-Object System.Drawing.Font('Arial', 28, [System.Drawing.FontStyle]::Bold)
  $lines = Get-WrappedLines -graphics $graphics -text $text -font $font -maxWidth $maxWidth
  return @{ Font = $font; Lines = $lines; LineH = $font.GetHeight($graphics); TotalH = ($lines.Count * $font.GetHeight($graphics)) }
}

function New-TopicCard {
  param([int]$day, [int]$num, [int]$total, [string]$title, [string]$path)

  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  # Background gradient (dark)
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0,0),
    (New-Object System.Drawing.Point 0,$H),
    [System.Drawing.Color]::FromArgb(12,12,16),
    [System.Drawing.Color]::FromArgb(28,18,22)
  )
  $g.FillRectangle($bgBrush, 0, 0, $W, $H)

  # Subtle vignette border
  $penGold = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(201,162,39), 6)
  $g.DrawRectangle($penGold, 24, 24, ($W - 48), ($H - 48))
  $penInner = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(80,201,162,39), 2)
  $g.DrawRectangle($penInner, 36, 36, ($W - 72), ($H - 72))

  $brushWhite = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $brushGold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(201,162,39))
  $brushRed = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200,40,40))
  $brushMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180,180,180))
  $brushYellow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,210,70))

  $fontBrand = New-Object System.Drawing.Font('Arial', 22, [System.Drawing.FontStyle]::Bold)
  $fontDay = New-Object System.Drawing.Font('Arial Black', 42, [System.Drawing.FontStyle]::Bold)
  $fontSub = New-Object System.Drawing.Font('Arial', 20, [System.Drawing.FontStyle]::Bold)
  $fontNumHuge = New-Object System.Drawing.Font('Arial Black', 120, [System.Drawing.FontStyle]::Bold)
  $fontFooter = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Bold)
  $fontFooterSm = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Bold)

  $centerFmt = New-Object System.Drawing.StringFormat
  $centerFmt.Alignment = [System.Drawing.StringAlignment]::Center
  $centerFmt.LineAlignment = [System.Drawing.StringAlignment]::Near

  # Header
  $g.DrawString('R&R  |  REPENTANCE AND REDEMPTION', $fontBrand, $brushMuted, (New-Object System.Drawing.RectangleF 60, 70, ($W-120), 40), $centerFmt)
  $g.DrawString("Day $day", $fontDay, $brushYellow, (New-Object System.Drawing.RectangleF 60, 120, ($W-120), 70), $centerFmt)
  $g.DrawString('Destructive Identities', $fontSub, $brushRed, (New-Object System.Drawing.RectangleF 60, 195, ($W-120), 40), $centerFmt)

  # Big number
  $numText = [string]$num
  $numSize = $g.MeasureString($numText, $fontNumHuge)
  $g.DrawString($numText, $fontNumHuge, $brushGold, (($W - $numSize.Width) / 2), 280)

  # Topic title block
  $titleRectTop = 520
  $titleMaxW = [float]($W - 140)
  $titleMaxH = [float]820
  $fit = Get-BestFont -graphics $g -text $title -maxWidth $titleMaxW -maxHeight $titleMaxH -startSize 64
  $y = [float]($titleRectTop + [math]::Max(0, ($titleMaxH - $fit.TotalH) / 2) - 80)
  foreach ($line in $fit.Lines) {
    $lw = $g.MeasureString($line, $fit.Font).Width
    $g.DrawString($line, $fit.Font, $brushWhite, (($W - $lw) / 2), $y)
    $y += $fit.LineH
  }
  $fit.Font.Dispose()

  # Progress dots / of total
  $g.DrawString("$num of $total", $fontSub, $brushMuted, (New-Object System.Drawing.RectangleF 60, 1500, ($W-120), 40), $centerFmt)

  # Footer banner
  $footerY = 1620
  $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,210,70))), 0, $footerY, $W, ($H - $footerY))
  $footerText = 'TAKE NO PART IN THE UNFRUITFUL WORKS OF DARKNESS,'
  $footerText2 = 'BUT INSTEAD EXPOSE THEM.'
  $g.DrawString($footerText, $fontFooter, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)), (New-Object System.Drawing.RectangleF 40, ($footerY + 40), ($W-80), 40), $centerFmt)
  $g.DrawString($footerText2, $fontFooter, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)), (New-Object System.Drawing.RectangleF 40, ($footerY + 85), ($W-80), 40), $centerFmt)
  $g.DrawString('EPHESIANS 5:11', $fontFooterSm, $brushRed, (New-Object System.Drawing.RectangleF 40, ($footerY + 145), ($W-80), 40), $centerFmt)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  $bgBrush.Dispose()
}

function New-DaySlideshowHtml {
  param([int]$day, [string[]]$topics, [string]$dayDir, [string]$htmlPath)

  $slides = for ($i = 0; $i -lt $topics.Count; $i++) {
    $n = $i + 1
    $file = ('{0:D2}.png' -f $n)
    "    { file: '$file', title: $($topics[$i] | ConvertTo-Json -Compress) }"
  }
  $slidesJs = $slides -join ",`n"
  $topicCount = $topics.Count

  $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Day $day - Destructive Identities</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%; height: 100%;
    background: #0a0a0c;
    font-family: Arial, Helvetica, sans-serif;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }
  #stage {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    position: relative;
  }
  #frame {
    width: min(100vw, calc(100vh * 9 / 16));
    height: min(100vh, calc(100vw * 16 / 9));
    position: relative;
    overflow: hidden;
    background: #111;
    box-shadow: 0 0 40px rgba(0,0,0,.6);
  }
  #titleSlide, #frame img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
  }
  #titleSlide {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(180deg, #0c0c10 0%, #1c1216 100%);
    border: 6px solid #c9a227;
    color: #fff;
    text-align: center;
    padding: 40px;
    opacity: 1;
    transform: translateX(0);
    transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .35s ease;
    z-index: 2;
  }
  #titleSlide.hide {
    opacity: 0;
    transform: translateX(-110%);
    pointer-events: none;
  }
  #titleSlide .brand { color: #b0b0b0; font-size: clamp(14px, 3vw, 22px); margin-bottom: 16px; }
  #titleSlide .day { color: #ffd246; font-size: clamp(42px, 10vw, 72px); font-weight: 900; margin-bottom: 12px; }
  #titleSlide .sub { color: #c82828; font-size: clamp(16px, 4vw, 28px); font-weight: 700; margin-bottom: 40px; }
  #titleSlide .cta { color: rgba(255,255,255,.6); font-size: clamp(14px, 3vw, 18px); }
  #frame img {
    object-fit: contain;
    opacity: 0;
    transform: translateX(110%);
    transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .35s ease;
  }
  #frame img.show {
    opacity: 1;
    transform: translateX(0);
  }
  #frame img.exit {
    opacity: 0;
    transform: translateX(-110%);
  }
  #hint {
    position: fixed; bottom: 18px; left: 50%;
    transform: translateX(-50%);
    color: rgba(255,255,255,.55);
    font-size: 14px;
    letter-spacing: .04em;
    pointer-events: none;
    text-align: center;
    max-width: 90vw;
  }
  #progress {
    position: fixed; top: 0; left: 0; height: 4px;
    background: #c9a227;
    width: 0%;
    transition: width .3s ease;
  }
</style>
</head>
<body>
<div id="progress"></div>
<div id="stage" title="Click / tap / Space / Right Arrow for next">
  <div id="frame">
    <div id="titleSlide">
      <div class="brand">R&amp;R | REPENTANCE AND REDEMPTION</div>
      <div class="day">Day $day</div>
      <div class="sub">Destructive Identities</div>
      <div class="cta">$topicCount topics &mdash; click to begin</div>
    </div>
  </div>
</div>
<div id="hint">Click or press Space / Right Arrow for first topic - Day $day</div>
<script>
const slides = [
$slidesJs
];
let i = -1; // -1 = title slide
const frame = document.getElementById('frame');
const titleSlide = document.getElementById('titleSlide');
const progress = document.getElementById('progress');
const hint = document.getElementById('hint');

function showTopic(nextIndex) {
  if (nextIndex < 0 || nextIndex >= slides.length) return;
  if (i === -1) titleSlide.classList.add('hide');
  const prev = frame.querySelector('img.show');
  if (prev) {
    prev.classList.remove('show');
    prev.classList.add('exit');
    setTimeout(() => prev.remove(), 450);
  }
  const img = document.createElement('img');
  img.src = slides[nextIndex].file;
  img.alt = slides[nextIndex].title;
  frame.appendChild(img);
  requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('show')));
  i = nextIndex;
  progress.style.width = ((i + 1) / slides.length * 100) + '%';
  hint.textContent = (i + 1) + ' / ' + slides.length + ' - click / Space / Right Arrow next - Left Arrow previous';
}

function next() {
  if (i < slides.length - 1) showTopic(i + 1);
  else hint.textContent = 'End of Day $day - Left Arrow to go back';
}
function prev() {
  if (i > 0) showTopic(i - 1);
  else if (i === 0) {
    const prev = frame.querySelector('img.show');
    if (prev) {
      prev.classList.remove('show');
      prev.classList.add('exit');
      setTimeout(() => prev.remove(), 450);
    }
    titleSlide.classList.remove('hide');
    i = -1;
    progress.style.width = '0%';
    hint.textContent = 'Click or press Space / Right Arrow for first topic - Day $day';
  }
}

document.getElementById('stage').addEventListener('click', next);
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  if (e.key === 'Home') { e.preventDefault(); prev(); while (i > -1) prev(); }
});
</script>
</body>
</html>
"@
  Set-Content -Path $htmlPath -Value $html -Encoding UTF8
}

$totalCards = 0
foreach ($entry in $days.GetEnumerator()) {
  $day = [int]$entry.Key
  $topics = @($entry.Value)
  $dayDir = Join-Path $outRoot ("day-{0:D2}" -f $day)
  New-Item -ItemType Directory -Force -Path $dayDir | Out-Null

  Write-Output ("Building Day {0} ({1} topics)..." -f $day, $topics.Count)

  for ($i = 0; $i -lt $topics.Count; $i++) {
    $n = $i + 1
    $path = Join-Path $dayDir ('{0:D2}.png' -f $n)
    New-TopicCard -day $day -num $n -total $topics.Count -title ([string]$topics[$i]) -path $path
    $totalCards++
  }

  New-DaySlideshowHtml -day $day -topics $topics -dayDir $dayDir -htmlPath (Join-Path $dayDir 'slideshow.html')
  Write-Output ("Day {0} : {1} cards" -f $day, $topics.Count)
}

# Master index
$linkLines = New-Object System.Collections.Generic.List[string]
foreach ($entry in $days.GetEnumerator()) {
  $day = [int]$entry.Key
  $count = @($entry.Value).Count
  $folder = 'day-{0:D2}' -f $day
  $linkLines.Add(("  <li><a href=""{0}/slideshow.html"">Day {1}</a> - {2} topics</li>" -f $folder, $day, $count)) | Out-Null
}
$index = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>RR Days 48-56 Presentation</title>
<style>
  body { font-family: Arial, sans-serif; background:#0a0a0c; color:#eee; padding:40px; max-width:720px; margin:0 auto; }
  h1 { color:#c9a227; }
  a { color:#ffd246; font-size:1.2rem; }
  li { margin: 14px 0; }
  p { color:#aaa; }
</style>
</head>
<body>
<h1>R&amp;R Days 48-56</h1>
<p>Open a day, then click / tap (or Space / Right Arrow) to advance one topic at a time. Cards are 9:16.</p>
<ul>
$($linkLines -join "`n")
</ul>
</body>
</html>
"@
Set-Content -Path (Join-Path $outRoot 'index.html') -Value $index -Encoding UTF8

Write-Output "TOTAL cards: $totalCards"
Write-Output "Root: $outRoot"
