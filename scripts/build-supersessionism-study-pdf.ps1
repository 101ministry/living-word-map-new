# Build SUPERSESSIONISM-BIBLICAL-STUDY.html and .pdf (landscape, side-by-side lists)
# Part 2: Replacement theology vs Gentiles grafted into Israel

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$OutHtml = Join-Path $Root 'data/SUPERSESSIONISM-BIBLICAL-STUDY.html'
$OutPdf  = Join-Path $Root 'data/SUPERSESSIONISM-BIBLICAL-STUDY.pdf'

function Get-BlbInterlinear([string]$Book, [int]$Ch, [int]$Vs, [bool]$IsOT) {
    $base = if ($IsOT) { 'wlc-kjv' } else { 'tr-kjv' }
    "https://www.blueletterbible.org/tools/interlinear/$base/$Book/$Ch/$Vs/"
}
function Get-BlbEsv([string]$Book, [string]$Range) {
    "https://www.blueletterbible.org/esv/$Book/$Range/"
}
function Get-BlbHenry([string]$Abr, [int]$Ch) {
    $chStr = '{0:D3}' -f $Ch
    "https://www.blueletterbible.org/Comm/mhc/$Abr/${Abr}_$chStr.cfm"
}
$script:C2000Folder = @{ Exo = 'Exd' }
$script:C2000Block = @{
    'Gen:12'=10; 'Gen:15'=10; 'Gen:17'=10; 'Gen:22'=10
    'Exo:19'=19; 'Lev:26'=26; 'Deu:30'=26
    '2Sa:7'=7; 'Psa:89'=89; 'Psa:105'=105; 'Psa:106'=106
    'Isa:41'=40; 'Isa:49'=49; 'Isa:54'=54; 'Isa:59'=59
    'Jer:31'=31; 'Jer:32'=32; 'Jer:33'=33
    'Eze:36'=36; 'Eze:37'=37; 'Amo:9'=9
    'Zec:8'=8; 'Zec:12'=12; 'Zec:14'=14
    'Mat:8'=8; 'Mat:19'=19; 'Mat:21'=21; 'Mat:22'=20; 'Mat:23'=23
    'Luk:20'=20; 'Luk:21'=21; 'Luk:22'=22
    'Jhn:1'=1; 'Jhn:15'=15
    'Act:1'=1; 'Act:3'=3; 'Act:13'=13; 'Act:15'=15; 'Act:21'=21
    'Rom:2'=2; 'Rom:3'=3; 'Rom:9'=9; 'Rom:11'=11
    '1Co:10'=10; 'Gal:3'=3; 'Gal:6'=6; 'Eph:2'=2; 'Php:3'=3
    'Heb:8'=8; 'Heb:10'=10
    '1Pe:2'=2; 'Rev:2'=2; 'Rev:3'=3; 'Rev:7'=7; 'Rev:12'=12; 'Rev:21'=21
}
function Get-BlbSmith([string]$Abr, [int]$Ch) {
    $folder = if ($script:C2000Folder.ContainsKey($Abr)) { $script:C2000Folder[$Abr] } else { $Abr }
    $key = "${Abr}:$Ch"
    $blockCh = if ($script:C2000Block.ContainsKey($key)) { $script:C2000Block[$key] } else { $Ch }
    $chStr = '{0:D3}' -f $blockCh
    "https://www.blueletterbible.org/Comm/smith_chuck/c2000_${folder}/${folder}_$chStr.cfm"
}
function Escape-Html([string]$s) {
    if (-not $s) { return '' }
    $s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;'
}
function Normalize-UnicodeText([string]$s) {
    if (-not $s) { return '' }
    $map = @(
        @([char]0x2014, ' - '), @([char]0x2013, '-'),
        @([char]0x201C, '"'), @([char]0x201D, '"'),
        @([char]0x2018, "'"), @([char]0x2019, "'"),
        @([char]0x00B6, ''), @([char]0x2026, '...'),
        @([char]0x00B7, ' | ')
    )
    foreach ($pair in $map) { $s = $s.Replace($pair[0].ToString(), $pair[1]) }
    # UTF-8 punctuation mis-decoded as three Latin-1 chars (common in ESV API payloads)
    $e280 = ([char]0x00E2).ToString() + ([char]0x0080).ToString()
    $s = $s.Replace($e280 + ([char]0x009C), '"')
    $s = $s.Replace($e280 + ([char]0x009D), '"')
    $s = $s.Replace($e280 + ([char]0x0098), "'")
    $s = $s.Replace($e280 + ([char]0x0099), "'")
    $s = $s.Replace($e280 + ([char]0x0094), ' - ')
    $s = $s.Replace($e280 + ([char]0x0093), '-')
    $e2ac = ([char]0x00E2).ToString() + ([char]0x20AC).ToString()
    foreach ($c in @([char]0x0153, [char]0x201D, [char]0x201C, [char]0x0093, [char]0x0094, [char]0x009D)) {
        $s = $s.Replace($e2ac + $c, '"')
    }
    $s = $s.Replace(([char]0x00C2).ToString() + ([char]0x00B6).ToString(), '')
    $s = $s.Replace(([char]0x00C2).ToString() + ([char]0x00B7).ToString(), ' | ')
    return $s
}

# --- ESV fetch (api.midvash.com, ESV text) ---
$script:ChapterCache = @{}
$MidvashByBlb = @{
    gen='genesis'; exo='exodus'; lev='leviticus'; deu='deuteronomy'; '2sa'='2-samuel'
    psa='psalms'; isa='isaiah'; jer='jeremiah'; ezk='ezekiel'; amo='amos'; zec='zechariah'
    mat='matthew'; luk='luke'; jhn='john'; act='acts'; rom='romans'; '1co'='1-corinthians'
    gal='galatians'; eph='ephesians'; php='philippians'; heb='hebrews'; '1pe'='1-peter'; rev='revelation'
}
$HenryByBlb = @{
    gen='Gen'; exo='Exo'; lev='Lev'; deu='Deu'; '2sa'='2Sa'; psa='Psa'; isa='Isa'; jer='Jer'
    ezk='Eze'; amo='Amo'; zec='Zec'; mat='Mat'; luk='Luk'; jhn='Jhn'; act='Act'; rom='Rom'
    '1co'='1Co'; gal='Gal'; eph='Eph'; php='Php'; heb='Heb'; '1pe'='1Pe'; rev='Rev'
}

function Get-EsvChapterVerses {
    param([string]$MidvashBook, [int]$Ch)
    $key = "${MidvashBook}:${Ch}"
    if ($script:ChapterCache.ContainsKey($key)) { return $script:ChapterCache[$key] }
    Start-Sleep -Milliseconds 120
    $uri = "https://api.midvash.com/v1/esv/$MidvashBook/$Ch"
    try {
        $resp = Invoke-RestMethod -Uri $uri -TimeoutSec 120
        $verses = @($resp.data.verses | ForEach-Object { Normalize-UnicodeText (($_ -as [string]).Trim()) })
        $script:ChapterCache[$key] = $verses
        return $verses
    } catch {
        Write-Warning "ESV fetch failed for $MidvashBook $Ch : $($_.Exception.Message)"
        return @()
    }
}

function Get-ContextStartVerse {
    param([hashtable]$Entry, [int]$VerseCount)
    if ($Entry.Pv) { return [int]$Entry.Pv }
    if ($Entry.P -match ':(\d+)') { return [int]$Matches[1] }
    $v = [int]$Entry.V
    $end = if ($Entry.E -and [int]$Entry.E -gt 0) { [int]$Entry.E } else { $VerseCount }
    if (($end - $v) -le 3 -and $v -gt 4) { return [Math]::Max(1, $v - 4) }
    return [Math]::Max(1, $v)
}

function Build-ScriptureHtml {
    param(
        [string[]]$Verses,
        [int]$CtxStart, [int]$CtxEnd,
        [int]$BoldStart, [int]$BoldEnd
    )
    $sb = New-Object System.Text.StringBuilder
    for ($i = $CtxStart; $i -le $CtxEnd; $i++) {
        if ($i -lt 1 -or $i -gt $Verses.Count) { continue }
        $text = ($Verses[$i - 1] -as [string]).Trim()
        if (-not $text) { continue }
        $esc = Escape-Html $text
        if ($i -ge $BoldStart -and $i -le $BoldEnd) {
            [void]$sb.AppendLine("<p><strong>$esc</strong></p>")
        } else {
            [void]$sb.AppendLine("<p>$esc</p>")
        }
    }
    return $sb.ToString()
}

function Get-ScriptureHtmlForEntry {
    param([hashtable]$Entry)
    $midvash = $MidvashByBlb[$Entry.B]
    if (-not $midvash) { return '<p><em>Book mapping missing - use BLB link.</em></p>' }

    if ($Entry.T -eq 'Romans 9-11') {
        $sb = New-Object System.Text.StringBuilder
        foreach ($ch in @(9, 10, 11)) {
            $verses = Get-EsvChapterVerses $midvash $ch
            if (-not $verses.Count) { continue }
            [void]$sb.AppendLine("<p class=`"note`"><em>Romans $ch (ESV, full chapter; target section in bold)</em></p>")
            [void]$sb.AppendLine((Build-ScriptureHtml -Verses $verses -CtxStart 1 -CtxEnd $verses.Count -BoldStart 1 -BoldEnd $verses.Count))
        }
        return $sb.ToString()
    }

    $verses = Get-EsvChapterVerses $midvash $Entry.C
    if (-not $verses.Count) {
        return '<p><em>ESV text unavailable - use BLB link above.</em></p>'
    }

    $boldStart = [int]$Entry.V
    $boldEnd = if ($Entry.E -and [int]$Entry.E -gt 0) { [int]$Entry.E } else { $verses.Count }
    $ctxStart = Get-ContextStartVerse $Entry $verses.Count
    $ctxEnd = if ($Entry.E -and [int]$Entry.E -gt 0) { [Math]::Min($verses.Count, [int]$Entry.E + 2) } else { $verses.Count }
    if ($ctxEnd -lt $boldEnd) { $ctxEnd = $boldEnd }

    return (Build-ScriptureHtml -Verses $verses -CtxStart $ctxStart -CtxEnd $ctxEnd -BoldStart $boldStart -BoldEnd $boldEnd)
}

function Get-ParaStartRef {
    param([hashtable]$Entry)
    if ($Entry.P) { return $Entry.P }
    $ctx = Get-ContextStartVerse $Entry 999
    if ($Entry.T -match '^(\d?\s?[A-Za-z]+)\s') {
        return "$($Matches[1]) $($Entry.C):$ctx"
    }
    return "$($Entry.T.Split(':')[0]) $($Entry.C):$ctx"
}

function Render-EntryPassage {
    param([hashtable]$Entry, [string]$Side)
    $henryAbr = if ($Entry.H) { $Entry.H } else { $HenryByBlb[$Entry.B] }
    $vsEnd = if ($Entry.E -and [int]$Entry.E -gt 0) { [int]$Entry.E } else { [int]$Entry.V }
    if ($Entry.T -eq 'Romans 9-11') { $vsEnd = 36 }
    if ($Entry.E -eq 0) { $vsEnd = [int]$Entry.V }

    $params = @{
        Side          = $Side
        Title         = $Entry.T
        Book          = $Entry.B
        HenryAbr      = $henryAbr
        Ch            = [int]$Entry.C
        VsStart       = [int]$Entry.V
        VsEnd         = $vsEnd
        IsOT          = [bool]$Entry.OT
        ParaStartRef  = (Get-ParaStartRef $Entry)
        ScriptureHtml = (Get-ScriptureHtmlForEntry $Entry)
    }
    if ($Entry.N) { $params.Note = $Entry.N }
    elseif ($NotesByTitle.ContainsKey($Entry.T)) { $params.Note = $NotesByTitle[$Entry.T] }
    if ($Entry.Ht) { $params.Henry = $Entry.Ht }
    elseif ($HenryByTitle.ContainsKey($Entry.T)) { $params.Henry = $HenryByTitle[$Entry.T] }
    if ($Entry.Smith) { $params.Smith = $Entry.Smith }
    if ($Entry.Ma) { $params.MacArthur = $Entry.Ma }
    elseif ($MacArthurByTitle.ContainsKey($Entry.T)) { $params.MacArthur = $MacArthurByTitle[$Entry.T] }
    return (Render-Passage @params)
}

$MacArthurByTitle = @{}

$NotesByTitle = @{
    'Matthew 21:33-46'   = 'Often cited: kingdom taken from tenants, given to a nation bearing fruit.'
    'Matthew 8:11-12'    = 'Cited: Gentiles from east and west at feast; sons of the kingdom cast out.'
    'Matthew 22:1-14'    = 'Cited: king destroys those who refused the wedding feast; guests from highways.'
    'Matthew 23:37-39'   = 'Cited: house left desolate; you will not see me until you say, Blessed is he.'
    'Luke 20:9-19'       = 'Parallel vineyard parable - kingdom taken from tenants.'
    'John 1:11-13'       = 'Cited: he came to his own; his own did not receive him; right to become children of God.'
    'John 15:1-8'        = 'Cited: branches in the vine; abide or thrown into fire. Read with Rom 11 olive tree.'
    'Acts 13:46'         = 'Cited: Paul turns to Gentiles when Jews reject the word.'
    'Romans 2:28-29'     = 'Cited: Jew inwardly vs outwardly; circumcision of the heart.'
    'Romans 9:6-8'       = 'Cited to distinguish true Israel; read with Rom 9:27-29 and Rom 11:1-2.'
    'Galatians 6:16'     = 'Cited: "Israel of God" - read with Rom 11 and ethnic Israel promises.'
    'Philippians 3:3'    = 'Cited: we are the circumcision who worship by the Spirit.'
    '1 Peter 2:9-10'     = 'Cited: royal priesthood, holy nation - language from Exodus 19 applied to believers.'
    'Hebrews 8:13'       = 'Cited for obsolete first covenant; Hebrews 8:6-12 quotes Jeremiah 31 to Israel.'
    'Hebrews 10:9'       = 'Cited: Christ abolishes first to establish second (new covenant).'
    'Revelation 2:9'     = 'Cited: those who say they are Jews and are not.'
    'Revelation 3:9'     = 'Cited: synagogue of Satan, say they are Jews.'
    '1 Corinthians 10:32' = 'Paul still distinguishes Jews, Greeks, and church of God after Pentecost.'
    'Acts 1:6-7'         = 'Apostles expect restoration of the kingdom to Israel; Jesus redirects timing only.'
    'Acts 3:19-21'      = 'Times of refreshing; restoration of all things - apostolic hope for Israel.'
    'Acts 15'            = 'Council: Gentiles saved without circumcision; law not undone for Jewish believers.'
    'Acts 21'            = 'Paul with Jewish believers in Jerusalem - distinction maintained.'
    'Luke 21:24'         = 'Jerusalem trampled until times of the Gentiles fulfilled.'
    'Romans 1:16'        = 'Gospel to the Jew first and also to the Greek.'
    'Revelation 7'       = '144,000 sealed from twelve tribes - ethnic tribal identification.'
    'Revelation 12'      = 'The woman - often linked to Israel in conflict with the dragon.'
    'Revelation 21'      = 'New Jerusalem: twelve tribes of Israel and twelve apostles both honored.'
}

$HenryByTitle = @{
    'Jeremiah 31:31-37' = 'The new covenant is made with the house of Israel and Judah - not a covenant that excludes ethnic Israel but one that transforms them. If heaven can be measured, Israel will cease - until then the covenant stands.'
    'Jeremiah 33:20-26' = 'As sure as day and night, God will not reject the offspring of Jacob. Israel remains as countless as the stars.'
    'Hebrews 8:13'      = 'The first covenant grows old; the better covenant (Jer 31) replaces the Mosaic administration, not God''s word to Abraham''s seed.'
}

$MacArthurIntro = @{
    Romans     = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/romans-intro.cfm'
    Genesis    = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/genesis-intro.cfm'
    Galatians  = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/galatians-intro.cfm'
    Ephesians  = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/ephesians-intro.cfm'
    Hebrews    = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/hebrews-intro.cfm'
    Revelation = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/revelation-intro.cfm'
}

$MacArthurByTitle['Romans 9:6-8']      = $MacArthurIntro.Romans
$MacArthurByTitle['Galatians 3:28-29'] = $MacArthurIntro.Galatians
$MacArthurByTitle['Ephesians 2:11-22'] = $MacArthurIntro.Ephesians
$MacArthurByTitle['Hebrews 8:13']      = $MacArthurIntro.Hebrews
$MacArthurByTitle['Genesis 12:1-3']     = $MacArthurIntro.Genesis
$MacArthurByTitle['Romans 11:1-2']      = $MacArthurIntro.Romans
$MacArthurByTitle['Romans 9-11']        = $MacArthurIntro.Romans
$MacArthurByTitle['Revelation 7']       = $MacArthurIntro.Revelation

$SmithByTitle = @{
    'Romans 11:1-2' = 'Paul asks, "Has God cast away his people?" and answers emphatically, "God forbid." Israel is not cast off; there is a remnant according to the election of grace.'
    'Romans 11:17-24' = 'The olive tree is Israel. Gentiles are wild branches grafted in; they do not replace the root. Paul warns Gentiles not to boast against the natural branches - God can graft Israel back in.'
    'Romans 11:25-32' = 'Blindness in part has happened to Israel until the fullness of the Gentiles. All Israel shall be saved. The gifts and calling of God are without repentance (irrevocable).'
    'Matthew 21:33-46' = 'The vineyard parable: tenants kill the son; the kingdom taken and given to a nation bearing fruit. Often cited for replacement - but read with Romans 11: judgment and transfer of stewardship, not erasure of God''s covenant word to Abraham''s seed.'
    'Ephesians 2:11-22' = 'Gentiles were aliens, now brought near by Christ, one new man, built on apostles and prophets. Inclusion in God''s household - not a denial that Paul still distinguishes Jew and Gentile elsewhere (Rom 11; 1 Cor 10:32).'
    'Galatians 3:28-29' = 'In Christ there is neither Jew nor Greek - unity in the Messiah; Abraham''s seed by faith. Does not cancel ethnic Israel''s promises (Romans 11; Jeremiah 31).'
    'Jeremiah 31:31-37' = 'New covenant with the house of Israel and Judah - not with Gentiles only. If sun and moon depart, Israel''s seed ceases - God''s covenant with Israel is permanent.'
}

function Render-Passage {
    param(
        [string]$Title, [string]$Book, [string]$HenryAbr, [int]$Ch,
        [int]$VsStart, [int]$VsEnd = 0, [bool]$IsOT = $true,
        [string]$ParaStartRef = '', [string]$ScriptureHtml,
        [string]$Henry = '', [string]$Smith = '', [string]$MacArthur = '',
        [string]$Note = '', [string]$Side = ''
    )
    if ($VsEnd -eq 0) { $VsEnd = $VsStart }
    $range = if ($VsStart -eq $VsEnd) { "$Ch/$VsStart" } else { "$Ch/${VsStart}-$VsEnd" }
    $sideClass = if ($Side -eq 'replace') { ' side-replace' } elseif ($Side -eq 'graft') { ' side-graft' } else { '' }
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("<section class=`"passage$sideClass`">")
    [void]$sb.AppendLine("<h2>$(Escape-Html $Title)</h2>")
    [void]$sb.AppendLine('<div class="links">')
    [void]$sb.AppendLine("  <a href=`"$(Get-BlbEsv $Book $range)`">ESV</a> | ")
    [void]$sb.AppendLine("  <a href=`"$(Get-BlbInterlinear $Book $Ch $VsStart $IsOT)`">$(if($IsOT){'Hebrew'}else{'Greek'}) Interlinear</a> | ")
    [void]$sb.AppendLine("  <a href=`"$(Get-BlbHenry $HenryAbr $Ch)`">Henry</a> | ")
    [void]$sb.AppendLine("  <a href=`"$(Get-BlbSmith $HenryAbr $Ch)`">Chuck Smith C2000</a>")
    if ($MacArthur) { [void]$sb.AppendLine(" | <a href=`"$MacArthur`">MacArthur Intro</a>") }
    [void]$sb.AppendLine('</div>')
    if ($ParaStartRef) {
        [void]$sb.AppendLine("<p class=`"context-note`"><em>Starting with $ParaStartRef</em> - paragraph context; target in <strong>bold</strong></p>")
    }
    if ($Note) { [void]$sb.AppendLine("<p class=`"note`">$(Escape-Html $Note)</p>") }
    [void]$sb.AppendLine('<div class="scripture">')
    [void]$sb.AppendLine($ScriptureHtml)
    [void]$sb.AppendLine('</div>')
    if ($Henry) {
        [void]$sb.AppendLine('<div class="commentary"><h3>Matthew Henry <span class="tag">selective</span></h3>')
        [void]$sb.AppendLine("<p>$(Escape-Html $Henry)</p></div>")
    }
    if (-not $Smith -and $SmithByTitle.ContainsKey($Title)) { $Smith = $SmithByTitle[$Title] }
    if (-not $Smith) { $Smith = 'Full C2000 transcript on Blue Letter Bible (link above).' }
    [void]$sb.AppendLine('<div class="commentary"><h3>Chuck Smith <span class="tag">C2000</span></h3>')
    [void]$sb.AppendLine("<p>$(Escape-Html $Smith)</p></div>")
    [void]$sb.AppendLine('</section>')
    return $sb.ToString()
}

function Render-IndexLink {
    param([hashtable]$e)
    $range = if ($e.E -and $e.E -ne $e.V) { "$($e.C)/$($e.V)-$($e.E)" } else { "$($e.C)/$($e.V)" }
    $url = Get-BlbEsv $e.B $range
    $label = if ($e.L) { $e.L } else { $e.T }
    return "<li><a href=`"$url`">$(Escape-Html $label)</a></li>"
}

$css = @'
<style>
  @page { size: landscape; margin: 0.5in; background-color: #f4ecd8; }
  html, body {
    background-color: #f4ecd8; color: #2c2416;
    font-family: "Courier New", Courier, monospace;
    font-size: 9.5pt; line-height: 1.35;
    margin: 0; padding: 0.75em 1em 1.5em;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-size: 14pt; border-bottom: 1px solid #8b7355; padding-bottom: 0.25em; margin: 0 0 0.5em; }
  h2 { font-size: 11pt; margin: 0.8em 0 0.35em; color: #3d2f1f; }
  h3 { font-size: 9.5pt; margin: 0.35em 0 0.2em; }
  a { color: #1a5276; }
  .intro { margin-bottom: 0.75em; }
  .intro ul { margin: 0.3em 0; padding-left: 1.2em; }
  .summary-box {
    margin: 0.75em 0; padding: 0.6em 0.8em;
    background: #e8dcc4; border: 1px solid #b8986a;
  }
  .compare-columns {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1em;
    margin: 0.75em 0 1.25em; page-break-inside: avoid;
  }
  .compare-col { padding: 0.5em 0.65em; border-radius: 2px; }
  .compare-col.replace { background: #ebe0d0; border-left: 4px solid #8b4513; }
  .compare-col.graft { background: #e0e8dc; border-left: 4px solid #2d5016; }
  .compare-col h2 { margin-top: 0; font-size: 10pt; }
  .compare-col ul { margin: 0.25em 0; padding-left: 1.1em; font-size: 9pt; }
  .compare-col li { margin: 0.15em 0; }
  .compare-col .count { font-size: 8.5pt; color: #5c4a32; margin-top: 0.4em; }
  .part-header {
    font-size: 12pt; font-weight: bold; text-transform: uppercase;
    letter-spacing: 0.04em; margin: 1.25em 0 0.5em;
    page-break-after: avoid;
  }
  .passage { margin-bottom: 1.25em; page-break-inside: avoid; }
  .passage.side-replace { border-left: 3px solid #8b4513; padding-left: 0.4em; }
  .passage.side-graft { border-left: 3px solid #2d5016; padding-left: 0.4em; }
  .links { font-size: 8.5pt; margin: 0.25em 0 0.4em; }
  .context-note, .note { font-size: 8.5pt; color: #5c4a32; margin: 0.2em 0 0.4em; }
  .note { font-style: italic; }
  .scripture { margin: 0.35em 0 0.6em; padding-left: 0.4em; border-left: 2px solid #c4a574; }
  .scripture p { margin: 0.3em 0; }
  .commentary { margin: 0.4em 0; padding: 0.4em 0.6em; background: #ebe3cf; border-radius: 2px; font-size: 9pt; }
  .commentary .tag { font-size: 8pt; color: #666; font-weight: normal; }
  strong { font-weight: bold; }
  .two-col-passages {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.75em 1.25em;
  }
  @media print {
    html, body { background-color: #f4ecd8 !important; }
    .commentary { background: #ebe3cf !important; }
  }
</style>
'@

$replaceList = @(
    @{ T='Matthew 21:33-46'; B='mat'; C=21; V=33; E=46; OT=$false; L='Matt 21:33-46 - Vineyard parable' }
    @{ T='Matthew 8:11-12'; B='mat'; C=8; V=11; E=12; OT=$false }
    @{ T='Matthew 22:1-14'; B='mat'; C=22; V=1; E=14; OT=$false }
    @{ T='Matthew 23:37-39'; B='mat'; C=23; V=37; E=39; OT=$false }
    @{ T='Luke 20:9-19'; B='luk'; C=20; V=9; E=19; OT=$false; L='Luke 20:9-19 - Vineyard (parallel)' }
    @{ T='John 1:11-13'; B='jhn'; C=1; V=11; E=13; OT=$false }
    @{ T='John 15:1-8'; B='jhn'; C=15; V=1; E=8; OT=$false; L='John 15:1-8 - Vine and branches' }
    @{ T='Acts 13:46'; B='act'; C=13; V=46; E=46; OT=$false }
    @{ T='Romans 2:28-29'; B='rom'; C=2; V=28; E=29; OT=$false }
    @{ T='Romans 9:6-8'; B='rom'; C=9; V=6; E=8; OT=$false; L='Rom 9:6-8 - Not all Israel is Israel' }
    @{ T='Galatians 3:28-29'; B='gal'; C=3; V=28; E=29; OT=$false }
    @{ T='Galatians 6:16'; B='gal'; C=6; V=16; E=16; OT=$false; L='Gal 6:16 - Israel of God' }
    @{ T='Ephesians 2:11-22'; B='eph'; C=2; V=11; E=22; OT=$false }
    @{ T='Philippians 3:3'; B='php'; C=3; V=3; E=3; OT=$false }
    @{ T='1 Peter 2:9-10'; B='1pe'; C=2; V=9; E=10; OT=$false }
    @{ T='Hebrews 8:13'; B='heb'; C=8; V=13; E=13; OT=$false; L='Heb 8:13 - Old covenant obsolete'; P='Hebrews 8:7'; Pv=7 }
    @{ T='Hebrews 10:9'; B='heb'; C=10; V=9; E=9; OT=$false }
    @{ T='Revelation 2:9'; B='rev'; C=2; V=9; E=9; OT=$false }
    @{ T='Revelation 3:9'; B='rev'; C=3; V=9; E=9; OT=$false }
)

$graftList = @(
    @{ T='Genesis 12:1-3'; B='gen'; H='Gen'; C=12; V=1; E=3; OT=$true; L='Gen 12:1-3 - Abrahamic covenant' }
    @{ T='Genesis 15'; B='gen'; H='Gen'; C=15; V=1; E=21; OT=$true; L='Genesis 15 - Covenant cut' }
    @{ T='Genesis 17'; B='gen'; H='Gen'; C=17; V=1; E=27; OT=$true; L='Genesis 17 - Everlasting covenant' }
    @{ T='Genesis 22:15-18'; B='gen'; H='Gen'; C=22; V=15; E=18; OT=$true }
    @{ T='Exodus 19:5-6'; B='exo'; H='Exo'; C=19; V=5; E=6; OT=$true }
    @{ T='Leviticus 26:40-45'; B='lev'; H='Lev'; C=26; V=40; E=45; OT=$true; L='Lev 26:40-45 - Remember covenant' }
    @{ T='Deuteronomy 30:1-10'; B='deu'; H='Deu'; C=30; V=1; E=10; OT=$true; L='Deut 30 - Return and restore' }
    @{ T='2 Samuel 7:12-16'; B='2sa'; H='2Sa'; C=7; V=12; E=16; OT=$true; L='2 Sam 7 - Davidic covenant' }
    @{ T='Psalm 89:28-37'; B='psa'; H='Psa'; C=89; V=28; E=37; OT=$true }
    @{ T='Psalm 105'; B='psa'; H='Psa'; C=105; V=1; E=0; OT=$true; L='Psalm 105 - Covenant remembered' }
    @{ T='Psalm 106'; B='psa'; H='Psa'; C=106; V=1; E=0; OT=$true; L='Psalm 106 - Mercy to Israel' }
    @{ T='Isaiah 41:8-10'; B='isa'; H='Isa'; C=41; V=8; E=10; OT=$true; L='Isa 41:8-10 - Servant Israel' }
    @{ T='Isaiah 49'; B='isa'; H='Isa'; C=49; V=1; E=0; OT=$true; L='Isaiah 49 - Israel my servant' }
    @{ T='Isaiah 54'; B='isa'; H='Isa'; C=54; V=1; E=0; OT=$true; L='Isaiah 54 - Covenant of peace' }
    @{ T='Isaiah 59:20-21'; B='isa'; H='Isa'; C=59; V=20; E=21; OT=$true }
    @{ T='Jeremiah 31:31-37'; B='jer'; H='Jer'; C=31; V=31; E=37; OT=$true; L='Jer 31:31-37 - New covenant with Israel' }
    @{ T='Jeremiah 32:37-42'; B='jer'; H='Jer'; C=32; V=37; E=42; OT=$true }
    @{ T='Jeremiah 33:20-26'; B='jer'; H='Jer'; C=33; V=20; E=26; OT=$true; L='Jer 33:20-26 - Israel indestructible' }
    @{ T='Ezekiel 36'; B='ezk'; H='Eze'; C=36; V=1; E=0; OT=$true; L='Ezekiel 36 - Land and heart restored' }
    @{ T='Ezekiel 37'; B='ezk'; H='Eze'; C=37; V=1; E=0; OT=$true; L='Ezekiel 37 - Dry bones / one nation' }
    @{ T='Amos 9:11-15'; B='amo'; H='Amo'; C=9; V=11; E=15; OT=$true; L='Amos 9:11-15 - Tabernacle of David' }
    @{ T='Zechariah 8'; B='zec'; H='Zec'; C=8; V=1; E=0; OT=$true }
    @{ T='Zechariah 12'; B='zec'; H='Zec'; C=12; V=1; E=0; OT=$true }
    @{ T='Zechariah 14'; B='zec'; H='Zec'; C=14; V=1; E=0; OT=$true }
    @{ T='Romans 11:1-2'; B='rom'; H='Rom'; C=11; V=1; E=2; OT=$false; L='Rom 11:1-2 - Has God cast away Israel?' }
    @{ T='Romans 11:11-12'; B='rom'; H='Rom'; C=11; V=11; E=12; OT=$false }
    @{ T='Romans 11:17-24'; B='rom'; H='Rom'; C=11; V=17; E=24; OT=$false; L='Rom 11:17-24 - Olive tree / grafting' }
    @{ T='Romans 11:25-29'; B='rom'; H='Rom'; C=11; V=25; E=29; OT=$false; L='Rom 11:25-29 - All Israel saved' }
    @{ T='Romans 11:32'; B='rom'; H='Rom'; C=11; V=32; E=32; OT=$false }
    @{ T='Matthew 19:28'; B='mat'; H='Mat'; C=19; V=28; E=28; OT=$false }
    @{ T='Matthew 23:39'; B='mat'; H='Mat'; C=23; V=39; E=39; OT=$false }
    @{ T='Luke 22:30'; B='luk'; H='Luk'; C=22; V=30; E=30; OT=$false }
    @{ T='Luke 21:24'; B='luk'; H='Luk'; C=21; V=24; E=24; OT=$false; L='Luke 21:24 - Times of the Gentiles' }
    @{ T='Acts 1:6-7'; B='act'; H='Act'; C=1; V=6; E=7; OT=$false; L='Acts 1:6-7 - Restore kingdom to Israel?' }
    @{ T='Acts 3:19-21'; B='act'; H='Act'; C=3; V=19; E=21; OT=$false; L='Acts 3:19-21 - Times of restoration' }
    @{ T='Acts 15'; B='act'; H='Act'; C=15; V=1; E=0; OT=$false; L='Acts 15 - Gentiles not circumcised' }
    @{ T='Acts 21'; B='act'; H='Act'; C=21; V=17; E=26; OT=$false; L='Acts 21 - Paul and Jewish believers' }
    @{ T='Romans 1:16'; B='rom'; H='Rom'; C=1; V=16; E=16; OT=$false; L='Rom 1:16 - Jew first, also Greek' }
    @{ T='Romans 3'; B='rom'; H='Rom'; C=3; V=1; E=0; OT=$false; L='Romans 3 - Jews and Gentiles under sin' }
    @{ T='Romans 9-11'; B='rom'; H='Rom'; C=9; V=1; E=0; OT=$false; L='Romans 9-11 (full section)' }
    @{ T='1 Corinthians 10:32'; B='1co'; H='1Co'; C=10; V=32; E=32; OT=$false; L='1 Cor 10:32 - Threefold distinction' }
    @{ T='Revelation 7'; B='rev'; H='Rev'; C=7; V=1; E=0; OT=$false; L='Rev 7 - 144,000 from tribes' }
    @{ T='Revelation 12'; B='rev'; H='Rev'; C=12; V=1; E=0; OT=$false; L='Rev 12 - The woman' }
    @{ T='Revelation 21'; B='rev'; H='Rev'; C=21; V=1; E=0; OT=$false; L='Rev 21 - Twelve tribes and apostles' }
)

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine(@"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Supersessionism vs Scripture - Part 2 Study</title>
$css
</head>
<body>
<h1>Part 2: Supersessionism (Replacement Theology) vs Scripture - Gentiles Grafted, Not Replacing Israel</h1>
<div class="intro">
<p><strong>ESV</strong> in paragraph context | <strong>Blue Letter Bible</strong>: MacArthur, Chuck Smith C2000, Matthew Henry (selective) | <strong>Landscape layout</strong></p>
<div class="summary-box">
<p><strong>Short answer:</strong> The list of passages arguing that Gentiles are <em>added</em> rather than <em>replacing</em> ethnic Israel is significantly longer and more explicit than the list commonly cited for hard supersessionism (~19 primary replacement passages vs ~45+ covenant / grafting passages).</p>
<p><strong>Three positions:</strong> (1) <em>Hard supersessionism</em> - Church replaces Israel; promises to ethnic Israel belong only to the Church. (2) <em>Soft supersessionism / fulfillment</em> - Church fulfills Israel's mission in Christ; possible future for ethnic Israel. (3) <em>Restoration / dual-track</em> - Israel and Church have distinct but related roles.</p>
<p><strong>Important:</strong> No replacement passage explicitly says "the Church has replaced Israel." Advocates infer from judgment, fulfillment, new covenant, or Gentile inclusion. Romans 11 explicitly warns Gentiles not to boast over Israel and calls God's gifts and calling irrevocable.</p>
</div>
</div>

<div class="compare-columns">
<div class="compare-col replace">
<h2>A. Commonly cited for replacement theology (~19)</h2>
<ul>
"@)

foreach ($e in $replaceList) { [void]$sb.AppendLine((Render-IndexLink $e)) }
[void]$sb.AppendLine(@"
</ul>
<p class="count">Themes: vineyard/kingdom transferred, new covenant, one people in Christ, "Israel of God," obsolete old covenant. Mostly inferential.</p>
</div>
<div class="compare-col graft">
<h2>B. Israel's ongoing role / Gentiles grafted in (~45+)</h2>
<ul>
"@)
foreach ($e in $graftList) { [void]$sb.AppendLine((Render-IndexLink $e)) }
[void]$sb.AppendLine(@"
</ul>
<p class="count">OT: covenant promises to Israel remain. NT: olive tree (Rom 11), threefold distinction (1 Cor 10:32), tribal lists in Revelation. Many explicit statements.</p>
</div>
</div>
"@)

# --- FULL PASSAGES: replacement first, then grafting ---
[void]$sb.AppendLine('<div class="part-header">Section A - Replacement Theology Passages (full ESV paragraph context)</div>')
foreach ($e in $replaceList) {
    Write-Host "Fetching ESV: $($e.T)"
    [void]$sb.AppendLine((Render-EntryPassage -Entry $e -Side 'replace'))
}

[void]$sb.AppendLine('<div class="part-header">Section B - Gentiles Grafted In / Israel''s Ongoing Role (full ESV paragraph context)</div>')
foreach ($e in $graftList) {
    Write-Host "Fetching ESV: $($e.T)"
    [void]$sb.AppendLine((Render-EntryPassage -Entry $e -Side 'graft'))
}

[void]$sb.AppendLine(@'
<hr>
<p><em>Living Word Map - Part 2. ESV text via api.midvash.com. Blue Letter Bible links for interlinear and commentaries.</em></p>
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
$p = Start-Process -FilePath $edge -ArgumentList @('--headless=new','--disable-gpu','--no-pdf-header-footer',"--print-to-pdf=$OutPdf",$fileUri) -Wait -PassThru -WindowStyle Hidden
if (Test-Path $OutPdf) {
    Write-Host "Wrote PDF: $OutPdf ($((Get-Item $OutPdf).Length) bytes)"
} else {
    Write-Warning 'PDF not created - open HTML and Print to PDF (landscape).'
}
