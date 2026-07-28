# Build all 666 topics in topics 666.txt format with correct UTF-8 emojis.
# Uses presentation file where available; generates the rest from graph data + chart.
param(
    [string]$PresentationFile = "$PSScriptRoot\..\data\TOPICS-666-PRESENTATION.txt",
    [string]$ChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt",
    [string]$DataFile = "$PSScriptRoot\..\public\data.js",
    [string]$OutputFile = "$PSScriptRoot\..\data\TOPICS-666.txt"
)

$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($true)  # BOM helps Windows editors

function Em([int]$codePoint) {
    return [System.Char]::ConvertFromUtf32($codePoint)
}

# Canonical emoji maps — composed from code points (script file stays ASCII-safe)
$RootEmoji = @{
    'loneliness and emotional brokenness' = Em 0x1F7E4
    'deception and falsehood'              = Em 0x1F7E3
    'idolatry and person-worship'          = Em 0x2B55
    'idolatry and self-worship'            = Em 0x2B55
    'pride and self-exaltation'            = Em 0x1F534
    'control and rebellion'                = Em 0x1F535
    'bitterness and unforgiveness'         = Em 0x1F7E2
    'addiction and bondage'                = Em 0x26AA
    'unbelief and distrust of god'         = Em 0x1F7E1
    'shame and false identity'             = Em 0x1FA77
    'covetousness and materialism'         = Em 0x26AB
    'fear and insecurity'                  = Em 0x1F7E0
}

$FruitEmoji = @{
    'sexual corruption'                         = Em 0x1F7E8
    'sexual corruption of human and hybrid dna' = Em 0x1F7E8
    'human and hybrid dna'                      = Em 0x1F7E8
    'counterfeit spirituality'                  = Em 0x1F7E9
    'confusing preferences with stewardship'    = Em 0x2B1B
    'neglect and lack of stewardship'           = Em 0x2B1B
    'anger and violence'                        = Em 0x1F7E5
    'death and self-destruction'                = Em 0x1F7EB
    'death and self destruction'                = Em 0x1F7EB
    'abuse and exploitation of others'          = (Em 0x25FB) + [char]0xFE0F
    'division and relational destruction'       = Em 0x1F7E7
    'mental oppression and confusion'           = Em 0x1F7EA
    'physical weakness and infirmity'           = Em 0x2B1C
    'false religion and doctrinal error'        = (Em 0x1F7E6) + (Em 0x1F7E9)
    'false religion and occultism'              = (Em 0x1F7E6) + (Em 0x1F7E9)
    'destructive attitudes against god''s image' = [char]0x26D4 + [char]0xFE0F
    'destructive identities against god''s image' = [char]0x2754
    'anti-christ or separation from god'        = Em 0x25AB
    'anti-christ spirit / separation from god'  = Em 0x25AB
    'anti-christ spirit or separation from god' = Em 0x25AB
    'occultism and counterfeit spirituality'    = Em 0x1F7E9
    'destructive attitudes against god''s image' = Em 0x1F7E7
}

$E = @{
    Y = Em 0x1F7E7; G = Em 0x1F7E9; K = Em 0x2B1B
}
$SpiritSpouseFruitLine = "$($E.Y)$($E.G)$($E.K)Sexual Corruption of Human and Hybrid DNA, Counterfeit Spirituality (think KUNDALINI), and Confusing Preferences with Stewardship with the parent Principality of Spirit Spouse Gods"

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.UTF8Encoding]::new($false))
}

function Strip-NonAscii([string]$text) {
    if (-not $text) { return '' }
    return ($text -replace '[^\x00-\x7F\u0080-\u024F\u1E00-\u1EFF''\u2019]+', ' ' -replace '\s+', ' ').Trim()
}

function Slugify([string]$text) {
    if (-not $text) { return '' }
    $t = $text.ToLower()
    $t = $t -replace '[\u201c\u201d\u2018\u2019''"]', ' '
    $t = $t -replace '^(spirit of|familiar identity of|interacting with the spirit of|interacting with the|interacting with)\s+', ''
    $t = $t -replace '^(being in|being|having|using|going to|reading|playing with|participating in|a |an )\s+', ''
    $t = $t -replace '[^a-z0-9]+', ' '
    return ($t.Trim() -replace '\s+', ' ')
}

function Format-Root([string]$plainRoot) {
    $key = (Strip-NonAscii $plainRoot).ToLower().Trim()
    if ($RootEmoji.ContainsKey($key)) {
        return "$($RootEmoji[$key]) $key"
    }
    return $key
}

function Format-FruitLabel([string]$plainFruit) {
    $key = (Strip-NonAscii $plainFruit).ToLower().Trim()
    foreach ($pair in $FruitEmoji.GetEnumerator()) {
        if ($key -eq $pair.Key -or $key.StartsWith($pair.Key) -or $pair.Key.StartsWith($key)) {
            $label = (Strip-NonAscii $plainFruit)
            if (-not $label) { $label = (Get-Culture).TextInfo.ToTitleCase($pair.Key) }
            return "$($pair.Value)$label"
        }
    }
    return (Strip-NonAscii $plainFruit)
}

function Extract-PlainRoot([string]$line) {
    if (-not $line) { return '' }
    if ($line -match '(?i)root\s*of\s+([^;,\n]+)') {
        return (Strip-NonAscii $Matches[1]).Trim().TrimEnd('.')
    }
    return ''
}

function Extract-PlainFruitFromBecause([string]$because) {
    if (-not $because) { return '' }
    if ($because -match '(?i)because of\s+(.+?)\s+with the parent Principality of') {
        return (Strip-NonAscii $Matches[1]).Trim()
    }
    return ''
}

function Clean-PhraseTail([string]$phrase) {
    if (-not $phrase) { return '' }
    $p = $phrase
    foreach ($sep in @(', with the root', ' with the root', ', from a root', ' from a root', ' and its', ';', ' is happening')) {
        $p = ($p -split [regex]::Escape($sep), 2)[0]
    }
    return $p.Trim().TrimEnd(',;.')
}

function Extract-TopicPhrase([string]$line) {
    $line = Strip-NonAscii $line.Trim()
    if (-not $line -or $line -match '^(?i)(because|happening because|is happening)') { return $null }
    $patterns = @(
        '(?i)^interacting with (?:the )?spirit of (.+)$'
        '(?i)^interacting with (?:the )?spirit (.+)$'
        '(?i)^interacting with (?:the )?(.+?) spirit\b'
        '(?i)^interacting with (disembodied .+)$'
        '(?i)^spirit of (.+)$'
        '(?i)^(.+?),\s*with the root'
        '(?i)^(.+?),\s*from a root'
        '(?i)^(.+?)\s+with the root'
        '(?i)^(.+?)\s+from a root'
        '(?i)^(.+?),\s*is happening'
        '(?i)^(.+?)\s+is happening'
        '(?i)^(.+?);'
        '(?i)^(.+)$'
    )
    foreach ($pat in $patterns) {
        if ($line -match $pat) {
            $phrase = Clean-PhraseTail $Matches[1]
            if ($phrase -and $phrase -notmatch '^(?i)because') { return $phrase }
        }
    }
    return $null
}

function Get-Chart([string]$path) {
    $chart = @{}
    foreach ($line in (Read-Utf8 $path) -split "`r?`n") {
        if ($line -match '^\s*(\d{3})\.\s*(.+?)\s*$') {
            $chart[[int]$Matches[1]] = $Matches[2].Trim()
        }
    }
    return $chart
}

function Load-Graph([string]$path) {
    $raw = Read-Utf8 $path
    $raw = $raw -replace '^window\.GRAPH_DATA\s*=\s*', '' -replace ';\s*$', ''
    return $raw | ConvertFrom-Json
}

function Get-PrincipalityDisplayName($graph, [string]$id) {
    $p = $graph.principalities | Where-Object { $_.id -eq $id } | Select-Object -First 1
    if ($p) { return $p.name }
    return ($id -replace '-', ' ')
}

function Match-ChartNumber([string]$phrase, $chart) {
    $key = Slugify $phrase
    if (-not $key) { return $null }
    foreach ($entry in ($chart.GetEnumerator() | Sort-Object Name)) {
        if ($key -eq (Slugify $entry.Value)) { return [int]$entry.Key }
    }
    $aliases = @{
        'writing fan fiction stories to create and worship my own narrative' = 665
        'dictator like' = 31
        'feeling i can t change' = 55
        'feeling i cant change' = 55
        'a love of money' = 71
        'a love of possessions' = 72
        'a love of position' = 73
        'a love of power' = 74
        'a lack of faith' = 89
        'a fear of death' = 90
        'a fear of success' = 91
        'a fear of men' = 92
        'a fear of women' = 93
        'a fear of poverty' = 94
        'a fear of rejection' = 96
        'a fear of authority' = 97
        'a poor self image' = 53
        'disembodied spirits of unsaved family members relatives ancestors or celebrities' = 574
    }
    if ($aliases.ContainsKey($key)) { return $aliases[$key] }
    $best = $null; $bestScore = 0
    foreach ($entry in $chart.GetEnumerator()) {
        $nameKey = Slugify $entry.Value
        if ($key.Contains($nameKey) -or $nameKey.Contains($key)) {
            $score = [Math]::Min($key.Length, $nameKey.Length)
            if ($score -gt $bestScore) { $bestScore = $score; $best = [int]$entry.Key }
        }
    }
    return $best
}

function Parse-Presentation([string]$path) {
    $entries = @()
    $pendingTopic = $null
    $pendingRootPlain = ''

    function Flush-Pending {
        if ($script:pendingTopic) {
            $script:entries += [pscustomobject]@{
                phrase     = Extract-TopicPhrase $script:pendingTopic
                rootPlain  = $(if ($script:pendingRootPlain) { $script:pendingRootPlain } else { Extract-PlainRoot $script:pendingTopic })
                becauseRaw = ''
            }
        }
        $script:pendingTopic = $null
        $script:pendingRootPlain = ''
    }

    foreach ($rawLine in (Read-Utf8 $path) -split "`r?`n") {
        $line = $rawLine.Trim()
        if (-not $line) { continue }
        if ($line -match '(?i)^DAY\s+\d+') { Flush-Pending; continue }

        if ($line -match '(?i)^(because|happening because|is happening because|is happening$)') {
            $because = $line.Trim().TrimEnd('.') + '.'
            if ($pendingTopic) {
                $entries += [pscustomobject]@{
                    phrase     = Extract-TopicPhrase $pendingTopic
                    rootPlain  = $(if ($pendingRootPlain) { $pendingRootPlain } else { Extract-PlainRoot $pendingTopic })
                    becauseRaw = $because
                }
                $pendingTopic = $null
                $pendingRootPlain = ''
            } elseif ($entries.Count -gt 0 -and -not $entries[-1].becauseRaw) {
                $entries[-1].becauseRaw = $because
            }
            continue
        }

        Flush-Pending
        $pendingTopic = $line
        $pendingRootPlain = Extract-PlainRoot $line
    }
    Flush-Pending
    return @($entries | Where-Object { $_.phrase })
}

function Get-TopicLabel([int]$num, [string]$chartName, [string]$phrase) {
    if ($num -ge 574) {
        $topic = $phrase.ToLower()
        if ($topic -notmatch '^interacting') {
            if ($topic -match '^disembodied') { return "interacting with $topic" }
            if ($topic -match '^spirit') { return "interacting with the $topic" }
            return "interacting with the spirit of $topic"
        }
        return $topic
    }
    return $chartName.ToLower()
}

function Build-BecauseFromGraph($graph, $topicMeta, [int]$num) {
    $rootPlain = ''
    if ($topicMeta.rootId) {
        $r = $graph.roots | Where-Object { $_.id -eq $topicMeta.rootId } | Select-Object -First 1
        if ($r) { $rootPlain = $r.name.ToLower() }
    }
    $rootFormatted = Format-Root $rootPlain

    if ($num -ge 574) {
        $label = Get-TopicLabel $num $topicMeta.name $topicMeta.name
        return "$label with the root of $rootFormatted; is happening because of 7 agreements AND because FRUITS of $SpiritSpouseFruitLine."
    }

    $fruitPlain = ''
    if ($topicMeta.fruitIds -and $topicMeta.fruitIds.Count -gt 0) {
        $f = $graph.fruits | Where-Object { $_.id -eq $topicMeta.fruitIds[0] } | Select-Object -First 1
        if ($f) { $fruitPlain = $f.name }
    }
    $fruitFormatted = Format-FruitLabel $fruitPlain

    $principalityId = if ($topicMeta.principalityIds -and $topicMeta.principalityIds.Count -gt 0) {
        $topicMeta.principalityIds[0]
    } else { '' }
    $princName = Get-PrincipalityDisplayName $graph $principalityId

    $label = $topicMeta.name.ToLower()
    return "$label with the root of $rootFormatted; is happening because of agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements because of $fruitFormatted with the parent Principality of $princName."
}

function Build-BecauseFromPresentation($entry, [int]$num, [string]$chartName) {
    $rootFormatted = Format-Root $entry.rootPlain
    $label = Get-TopicLabel $num $chartName $entry.phrase
    $because = $entry.becauseRaw.Trim().TrimEnd('.')

    if ($num -ge 574) {
        return "$label with the root of $rootFormatted; is happening because of 7 agreements AND because FRUITS of $SpiritSpouseFruitLine."
    }

    if ($because -match '(?i)^(because of|happening because of) agreements,.+?because of (.+?) with the parent Principality of (.+)$') {
        $fruitFormatted = Format-FruitLabel (Strip-NonAscii $Matches[2])
        $princ = $Matches[3].Trim()
        return "$label with the root of $rootFormatted; is happening because of agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements because of $fruitFormatted with the parent Principality of $princ."
    }

    if ($because -match '(?i)^happening because') {
        return "$label with the root of $rootFormatted; $because."
    }
    if ($because -match '(?i)^because of') {
        return "$label with the root of $rootFormatted; is happening $because."
    }
    return "$label with the root of $rootFormatted; $because."
}

# --- main ---
if (-not (Test-Path -LiteralPath $PresentationFile)) { throw "Missing: $PresentationFile" }
if (-not (Test-Path -LiteralPath $ChartFile)) { throw "Missing: $ChartFile" }
if (-not (Test-Path -LiteralPath $DataFile)) { throw "Missing: $DataFile" }

$chart = Get-Chart $ChartFile
$graph = Load-Graph $DataFile
$topicByNumber = @{}
foreach ($t in $graph.topics) { $topicByNumber[[int]$t.number] = $t }

$presentationByNumber = @{}
foreach ($entry in (Parse-Presentation $PresentationFile)) {
    $num = Match-ChartNumber $entry.phrase $chart
    if ($num) { $presentationByNumber[$num] = $entry }
}

$blocks = New-Object System.Collections.Generic.List[string]
for ($num = 1; $num -le 666; $num++) {
    $chartName = if ($chart.ContainsKey($num)) { $chart[$num] } else { "Topic $num" }
    $topicMeta = $topicByNumber[$num]

    if ($presentationByNumber.ContainsKey($num)) {
        $entry = $presentationByNumber[$num]
        $rootFormatted = Format-Root $entry.rootPlain
        $headerLabel = Get-TopicLabel $num $chartName $entry.phrase
        $header = ('{0:D3}. {1}, from a root of {2}.' -f $num, $headerLabel, $rootFormatted)
        $detail = Build-BecauseFromPresentation $entry $num $chartName
    } elseif ($topicMeta) {
        $rootPlain = ''
        if ($topicMeta.rootId) {
            $r = $graph.roots | Where-Object { $_.id -eq $topicMeta.rootId } | Select-Object -First 1
            if ($r) { $rootPlain = $r.name.ToLower() }
        }
        $rootFormatted = Format-Root $rootPlain
        $headerLabel = Get-TopicLabel $num $chartName $chartName
        $header = ('{0:D3}. {1}, from a root of {2}.' -f $num, $headerLabel, $rootFormatted)
        $detail = Build-BecauseFromGraph $graph $topicMeta $num
    } else {
        $header = ('{0:D3}. {1}, from a root of unknown.' -f $num, $chartName.ToLower())
        $detail = ''
    }

    [void]$blocks.Add("$header`n`n$detail`n~~~~~~~~~~~~")
}

$content = ($blocks -join "`n`n") + "`n"
[System.IO.File]::WriteAllText($OutputFile, $content, $Utf8)

Write-Host "Wrote $OutputFile"
Write-Host "  Presentation overrides: $($presentationByNumber.Count)"
Write-Host "  Generated from graph: $(666 - $presentationByNumber.Count)"
Write-Host "  Numbering: 001-666 (chart order)"

# Spot-check emoji bytes
$sample = (Read-Utf8 $OutputFile) -split "`n" | Where-Object { $_ -match '^002\.' } | Select-Object -First 1
Write-Host "  Sample line 2 header: $sample"
