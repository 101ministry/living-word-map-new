# Builds public/round1-data.js for the Round 1 prayer journey page.
param(
    [string]$Round1File = "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt",
    [string]$Round1Json = "$PSScriptRoot\..\public\prayers\en.json",
    [string]$GraphDataJs = "$PSScriptRoot\..\public\data.js",
    [string]$ChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART-NUMBERED.txt",
    [string]$MembershipFile = "$PSScriptRoot\..\data\PRINCIPALITY-MEMBERSHIPS.txt",
    [string]$OutputFile = "$PSScriptRoot\..\public\round1-data.js"
)

$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)
. (Join-Path $PSScriptRoot 'lib-numbered-chart.ps1')

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, $Utf8)
}

function Slugify([string]$text) {
    $t = $text.ToLower() -replace '[^a-z0-9]+', '-'
    return $t.Trim('-')
}

function Normalize-TopicKey([string]$text) {
    if (-not $text) { return '' }
    $t = $text.ToLower()
    $t = $t -replace '^(spirit of|familiar identity of|interacting with the spirit of)\s+', ''
    $t = $t -replace '^(being in|being|having|using|going to|reading|playing with|participating in)\s+', ''
    $t = $t -replace '-', ''
    $t = $t -replace '[^a-z0-9]+', ' '
    return ($t.Trim() -replace '\s+', ' ')
}

function Normalize-Principality([string]$name) {
    if (-not $name) { return $name }
    $map = @{
        'Sleep-Slumber' = 'Slothfulness'
        'Lying' = 'Lies'
        'Spirit of Heaviness' = 'Heaviness'
        'Spirit of Anti-Christ' = 'Anti-Christ'
        'Deaf' = 'Deaf & Dumb'
        'Spirit Spouse' = 'Spirit Spouse Gods'
        'Destructive Attitudes Against God' = "Destructive Attitudes Against God$([char]0x2019)s Image"
        'Destructive Identities Against God' = 'Destructive Identities Against God'
    }
    if ($map.ContainsKey($name)) { return $map[$name] }
    return $name
}

function Resolve-MembershipPrincipality([string]$header) {
    $clean = $header.Trim()
    if ($clean -match '^\[(.+)\]$') { $clean = $Matches[1].Trim() }
    $clean = ($clean -replace '^(?i)PRINCIPALITY OF\s+', '').Trim()
    $clean = ($clean -replace '^(?i)SPIRIT OF\s+', '').Trim()
    if ((Slugify $clean) -eq 'perversion') { return 'Perversion' }
    if ((Slugify $clean) -eq 'sexual-perversion') { return 'Sexual Perversion' }
    $known = @(
        'Jealousy', 'Slothfulness', 'Haughtiness', 'Lies', 'Bondage', 'Idolatry', 'Error',
        'Fear', 'Divination', 'Heaviness', 'Anti-Christ', 'Deaf & Dumb', 'Perversion', 'Sexual Perversion',
        'Whoredom', 'Infirmity', 'Shedding of Innocent Blood', 'Treachery Against Others',
        'Using and Abusing Others Emotionally, Physically, Spiritually, and Verbally',
        'Trading Floor Transactions with Demons', 'Gluttony', 'Self-Righteousness',
        'Rebellion', "Destructive Attitudes Against God$([char]0x2019)s Image",
        'Destructive Identities Against God', 'Spirit Spouse Gods'
    )
    foreach ($p in $known) {
        if ((Slugify $p) -eq (Slugify $clean)) { return Normalize-Principality $p }
    }
    return Normalize-Principality $clean
}

function Split-MembershipLabels([string]$line) {
    $trimmed = $line.Trim()
    if (-not $trimmed) { return @() }
    $normalized = ($trimmed -replace "`t", '    ').Trim()
    $labels = @($normalized -split '\s{4,}' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($labels.Count -le 1) {
        if ($trimmed -match "`t") {
            $labels = @($trimmed -split "`t" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        } else {
            $labels = @($trimmed -split '\s{2,}' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        }
    }

    $expanded = [System.Collections.Generic.List[string]]::new()
    foreach ($label in $labels) {
        if ($label -match 'Familiar Identity Of .+\s{2,3}Familiar Identity Of') {
            foreach ($part in ($label -split '\s{2,3}' | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
                [void]$expanded.Add($part)
            }
        } else {
            [void]$expanded.Add($label)
        }
    }
    return @($expanded)
}

function Parse-Round1Prayers([string]$raw) {
    $result = @{}
    $blocks = [regex]::Split($raw, '(?=\d{3}\.\s*PLEASE NOTE:)')
    foreach ($block in $blocks) {
        if ($block -notmatch '(?m)^(\d{3})\.\s*PLEASE NOTE:') { continue }
        $num = [int]$Matches[1]
        $body = $block -replace '(?m)^\d{3}\.\s*PLEASE NOTE:[^\r\n]*\r?\n?', ''
        $result[$num] = $body.Trim()
    }
    return $result
}

$chartParsed = Read-NumberedChart -Path $ChartFile -ResolvePrincipality ${function:Resolve-MembershipPrincipality} -Slugify ${function:Slugify}
$chartNames = $chartParsed.chartNames
$sections = [System.Collections.Generic.List[object]]::new()
foreach ($sec in $chartParsed.sections) { [void]$sections.Add($sec) }
$topicToSection = $chartParsed.topicToSection
$topicToPrincipality = $chartParsed.topicToPrincipality

$graphRaw = Read-Utf8 $GraphDataJs
$graphJson = ($graphRaw -replace '^window\.GRAPH_DATA\s*=\s*', '' -replace ';\s*$', '') | ConvertFrom-Json
$graphByNum = @{}
foreach ($t in $graphJson.topics) {
    $graphByNum[[int]$t.number] = $t
}

$round1Meta = Read-Utf8 $Round1Json | ConvertFrom-Json
$round1MetaByNum = @{}
foreach ($prop in $round1Meta.topics.PSObject.Properties) {
    $round1MetaByNum[[int]$prop.Name] = $prop.Value
}

if (-not (Test-Path -LiteralPath $Round1File)) {
    throw "Round 1 prayers not found: $Round1File."
}
$round1ByNum = Parse-Round1Prayers (Read-Utf8 $Round1File)

$order = @(1..666)
$topicsOut = @{}
for ($n = 1; $n -le 666; $n++) {
    $g = $graphByNum[$n]
    $meta = $round1MetaByNum[$n]
    $roots = @()
    $fruits = @()
    if ($g) {
        if ($g.roots) { $roots = @($g.roots) }
        elseif ($g.root) { $roots = @($g.root) }
        if ($g.fruits) { $fruits = @($g.fruits) }
        elseif ($g.fruit) { $fruits = @($g.fruit) }
    }
    $rootDisplay = ($roots | Where-Object { $_ } | ForEach-Object { ($_ -replace '[^\x00-\x7F\u0080-\u024F\u1E00-\u1EFF''\u2019\-(),./:;]+', ' ').Trim() }) -join ' and '
    $fruitDisplay = ($fruits | Where-Object { $_ }) -join ', '
    $principality = if ($topicToPrincipality.ContainsKey($n)) { $topicToPrincipality[$n] }
        elseif ($g -and $g.principality) { $g.principality } else { $null }

    if (-not $round1ByNum.ContainsKey($n)) {
        throw "Missing Round 1 prayer for topic #$n"
    }

    $body = $round1ByNum[$n]
    $round1Preview = $null
    if ($body) {
        $first = ($body -split '\n\n')[0]
        if ($first.Length -gt 220) { $first = $first.Substring(0, 217) + '…' }
        $round1Preview = $first
    }

    $topicsOut["$n"] = @{
        number = $n
        label = if ($chartNames.ContainsKey($n)) { $chartNames[$n] } else { "Topic $n" }
        spirit = if ($meta -and $meta.spirit) { $meta.spirit } else { $null }
        root = $rootDisplay
        roots = @($roots)
        fruits = @($fruits)
        fruitDisplay = $fruitDisplay
        principality = $principality
        sectionId = if ($topicToSection.ContainsKey($n)) { $topicToSection[$n] } else { $null }
        round1Preview = $round1Preview
        round1Text = $body
    }
}

$payload = @{
    version = 1
    calLink = 'https://cal.com/repentance101ministry'
    calReturnMinutes = 2
    topicCount = 666
    order = $order
    sections = @($sections)
    topics = $topicsOut
}

$json = $payload | ConvertTo-Json -Depth 8 -Compress:$false
$js = "window.ROUND1_DATA = $json;`n"
[System.IO.File]::WriteAllText($OutputFile, $js, $Utf8)
Write-Host "Wrote $($topicsOut.Count) topics, $($sections.Count) sections -> $OutputFile"
