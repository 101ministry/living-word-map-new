# Refresh slideshow HTML for Days 48-56 to include day thumbnail as first content slide.
# Does not regenerate topic cards.

$outRoot = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\48-56-presentation'
$thumbSrc = @{
  48 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\46-50\day 48.png'
  49 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\46-50\day 49.png'
  50 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\46-50\day 50.png'
  51 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\51-55\day 51.png'
  52 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\51-55\day 52.png'
  53 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\51-55\day 53.png'
  54 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\51-55\day 54.png'
  55 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\51-55\day 55.png'
  56 = 'C:\Users\tweed\Downloads\Documents\redemption\series screenshots\56-60\day 56.png'
}

$days = [ordered]@{
  48 = @(
    'Familiar Identity Of Envy','Familiar Identity Of Escapism','Familiar Identity Of Fantasy',
    'Familiar Identity Of Fatigue','Familiar Identity Of Faultfinding','Familiar Identity Of Fear',
    'Familiar Identity Of Fear Of Accusation','Familiar Identity Of Fear Of Condemnation',
    'Familiar Identity Of Fear Of Disapproval','Familiar Identity Of Fear Of Failure',
    'Familiar Identity Of Fear Of Judgment'
  )
  49 = @(
    'Familiar Identity Of Fear Of Man','Familiar Identity Of Fear Of Reproof','Familiar Identity Of Fighting',
    'Familiar Identity Of Forgetfulness','Familiar Identity Of Frigidity','Familiar Identity Of Gluttony',
    'Familiar Identity Of Gossip','Familiar Identity Of Greed','Familiar Identity Of Hallucinations',
    'Familiar Identity Of Hatred','Familiar Identity Of Headache'
  )
  50 = @(
    'Familiar Identity Of Heartbreak','Familiar Identity Of Heaviness','Familiar Identity Of Hopelessness',
    'Familiar Identity Of Hurt','Familiar Identity Of Inadequacy','Familiar Identity Of Incubus',
    'Familiar Identity Of Indifference','Familiar Identity Of Inferiority','Familiar Identity Of Infirmity',
    'Familiar Identity Of Insanity','Familiar Identity Of Insomnia','Familiar Identity Of Intellectualism'
  )
  51 = @(
    'Familiar Identity Of Jealousy','Familiar Identity Of Kleptomania','Familiar Identity Of Laziness',
    'Familiar Identity Of Legalism','Familiar Identity Of Listlessness','Familiar Identity Of Loneliness',
    'Familiar Identity Of Lying Spirit','Familiar Identity Of Mania','Familiar Identity Of Materialism',
    'Familiar Identity Of Mockery','Familiar Identity Of Molestation','Familiar Identity Of Moonstruck'
  )
  52 = @(
    'Familiar Identity Of Murder','Familiar Identity Of Nervousness','Familiar Identity Of Nightmares',
    'Familiar Identity Of Obesity','Familiar Identity Of Occult Spirits','Familiar Identity Of Overburden',
    'Familiar Identity Of Paranoia','Familiar Identity Of Passivity','Familiar Identity Of Persecution',
    'Familiar Identity Of Playacting','Familiar Identity Of Possessiveness'
  )
  53 = @(
    'Familiar Identity Of Pride','Familiar Identity Of Procrastination','Familiar Identity Of Quarreling',
    'Familiar Identity Of Rape','Familiar Identity Of Rationalism','Familiar Identity Of Rebellion',
    'Familiar Identity Of Religiosity','Familiar Identity Of Resentment','Familiar Identity Of Restlessness',
    'Familiar Identity Of Retaliation','Familiar Identity Of Retardation'
  )
  54 = @(
    'Familiar Identity Of Revenge','Familiar Identity Of Ritualism','Familiar Identity Of Sadness And Crying',
    'Familiar Identity Of Schizophrenia','Familiar Identity Of Selfishness','Familiar Identity Of Self-pity',
    'Familiar Identity Of Senility','Familiar Identity Of Sensitivity','Familiar Identity Of Sexual Perversion',
    'Familiar Identity Of Shyness','Familiar Identity Of Sorrow'
  )
  55 = @(
    'Familiar Identity Of Spirit Of Error','Familiar Identity Of Spiritism','Familiar Identity Of Spite',
    'Familiar Identity Of Stoicism','Familiar Identity Of Strife','Familiar Identity Of Stubbornness',
    'Familiar Identity Of Succubus','Familiar Identity Of Suicide','Familiar Identity Of Suspicion',
    'Familiar Identity Of Temper','Familiar Identity Of Tension'
  )
  56 = @(
    'Familiar Identity Of Timidity','Familiar Identity Of Unfairness','Familiar Identity Of Unforgiveness',
    'Familiar Identity Of Vanity','Familiar Identity Of Violence','Familiar Identity Of Weary In Well Doing',
    'Familiar Identity Of Witchcraft','Familiar Identity Of Worry'
  )
}

foreach ($entry in $days.GetEnumerator()) {
  $day = [int]$entry.Key
  $topics = @($entry.Value)
  $dayDir = Join-Path $outRoot ('day-{0:D2}' -f $day)
  New-Item -ItemType Directory -Force -Path $dayDir | Out-Null

  $src = $thumbSrc[$day]
  Copy-Item -Force $src (Join-Path $dayDir 'thumbnail.png')

  $slideObjs = New-Object System.Collections.Generic.List[string]
  $slideObjs.Add("    { file: 'thumbnail.png', title: 'Day $day - Full Scene', kind: 'thumbnail' }") | Out-Null
  for ($i = 0; $i -lt $topics.Count; $i++) {
    $n = $i + 1
    $file = '{0:D2}.png' -f $n
    $titleJson = $topics[$i] | ConvertTo-Json -Compress
    $slideObjs.Add("    { file: '$file', title: $titleJson, kind: 'topic' }") | Out-Null
  }
  $slidesJs = $slideObjs -join ",`n"
  $topicCount = $topics.Count
  $totalSlides = $topicCount + 1

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
  #titleSlide .sub { color: #c82828; font-size: clamp(16px, 4vw, 28px); font-weight: 700; margin-bottom: 24px; }
  #titleSlide .cta { color: rgba(255,255,255,.6); font-size: clamp(14px, 3vw, 18px); line-height: 1.5; }
  #frame img {
    object-fit: contain;
    background: #0a0a0c;
    opacity: 0;
    transform: translateX(110%);
    transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .35s ease;
  }
  #frame img.show { opacity: 1; transform: translateX(0); }
  #frame img.exit { opacity: 0; transform: translateX(-110%); }
  #frame img.thumb {
    /* 16:9 scene letterboxed inside 9:16 frame */
    object-fit: contain;
  }
  #hint {
    position: fixed; bottom: 18px; left: 50%;
    transform: translateX(-50%);
    color: rgba(255,255,255,.55);
    font-size: 14px;
    letter-spacing: .04em;
    pointer-events: none;
    text-align: center;
    max-width: 92vw;
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
      <div class="cta">Click for the day scene<br>then each topic ($topicCount)</div>
    </div>
  </div>
</div>
<div id="hint">Click or Space / Right Arrow — Day $day scene first, then topics</div>
<script>
const slides = [
$slidesJs
];
let i = -1; // -1 = title
const frame = document.getElementById('frame');
const titleSlide = document.getElementById('titleSlide');
const progress = document.getElementById('progress');
const hint = document.getElementById('hint');

function showSlide(nextIndex) {
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
  if (slides[nextIndex].kind === 'thumbnail') img.classList.add('thumb');
  frame.appendChild(img);
  requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('show')));
  i = nextIndex;
  progress.style.width = ((i + 1) / slides.length * 100) + '%';
  if (slides[i].kind === 'thumbnail') {
    hint.textContent = 'Day $day scene (1 / ' + slides.length + ') — click for topic 1';
  } else {
    const topicNum = i; // thumbnail is index 0
    hint.textContent = 'Topic ' + topicNum + ' / $topicCount — ' + slides[i].title;
  }
}

function next() {
  if (i < slides.length - 1) showSlide(i + 1);
  else hint.textContent = 'End of Day $day — Left Arrow to go back';
}
function prev() {
  if (i > 0) showSlide(i - 1);
  else if (i === 0) {
    const prevImg = frame.querySelector('img.show');
    if (prevImg) {
      prevImg.classList.remove('show');
      prevImg.classList.add('exit');
      setTimeout(() => prevImg.remove(), 450);
    }
    titleSlide.classList.remove('hide');
    i = -1;
    progress.style.width = '0%';
    hint.textContent = 'Click or Space / Right Arrow — Day $day scene first, then topics';
  }
}

document.getElementById('stage').addEventListener('click', next);
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
});
</script>
</body>
</html>
"@

  Set-Content -Path (Join-Path $dayDir 'slideshow.html') -Value $html -Encoding UTF8
  Write-Output ("Updated Day {0} slideshow ({1} slides: thumbnail + {2} topics)" -f $day, $totalSlides, $topicCount)
}

Write-Output "Done. Open: $outRoot\index.html"
