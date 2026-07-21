# Audit topic fruits against canonical list — read-only
$ErrorActionPreference = 'Stop'

$dataFile = Join-Path $PSScriptRoot '..\public\data.js'
$topicsFile = "$env:USERPROFILE\Downloads\Telegram Desktop\topics 666.txt"
$outFile = Join-Path $PSScriptRoot '..\_tmp_fruit_audit_report.txt'

function Normalize-FruitBlob([string]$text) {
    if (-not $text) { return $text }
    $t = $text.Trim().TrimEnd('.')
    $t = $t -replace '(?is)^happening because of\s+', ''
    $t = $t -replace '(?is)agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements\s*', ''
    $t = $t -replace '(?is)agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual\s*', ''
    $t = $t -replace '(?i)^agreements\s+because of\s+', ''
    while ($t -match '(?is)because of\s+(.+)$') {
        $tail = $Matches[1].Trim()
        if ($tail -match '(?i)because of') { $t = $tail; continue }
        $t = $tail; break
    }
    $t = $t -replace '(?i)^because of\s+', ''
    $t = $t -replace '~+', ''
    $t = $t -replace '(?i),\s*which I will forgive\.?$', ''
    $t = $t -replace '(?i),?\s*or an Occultic Trickery\.?$', ''
    $t = $t -replace '(?i)^Death and Social Destruction\b', 'Death and Self-Destruction'
    $t = $t -replace '(?i)\bAnti-Holy Spirit\b', 'Anti-Christ Spirit'
    $t = $t -replace '(?i)^Physical Division and Relational Destruction\b', 'Division and Relational Destruction'
    $t = $t -replace '(?i)\s+with (?:the parent Principality of|(?:the )?Using and Abusing Others|Treachery|Destructive Acts).*$', ''
    if ($t -match '(?i)^Treachery Against') { $t = 'Division and Relational Destruction' }
    return $t.Trim().TrimEnd('.')
}

function Get-KnownFruitBlobMap() {
    return @{
        'anger, violence, sexual corruption, occultism and false religion' = @(
            'Anger and Violence', 'Sexual Corruption', 'Occultism and Counterfeit Spirituality', 'Abuse and Exploitation of Others'
        )
        'gluttony, physical neglect, and exploitation of holy spirit''s temple' = @(
            'Neglect and Lack of Stewardship', 'Abuse and Exploitation of Others'
        )
        'unrighteous division, spiritual destruction, neglect, and separation from god' = @(
            'Division and Relational Destruction', 'False Religion and Doctrinal Error', 'Neglect and Lack of Stewardship', 'Anti-Christ Spirit / Separation From God'
        )
        'anti-christ spirit, separation from god' = @('Anti-Christ Spirit / Separation From God')
        'anti-christ spirit,separation from god' = @('Anti-Christ Spirit / Separation From God')
        'sexual corruption, division, spiritual oppression' = @(
            'Sexual Corruption', 'Division and Relational Destruction', 'Mental Oppression and Confusion'
        )
    }
}

function Resolve-KnownFruitBlob([string]$text) {
    if (-not $text) { return @() }
    $key = ($text -replace '\s+', ' ').Trim().TrimEnd('.').ToLower()
    $key = $key -replace '(?i),?\s*or an occultic trickery\.?$', ''
    $key = $key -replace '(?i),\s*which I will forgive\.?$', ''
    $map = Get-KnownFruitBlobMap
    if ($map.ContainsKey($key)) { return @($map[$key]) }
    foreach ($entry in $map.GetEnumerator()) {
        if ($key.StartsWith($entry.Key)) { return @($entry.Value) }
    }
    return @()
}

function Test-IsPrayerBoilerplateFruit([string]$fruit) {
    if (-not $fruit) { return $false }
    $t = ($fruit -replace '\s+', ' ').Trim().TrimEnd('.')
    if ($t -match '(?i)^adultery\s*(?:a|ga)?gainst\s*god$') { return $true }
    if ($t -match '(?i)^(or an )?occultic trickery$') { return $true }
    if ($t -match '(?i)^which I will forgive$') { return $true }
    if ($t -match '(?i)^(physically|verbally|emotionally and spiritually)$') { return $true }
    if ($t -match '(?i)^using and abusing others') { return $true }
    return $false
}

function Normalize-FruitLabel([string]$label) {
    if (-not $label) { return $null }
    $t = ($label -replace '\s+', ' ').Trim().TrimEnd('.')
    if (Test-IsPrayerBoilerplateFruit $t) { return $null }
    $exact = @{
        'Death and Social Destruction' = 'Death and Self-Destruction'
        'Anti-Holy Spirit' = 'Anti-Christ Spirit / Separation From God'
        'Anti-Christ Spirit' = 'Anti-Christ Spirit / Separation From God'
        'Separation from God' = 'Anti-Christ Spirit / Separation From God'
        'Division' = 'Division and Relational Destruction'
        'Unrighteous Division' = 'Division and Relational Destruction'
        'Spiritual Destruction' = 'False Religion and Doctrinal Error'
        'Spiritual Oppression' = 'Mental Oppression and Confusion'
        'Neglect' = 'Neglect and Lack of Stewardship'
        'Physical Neglect' = 'Neglect and Lack of Stewardship'
        'Gluttony' = 'Neglect and Lack of Stewardship'
        'Exploitation of Holy Spirit''s Temple' = 'Abuse and Exploitation of Others'
        'anger' = 'Anger and Violence'
        'violence' = 'Anger and Violence'
        'sexual corruption' = 'Sexual Corruption'
        'occultism and false religion' = 'Occultism and Counterfeit Spirituality'
    }
    if ($exact.ContainsKey($t)) { return $exact[$t] }
    $lower = $t.ToLower()
    if ($exact.ContainsKey($lower)) { return $exact[$lower] }
    return $t
}

function Get-FruitBlobPattern() {
    return '(?is)FRUITS of\s+(.+?)(?:\s+with the parent Principality of|\s+with (?:the )?Using and Abusing|\s+with Treachery|\s+with Destructive Acts|\s+is happening because|\s*$|\.)'
}

function Expand-FruitPhrases([string[]]$items) {
    $expanded = [System.Collections.Generic.List[string]]::new()
    foreach ($item in $items) {
        $f = $item.Trim().TrimEnd('.')
        if (-not $f) { continue }
        if ($f -match '(?i)^Sexual Corruption of Human and Hybrid DNA$') {
            [void]$expanded.Add('Sexual Corruption')
            [void]$expanded.Add('Human and Hybrid DNA')
        } else {
            [void]$expanded.Add($f)
        }
    }
    return @($expanded | Select-Object -Unique)
}

function Parse-FruitList([string]$text) {
    if (-not $text) { return @() }
    $t = Normalize-FruitBlob $text
    $t = $t -replace '\s*\(think [^)]+\)', ''
    $t = $t -replace '\s+with the parent Principality of.+$', ''
    $t = $t -replace '\s+with (?:the )?Using and Abusing.+$', ''
    $t = $t -replace '(?i)\s+with Treachery.+$', ''
    $t = $t -replace '(?i)\s+with Destructive Acts.+$', ''
    $t = $t -replace '(?i)^Physical Division and Relational Destruction\b', 'Division and Relational Destruction'
    $t = $t.Trim().TrimEnd('.')
    $known = Resolve-KnownFruitBlob $t
    if ($known.Count -gt 0) { return Expand-FruitPhrases @($known | Select-Object -Unique) }
    $items = @()
    if ($t -match '^(.+),\s*and\s+(.+)$') {
        $last = $Matches[2].Trim().TrimEnd('.')
        $rest = $Matches[1]
        $items = @($rest -split ',\s*' | ForEach-Object { $_.Trim().TrimEnd('.') } | Where-Object { $_ })
        if ($last) { $items += $last }
    } elseif (($t -split ',\s*').Count -gt 1) {
        $items = @($t -split ',\s*' | ForEach-Object { $_.Trim().TrimEnd('.') } | Where-Object { $_ })
    } else {
        $items = @($t)
    }
    $normalized = @($items | ForEach-Object { Normalize-FruitLabel $_ } | Where-Object { $_ } | Select-Object -Unique)
    if ($normalized.Count -gt 0) { return Expand-FruitPhrases $normalized }
    return Expand-FruitPhrases @($t)
}

$canonical = @(
    'Anger and Violence',
    'Division and Relational Destruction',
    'Sexual Corruption',
    'Occultism and Counterfeit Spirituality',
    'False Religion and Doctrinal Error',
    'Mental Oppression and Confusion',
    'Death and Self-Destruction',
    'Physical Weakness and Infirmity',
    'Neglect and Lack of Stewardship',
    'Abuse and Exploitation of Others',
    'Anti-Christ Spirit / Separation From God'
)

$validStandalone = @(
    'Human and Hybrid DNA',
    'Counterfeit Spirituality',
    'Confusing Preferences with Stewardship',
    "Destructive Attitudes Against God$([char]0x2019)s Image"
)

function Map-ToCanonical([string]$fruit) {
    if (-not $fruit) { return @{ canonical = $null; confidence = 'none'; note = 'empty' } }
    $f = $fruit.Trim().TrimEnd('.')
    foreach ($s in $validStandalone) {
        if ($f -eq $s) { return @{ canonical = $s; confidence = 'standalone'; note = 'valid standalone fruit' } }
    }
    foreach ($c in $canonical) {
        if ($f -eq $c) { return @{ canonical = $c; confidence = 'exact'; note = '' } }
    }
    $aliases = @{
        'Confusing Preferences with Stewardship' = 'Neglect and Lack of Stewardship'
        'Physical Division and Relational Destruction' = 'Division and Relational Destruction'
        'Treachery Against Others' = 'Division and Relational Destruction'
        'Destructive Attitudes Against God''s Image' = 'Anti-Christ Spirit / Separation From God'
        'Anti-Christ Spirit' = 'Anti-Christ Spirit / Separation From God'
        'Separation From God' = 'Anti-Christ Spirit / Separation From God'
        'Occultism' = 'Occultism and Counterfeit Spirituality'
        'Doctrinal Error' = 'False Religion and Doctrinal Error'
        'False Religion' = 'False Religion and Doctrinal Error'
        'Mental Oppression' = 'Mental Oppression and Confusion'
        'Confusion' = 'Mental Oppression and Confusion'
        'Physical Weakness' = 'Physical Weakness and Infirmity'
        'Infirmity' = 'Physical Weakness and Infirmity'
        'Neglect' = 'Neglect and Lack of Stewardship'
        'Lack of Stewardship' = 'Neglect and Lack of Stewardship'
        'Abuse and Exploitation' = 'Abuse and Exploitation of Others'
        'Self-Destruction' = 'Death and Self-Destruction'
    }
    foreach ($key in $aliases.Keys) {
        if ($f -eq $key) { return @{ canonical = $aliases[$key]; confidence = 'alias'; note = "alias: $key" } }
    }
    $heuristics = @(
        @{ pattern = '(?i)^Sexual Corruption$'; canonical = 'Sexual Corruption'; confidence = 'exact' }
        @{ pattern = '(?i)^Sexual Corruption of Human and Hybrid DNA$'; canonical = $null; confidence = 'unmapped'; note = 'compound slug should be split' }
        @{ pattern = '(?i)^Occultism'; canonical = 'Occultism and Counterfeit Spirituality'; confidence = 'prefix' }
        @{ pattern = '(?i)Division and Relational'; canonical = 'Division and Relational Destruction'; confidence = 'prefix' }
        @{ pattern = '(?i)^Treachery Against'; canonical = 'Division and Relational Destruction'; confidence = 'prefix' }
        @{ pattern = '(?i)False Religion|Doctrinal Error'; canonical = 'False Religion and Doctrinal Error'; confidence = 'contains' }
        @{ pattern = '(?i)Mental Oppression|Confusion'; canonical = 'Mental Oppression and Confusion'; confidence = 'contains' }
        @{ pattern = '(?i)Death and Self|Self-Destruction'; canonical = 'Death and Self-Destruction'; confidence = 'contains' }
        @{ pattern = '(?i)Physical Weakness|Infirmity'; canonical = 'Physical Weakness and Infirmity'; confidence = 'contains' }
        @{ pattern = '(?i)Neglect|Stewardship'; canonical = 'Neglect and Lack of Stewardship'; confidence = 'contains' }
        @{ pattern = '(?i)Abuse and Exploitation|Using and Abusing'; canonical = 'Abuse and Exploitation of Others'; confidence = 'contains' }
        @{ pattern = '(?i)Anti-Christ|Separation From God'; canonical = 'Anti-Christ Spirit / Separation From God'; confidence = 'contains'; ambiguous = $true }
        @{ pattern = '(?i)Anger and Violence'; canonical = 'Anger and Violence'; confidence = 'prefix' }
        @{ pattern = '(?i)Destructive Attitudes Against God'; canonical = 'Anti-Christ Spirit / Separation From God'; confidence = 'contains'; ambiguous = $true }
        @{ pattern = '(?i)Against God''s Image'; canonical = 'Anti-Christ Spirit / Separation From God'; confidence = 'contains'; ambiguous = $true }
    )
    foreach ($h in $heuristics) {
        if ($f -match $h.pattern) {
            $note = if ($h.note) { $h.note } elseif ($h.ambiguous) { 'ambiguous heuristic' } else { "matched: $($h.pattern)" }
            return @{ canonical = $h.canonical; confidence = $h.confidence; note = $note }
        }
    }
    return @{ canonical = $null; confidence = 'unmapped'; note = '' }
}

Write-Host "Loading $dataFile ..."
$content = [System.IO.File]::ReadAllText($dataFile, [System.Text.UTF8Encoding]::new($false))
$json = $content -replace '^window\.GRAPH_DATA\s*=\s*', '' -replace ';\s*$', ''
$data = $json | ConvertFrom-Json

$fruitTopicCounts = @{}
$fruitTopics = @{}
$arrayFruitCounts = @{}

foreach ($f in $data.fruits) { $arrayFruitCounts[$f.name] = $f.topicCount }
foreach ($t in $data.topics) {
    foreach ($fname in @($t.fruits)) {
        if (-not $fname) { continue }
        if (-not $fruitTopicCounts.ContainsKey($fname)) {
            $fruitTopicCounts[$fname] = 0
            $fruitTopics[$fname] = @()
        }
        $fruitTopicCounts[$fname]++
        $fruitTopics[$fname] += [PSCustomObject]@{ num = $t.number; name = $t.name }
    }
}

$allFruitNames = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($k in $arrayFruitCounts.Keys) { [void]$allFruitNames.Add($k) }
foreach ($k in $fruitTopicCounts.Keys) { [void]$allFruitNames.Add($k) }

$sourceParsedFruits = @{}
$sourceExists = Test-Path $topicsFile
if ($sourceExists) {
    Write-Host "Scanning $topicsFile ..."
    $raw = [System.IO.File]::ReadAllText($topicsFile, [System.Text.UTF8Encoding]::new($false))
    $blocks = $raw -split '(?=^\d{3}\.)' | Where-Object { $_ -match '^\d{3}\.' }
    foreach ($b in $blocks) {
        if ($b -match '^(\d{3})\.') { $num = [int]$Matches[1] } else { continue }
        $fruitBlob = $null
        if ($b -match (Get-FruitBlobPattern)) {
            $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        } elseif ($b -match '(?is)because FRUITS of\s+(.+?)(?:\s+with the parent Principality of|\s+with Using and Abusing|\s+with Treachery|\s+with Destructive Acts|\s*$|\.)') {
            $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        } elseif ($b -match '(?is)FRUITS with\s+(?!because of)(.+?)(?:\s+with the parent Principality of|\s+is happening because|\s*$|\.)') {
            $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        } elseif ($b -match 'because of\s+(?!7 agreements)(?!agreements,)(.+?)\s+with the parent Principality of\s+(.+?)(?:\s|$|\.)') {
            $fruitBlob = Normalize-FruitBlob ($Matches[1].Trim().TrimEnd('.'))
        }
        if ($fruitBlob) {
            foreach ($pf in (Parse-FruitList $fruitBlob)) {
                if (-not $sourceParsedFruits.ContainsKey($pf)) { $sourceParsedFruits[$pf] = 0 }
                $sourceParsedFruits[$pf]++
            }
        }
    }
} else {
    Write-Warning "Source file not found: $topicsFile"
}

$compoundSlug = @($allFruitNames | Where-Object { $_ -match '(?i)^Sexual Corruption of Human and Hybrid DNA$' })

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('=== FRUIT AUDIT REPORT ===')
[void]$sb.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("Topics in graph: $($data.topics.Count)")
[void]$sb.AppendLine("Unique fruits in graph: $($allFruitNames.Count)")
[void]$sb.AppendLine("Compound slug 'Sexual Corruption of Human and Hybrid DNA' present: $(if ($compoundSlug.Count) { 'YES' } else { 'NO' })")
[void]$sb.AppendLine('')

$unmapped = @{}
$sortedFruits = @($allFruitNames | Sort-Object)

[void]$sb.AppendLine('=== ALL FRUITS IN public/data.js ===')
foreach ($fname in $sortedFruits) {
    $nodeCnt = if ($arrayFruitCounts.ContainsKey($fname)) { $arrayFruitCounts[$fname] } else { 0 }
    $topicCnt = if ($fruitTopicCounts.ContainsKey($fname)) { $fruitTopicCounts[$fname] } else { 0 }
    $map = Map-ToCanonical $fname
    $canon = if ($map.canonical) { $map.canonical } else { 'UNMAPPED' }
    if (-not $map.canonical) { $unmapped[$fname] = $true }
    [void]$sb.AppendLine("$topicCnt`t$nodeCnt`t$canon`t$($map.confidence)`t$fname")
}

[void]$sb.AppendLine('')
[void]$sb.AppendLine('=== CANONICAL + STANDALONE COVERAGE ===')
foreach ($c in ($canonical + $validStandalone)) {
    $matching = @($sortedFruits | Where-Object { (Map-ToCanonical $_).canonical -eq $c })
    $totalTopics = 0
    foreach ($m in $matching) { $totalTopics += $fruitTopicCounts[$m] }
    [void]$sb.AppendLine("$c | variants=$($matching.Count) topic-assignments=$totalTopics")
}

[void]$sb.AppendLine('')
[void]$sb.AppendLine('=== NON-CANONICAL / UNMAPPED ===')
if ($unmapped.Count -eq 0) {
    [void]$sb.AppendLine('(none)')
} else {
    foreach ($fname in ($unmapped.Keys | Sort-Object)) {
        [void]$sb.AppendLine('')
        [void]$sb.AppendLine("FRUIT: $fname ($($fruitTopicCounts[$fname]) topics)")
        foreach ($t in ($fruitTopics[$fname] | Sort-Object num)) {
            [void]$sb.AppendLine("  #$($t.num.ToString('000')) - $($t.name)")
        }
    }
}

if ($sourceExists) {
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('=== SOURCE FILE (topics 666.txt) UNIQUE PARSED FRUITS ===')
    foreach ($pf in ($sourceParsedFruits.Keys | Sort-Object)) {
        $map = Map-ToCanonical $pf
        $canon = if ($map.canonical) { $map.canonical } else { 'UNMAPPED' }
        [void]$sb.AppendLine("$($sourceParsedFruits[$pf])`t$canon`t$pf")
    }
}

$report = $sb.ToString()
[System.IO.File]::WriteAllText($outFile, $report, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $outFile"
Write-Host "Unique fruits: $($allFruitNames.Count), Unmapped: $($unmapped.Count), Compound slug gone: $(if ($compoundSlug.Count) { 'NO' } else { 'YES' })"
