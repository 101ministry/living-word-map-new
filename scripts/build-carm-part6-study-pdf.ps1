# Build CARM-PART6-STUDY.html and .pdf (Deportation Study Part 6)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$ManifestPath = Join-Path $Root 'data/CARM-PART6-MANIFEST.json'
$CacheDir = Join-Path $Root 'data/carm-part6-cache'
$OutHtml = Join-Path $Root 'data/CARM-PART6-STUDY.html'
$OutPdf  = Join-Path $Root 'data/CARM-PART6-STUDY.pdf'

if (-not (Test-Path $CacheDir)) { New-Item -ItemType Directory -Path $CacheDir | Out-Null }

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
    return $s
}

function Get-Slug([string]$url) {
    ($url -replace 'https://carm.org/', '').TrimEnd('/')
}

function Fetch-CarmPage([string]$url) {
    $slug = Get-Slug $url
    $htmlPath = Join-Path $CacheDir "$slug.html"
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 45 `
            -Headers @{ 'User-Agent' = 'LivingWordMapStudy/1.0' }
        [System.IO.File]::WriteAllText($htmlPath, $resp.Content, [System.Text.UTF8Encoding]::new($false))
        return $resp.Content
    } catch {
        if (Test-Path $htmlPath) {
            Write-Warning "Fetch failed for $url - using cached HTML"
            return [System.IO.File]::ReadAllText($htmlPath)
        }
        throw
    }
}

function Parse-CarmHtml([string]$html, [string]$url) {
    $obj = [ordered]@{
        Url = $url
        Title = ''
        Author = ''
        Date = ''
        ReadTime = ''
        MetaDescription = ''
        Preview = ''
        RelatedLinks = @()
        BulletIndex = @()
    }

    if ($html -match '<title>([^<]+)</title>') {
        $obj.Title = ($Matches[1] -replace '\s*-\s*CARM\s*$', '').Trim()
    }
    if ($html -match 'property="og:description"\s+content="([^"]*)"') {
        $obj.MetaDescription = [System.Net.WebUtility]::HtmlDecode($Matches[1])
    }

    $article = $html
    if ($html -match '(?s)(<article\b.*?</article>)') { $article = $Matches[1] }

    if ($article -match 'class="article-author">([^<]+)<') { $obj.Author = $Matches[1].Trim() }
    if ($article -match 'datetime="([^"]+)"') { $obj.Date = $Matches[1] }
    if ($article -match 'class="article-reading-time">\s*([^<]+?)\s*<') { $obj.ReadTime = $Matches[1].Trim() }

    if ($article -match '(?s)<div class="article-body">(.*?)<div class="preview-cta"') {
        $body = $Matches[1]
    } elseif ($article -match '(?s)<div class="article-body">(.*)</div>\s*</article>') {
        $body = $Matches[1]
    } else {
        $body = ''
    }

    if ($body) {
        $paras = [regex]::Matches($body, '(?s)<p[^>]*>(.*?)</p>') | ForEach-Object {
            $t = $_.Groups[1].Value -replace '<[^>]+>', ''
            [System.Net.WebUtility]::HtmlDecode($t).Trim()
        } | Where-Object { $_ -and $_ -ne '&nbsp;' }
        $obj.Preview = ($paras -join "`n`n").Trim()

        $listItems = [regex]::Matches($body, '(?s)<li[^>]*>(.*?)</li>') | ForEach-Object {
            $raw = $_.Groups[1].Value
            $text = ([System.Net.WebUtility]::HtmlDecode(($raw -replace '<[^>]+>', ' '))).Trim() -replace '\s+', ' '
            $href = if ($raw -match 'href="(/[^"#?]+|https://carm\.org/[^"#?]+)"') { $Matches[1] } else { $null }
            if ($href -and $href.StartsWith('/')) { $href = 'https://carm.org' + $href }
            if ($text) { [pscustomobject]@{ Text = $text; Url = $href } }
        }
        $obj.BulletIndex = @($listItems | Where-Object { $_ })

        $linkMatches = [regex]::Matches($body, 'href="(/[^"#?]+|https://carm\.org/[^"#?]+)"[^>]*>([^<]+)</a>')
        $seen = @{}
        foreach ($m in $linkMatches) {
            $href = $m.Groups[1].Value
            if ($href.StartsWith('/')) { $href = 'https://carm.org' + $href }
            if ($href -match '/wp-content/|/css/|/fonts/|favicon|\.woff') { continue }
            $label = ([System.Net.WebUtility]::HtmlDecode($m.Groups[2].Value)).Trim()
            if (-not $label -or $seen.ContainsKey($href)) { continue }
            $seen[$href] = $true
            $obj.RelatedLinks += [pscustomobject]@{ Text = $label; Url = $href }
        }
    }

    if (-not $obj.Preview -and $obj.MetaDescription) { $obj.Preview = $obj.MetaDescription }
    return [pscustomobject]$obj
}

function Get-OpenTheismSubArticles() {
    $files = Get-ChildItem -Path $CacheDir -Filter 'extra_open-theism_*.txt' -ErrorAction SilentlyContinue
    $items = foreach ($f in $files) {
        $raw = [System.IO.File]::ReadAllText($f.FullName)
        $title = if ($raw -match '(?m)^#\s*(.+)$') { $Matches[1].Trim() } else { $f.BaseName }
        $preview = ($raw -split 'Please verify to continue reading')[0] -replace '(?m)^#.*$', '' -replace '(?m)^\s*by Matt.*$', ''
        $preview = ($preview -replace '\s+', ' ').Trim()
        if ($preview.Length -gt 1200) { $preview = $preview.Substring(0, 1197) + '...' }
        $slug = $f.BaseName -replace '^extra_open-theism_', ''
        [pscustomobject]@{
            Title = $title
            Url = "https://carm.org/open-theism/$slug"
            Preview = $preview
        }
    }
    return @($items | Sort-Object Title)
}

function Render-Entry([pscustomobject]$entry, [pscustomobject]$parsed, [array]$subArticles) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('<section class="entry">')
    [void]$sb.AppendLine("<h3>$(Escape-Html $entry.title)</h3>")
    [void]$sb.AppendLine('<div class="meta">')
    [void]$sb.AppendLine("  <a href=`"$(Escape-Html $parsed.Url)`">$(Escape-Html $parsed.Url)</a>")
    if ($parsed.Author) { [void]$sb.AppendLine("  <span class=`"tag`">Author: $(Escape-Html $parsed.Author)</span>") }
    if ($parsed.Date) { [void]$sb.AppendLine("  <span class=`"tag`">Date: $(Escape-Html $parsed.Date)</span>") }
    if ($parsed.ReadTime) { [void]$sb.AppendLine("  <span class=`"tag`">$(Escape-Html $parsed.ReadTime)</span>") }
    [void]$sb.AppendLine('</div>')
    if ($parsed.Preview) {
        [void]$sb.AppendLine('<div class="preview">')
        foreach ($para in ($parsed.Preview -split "`n`n")) {
            if ($para.Trim()) { [void]$sb.AppendLine("<p>$(Escape-Html $para.Trim())</p>") }
        }
        [void]$sb.AppendLine('</div>')
    }
    if ($parsed.BulletIndex.Count -gt 0) {
        [void]$sb.AppendLine('<h4>Index / linked topics on CARM</h4><ul class="index-list">')
        foreach ($bi in $parsed.BulletIndex) {
            if ($bi.Url) {
                [void]$sb.AppendLine("<li><a href=`"$(Escape-Html $bi.Url)`">$(Escape-Html $bi.Text)</a></li>")
            } else {
                [void]$sb.AppendLine("<li>$(Escape-Html $bi.Text)</li>")
            }
        }
        [void]$sb.AppendLine('</ul>')
    }
    if ($parsed.RelatedLinks.Count -gt 0) {
        [void]$sb.AppendLine('<h4>Related links (from page)</h4><ul class="link-list">')
        foreach ($rl in $parsed.RelatedLinks | Select-Object -First 20) {
            [void]$sb.AppendLine("<li><a href=`"$(Escape-Html $rl.Url)`">$(Escape-Html $rl.Text)</a></li>")
        }
        [void]$sb.AppendLine('</ul>')
    }
    if ($subArticles -and $subArticles.Count -gt 0) {
        [void]$sb.AppendLine("<h4>Open Theism sub-articles on CARM ($($subArticles.Count) fetched)</h4>")
        [void]$sb.AppendLine('<table class="sub-table"><tr><th>Article</th><th>Preview excerpt</th></tr>')
        foreach ($sa in $subArticles) {
            [void]$sb.AppendLine('<tr>')
            [void]$sb.AppendLine("<td><a href=`"$(Escape-Html $sa.Url)`">$(Escape-Html $sa.Title)</a></td>")
            [void]$sb.AppendLine("<td>$(Escape-Html $sa.Preview)</td>")
            [void]$sb.AppendLine('</tr>')
        }
        [void]$sb.AppendLine('</table>')
    }
    [void]$sb.AppendLine('<p class="gate-note"><em>Full article on carm.org may require browser verification (Cloudflare Turnstile).</em></p>')
    [void]$sb.AppendLine('</section>')
    return $sb.ToString()
}

$manifest = Get-Content $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$openTheismSubs = Get-OpenTheismSubArticles

$css = @'
<style>
  @page { margin: 0.65in; background-color: #f4ecd8; }
  html, body {
    background-color: #f4ecd8; color: #2c2416;
    font-family: "Courier New", Courier, monospace;
    font-size: 10pt; line-height: 1.4;
    margin: 0; padding: 0.85em 1em 1.5em;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-size: 15pt; border-bottom: 1px solid #8b7355; margin: 0 0 0.4em; }
  h2 { font-size: 12pt; margin: 1.2em 0 0.35em; color: #3d2f1f; page-break-after: avoid; }
  h3 { font-size: 10.5pt; margin: 0.6em 0 0.2em; page-break-after: avoid; }
  h4 { font-size: 9.5pt; margin: 0.45em 0 0.15em; color: #4a3a1a; }
  a { color: #1a5276; word-break: break-all; }
  .intro, .crosslinks { margin: 0.5em 0; padding: 0.55em 0.7em; background: #e8dcc4; border: 1px solid #b8986a; font-size: 9pt; }
  .intro ul, .crosslinks ul { margin: 0.25em 0; padding-left: 1.2em; }
  .part-header { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 1em 0 0.35em; page-break-before: always; page-break-after: avoid; }
  .part-header.first { page-break-before: auto; }
  .entry { margin-bottom: 1.1em; padding-bottom: 0.6em; border-bottom: 1px dashed #c4a574; page-break-inside: avoid; }
  .meta { font-size: 8.5pt; margin: 0.15em 0 0.35em; }
  .tag { margin-left: 0.5em; color: #5c4a32; }
  .preview p { margin: 0.3em 0; }
  .index-list, .link-list { margin: 0.2em 0 0.4em; padding-left: 1.2em; font-size: 9pt; }
  .index-list li, .link-list li { margin: 0.12em 0; }
  .sub-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin: 0.35em 0; }
  .sub-table th, .sub-table td { border: 1px solid #b8986a; padding: 0.2em 0.35em; vertical-align: top; }
  .sub-table th { background: #d4c4a8; }
  .gate-note { font-size: 8pt; color: #5c4a32; margin: 0.25em 0 0; }
  @media print { html, body { background-color: #f4ecd8 !important; } }
</style>
'@

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">')
[void]$sb.AppendLine("<title>$($manifest.title)</title>$css</head><body>")
[void]$sb.AppendLine("<h1>$(Escape-Html $manifest.title)</h1>")

[void]$sb.AppendLine('<div class="intro">')
[void]$sb.AppendLine("<p><strong>Source:</strong> $(Escape-Html $manifest.source). Compiled $(Escape-Html $manifest.compiled).</p>")
[void]$sb.AppendLine("<p>$(Escape-Html $manifest.note)</p>")
[void]$sb.AppendLine('<p><strong>Parts of the deportation study series:</strong> Part 1 biblical passages; Part 2 supersessionism; Part 4 country statutes; Appendix A teacher comparison; <strong>Part 6 (this document)</strong> CARM comparative religion and biblical-response articles.</p>')
[void]$sb.AppendLine('</div>')

[void]$sb.AppendLine('<div class="crosslinks">')
[void]$sb.AppendLine('<p><strong>Cross-links to deportation study themes:</strong></p><ul>')
foreach ($cl in $manifest.deportationCrossLinks) {
    [void]$sb.AppendLine("<li>$(Escape-Html $cl)</li>")
}
[void]$sb.AppendLine('</ul></div>')

$first = $true
foreach ($section in $manifest.sections) {
    $cls = if ($first) { 'part-header first' } else { 'part-header' }
    $first = $false
    [void]$sb.AppendLine("<div class=`"$cls`">$(Escape-Html $section.label)</div>")

    foreach ($entry in $section.entries) {
        Write-Host "Processing: $($entry.url)"
        $html = Fetch-CarmPage $entry.url
        $parsed = Parse-CarmHtml $html $entry.url
        if (-not $parsed.Title) { $parsed.Title = $entry.title }

        $subs = @()
        if ($entry.expandSubArticles) { $subs = $openTheismSubs }

        [void]$sb.AppendLine((Render-Entry $entry $parsed $subs))
        Start-Sleep -Milliseconds 250
    }
}

[void]$sb.AppendLine('<hr><p><em>Living Word Map - Part 6. Rebuild: scripts/build-carm-part6-study-pdf.ps1</em></p>')
[void]$sb.AppendLine('</body></html>')

$htmlContent = Normalize-UnicodeText $sb.ToString()
[System.IO.File]::WriteAllText($OutHtml, $htmlContent, (New-Object System.Text.UTF8Encoding $true))
Write-Host "Wrote HTML: $OutHtml"

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
if (-not (Test-Path $edge)) { Write-Warning 'Edge not found - HTML only.'; exit 0 }

$htmlPath = (Resolve-Path $OutHtml).Path
$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')
if (Test-Path $OutPdf) { Remove-Item $OutPdf -Force }
$edgeArgs = @('--headless=new', '--disable-gpu', '--no-pdf-header-footer', "--print-to-pdf=$OutPdf", $fileUri)
$p = Start-Process -FilePath $edge -ArgumentList $edgeArgs -Wait -PassThru -WindowStyle Hidden
if (Test-Path $OutPdf) {
    Write-Host "Wrote PDF: $OutPdf ($((Get-Item $OutPdf).Length) bytes)"
} else {
    Write-Warning 'PDF not created.'
}
