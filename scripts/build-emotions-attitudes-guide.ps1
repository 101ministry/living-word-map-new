# Build Understanding Life in Simplified Terms HTML + PDF

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$Title = 'Understanding Life in Simplified Terms'
$DataJson = Join-Path $Root 'data/emotions-attitudes-teen-definitions.json'
$OutHtml = Join-Path $Root 'data/Understanding-Life-in-Simplified-Terms.html'
$OutPdf  = Join-Path $Root 'data/Understanding Life in Simplified Terms.pdf'

if (-not (Test-Path $DataJson)) {
    Write-Error "Definitions JSON not found: $DataJson"
}

$data = Get-Content -Raw -Encoding UTF8 $DataJson | ConvertFrom-Json

$flagged = @{
    positive_emotions  = @('Adversarial','Hesitant')
    positive_attitudes = @('Gloomy','Distant')
    negative_emotions  = @('Good','Wise','Responsible','Moral','Noble')
    negative_attitudes = @()
}

$sections = @(
    @{ key = 'positive_emotions';  title = 'Positive Emotions';  url = 'https://amojolife.wordpress.com/resources/positive-emotions-list/' }
    @{ key = 'positive_attitudes'; title = 'Positive Attitudes'; url = 'https://amojolife.wordpress.com/resources/positive-attitude-list/' }
    @{ key = 'negative_emotions';  title = 'Negative Emotions';  url = 'https://amojolife.wordpress.com/resources/negative-emotions-list/' }
    @{ key = 'negative_attitudes'; title = 'Negative Attitudes'; url = 'https://amojolife.wordpress.com/resources/negative-attitudes-list/' }
)

function Escape-Html([string]$s) {
    if ($null -eq $s) { return '' }
    return [System.Net.WebUtility]::HtmlEncode($s)
}

$css = @'
  @page { margin: 0.65in 0.7in; size: letter; }
  html, body {
    background: #f7f9fc;
    color: #1a1a1a;
    font-family: "Segoe UI", Calibri, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    margin: 0;
    padding: 0.75in 0.85in 1in;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 { font-size: 20pt; margin: 0 0 0.15em; color: #1e3a5f; border-bottom: 3px solid #4a7ab8; padding-bottom: 0.2em; }
  .subtitle { font-size: 10.5pt; color: #4a5568; margin: 0 0 0.75em; }
  .intro {
    background: #e8eef6;
    border-left: 4px solid #4a7ab8;
    padding: 0.6em 0.85em;
    margin: 0 0 1.25em;
    font-size: 9.5pt;
  }
  h2 {
    font-size: 14pt;
    color: #1e3a5f;
    margin: 1.5em 0 0.35em;
    page-break-after: avoid;
    border-bottom: 1px solid #b8cce4;
    padding-bottom: 0.15em;
  }
  h2.positive { color: #1f5c3a; border-color: #8fd4ad; }
  h2.negative { color: #7a1f1f; border-color: #e8a0a0; }
  .source { font-size: 8.5pt; color: #666; margin: 0 0 0.65em; }
  dl { margin: 0 0 0.5em; columns: 2; column-gap: 1.25em; }
  dt {
    font-weight: 700;
    color: #2d3748;
    margin-top: 0.45em;
    break-after: avoid;
    page-break-after: avoid;
  }
  dt.flagged { color: #9b2c2c; }
  dt.flagged::after { content: " *"; font-weight: 400; font-size: 8pt; color: #9b2c2c; }
  dd {
    margin: 0.1em 0 0.35em 0;
    color: #374151;
    font-size: 9.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .note { font-size: 8.5pt; color: #666; margin-top: 1.5em; padding-top: 0.5em; border-top: 1px solid #ccc; }
  @media print {
    html, body { background: #fff !important; padding: 0; }
    .intro { background: #e8eef6 !important; }
  }
'@

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<!DOCTYPE html>')
[void]$sb.AppendLine('<html lang="en"><head><meta charset="UTF-8">')
[void]$sb.AppendLine("<title>$Title</title>")
[void]$sb.AppendLine("<style>$css</style></head><body>")
[void]$sb.AppendLine("<h1>$Title</h1>")
[void]$sb.AppendLine('<p class="subtitle">Plain-language explanations for every word on the Amojo Life emotion and attitude lists</p>')
[void]$sb.AppendLine('<div class="intro">')
[void]$sb.AppendLine('<p><strong>Sources:</strong> Amojo Life resource lists (positive/negative emotions and attitudes). Words marked <strong>*</strong> appear on a list where they usually belong on the opposite side.</p>')
[void]$sb.AppendLine('</div>')

foreach ($sec in $sections) {
    $key = $sec.key
    $items = $data.$key
    $cssClass = if ($key -like 'positive*') { 'positive' } else { 'negative' }
    [void]$sb.AppendLine("<h2 class=""$cssClass"">$($sec.title)</h2>")
    [void]$sb.AppendLine("<p class=""source"">Source: $($sec.url) - $($items.Count) words</p>")
    [void]$sb.AppendLine('<dl>')
    foreach ($item in $items) {
        $word = Escape-Html $item.word
        $def  = Escape-Html $item.definition
        $flag = if ($flagged[$key] -contains $item.word) { ' class="flagged"' } else { '' }
        [void]$sb.AppendLine("<dt$flag>$word</dt><dd>$def</dd>")
    }
    [void]$sb.AppendLine('</dl>')
}

[void]$sb.AppendLine('<p class="note">Generated for personal study. Lists from amojolife.wordpress.com.</p>')
[void]$sb.AppendLine('</body></html>')

[System.IO.File]::WriteAllText($OutHtml, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote HTML: $OutHtml ($((Get-Item $OutHtml).Length) bytes)"

$chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
$browser = if (Test-Path $chrome) { $chrome } elseif (Test-Path $edge) { $edge } else { $null }
if (-not $browser) {
    Write-Warning 'Chrome/Edge not found - HTML only. Open the HTML file and Print to PDF.'
    exit 0
}

$htmlPath = (Resolve-Path $OutHtml).Path
$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')
$OutPdfTemp = Join-Path $Root 'data/Understanding-Life-in-Simplified-Terms.pdf'
if (Test-Path $OutPdfTemp) { Remove-Item $OutPdfTemp -Force }
if (Test-Path $OutPdf) { Remove-Item $OutPdf -Force }

$p = Start-Process -FilePath $browser -ArgumentList @(
    '--headless=new','--disable-gpu','--no-pdf-header-footer',"--print-to-pdf=$OutPdfTemp",$fileUri
) -Wait -PassThru -WindowStyle Hidden
if ($p.ExitCode -ne 0) { Write-Warning "Browser exit code $($p.ExitCode)" }

if (Test-Path $OutPdfTemp) {
    Move-Item -Force $OutPdfTemp $OutPdf
}

if (Test-Path $OutPdf) {
    Write-Host "Wrote PDF: $OutPdf ($((Get-Item $OutPdf).Length) bytes)"
} else {
    Write-Warning 'PDF not created - open HTML in browser and Print to PDF.'
}
