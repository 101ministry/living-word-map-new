# Build DEPORTATION-STATUTES-COMPARATIVE-STUDY.html and .pdf
# Part 4 extension: 30 countries vs biblical statute framework (non-BLB citations)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$DataJson = Join-Path $Root 'data/DEPORTATION-STATUTES-COUNTRIES.json'
$OutHtml = Join-Path $Root 'data/DEPORTATION-STATUTES-COMPARATIVE-STUDY.html'
$OutPdf  = Join-Path $Root 'data/DEPORTATION-STATUTES-COMPARATIVE-STUDY.pdf'

function Escape-Html([string]$s) {
    if (-not $s) { return '' }
    $s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;'
}

function Normalize-UnicodeText([string]$s) {
    if (-not $s) { return '' }
    $map = @(
        @([char]0x2014, ' - '), @([char]0x2013, '-'),
        @([char]0x201C, '"'), @([char]0x201D, '"'),
        @([char]0x2018, "'"), @([char]0x2019, "'")
    )
    foreach ($pair in $map) { $s = $s.Replace($pair[0].ToString(), $pair[1]) }
    $e280 = ([char]0x00E2).ToString() + ([char]0x0080).ToString()
    $s = $s.Replace($e280 + ([char]0x0094), ' - ')
    $s = $s.Replace($e280 + ([char]0x0093), '-')
    $s = $s.Replace($e280 + ([char]0x009C), '"')
    $s = $s.Replace($e280 + ([char]0x009D), '"')
    return $s
}

function Render-AxisCell([string]$v) {
    switch ($v) {
        'Y' { return '<td class="ax-y">Aligns</td>' }
        'P' { return '<td class="ax-p">Partial</td>' }
        'N' { return '<td class="ax-n">Conflicts</td>' }
        default { return '<td class="ax-m">Mixed</td>' }
    }
}

if (-not (Test-Path $DataJson)) { throw "Missing data file: $DataJson" }
$raw = [System.IO.File]::ReadAllText($DataJson, [System.Text.Encoding]::UTF8)
$data = $raw | ConvertFrom-Json

$css = @'
<style>
  @page { size: landscape; margin: 0.45in; background-color: #f4ecd8; }
  html, body {
    background-color: #f4ecd8; color: #2c2416;
    font-family: "Courier New", Courier, monospace;
    font-size: 8.5pt; line-height: 1.3;
    margin: 0; padding: 0.6em 0.8em 1.2em;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-size: 13pt; border-bottom: 1px solid #8b7355; margin: 0 0 0.4em; }
  h2 { font-size: 10pt; margin: 0.9em 0 0.3em; color: #3d2f1f; }
  h3 { font-size: 9pt; margin: 0.4em 0 0.2em; }
  a { color: #1a5276; word-break: break-all; }
  .intro, .method { margin: 0.5em 0; padding: 0.5em 0.65em; background: #e8dcc4; border: 1px solid #b8986a; }
  .intro ul, .method ul { margin: 0.25em 0; padding-left: 1.2em; }
  .part-header { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 1em 0 0.4em; page-break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 0.4em 0 0.8em; font-size: 7.5pt; }
  th, td { border: 1px solid #b8986a; padding: 0.2em 0.35em; vertical-align: top; text-align: left; }
  th { background: #d4c4a8; }
  tr:nth-child(even) { background: #ebe3cf; }
  .ax-y { background: #d4e8d4; font-weight: bold; }
  .ax-p { background: #f0e8c8; }
  .ax-n { background: #e8d0d0; font-weight: bold; }
  .ax-m { background: #e0e0e0; }
  .country { margin-bottom: 1.1em; page-break-inside: avoid; border-left: 3px solid #8b6914; padding-left: 0.45em; }
  .country h2 { margin-top: 0; }
  .religion-box { margin: 0.35em 0; padding: 0.4em 0.55em; background: #e0d4bc; font-size: 8pt; }
  .statute-list { margin: 0.25em 0 0.4em; padding-left: 1em; }
  .statute-list li { margin: 0.15em 0; }
  .verdict { font-size: 8.5pt; margin: 0.3em 0; padding: 0.35em 0.5em; background: #ebe3cf; }
  .sources { font-size: 7.5pt; color: #5c4a32; }
  @media print { html, body { background-color: #f4ecd8 !important; } }
</style>
'@

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine(@"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Deportation Study Part 4 - 30 Countries vs Biblical Statutes</title>
$css
</head>
<body>
<h1>Part 4: Thirty Countries - Statutes Compared to Biblical Law (Deportation Study Extension)</h1>
<div class="intro">
<p><strong>Purpose:</strong> Extend the deportation biblical study with <em>statute comparison</em>, not verse-by-verse BLB commentary.
Sources: national codes, constitutions, World Justice Project Rule of Law Index 2025, Pew Research religious composition (2010-2020),
CIA World Factbook, and official government portals.</p>
<p><strong>Biblical frame</strong> (from Parts 1-3): Gen 9 (life); Ex 18-23 / Deut 16-28 (impartial justice, sojourner, covenant);
Lev 18-19 (sexual order, ger protection); Num 15:16 (one law); Rom 13 (law of the land); Ezra 10 (broken covenant faith, not ethnicity).</p>
<p><strong>Rating key:</strong> <span class="ax-y">Aligns</span> = statute largely matches biblical expectation;
<span class="ax-p">Partial</span> = mixed or secularized; <span class="ax-n">Conflicts</span> = statute or practice opposes the biblical norm;
<span class="ax-m">Mixed</span> = strong in law, weak in enforcement, or vice versa.</p>
<p><em>Not legal advice. Laws change; verify current codes. No country matches theocratic Israel; comparison is on <strong>categories</strong>, not carbon-copy Torah civil law.</em></p>
</div>
<div class="method">
<h2>Comparison axes (10)</h2>
<ul>
<li><strong>Life</strong> - unlawful killing criminally punished (Gen 9:5-6)</li>
<li><strong>Justice</strong> - impartial courts, anti-bribery (Ex 23:1-3; Deut 16:18-20)</li>
<li><strong>Sojourner</strong> - aliens under fair law, anti-oppression (Lev 19:33-34; Deut 10:19)</li>
<li><strong>One law</strong> - clear immigration/residence rules (Num 15:15-16 analog)</li>
<li><strong>Child</strong> - child murder/abuse criminalized (Lev 18:21; 20:2-5 analog)</li>
<li><strong>Sexual order</strong> - Lev 18-class offenses partly retained in criminal code</li>
<li><strong>Authority</strong> - governing power, tax, lawful removal (Rom 13; Part 1)</li>
<li><strong>Religion</strong> - no compelled national idolatry; freedom vs established cult (Ex 20; Deut 7; contrast Canaanite nations)</li>
<li><strong>Truth</strong> - perjury, fraud prosecuted (Ex 20:16 analog)</li>
<li><strong>Security</strong> - state may exclude threats (functional analog to Ex 23:33; not ethnic template)</li>
</ul>
</div>
"@)

# Summary matrix
[void]$sb.AppendLine('<div class="part-header">Summary matrix - all 30 countries</div>')
[void]$sb.AppendLine('<table><tr><th>Country</th><th>WJP 2025</th><th>Official religion</th><th>Practice (Pew est.)</th><th>Life</th><th>Justice</th><th>Sojourner</th><th>One law</th><th>Child</th><th>Sexual</th><th>Auth</th><th>Religion</th><th>Truth</th><th>Sec</th><th>Overall</th></tr>')
foreach ($c in $data.countries) {
    $a = $c.axes
    [void]$sb.AppendLine("<tr><td>$(Escape-Html $c.name)</td><td>#$( $c.wjpRank ) ($($c.wjpScore))</td><td>$(Escape-Html $c.officialReligionShort)</td><td>$(Escape-Html $c.practiceShort)</td>")
    foreach ($key in @('life','justice','sojourner','oneLaw','child','sexual','authority','religion','truth','security')) {
        [void]$sb.AppendLine((Render-AxisCell $a.$key))
    }
    [void]$sb.AppendLine("<td><strong>$(Escape-Html $c.overall)</strong></td></tr>")
}
[void]$sb.AppendLine('</table>')

# Country profiles
[void]$sb.AppendLine('<div class="part-header">Country profiles - religion and statutes</div>')
foreach ($c in $data.countries) {
    [void]$sb.AppendLine('<div class="country">')
    [void]$sb.AppendLine("<h2>$(Escape-Html $c.name)</h2>")
    [void]$sb.AppendLine("<p class='sources'>WJP Rule of Law Index 2025: rank #$($c.wjpRank), score $($c.wjpScore) - <a href='https://worldjusticeproject.org/rule-of-law-index/'>worldjusticeproject.org</a></p>")
    [void]$sb.AppendLine('<div class="religion-box">')
    [void]$sb.AppendLine("<p><strong>Official / constitutional:</strong> $(Escape-Html $c.officialReligion)</p>")
    if ($c.officialSource) { [void]$sb.AppendLine("<p class='sources'>Source: <a href='$(Escape-Html $c.officialSource)'>$(Escape-Html $c.officialSource)</a></p>") }
    [void]$sb.AppendLine("<p><strong>Active practice (population):</strong> $(Escape-Html $c.practiceReligion)</p>")
    if ($c.practiceSource) { [void]$sb.AppendLine("<p class='sources'>Source: <a href='$(Escape-Html $c.practiceSource)'>$(Escape-Html $c.practiceSource)</a></p>") }
    [void]$sb.AppendLine("<p><strong>Official vs practice gap:</strong> $(Escape-Html $c.practiceGap)</p>")
    [void]$sb.AppendLine('</div>')
    [void]$sb.AppendLine('<h3>Statutes vs biblical categories</h3><ul class="statute-list">')
    foreach ($s in $c.statutes) {
        $cite = if ($s.url) { "<a href='$(Escape-Html $s.url)'>$(Escape-Html $s.cite)</a>" } else { Escape-Html $s.cite }
        [void]$sb.AppendLine("<li><strong>$(Escape-Html $s.axis):</strong> $(Escape-Html $s.note) - $cite</li>")
    }
    [void]$sb.AppendLine('</ul>')
    [void]$sb.AppendLine("<p class='verdict'><strong>Biblical alignment summary:</strong> $(Escape-Html $c.verdict)</p>")
    [void]$sb.AppendLine('</div>')
}

[void]$sb.AppendLine(@'
<hr>
<h2>Master sources</h2>
<ul class="sources">
<li>World Justice Project, Rule of Law Index 2025: https://worldjusticeproject.org/rule-of-law-index/</li>
<li>Pew Research Center, Religious Composition by Country 2010-2020: https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/</li>
<li>Pew Research, Government-Favored Religion (official/preferred): https://www.pewresearch.org/short-reads/2017/10/03/key-facts-about-government-favored-religion-around-the-world/</li>
<li>CIA World Factbook (legal systems, religions): https://www.cia.gov/the-world-factbook/</li>
<li>Living Word Map deportation study: data/DEPORTATION-BIBLICAL-STUDY.pdf</li>
</ul>
<p><em>Living Word Map - Part 4 comparative statutes. Rebuild: scripts/build-deportation-statutes-comparative.ps1</em></p>
</body></html>
'@)

$html = Normalize-UnicodeText $sb.ToString()
[System.IO.File]::WriteAllText($OutHtml, $html, (New-Object System.Text.UTF8Encoding $true))
Write-Host "Wrote HTML: $OutHtml"

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
if (-not (Test-Path $edge)) { Write-Warning 'Edge not found - HTML only.'; exit 0 }
$htmlPath = (Resolve-Path $OutHtml).Path
$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')
if (Test-Path $OutPdf) { Remove-Item $OutPdf -Force }
Start-Process -FilePath $edge -ArgumentList @('--headless=new','--disable-gpu','--no-pdf-header-footer',"--print-to-pdf=$OutPdf",$fileUri) -Wait -PassThru -WindowStyle Hidden | Out-Null
if (Test-Path $OutPdf) {
    Write-Host "Wrote PDF: $OutPdf ($((Get-Item $OutPdf).Length) bytes)"
} else {
    Write-Warning 'PDF not created - open HTML and Print to PDF (landscape).'
}
