# Build DEPORTATION-BIBLICAL-STUDY.html and .pdf
# Paragraph-context ESV + BLB links (MacArthur, Chuck Smith, Henry)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$OutHtml = Join-Path $Root 'data/DEPORTATION-BIBLICAL-STUDY.html'
$OutPdf  = Join-Path $Root 'data/DEPORTATION-BIBLICAL-STUDY.pdf'

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

# C2000 folder abbrev differs from Henry on some books (Exodus = Exd)
$script:C2000Folder = @{ Exo = 'Exd' }

# C2000 groups chapters into blocks  -  URL uses the block-start chapter
$script:C2000Block = @{
    'Gen:3' = 2; 'Gen:6' = 6; 'Gen:9' = 8; 'Gen:11' = 10
    'Exo:18' = 16; 'Exo:20' = 19; 'Exo:21' = 21; 'Exo:22' = 21; 'Exo:23' = 23
    'Lev:18' = 16; 'Lev:19' = 16; 'Lev:24' = 21
    'Deu:1' = 1; 'Deu:4' = 1; 'Deu:5' = 5; 'Deu:10' = 9; 'Deu:16' = 9; 'Deu:17' = 17; 'Deu:27' = 26; 'Deu:28' = 26
    'Mat:5' = 5; 'Mat:17' = 17; 'Mat:22' = 20; 'Mat:23' = 23; 'Mat:25' = 25
    'Luk:10' = 10; 'Luk:20' = 20
    'Rom:12' = 12; 'Rom:13' = 13
    'Ezr:10' = 1
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
    # Use string.Replace (not regex) to avoid accidental global matches
    $map = @(
        @([char]0x2014, ' - '), @([char]0x2013, '-'),
        @([char]0x201C, '"'), @([char]0x201D, '"'),
        @([char]0x2018, "'"), @([char]0x2019, "'"),
        @([char]0x00B6, ''), @([char]0x2026, '...'),
        @([char]0x00B7, ' | ')
    )
    foreach ($pair in $map) { $s = $s.Replace($pair[0].ToString(), $pair[1]) }
    # Mojibake repair (UTF-8 misread as Windows-1252)
    $e2ac = ([char]0x00E2).ToString() + ([char]0x20AC).ToString()
    $s = $s.Replace($e2ac + [char]0x0153, '"')
    $s = $s.Replace($e2ac + [char]0x201D, '"')
    $s = $s.Replace($e2ac + [char]0x201C, '"')
    $s = $s.Replace($e2ac + [char]0x0093, '"')
    $s = $s.Replace($e2ac + [char]0x0094, '"')
    $s = $s.Replace($e2ac + [char]0x009D, '"')
    $s = $s.Replace(([char]0x00C2).ToString() + ([char]0x00B6).ToString(), '')
    $s = $s.Replace(([char]0x00C2).ToString() + ([char]0x00B7).ToString(), ' | ')
    return $s
}

function Render-Passage {
    param(
        [string]$Title,
        [string]$Book,          # blb slug: gen, rom
        [string]$HenryAbr,      # Gen, Rom
        [int]$Ch,
        [int]$VsStart,
        [int]$VsEnd = 0,
        [bool]$IsOT = $true,
        [string]$ParaStartRef,  # e.g. "Genesis 9:1"
        [string]$ScriptureHtml, # HTML with <strong> on target verses
        [string]$Henry = '',
        [string]$Smith = '',
        [string]$MacArthur = '',
        [string]$Note = '',
        [string]$OtContext = ''
    )
    if ($VsEnd -eq 0) { $VsEnd = $VsStart }
    $range = if ($VsStart -eq $VsEnd) { "$Ch/$VsStart" } else { "$Ch/${VsStart}-$VsEnd" }
    $esv = Get-BlbEsv $Book $range
    $heb = Get-BlbInterlinear $Book $Ch $VsStart $IsOT
    $henryUrl = Get-BlbHenry $HenryAbr $Ch
    $smithUrl = Get-BlbSmith $HenryAbr $Ch
    $langLabel = if ($IsOT) { 'Hebrew Interlinear (BLB)' } else { 'Greek Interlinear (BLB)' }

    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("<section class=`"passage`">")
    [void]$sb.AppendLine("<h2>$(Escape-Html $Title)</h2>")
    [void]$sb.AppendLine('<div class="links">')
    [void]$sb.AppendLine("  <a href=`"$esv`">ESV Passage</a> | ")
    [void]$sb.AppendLine("  <a href=`"$heb`">$langLabel</a> | ")
    [void]$sb.AppendLine("  <a href=`"$henryUrl`">Matthew Henry</a> | ")
    [void]$sb.AppendLine("  <a href=`"$smithUrl`">Chuck Smith C2000</a>")
    if ($MacArthur) {
        [void]$sb.AppendLine(" | <a href=`"$MacArthur`">John MacArthur (Intro)</a>")
    }
    [void]$sb.AppendLine('</div>')
    if ($ParaStartRef -and $ParaStartRef -ne $Title) {
        [void]$sb.AppendLine("<p class=`"context-note`"><em>Starting with $ParaStartRef</em> - paragraph context (target reference in <strong>bold</strong>)</p>")
    } else {
        [void]$sb.AppendLine('<p class="context-note">Paragraph context (target reference in <strong>bold</strong> where marked)</p>')
    }
    if ($Note) { [void]$sb.AppendLine("<p class=`"note`">$(Escape-Html $Note)</p>") }
    if (-not $OtContext -and $script:OtContextByTitle.ContainsKey($Title)) {
        $OtContext = $script:OtContextByTitle[$Title]
    }
    if ($OtContext) {
        [void]$sb.AppendLine('<div class="ot-context">')
        [void]$sb.AppendLine('<h4>OT distinction: sojourner vs. nations of the land</h4>')
        [void]$sb.AppendLine("<p>$(Escape-Html $OtContext)</p></div>")
    }
    [void]$sb.AppendLine('<div class="scripture">')
    [void]$sb.AppendLine($ScriptureHtml)
    [void]$sb.AppendLine('</div>')
    if ($Henry) {
        [void]$sb.AppendLine('<div class="commentary"><h3>Matthew Henry <span class="tag">selective</span></h3>')
        [void]$sb.AppendLine("<p>$(Escape-Html $Henry)</p></div>")
    }
    if (-not $Smith -and $script:SmithByTitle.ContainsKey($Title)) {
        $Smith = $script:SmithByTitle[$Title]
    }
    if (-not $Smith) {
        $Smith = 'Full C2000 verse-by-verse transcript on Blue Letter Bible (link above).'
    }
    [void]$sb.AppendLine('<div class="commentary"><h3>Chuck Smith <span class="tag">C2000</span></h3>')
    [void]$sb.AppendLine("<p>$(Escape-Html $Smith)</p></div>")
    if ($MacArthur -and $script:MacArthurText.ContainsKey($Title)) {
        [void]$sb.AppendLine('<div class="commentary"><h3>John MacArthur</h3>')
        [void]$sb.AppendLine("<p>$(Escape-Html $script:MacArthurText[$Title])</p></div>")
    }
    [void]$sb.AppendLine('</section>')
    return $sb.ToString()
}

$MacArthurIntro = @{
    Genesis = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/genesis-intro.cfm'
    Romans  = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/romans-intro.cfm'
    John    = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/john-intro.cfm'
    '1John' = 'https://www.blueletterbible.org/comm/macarthur_john/bible-introductions/1-john-intro.cfm'
}

$MacArthurText = @{
    'Genesis 9:5-6' = 'Genesis is the book of beginnings  -  including human government under God after the Flood. Life is sacred because man bears God''s image; human authority exists to protect that image. Pre-Mosaic, pre-Israel  -  civil order as creation ordinance.'
    'Romans 13:1-7' = 'Some have ignored Paul''s teaching on obedience to human government (13:1-7) in the name of Christian activism; others have used it to defend slavish obedience to totalitarian regimes. Both are errors.'
}

$SmithByTitle = @{
    'Genesis 9:5-6' = 'At the beginning of a new civilization God establishes capital punishment: "Whoso sheddeth man''s blood, by man shall his blood be shed"  -  the beginning of human government, the basic foundation upon which human government was to be established. God gives man respect for life; the command antedates the law of Moses.'
    'Exodus 18:13-26' = 'Jethro saw Moses judging alone from morning till evening and said, "That''s not good  -  you''re gonna wear yourself out." He counseled able men who fear God, hate a bribe, chiefs of thousands, hundreds, fifties, and tens  -  "let them judge the people at all seasons." Moses hearkened and chose able men; the hard causes they brought to Moses, every small matter they judged themselves.'
    'Romans 13:1-7' = 'Paul wrote while Nero ruled Rome. The Bible does not allow civil disobedience except where God''s law supersedes man''s  -  as when they refused to declare Caesar lord, or when Peter said in Acts 4:19 we must obey God rather than men. Why does God allow evil rulers? Because men want them; yet we are subject because powers are ordained of God. Rulers bear the sword as ministers of God; pay taxes, for they are God''s ministers.'
    'Matthew 22:15-22' = 'Pharisees and Herodians tried to entangle Jesus: if He said pay taxes to Caesar, the Jews would hate Him as a Roman collaborator; if He said no, Rome would arrest Him. He asked whose image is on the denarius  -  "Caesar''s"  -  then: "Render therefore to Caesar the things which are Caesar''s; and unto God the things which are God''s." They marvelled and left Him.'
    'Leviticus 19:33-34' = 'Also the respect for a stranger (ger) - treat him as one born in the land; no tribal inheritance, but full neighbor-love. Same chapter forbids Canaanite occult (vv.26-31). The ger is not a landholding nation with Baal/Asherah cults; he is the landless resident under Yahweh''s law.'
    'Genesis 3:22-24' = 'God sent Adam forth from Eden and drove him out, cherubim guarding the tree of life  -  not merely judgment but protection: lest man eat of the tree of life and live forever in this miserable, cursed condition. God protects man from his own folly until redemption in Christ.'
    'Deuteronomy 28:64-68' = 'God pronounces curses for disobedience: "The Lord shall scatter thee among all people, from one end of the earth even unto the other." The Jew became a byword among nations  -  fulfilled in dispersion  -  because they disobeyed the commandments of God.'
    'Exodus 23:20-33' = 'Drive out six nations with land and gods - Hivites, Canaanites, Hittites, Perizzites, Amorites, Jebusites. "Make no covenant with them nor their gods." Little by little - lest Israel serve Baal and Asherah. Contrast vv.4-9: kindness to sojourner. Israel kept Gibeonites and paid for disobedience.'
    'Ezra 10:1-44' = 'After exile, Israel had again married foreign wives and risked idolatry. Ezra''s remedy seems harsh  -  put away the wives  -  "but it had to be done if they were going to survive." Smith notes inter-racial marriage was forbidden only to Israel to preserve the holy seed and prevent idolatry; for Christians the parallel is "be not unequally yoked with an unbeliever" (2 Cor 6:14).'
    'Acts 4:19-20' = 'When commanded not to speak in Jesus'' name, Peter answered: "Whether it be right in the sight of God to hearken unto you more than unto God, judge ye." Smith places this alongside Romans 13 as the limit  -  conscience and God''s law over human decree.'
    'Romans 13:8-10' = 'Continuing Romans 13: "Owe no man any thing, but to love one another"  -  love fulfills the law. Smith ties civil obedience (vv.1-7) to love of neighbor (vv.8-10); the Christian is subject to government and debtor to love.'
}

$OtContextByTitle = @{
    'Leviticus 19:33-34' = 'SOJOURNER (Heb. ger): a foreigner residing in Israel without inherited tribal land. Not a landholding nation; dependent on Israel''s hospitality and subject to the same law (cf. Num 15:15-16). Command: love as yourself  -  the opposite of oppressing the landless resident. Contrast: the seven nations of Canaan (Deut 7:1) held established territories and national cults; they were not gerim to be assimilated but occupants to be dispossessed because of abominations.'
    'Exodus 22:21-24' = 'SOJOURNER (ger): no tribal allotment; Israel must remember they were gerim in Egypt. Oppressing the landless foreigner is forbidden  -  distinct from the conquest command against established Canaanite nations who possessed the land and served other gods.'
    'Exodus 23:9' = 'SOJOURNER: "You shall not oppress a sojourner"  -  same memory-of-Egypt rationale as 22:21. The sojourner has no ancestral claim to Israel''s land; Israel is commanded justice toward the vulnerable resident, not expulsion.'
    'Numbers 15:15-16' = 'ONE LAW for native (ezrah) and sojourner (ger): the ger is under Israel''s covenant law but does not hold tribal inheritance. Same statutes  -  including worship of Yahweh alone  -  not coexistence with Canaanite national religions.'
    'Leviticus 24:22' = 'Same law for sojourner and native in capital cases  -  equal justice regardless of land status.'
    'Deuteronomy 10:17-19' = 'God "loves the sojourner" (ger)  -  food, clothing, no oppression. The ger is landless and dependent; Israel''s duty is provision and justice. Not the same category as the nations of the land whose kings, high places, and gods Israel was told to destroy (Deut 12:2-3).'
    'Deuteronomy 24:17-22' = 'Justice and gleaning rights for the sojourner, fatherless, and widow  -  all without secure land inheritance. The ger shares in Israel''s economic mercy; this is neighbor-love for the resident alien, not a treaty with a foreign nation''s religion.'
    'Leviticus 18:24-30' = 'NATIONS OF THE LAND (established occupants): Canaanites and predecessors defiled the land by abominations  -  child sacrifice (Molech), sexual cult practices tied to fertility gods (Baal/Asherah), necromancy. Israel must not adopt these practices; "the land vomited out its inhabitants." Reason for expulsion: incompatible worship and morality, not ethnicity alone.'
    'Exodus 23:20-33' = 'NATIONS WITH LAND AND GODS: Hittites, Amorites, Perizzites, Canaanites, Hivites, Jebusites  -  established peoples with territories and "their gods." Israel must make no covenant with them; they must not dwell in the land lest Israel serve Baal, Asherah, and the cults of those nations. Gradual dispossession  -  distinct from welcoming a landless ger under Yahweh''s law.'
    'Exodus 23:4-5' = 'Even an enemy''s donkey gets help  -  humanitarian duty. Distinct category from national expulsion: individual mercy vs. covenant separation from landholding idolatrous nations.'
    'Ezra 10:1-44' = 'POST-EXILE SEPARATION: wives from "peoples of the land" (Canaanites, Ammonites, Moabites, Egyptians per Ezra 9:1) who remained in pagan worship  -  not gerim who had joined Israel''s God. Ruth (Moabitess) shows the contrast: welcomed when she took Yahweh. Ezra''s crisis: national-religious allegiance that refused covenant, risking Baal/Asherah syncretism again.'
    'Nehemiah 13:1-3' = 'Excluded Ammonite and Moabite from the assembly (Deut 23:3)  -  nations with their own lands and gods (Chemosh, Milcom). Distinct from gerim who sojourn under Israel''s law. Separation for covenant purity, not blanket rejection of all foreigners (cf. Ruth, Rahab).'
    '2 Kings 17:6-23' = 'SAMARIA''S Syncretism: exiled Israel served other gods - Baal, Asherah at high places, plus imported deities (Nergal, Ashima, Adrammelech/Anammelech with child sacrifice, 2 Kgs 17:29-31). Israel became what they refused to drive out.'
    'Ruth 1-4' = 'MOABITE SOJOURNER, not Canaanite landholder: Ruth had no inheritance in Israel until Boaz redeemed; she chose Yahweh ("your people shall be my people, your God my God"). Welcomed into covenant  -  contrast with nations of the land whose gods and high places could not coexist with Torah.'
    'Isaiah 56:3-8' = 'FOREIGNERS who join themselves to the LORD  -  even eunuchs and strangers without Israelite lineage  -  welcomed in worship. Distinction: voluntary covenant allegiance to Yahweh vs. landholding nations maintaining rival cults in the Promised Land.'
    'Leviticus 19:9-10' = 'Gleanings left for the poor and the sojourner (ger)  -  economic provision for the landless resident, same holiness code that forbids Canaanite abominations (Lev 18).'
}

$css = @'
<style>
  @page { margin: 0.75in; background-color: #f4ecd8; }
  html, body {
    background-color: #f4ecd8;
    color: #2c2416;
    font-family: "Courier New", Courier, monospace;
    font-size: 11pt;
    line-height: 1.45;
    margin: 0;
    padding: 1em 1.25em 2em;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 { font-size: 16pt; border-bottom: 1px solid #8b7355; padding-bottom: 0.3em; }
  h2 { font-size: 13pt; margin-top: 1.5em; color: #3d2f1f; }
  h3 { font-size: 11pt; margin: 0.5em 0 0.25em; }
  a { color: #1a5276; }
  a:visited { color: #5b2c6f; }
  .intro, .part-header { margin: 1.5em 0; }
  .part-header { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
  .passage { margin-bottom: 2em; page-break-inside: avoid; }
  .links { font-size: 10pt; margin: 0.4em 0 0.6em; }
  .context-note { font-size: 10pt; color: #5c4a32; margin: 0.3em 0 0.6em; }
  .note { font-size: 10pt; font-style: italic; }
  .ot-context { margin: 0.6em 0 1em; padding: 0.6em 0.85em; background: #e0d4bc; border-left: 4px solid #8b6914; font-size: 10pt; }
  .ot-context h4 { margin: 0 0 0.35em; font-size: 10.5pt; color: #4a3a1a; }
  .ot-framework { margin: 1.5em 0 2em; padding: 1em 1.1em; background: #e8dcc4; border: 1px solid #b8986a; }
  .ot-framework h2 { margin-top: 0; font-size: 13pt; }
  .ot-framework ul { margin: 0.4em 0; padding-left: 1.4em; }
  .ot-framework li { margin: 0.25em 0; }
  .gods-table { font-size: 10pt; margin: 0.75em 0; border-collapse: collapse; width: 100%; }
  .gods-table th, .gods-table td { border: 1px solid #b8986a; padding: 0.35em 0.5em; text-align: left; vertical-align: top; }
  .gods-table th { background: #d4c4a8; }
  .scripture { margin: 0.5em 0 1em; padding-left: 0.5em; border-left: 3px solid #c4a574; }
  .scripture p { margin: 0.4em 0; }
  .commentary { margin: 0.75em 0; padding: 0.5em 0.75em; background: #ebe3cf; border-radius: 2px; }
  .commentary .tag { font-size: 9pt; font-weight: normal; color: #666; }
  strong { font-weight: bold; color: #1a1a1a; }
  .toc li { margin: 0.2em 0; }
  .appendix { margin-top: 2em; page-break-before: always; }
  .appendix-summary { margin: 0.75em 0 1em; padding: 0.65em 0.85em; background: #e8dcc4; border: 1px solid #b8986a; font-size: 10pt; }
  .appendix-summary ul { margin: 0.35em 0; padding-left: 1.3em; }
  .teachers-table { font-size: 9pt; margin: 0.75em 0; border-collapse: collapse; width: 100%; }
  .teachers-table th, .teachers-table td { border: 1px solid #b8986a; padding: 0.35em 0.45em; text-align: left; vertical-align: top; }
  .teachers-table th { background: #d4c4a8; }
  .teachers-table .class-a { font-weight: bold; color: #1a5276; }
  .teachers-table .class-u { font-weight: bold; color: #7d6608; }
  .cat-def { font-size: 10pt; margin: 0.75em 0; }
  .cat-def dt { font-weight: bold; margin-top: 0.5em; }
  .cat-def dd { margin: 0.2em 0 0.4em 1em; }
  @media print {
    html, body { background-color: #f4ecd8 !important; }
    .commentary { background: #ebe3cf !important; }
  }
</style>
'@

$header = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Is Deportation a Biblical Issue? - Scripture in Paragraph Context</title>
$css
</head>
<body>
<h1>Is Deportation a Biblical Issue We Can Come to Terms With Today?</h1>
<div class="intro">
<p>Scripture: <strong>English Standard Version (ESV)</strong> in <strong>paragraph context</strong>.
Target references appear in <strong>bold</strong>. When a passage begins mid-paragraph, the note
<em>Starting with ...</em> marks where the context begins.</p>
<p>Commentary (Blue Letter Bible): <strong>John MacArthur</strong> | <strong>Chuck Smith C2000</strong> (verse-by-verse) |
<strong>Matthew Henry</strong> (selective excerpts - full Henry on BLB is exhaustive).</p>
<p>Every entry includes clickable <strong>Hebrew</strong> or <strong>Greek Interlinear</strong> links on Blue Letter Bible.</p>
<p><strong>Appendix A</strong> compares nine Bible teachers on Romans 13 civil obedience (current government vs. God-only framing).</p>
</div>

<div class="ot-framework">
<h2>Old Testament Framework: Sojourner vs. Nations of the Land</h2>
<p>Israelite law distinguishes two categories that modern debates often collapse. <strong>Read the OT distinction notes</strong> (gold box) on passages below.</p>
<ul>
<li><strong>Sojourner / ger</strong> (resident alien)  -  a foreigner living <em>in</em> Israel <strong>without tribal land inheritance</strong>. Often poor, dependent, remembering Egypt. Commanded: no oppression, love as yourself, one law, gleaning rights, fair courts (Ex 22:21; 23:9; Lev 19:33-34; Num 15:15-16; Deut 10:19; 24:17-22). A ger who joins Yahweh is welcomed (Ruth; Isa 56).</li>
<li><strong>Native / ezrah</strong>  -  Israelite born with tribal allotment in the land.</li>
<li><strong>Nations / peoples of the land</strong>  -  established occupants with <strong>territories, kings, and national religions</strong>. Israel was commanded to dispossess them and make <strong>no covenant with them or their gods</strong> (Ex 23:23-33; Lev 18:24-30; Deut 7:1-5; 12:2-3). Reason given in text: abominations and idolatry that could not coexist with Torah  -  not mere ethnicity.</li>
</ul>
<p><strong>Gods and cults Israel was commanded to drive out</strong> (non-exhaustive; land could not "vomit out" Israel if these remained):</p>
<table class="gods-table">
<tr><th>Deity / cult</th><th>People / region</th><th>Scripture &amp; practice</th></tr>
<tr><td>Baal; Asherah/Ashtoreth</td><td>Canaanites; Phoenicians; syncretism in Israel</td><td>Storm/fertility worship; high places, sacred poles (Asherim); 1 Kgs 18; Judg 6; Deut 12:3</td></tr>
<tr><td>Molech / Milcom</td><td>Ammonites; Canaanite rites in Israel</td><td>Child sacrifice through fire; Lev 18:21; 20:2-5; 1 Kgs 11:5,7</td></tr>
<tr><td>Chemosh</td><td>Moabites</td><td>National god; child sacrifice ascribed in war taunt; Num 21:29; 1 Kgs 11:7</td></tr>
<tr><td>Ashtoreth</td><td>Sidonians</td><td>Solomon drawn to Sidonian cult; 1 Kgs 11:5</td></tr>
<tr><td>Dagon</td><td>Philistines</td><td>Temple cult; Judg 16:23; 1 Sam 5</td></tr>
<tr><td>Baal-peor</td><td>Moabites (Peor)</td><td>Idolatry and immorality at Shittim; Num 25</td></tr>
<tr><td>Golden calf</td><td>Egyptian-style syncretism</td><td>"These are your gods, O Israel"; Ex 32</td></tr>
<tr><td>High places, pillars, Asherim</td><td>Canaanite landscape religion</td><td>Deut 12:2-4; 2 Kgs 17:10-11  -  Israel told to destroy, not share</td></tr>
<tr><td>Succoth-benoth; Nergal; Ashima; Nibhaz/Tartak; Adrammelech/Anammelech</td><td>Import gods after Assyrian exile (Samaritan mix)</td><td>2 Kgs 17:29-31  -  nations serving gods of origin and of the land</td></tr>
<tr><td>"Queen of Heaven"</td><td>Popular syncretism in Judah</td><td>Jer 7:18  -  cakes, drink offerings to Ishtar/Astarte figure</td></tr>
<tr><td>Sun worship; Tammuz</td><td>Imported cults</td><td>Ezek 8:14-16  -  abominations at temple gate</td></tr>
</table>
<p><em>Seven nations of the land</em> (repeated list): Canaanites, Hittites, Amorites, Perizzites, Hivites, Jebusites  -  plus Girgashites (Deut 7:1). Border nations (Moab, Ammon, Edom) had their own lands and gods; intermarriage and treaty worship forbidden even when not all were "dispossessed" from Israel's territory.</p>
</div>
"@

$footer = @"
<hr>
<p><em>Generated for Living Word Map. Open any link in Blue Letter Bible for commentaries, interlinear, and cross-references.</em></p>
</body></html>
"@

$parts = New-Object System.Text.StringBuilder
[void]$parts.Append($header)

# --- PART ONE ---
[void]$parts.AppendLine('<div class="part-header">Part One  -  Law of the Land, Governing Authority, and Obedience</div>')

[void]$parts.AppendLine((Render-Passage `
    -Title 'Genesis 9:5-6' -Book 'gen' -HenryAbr 'Gen' -Ch 9 -VsStart 5 -VsEnd 6 -IsOT $true `
    -ParaStartRef 'Genesis 9:1' `
    -MacArthur $MacArthurIntro.Genesis `
    -Henry 'The magistrate must punish murderers: Whoso sheddeth man''s blood, by man shall his blood be shed. Before the flood, God took the punishment of murder into his own hands; but now he committed this judgment to men. Wilful murder ought always to be punished with death  -  because man is made in God''s image.' `
    -ScriptureHtml @'
<p>And God blessed Noah and his sons and said to them, “Be fruitful and multiply and fill the earth. The fear of you and the dread of you shall be upon every beast of the earth and upon every bird of the heavens, upon everything that creeps on the ground and all the fish of the sea. Into your hand they are delivered. Every moving thing that lives shall be food for you. And as I gave you the green plants, I give you everything. But you shall not eat flesh with its life, that is, its blood.</p>
<p>And for your <strong>lifeblood I will require a reckoning: from every beast I will require it and from man. From his fellow man I will require a reckoning for the life of man. “Whoever sheds the blood of man, by man shall his blood be shed, for God made man in his own image.</strong>”</p>
<p>And you, be fruitful and multiply, increase greatly on the earth and multiply in it.”</p>
'@))

[void]$parts.AppendLine((Render-Passage `
    -Title 'Exodus 18:13-26' -Book 'exo' -HenryAbr 'Exo' -Ch 18 -VsStart 13 -VsEnd 26 -IsOT $true `
    -ParaStartRef 'Exodus 18:13' `
    -ScriptureHtml @'
<p><strong>The next day Moses sat to judge the people, and the people stood around Moses from morning till evening. When Moses'' father-in-law saw all that he was doing for the people, he said, “What is this that you are doing for the people? Why do you sit alone, and all the people stand around you from morning till evening?” And Moses said to his father-in-law, “Because the people come to me to inquire of God; when they have a dispute, they come to me and I decide between one person and another, and I make them know the statutes of God and his laws.” Moses'' father-in-law said to him, “What you are doing is not good. You and the people with you will certainly wear yourselves out, for the thing is too heavy for you. You are not able to do it alone. Now obey my voice; I will give you advice, and God be with you! You shall represent the people before God and bring their cases to God, and you shall warn them about the statutes and the laws, and make them know the way in which they must walk and what they must do. Moreover, look for able men from all the people, men who fear God, who are trustworthy and hate a bribe, and place such men over the people as chiefs of thousands, of hundreds, of fifties, and of tens. And let them judge the people at all times. Every great matter they shall bring to you, but any small matter they shall decide themselves. So it will be easier for you, and they will bear the burden with you. If you do this, God will direct you, you will be able to endure, and all this people also will go to their place in peace.”</strong></p>
<p>So Moses listened to the voice of his father-in-law and did all that he had said. Moses chose able men out of all Israel and made them heads over the people, chiefs of thousands, of hundreds, of fifties, and of tens. And they judged the people at all times. Any hard case they brought to Moses, but any small matter they decided themselves.</p>
'@))

[void]$parts.AppendLine((Render-Passage `
    -Title 'Romans 13:1-7' -Book 'rom' -HenryAbr 'Rom' -Ch 13 -VsStart 1 -VsEnd 7 -IsOT $false `
    -ParaStartRef 'Romans 13:1' `
    -MacArthur $MacArthurIntro.Romans `
    -Henry 'Let every soul be subject  -  every person, not excluding the clergy. There is no power but of God  -  civil power is derived from him. We must be subject, not only for wrath, but for conscience'' sake. If Caesar''s commands interfere with God''s, we must obey God rather than men.' `
    -ScriptureHtml @'
<p><strong>Let every person be subject to the governing authorities. For there is no authority except from God, and those that exist have been instituted by God. Therefore whoever resists the authorities resists what God has appointed, and those who resist will incur judgment. For rulers are not a terror to good conduct, but to bad. Would you have no fear of the one who is in authority? Then do what is good, and you will receive his approval, for he is God''s servant for your good. But if you do wrong, be afraid, for he does not bear the sword in vain. For he is the servant of God, an avenger who carries out God''s wrath on the wrongdoer. Therefore one must be in subjection, not only because of God''s wrath but also for the sake of conscience. For because of this you also pay taxes, for the authorities are ministers of God, attending to this very thing. Pay to all what is owed to them: taxes to whom taxes are owed, revenue to whom revenue is owed, respect to whom respect is owed, honor to whom honor is owed.</strong></p>
'@))

[void]$parts.AppendLine((Render-Passage `
    -Title 'Matthew 22:15-22' -Book 'mat' -HenryAbr 'Mat' -Ch 22 -VsStart 15 -VsEnd 22 -IsOT $false `
    -ParaStartRef 'Matthew 22:15' `
    -Henry 'Render therefore to Caesar the things that are Caesar''s  -  we must remember withal to render to God the things that are God''s. Our purses be Caesar''s, our consciences are God''s. If Caesar''s commands interfere with God''s, we must obey God rather than men.' `
    -ScriptureHtml @'
<p><strong>Then the Pharisees went and plotted how to entangle him in his words. And they sent their disciples to him, along with the Herodians, saying, “Teacher, we know that you are true and teach the way of God truthfully, and you do not care about anyone''s opinion, for you are not swayed by appearances. Tell us, then, what you think. Is it lawful to pay taxes to Caesar, or not?” But Jesus, aware of their malice, said, “Why put me to the test, you hypocrites? Show me the coin for the tax.” And they brought him a denarius. And Jesus said to them, “Whose likeness and inscription is this?” They said, “Caesar''s.” Then he said to them, “Therefore render to Caesar the things that are Caesar''s, and to God the things that are God''s.” When they heard it, they marveled. And they left him and went away.</strong></p>
'@))

# Remaining Part 1 entries  -  link + note to read full ¶ on BLB
$part1Rest = @(
    @{ T='Exodus 20:1-17'; B='exo'; H='Exo'; C=20; V=1; E=17; OT=$true; P='Exodus 20:1' }
    @{ T='Exodus 21-23'; B='exo'; H='Exo'; C=21; V=1; E=0; OT=$true; P='Exodus 21:1'; N='Full Book of the Covenant  -  read entire chapters on BLB in paragraph view.' }
    @{ T='Leviticus 18:24-30'; B='lev'; H='Lev'; C=18; V=24; E=30; OT=$true; P='Leviticus 18:24'
       OtCtx='NATIONS OF THE LAND: established occupants defiled Canaan by Molech worship, Baal/Asherah fertility cults, and sexual abominations (vv.1-23). Israel must not copy them; land "vomited out" prior nations. Not a sojourner law  -  a territorial-cultic judgment.' }
    @{ T='Leviticus 19:15'; B='lev'; H='Lev'; C=19; V=15; E=15; OT=$true; P='Leviticus 19:1'; N='Starting with holiness code; v.15 in broader ch.19 context.' }
    @{ T='Leviticus 19:33-34'; B='lev'; H='Lev'; C=19; V=33; E=34; OT=$true; P='Leviticus 19:33'
       Ht='Thou shalt not vex a stranger, but love him as thyself  -  as one of thy own people. Cheating a stranger is as great a sin as cheating an Israelite.' }
    @{ T='Leviticus 24:22'; B='lev'; H='Lev'; C=24; V=22; E=22; OT=$true; P='Leviticus 24:17'
       OtCtx='Same capital law for sojourner and native  -  justice without regard to land inheritance.' }
    @{ T='Numbers 15:15-16'; B='num'; H='Num'; C=15; V=15; E=16; OT=$true; P='Numbers 15:14'
       OtCtx='One statute for ger and native before the LORD  -  sojourner under Torah, not under Canaanite national cults.' }
    @{ T='Numbers 35:29-34'; B='num'; H='Num'; C=35; V=29; E=34; OT=$true; P='Numbers 35:29' }
    @{ T='Deuteronomy 1:16-17'; B='deu'; H='Deu'; C=1; V=16; E=17; OT=$true; P='Deuteronomy 1:16' }
    @{ T='Deuteronomy 4:5-8'; B='deu'; H='Deu'; C=4; V=5; E=8; OT=$true; P='Deuteronomy 4:5' }
    @{ T='Deuteronomy 5:1-33'; B='deu'; H='Deu'; C=5; V=1; E=33; OT=$true; P='Deuteronomy 5:1' }
    @{ T='Deuteronomy 10:17-19'; B='deu'; H='Deu'; C=10; V=17; E=19; OT=$true; P='Deuteronomy 10:12'
       OtCtx='Love the sojourner (ger)  -  landless resident. Parallel command to destroy Canaanite worship sites (Deut 12) shows both duties: mercy to ger, no coexistence with nations'' gods.' }
    @{ T='Deuteronomy 16:18-20'; B='deu'; H='Deu'; C=16; V=18; E=20; OT=$true; P='Deuteronomy 16:18' }
    @{ T='Deuteronomy 17:8-13'; B='deu'; H='Deu'; C=17; V=8; E=13; OT=$true; P='Deuteronomy 17:8' }
    @{ T='Deuteronomy 17:14-20'; B='deu'; H='Deu'; C=17; V=14; E=20; OT=$true; P='Deuteronomy 17:14' }
    @{ T='Deuteronomy 27-28'; B='deu'; H='Deu'; C=27; V=1; E=0; OT=$true; P='Deuteronomy 27:1'; N='Blessings and curses  -  full chapters on BLB.' }
    @{ T='Joshua 1:7-8'; B='jos'; H='Jos'; C=1; V=7; E=8; OT=$true; P='Joshua 1:1' }
    @{ T='2 Samuel 23:3-4'; B='2sa'; H='2Sa'; C=23; V=3; E=4; OT=$true; P='2 Samuel 23:1' }
    @{ T='Psalm 72'; B='psa'; H='Psa'; C=72; V=1; E=0; OT=$true; P='Psalm 72:1'; N='Full psalm  -  kingship and justice.' }
    @{ T='Psalm 82'; B='psa'; H='Psa'; C=82; V=1; E=0; OT=$true; P='Psalm 82:1' }
    @{ T='Proverbs 8:15-16'; B='pro'; H='Pro'; C=8; V=15; E=16; OT=$true; P='Proverbs 8:12' }
    @{ T='Proverbs 16:10-15'; B='pro'; H='Pro'; C=16; V=10; E=15; OT=$true; P='Proverbs 16:10' }
    @{ T='Proverbs 20:8'; B='pro'; H='Pro'; C=20; V=8; E=8; OT=$true; P='Proverbs 20:8' }
    @{ T='Proverbs 24:21-22'; B='pro'; H='Pro'; C=24; V=21; E=22; OT=$true; P='Proverbs 24:21' }
    @{ T='Proverbs 29:2'; B='pro'; H='Pro'; C=29; V=2; E=2; OT=$true; P='Proverbs 29:2' }
    @{ T='Ecclesiastes 8:2-5'; B='ecc'; H='Ecc'; C=8; V=2; E=5; OT=$true; P='Ecclesiastes 8:2' }
    @{ T='Isaiah 1:16-17'; B='isa'; H='Isa'; C=1; V=16; E=17; OT=$true; P='Isaiah 1:16' }
    @{ T='Isaiah 33:22'; B='isa'; H='Isa'; C=33; V=22; E=22; OT=$true; P='Isaiah 33:20' }
    @{ T='Jeremiah 22:3'; B='jer'; H='Jer'; C=22; V=3; E=3; OT=$true; P='Jeremiah 22:1' }
    @{ T='Ezekiel 18:5-9'; B='ezk'; H='Eze'; C=18; V=5; E=9; OT=$true; P='Ezekiel 18:5' }
    @{ T='Micah 6:8'; B='mic'; H='Mic'; C=6; V=8; E=8; OT=$true; P='Micah 6:6' }
    @{ T='Matthew 5:17-20'; B='mat'; H='Mat'; C=5; V=17; E=20; OT=$false; P='Matthew 5:17' }
    @{ T='Matthew 17:24-27'; B='mat'; H='Mat'; C=17; V=24; E=27; OT=$false; P='Matthew 17:24' }
    @{ T='Matthew 23:1-3'; B='mat'; H='Mat'; C=23; V=1; E=3; OT=$false; P='Matthew 23:1' }
    @{ T='Luke 20:20-26'; B='luk'; H='Luk'; C=20; V=20; E=26; OT=$false; P='Luke 20:20' }
    @{ T='John 19:10-11'; B='jhn'; H='Jhn'; C=19; V=10; E=11; OT=$false; P='John 19:10'; Ma=$MacArthurIntro.John }
    @{ T='Acts 4:19-20'; B='act'; H='Act'; C=4; V=19; E=20; OT=$false; P='Acts 4:18' }
    @{ T='Acts 5:27-29'; B='act'; H='Act'; C=5; V=27; E=29; OT=$false; P='Acts 5:27' }
    @{ T='Acts 23:1-5'; B='act'; H='Act'; C=23; V=1; E=5; OT=$false; P='Acts 23:1' }
    @{ T='Titus 3:1-2'; B='tit'; H='Tit'; C=3; V=1; E=2; OT=$false; P='Titus 3:1' }
    @{ T='1 Timothy 2:1-2'; B='1ti'; H='1Ti'; C=2; V=1; E=2; OT=$false; P='1 Timothy 2:1' }
    @{ T='1 Peter 2:13-17'; B='1pe'; H='1Pe'; C=2; V=13; E=17; OT=$false; P='1 Peter 2:11' }
)

foreach ($e in $part1Rest) {
    $ve = if ($e.E -eq 0) { $e.V } else { $e.E }
    $html = "<p>Open the <strong>ESV Passage</strong> link below and read from <em>$($e.P)</em> through the target reference in Blue Letter Bible paragraph view. Highlight the target verses there.</p>"
    $params = @{
        Title=$e.T; Book=$e.B; HenryAbr=$e.H; Ch=$e.C; VsStart=$e.V; IsOT=$e.OT
        ParaStartRef=$e.P; ScriptureHtml=$html
    }
    if ($ve -ne $e.V) { $params.VsEnd = $ve }
    if ($e.N) { $params.Note = $e.N }
    if ($e.Ht) { $params.Henry = $e.Ht }
    if ($e.Ma) { $params.MacArthur = $e.Ma }
    if ($e.OtCtx) { $params.OtContext = $e.OtCtx }
    [void]$parts.AppendLine((Render-Passage @params))
}

# --- PART TWO ---
[void]$parts.AppendLine('<div class="part-header">Part Two  -  Love of Christ and Love of Neighbor</div>')

[void]$parts.AppendLine((Render-Passage `
    -Title 'Leviticus 19:33-34' -Book 'lev' -HenryAbr 'Lev' -Ch 19 -VsStart 33 -VsEnd 34 -IsOT $true `
    -ParaStartRef 'Leviticus 19:33' `
    -Henry 'Thou shalt not vex a stranger, but love him as thyself, as one of thy own people. They must not trample upon mankind  -  love the stranger; for you were strangers in Egypt.' `
    -ScriptureHtml @'
<p><strong>“When a stranger sojourns with you in your land, you shall not do him wrong. You shall treat the stranger who sojourns with you as the native among you, and you shall love him as yourself, for you were strangers in the land of Egypt: I am the LORD your God.”</strong></p>
'@))

$part2Rest = @(
    @{ T='Exodus 22:21-24'; B='exo'; H='Exo'; C=22; V=21; E=24; OT=$true; P='Exodus 22:21' }
    @{ T='Exodus 23:4-5'; B='exo'; H='Exo'; C=23; V=4; E=5; OT=$true; P='Exodus 23:4' }
    @{ T='Exodus 23:9'; B='exo'; H='Exo'; C=23; V=9; E=9; OT=$true; P='Exodus 23:9' }
    @{ T='Leviticus 19:9-10'; B='lev'; H='Lev'; C=19; V=9; E=10; OT=$true; P='Leviticus 19:9' }
    @{ T='Leviticus 19:17-18'; B='lev'; H='Lev'; C=19; V=17; E=18; OT=$true; P='Leviticus 19:17' }
    @{ T='Deuteronomy 10:17-19'; B='deu'; H='Deu'; C=10; V=17; E=19; OT=$true; P='Deuteronomy 10:17' }
    @{ T='Deuteronomy 15:7-11'; B='deu'; H='Deu'; C=15; V=7; E=11; OT=$true; P='Deuteronomy 15:7' }
    @{ T='Deuteronomy 24:17-22'; B='deu'; H='Deu'; C=24; V=17; E=22; OT=$true; P='Deuteronomy 24:17' }
    @{ T='Isaiah 58:6-10'; B='isa'; H='Isa'; C=58; V=6; E=10; OT=$true; P='Isaiah 58:6' }
    @{ T='Zechariah 7:9-10'; B='zec'; H='Zec'; C=7; V=9; E=10; OT=$true; P='Zechariah 7:9' }
    @{ T='Matthew 5:38-48'; B='mat'; H='Mat'; C=5; V=38; E=48; OT=$false; P='Matthew 5:38' }
    @{ T='Matthew 22:34-40'; B='mat'; H='Mat'; C=22; V=34; E=40; OT=$false; P='Matthew 22:34' }
    @{ T='Matthew 25:31-46'; B='mat'; H='Mat'; C=25; V=31; E=46; OT=$false; P='Matthew 25:31' }
    @{ T='Luke 10:25-37'; B='luk'; H='Luk'; C=10; V=25; E=37; OT=$false; P='Luke 10:25' }
    @{ T='John 13:34-35'; B='jhn'; H='Jhn'; C=13; V=34; E=35; OT=$false; P='John 13:34'; Ma=$MacArthurIntro.John }
    @{ T='Romans 12:9-21'; B='rom'; H='Rom'; C=12; V=9; E=21; OT=$false; P='Romans 12:9'; Ma=$MacArthurIntro.Romans }
    @{ T='Romans 13:8-10'; B='rom'; H='Rom'; C=13; V=8; E=10; OT=$false; P='Romans 13:8'; Ma=$MacArthurIntro.Romans }
    @{ T='1 John 4:7-21'; B='1jo'; H='1Jo'; C=4; V=7; E=21; OT=$false; P='1 John 4:7'; Ma=$MacArthurIntro.'1John' }
)
foreach ($e in $part2Rest) {
    $html = "<p>Read <em>$($e.P)</em> through target in BLB ESV paragraph view (link below).</p>"
    $params = @{ Title=$e.T; Book=$e.B; HenryAbr=$e.H; Ch=$e.C; VsStart=$e.V; VsEnd=$e.E; IsOT=$e.OT; ParaStartRef=$e.P; ScriptureHtml=$html }
    if ($e.Ma) { $params.MacArthur = $e.Ma }
    if ($e.OtCtx) { $params.OtContext = $e.OtCtx }
    [void]$parts.AppendLine((Render-Passage @params))
}

# --- PART THREE ---
[void]$parts.AppendLine('<div class="part-header">Part Three  -  Deportation, Expulsion, Exile, Covenant Separation</div>')

[void]$parts.AppendLine((Render-Passage `
    -Title 'Genesis 3:22-24' -Book 'gen' -HenryAbr 'Gen' -Ch 3 -VsStart 22 -VsEnd 24 -IsOT $true `
    -ParaStartRef 'Genesis 3:22' `
    -MacArthur $MacArthurIntro.Genesis `
    -Henry 'God turned him out and kept him out  -  sent him forth, then drove him out. Exclusion from communion with God which was the bliss of paradise. Cherubim guarded the way to the tree of life.' `
    -ScriptureHtml @'
<p><strong>Then the LORD God said, “Behold, the man has become like one of us in knowing good and evil. Now, lest he reach out his hand and take also of the tree of life and eat, and live forever - ” therefore the LORD God sent him out from the garden of Eden to work the ground from which he was taken. He drove out the man, and at the east of the garden of Eden he placed the cherubim and a flaming sword that turned every way to guard the way to the tree of life.</strong></p>
'@))

[void]$parts.AppendLine((Render-Passage `
    -Title 'Deuteronomy 28:64-68' -Book 'deu' -HenryAbr 'Deu' -Ch 28 -VsStart 64 -VsEnd 68 -IsOT $true `
    -ParaStartRef 'Deuteronomy 28:58' `
    -Henry 'The Lord shall scatter thee among all people  -  remarkably fulfilled in their dispersion. If they would not be ruled by God''s commands, they should be ruined by his curse.' `
    -ScriptureHtml @'
<p>“If you are not careful to do all the words of this law that are written in this book... the LORD will bring you and your king... to a nation that you have not known...</p>
<p><strong>And the LORD will scatter you among all peoples, from one end of the earth to the other, and there you shall serve other gods of wood and stone... And among these nations you shall find no rest... The LORD will bring you back in ships to Egypt... and there you shall offer yourselves for sale as male and female slaves, but no one will buy you.”</strong></p>
'@))

[void]$parts.AppendLine((Render-Passage `
    -Title 'Ezra 10:1-44' -Book 'ezr' -HenryAbr 'Ezr' -Ch 10 -VsStart 1 -VsEnd 44 -IsOT $true `
    -ParaStartRef 'Ezra 10:1' `
    -Henry 'The greater problem was wives who remained pagan and refused the covenant  -  separation grounded in faith, not race. Covenant-faithfulness after exile.' `
    -ScriptureHtml @'
<p><strong>While Ezra prayed and made confession... Shecaniah said, “We have broken faith with our God and have married foreign women... let us make a covenant with our God to put away all these wives...”</strong>  -  read full chapter on BLB for the assembly, oath, and list of names (Ezra 10:1-44).</p>
'@))

$part3Rest = @(
    @{ T='Genesis 6:5-7'; B='gen'; H='Gen'; C=6; V=5; E=7; OT=$true; P='Genesis 6:5' }
    @{ T='Genesis 11:1-9'; B='gen'; H='Gen'; C=11; V=1; E=9; OT=$true; P='Genesis 11:1' }
    @{ T='Exodus 23:20-33'; B='exo'; H='Exo'; C=23; V=20; E=33; OT=$true; P='Exodus 23:20'
       OtCtx='Six nations named with territories and gods  -  drive out, no covenant, lest Israel serve Baal, Asherah, and Canaanite cults. Not a sojourner passage.' }
    @{ T='2 Kings 17:6-23'; B='2ki'; H='2Ki'; C=17; V=6; E=23; OT=$true; P='2 Kings 17:6'
       OtCtx='Catalog of syncretism: Baal, Asherah, high places, plus imported gods (Nergal, Ashima, etc.). Israel exiled for doing what they were told to drive out.' }
    @{ T='Jeremiah 29:10-14'; B='jer'; H='Jer'; C=29; V=10; E=14; OT=$true; P='Jeremiah 29:10' }
    @{ T='Nehemiah 13:1-3'; B='neh'; H='Neh'; C=13; V=1; E=3; OT=$true; P='Nehemiah 13:1' }
    @{ T='Ruth 1-4'; B='rut'; H='Rut'; C=1; V=1; E=0; OT=$true; P='Ruth 1:1'; N='Faithful foreigner welcomed  -  full book on BLB.' }
    @{ T='Isaiah 56:3-8'; B='isa'; H='Isa'; C=56; V=3; E=8; OT=$true; P='Isaiah 56:3' }
)
foreach ($e in $part3Rest) {
    $ve = if ($e.E -eq 0) { $e.V } else { $e.E }
    $html = "<p>Read from <em>$($e.P)</em> in BLB ESV paragraph view.</p>"
    $params = @{ Title=$e.T; Book=$e.B; HenryAbr=$e.H; Ch=$e.C; VsStart=$e.V; IsOT=$e.OT; ParaStartRef=$e.P; ScriptureHtml=$html }
    if ($ve -ne $e.V) { $params.VsEnd = $ve }
    if ($e.N) { $params.Note = $e.N }
    if ($e.OtCtx) { $params.OtContext = $e.OtCtx }
    [void]$parts.AppendLine((Render-Passage @params))
}

$teachersAppendix = @'
<div class="appendix">
<h2>Appendix A - Bible Teachers: Government Obedience (Romans 13)</h2>
<p>Comparison of teachers the user listens to for Bible teaching and meditation. Source data:
<code>data/BIBLE-TEACHERS-GOVERNMENT-OBEDIENCE.txt</code> (compiled 2026-08-02).</p>

<div class="appendix-summary">
<p><strong>Question.</strong> Does each teacher treat Romans 13 as binding duty to the <em>current</em> civil government
(taxes, laws, honor officials), with a narrow Acts 4:19 / Acts 5:29 exception - or frame obedience mainly as
obedience to God apart from the physical magistrate?</p>
<ul>
<li><strong>Category A</strong> (current civil government): <strong>6 of 9</strong></li>
<li><strong>Category B</strong> (God apart from physical state): <strong>0 of 9</strong></li>
<li><strong>Unclear</strong> (no public Rom 13:1-7 civil doctrine on record): <strong>3 of 9</strong></li>
</ul>
<p><em>Note:</em> All six Category A teachers also say God outranks the state when the two directly conflict.
That is standard evangelical dual citizenship, not Category B.</p>
</div>

<table class="teachers-table">
<tr><th>Teacher</th><th>Class</th><th>Primary source</th><th>Key quote / summary</th></tr>
<tr>
<td>Chuck Smith</td><td class="class-a">A</td>
<td><a href="https://www.blueletterbible.org/Comm/smith_chuck/c2000_Rom/Rom_013.cfm">C2000 Romans 13 (BLB)</a></td>
<td>Submit to governing authorities (Paul under Nero). Obedience is the norm; Acts 4:19 is the rare limit when God''s law supersedes human decree.</td>
</tr>
<tr>
<td>Chuck Missler</td><td class="class-a">A</td>
<td><a href="https://khouse.org/personal_update/articles/2000/our-dual-citizenship">Our Dual Citizenship</a> (Koinonia House)</td>
<td>Rom 13:1-3; in a republic submission is primarily to laws and constitutional processes, not persons. Christ remains final authority.</td>
</tr>
<tr>
<td>Chuck Swindoll</td><td class="class-a">A</td>
<td><a href="https://insight.org/broadcasts/series-library/message/how-to-be-a-godly-rebel">How to Be a Godly Rebel</a> (Insight for Living)</td>
<td>Submit under Nero as default; civil disobedience only when human authority conflicts with God; pay taxes, obey laws.</td>
</tr>
<tr>
<td>Chip Ingram</td><td class="class-a">A</td>
<td><a href="https://livingontheedge.org/message/the-church-and-politics/">The Church and Politics</a> (Living on the Edge)</td>
<td>God placed this government at this time in this country; submit, pay taxes, honor as worship (Rom 13:1-7).</td>
</tr>
<tr>
<td>Charles Stanley</td><td class="class-a">A</td>
<td><a href="https://www.charleslstanley.com/a-biblical-response-to-the-response-to-the-recent-election/">Election response essay</a></td>
<td>Anti-anarchy; submit to authorities. Civil disobedience only when state forbids what God commands or commands sin.</td>
</tr>
<tr>
<td>Alistair Begg</td><td class="class-a">A</td>
<td><a href="https://www.truthforlife.org/resources/sermon/citizenship-part-one/">Citizenship - Part One</a> (Truth For Life)</td>
<td>Exemplary earthly citizens; submit, pay taxes, honor leaders. God first when worship/allegiance conflict.</td>
</tr>
<tr>
<td>Dan Mohler</td><td class="class-u">?</td>
<td><a href="https://sites.google.com/site/danmohlerbecominglove/hcskl-2010-notes/day-24">HCSKL Day 24 notes</a></td>
<td>Reads Rom 13:8-10 only; skips 13:1-7. Authority teaching is spiritual (kingdom over enemy). No clear civil doctrine on record.</td>
</tr>
<tr>
<td>Todd White</td><td class="class-u">?</td>
<td><a href="https://lifestylechristianity.com/about-us/">Lifestyle Christianity</a></td>
<td>Obedience to Christ, identity, evangelism. No Rom 13:1-7 sermon found for this Todd White (distinct from other Pastor Todd on SermonAudio).</td>
</tr>
<tr>
<td>Lionheart Church</td><td class="class-u">?</td>
<td><a href="https://www.youtube.com/@LionheartChurch">lionheartchurch.org</a></td>
<td>Rom 13:1-7 civil magistrate teaching not verified from available notes. Political prayer content exists; doctrine unconfirmed.</td>
</tr>
</table>

<dl class="cat-def">
<dt>A - Current civil government</dt>
<dd>Default: obey the magistrate you are under (laws, taxes, respect). Exception: obey God rather than men when direct conflict (Acts 4:19). Passages: Rom 13:1-7, 1 Pet 2:13-17, Titus 3:1, Matt 22:21.</dd>
<dt>B - God apart from physical state</dt>
<dd>Government obedience collapsed into spiritual obedience only; little or no binding duty to civil authority. None of the nine clearly teach this on record.</dd>
<dt>? - Unclear</dt>
<dd>Insufficient public teaching on Rom 13:1-7 / civil magistrate duty to classify as A or B.</dd>
</dl>

<p><strong>Related passages in this study:</strong> Rom 13:1-7, Acts 4:19, Acts 5:29, 1 Pet 2:13-17, Titus 3:1, Matt 22:15-22.
Chuck Smith C2000 on Rom 13 is indexed in <code>data/DEPORTATION-BLB-INDEX.txt</code>.</p>
</div>
'@

[void]$parts.AppendLine($teachersAppendix)

[void]$parts.AppendLine($footer)
$htmlContent = Normalize-UnicodeText $parts.ToString()
# UTF-8 with BOM so Edge/browser detect encoding when printing to PDF
[System.IO.File]::WriteAllText($OutHtml, $htmlContent, (New-Object System.Text.UTF8Encoding $true))
Write-Host "Wrote HTML: $OutHtml"

# PDF via Edge headless
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
if (-not (Test-Path $edge)) { Write-Warning 'Microsoft Edge not found  -  HTML only.'; exit 0 }

$htmlPath = (Resolve-Path $OutHtml).Path
$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')
if (Test-Path $OutPdf) { Remove-Item $OutPdf -Force }
$edgeArgs = @(
    '--headless=new'
    '--disable-gpu'
    '--no-pdf-header-footer'
    "--print-to-pdf=$OutPdf"
    $fileUri
)
$p = Start-Process -FilePath $edge -ArgumentList $edgeArgs -Wait -PassThru -WindowStyle Hidden
if ($p.ExitCode -ne 0) { Write-Warning "Edge exit code $($p.ExitCode)" }
if (Test-Path $OutPdf) {
    Write-Host "Wrote PDF: $OutPdf ($((Get-Item $OutPdf).Length) bytes)"
} else {
    Write-Warning 'PDF not created  -  open HTML in browser and Print to PDF.'
}
