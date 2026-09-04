# Build ISRAEL-NATIONS-KILLED-REFERENCES chart (HTML + PDF image)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$JsonPath = Join-Path $Root 'data/ISRAEL-NATIONS-KILLED-REFERENCES.json'
$OutHtml = Join-Path $Root 'data/ISRAEL-NATIONS-KILLED-REFERENCES.html'
$OutPdf  = Join-Path $Root 'data/ISRAEL-NATIONS-KILLED-REFERENCES.pdf'
$OutPng  = Join-Path $Root 'data/ISRAEL-NATIONS-KILLED-REFERENCES.png'

function Escape-Html([string]$s) {
    if (-not $s) { return '' }
    $s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;'
}

$data = Get-Content $JsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

$css = @'
<style>
  @page { size: landscape; margin: 0.35in; background: #f4ecd8; }
  html, body {
    background: #f4ecd8; color: #2c2416;
    font-family: "Courier New", Courier, monospace;
    font-size: 7pt; line-height: 1.25;
    margin: 0; padding: 0.4em 0.5em;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-size: 12pt; text-align: center; margin: 0 0 0.15em; border-bottom: 2px solid #8b6914; padding-bottom: 0.2em; }
  .subtitle { text-align: center; font-size: 8pt; color: #5c4a32; margin: 0 0 0.35em; }
  .framework { text-align: center; font-size: 6.5pt; margin: 0 0 0.5em; padding: 0.3em; background: #e8dcc4; border: 1px solid #b8986a; }
  .columns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.45em; align-items: start; }
  .col { border: 1px solid #b8986a; background: #ebe3cf; padding: 0.35em 0.4em; min-height: 100%; }
  .col h2 { font-size: 8pt; margin: 0 0 0.25em; color: #3d2f1f; text-transform: uppercase; letter-spacing: 0.03em; }
  .col .note { font-size: 6pt; color: #5c4a32; margin: 0 0 0.35em; font-style: italic; }
  table { width: 100%; border-collapse: collapse; font-size: 6.5pt; }
  th, td { border: 1px solid #c4a574; padding: 0.15em 0.25em; vertical-align: top; text-align: left; }
  th { background: #d4c4a8; font-size: 6pt; }
  tr:nth-child(even) td { background: #f4ecd8; }
  .sub-list { margin: 0.2em 0 0; padding: 0.2em 0.35em; background: #e0d4bc; font-size: 5.5pt; columns: 2; column-gap: 0.5em; }
  .sub-list span { display: block; break-inside: avoid; margin: 0.05em 0; }
  .footer { text-align: center; font-size: 6pt; margin-top: 0.4em; color: #5c4a32; }
  @media print { html, body { background: #f4ecd8 !important; } }
</style>
'@

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("<!DOCTYPE html><html lang=`"en`"><head><meta charset=`"UTF-8`"><title>$(Escape-Html $data.title)</title>$css</head><body>")
[void]$sb.AppendLine("<h1>$(Escape-Html $data.title)</h1>")
[void]$sb.AppendLine("<p class=`"subtitle`">$(Escape-Html $data.subtitle)</p>")
[void]$sb.AppendLine('<p class="framework"><strong>Framework texts:</strong> ' + (($data.frameworkRefs | ForEach-Object { Escape-Html $_ }) -join ' | ') + '</p>')
[void]$sb.AppendLine('<div class="columns">')

foreach ($section in $data.sections) {
    [void]$sb.AppendLine('<div class="col">')
    [void]$sb.AppendLine("<h2>$(Escape-Html $section.heading)</h2>")
    if ($section.note) { [void]$sb.AppendLine("<p class=`"note`">$(Escape-Html $section.note)</p>") }
    [void]$sb.AppendLine('<table><tr><th>#</th><th>City / Nation</th><th>Encounter</th><th>Reason (Scripture)</th></tr>')
    foreach ($e in $section.entries) {
        [void]$sb.AppendLine('<tr>')
        [void]$sb.AppendLine("<td>$($e.order)</td>")
        [void]$sb.AppendLine("<td>$(Escape-Html $e.name)</td>")
        [void]$sb.AppendLine("<td>$(Escape-Html $e.encounter)</td>")
        [void]$sb.AppendLine("<td>$(Escape-Html $e.reason)</td>")
        [void]$sb.AppendLine('</tr>')
        if ($e.sub) {
            [void]$sb.AppendLine('<tr><td colspan="4"><div class="sub-list">')
            foreach ($s in $e.sub) { [void]$sb.AppendLine("<span>$(Escape-Html $s)</span>") }
            [void]$sb.AppendLine('</div></td></tr>')
        }
    }
    [void]$sb.AppendLine('</table></div>')
}

[void]$sb.AppendLine('</div>')
[void]$sb.AppendLine('<p class="footer">ESV passage references. Open Bible for full text. Rebuild: scripts/build-israel-nations-killed-chart.ps1</p>')
[void]$sb.AppendLine('</body></html>')

[System.IO.File]::WriteAllText($OutHtml, $sb.ToString(), (New-Object System.Text.UTF8Encoding $true))
Write-Host "Wrote HTML: $OutHtml"

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
if (-not (Test-Path $edge)) { Write-Warning 'Edge not found.'; exit 0 }

$htmlPath = (Resolve-Path $OutHtml).Path
$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')
if (Test-Path $OutPdf) { Remove-Item $OutPdf -Force }
$p = Start-Process -FilePath $edge -ArgumentList @('--headless=new','--disable-gpu','--no-pdf-header-footer',"--print-to-pdf=$OutPdf",$fileUri) -Wait -PassThru -WindowStyle Hidden
if (Test-Path $OutPdf) {
    Write-Host "Wrote PDF: $OutPdf ($((Get-Item $OutPdf).Length) bytes)"
}

if (Test-Path $OutPng) { Remove-Item $OutPng -Force }
$p2 = Start-Process -FilePath $edge -ArgumentList @('--headless=new','--disable-gpu',"--screenshot=$OutPng",'--window-size=2400,1600',$fileUri) -Wait -PassThru -WindowStyle Hidden
if (Test-Path $OutPng) {
    Write-Host "Wrote PNG: $OutPng ($((Get-Item $OutPng).Length) bytes)"
}
