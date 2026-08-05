# Builds public/round2-data.js for the Round 2 prayer journey page.
param(
    [string]$Round2File = "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND2.txt",
    [string]$Round1Json = "$PSScriptRoot\..\public\prayers\en.json",
    [string]$GraphDataJs = "$PSScriptRoot\..\public\data.js",
    [string]$ChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt",
    [string]$MembershipFile = "$PSScriptRoot\..\data\PRINCIPALITY-MEMBERSHIPS.txt",
    [string]$OutputFile = "$PSScriptRoot\..\public\round2-data.js"
)

$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)

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
        'Perversion' = 'Sexual Perversion'
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
    $known = @(
        'Jealousy', 'Slothfulness', 'Haughtiness', 'Lies', 'Bondage', 'Idolatry', 'Error',
        'Fear', 'Divination', 'Heaviness', 'Anti-Christ', 'Deaf & Dumb', 'Sexual Perversion',
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

    # Recover labels merged with 2–3 spaces inside a 4-space-delimited chunk.
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

function Parse-Round2Prayers([string]$raw) {
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

# Chart labels
$chartNames = @{}
$chartKeyToNum = @{}
foreach ($line in ((Read-Utf8 $ChartFile) -split '\r?\n')) {
    if ($line -match '^(\d{3})\.\s*(.+)$') {
        $n = [int]$Matches[1]
        $chartNames[$n] = $Matches[2].Trim()
        $key = Normalize-TopicKey $Matches[2]
        if ($key) {
            if (-not $chartKeyToNum.ContainsKey($key)) { $chartKeyToNum[$key] = @() }
            $chartKeyToNum[$key] += $n
        }
    }
}

# Graph topic metadata
$graphRaw = Read-Utf8 $GraphDataJs
$graphJson = ($graphRaw -replace '^window\.GRAPH_DATA\s*=\s*', '' -replace ';\s*$', '') | ConvertFrom-Json
$graphByNum = @{}
foreach ($t in $graphJson.topics) {
    $graphByNum[[int]$t.number] = $t
}

# Round 1 snippets
$round1 = Read-Utf8 $Round1Json | ConvertFrom-Json
$round1ByNum = @{}
foreach ($prop in $round1.topics.PSObject.Properties) {
    $round1ByNum[[int]$prop.Name] = $prop.Value
}

# Round 2 bodies
if (-not (Test-Path -LiteralPath $Round2File)) {
    throw "Round 2 prayers not found: $Round2File. Run build-compiled-prayers-round2.ps1 first."
}
$round2ByNum = Parse-Round2Prayers (Read-Utf8 $Round2File)

# Build principality sections from membership file (sidebar order)
$sections = [System.Collections.Generic.List[object]]::new()
$topicToSection = @{}
$seenTopics = [System.Collections.Generic.HashSet[int]]::new()

if (Test-Path -LiteralPath $MembershipFile) {
    $currentName = $null
    $currentTopics = [System.Collections.Generic.List[int]]::new()

    function Flush-Section {
        param($name, $topicList)
        if (-not $name -or $topicList.Count -eq 0) { return }
        $sorted = @($topicList | Sort-Object)
        $items = @($sorted | ForEach-Object {
            $n = $_
            @{
                number = $n
                label = if ($chartNames.ContainsKey($n)) { $chartNames[$n] } else { "Topic $n" }
            }
        })
        [void]$sections.Add(@{
            id = Slugify $name
            name = $name
            topics = $items
            firstTopic = $sorted[0]
        })
        foreach ($n in $sorted) {
            if (-not $topicToSection.ContainsKey($n)) { $topicToSection[$n] = Slugify $name }
        }
    }

    foreach ($line in ((Read-Utf8 $MembershipFile) -split '\r?\n')) {
        if ($line -match '^\[(.+)\]\s*$') {
            Flush-Section $currentName $currentTopics
            $currentName = Resolve-MembershipPrincipality $Matches[1]
            $currentTopics = [System.Collections.Generic.List[int]]::new()
            continue
        }
        if (-not $currentName) { continue }
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed -match '^(ROOT SPIRITS CHART|JACKIE|MITCH|KIMBERLY|ASHTON)') { continue }
        foreach ($label in (Split-MembershipLabels $trimmed)) {
            $key = Normalize-TopicKey $label
            if ($key -and $chartKeyToNum.ContainsKey($key)) {
                foreach ($n in $chartKeyToNum[$key]) {
                    if ($seenTopics.Add($n)) { [void]$currentTopics.Add($n) }
                }
            }
        }
    }
    Flush-Section $currentName $currentTopics
}

# Append any chart topics missing from membership sections
$orphan = @()
for ($n = 1; $n -le 666; $n++) {
    if (-not $seenTopics.Contains($n)) { $orphan += $n }
}
if ($orphan.Count -gt 0) {
    [void]$sections.Add(@{
        id = 'other-topics'
        name = 'Other Topics'
        topics = @($orphan | Sort-Object | ForEach-Object {
            @{ number = $_; label = $chartNames[$_] }
        })
        firstTopic = ($orphan | Sort-Object)[0]
    })
    foreach ($n in $orphan) { $topicToSection[$n] = 'other-topics' }
}

# Flat chart order
$order = @(1..666)

# Topic payload
$topicsOut = @{}
for ($n = 1; $n -le 666; $n++) {
    $g = $graphByNum[$n]
    $r1 = $round1ByNum[$n]
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
    $principality = if ($g -and $g.principality) { $g.principality } else { $null }

    $round1Preview = $null
    if ($r1 -and $r1.text) {
        $first = ($r1.text -split '\n\n')[0]
        if ($first.Length -gt 220) { $first = $first.Substring(0, 217) + '…' }
        $round1Preview = $first
    }

    if (-not $round2ByNum.ContainsKey($n)) {
        throw "Missing Round 2 prayer for topic #$n"
    }

    $topicsOut["$n"] = @{
        number = $n
        label = if ($chartNames.ContainsKey($n)) { $chartNames[$n] } else { "Topic $n" }
        spirit = if ($r1 -and $r1.spirit) { $r1.spirit } else { $null }
        root = $rootDisplay
        roots = @($roots)
        fruits = @($fruits)
        fruitDisplay = $fruitDisplay
        principality = $principality
        sectionId = if ($topicToSection.ContainsKey($n)) { $topicToSection[$n] } else { $null }
        round1Preview = $round1Preview
        round2Text = $round2ByNum[$n]
    }
}

$payload = @{
    version = 1
    calLink = 'https://cal.com/repentance101/introductions-from-repentance-to-you'
    calReturnMinutes = 2
    topicCount = 666
    order = $order
    sections = @($sections)
    topics = $topicsOut
}

$json = $payload | ConvertTo-Json -Depth 8 -Compress:$false
$js = "window.ROUND2_DATA = $json;`n"
[System.IO.File]::WriteAllText($OutputFile, $js, $Utf8)
Write-Host "Wrote $($topicsOut.Count) topics, $($sections.Count) sections -> $OutputFile"
