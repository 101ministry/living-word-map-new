# Converts TOPICS 666 PRESENTATION.txt -> topics 666.txt format.
# Numbering stays 001-666 per ROOT-SPIRITS-CHART.txt (not presentation day order).
param(
    [string]$PresentationFile = "$PSScriptRoot\..\data\TOPICS-666-PRESENTATION.txt",
    [string]$ChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt",
    [string]$FallbackFile = "$PSScriptRoot\..\data\TOPICS-666.txt",
    [string]$OutputFile = "$PSScriptRoot\..\data\TOPICS-666.txt"
)

$ErrorActionPreference = 'Stop'

$RootEmoji = @{
    'loneliness and emotional brokenness' = '🟤'
    'deception and falsehood'              = '🟣'
    'idolatry and self-worship'            = '⭕'
    'pride and self-exaltation'            = '🔴'
    'control and rebellion'                = '🔵'
    'bitterness and unforgiveness'         = '🟢'
    'addiction and bondage'                = '⚪'
    'unbelief and distrust of god'         = '🟡'
    'shame and false identity'             = '🩷'
    'covetousness and materialism'         = '⚫'
    'fear and insecurity'                  = '🟠'
}

$FruitEmoji = [ordered]@{
    'sexual corruption of human and hybrid dna' = '🟨'
    'sexual corruption'                         = '🟨'
    'counterfeit spirituality'                  = '🟩'
    'confusing preferences with stewardship'    = '⬛'
    'neglect and lack of stewardship'           = '⬛'
    'anger and violence'                        = '🟥'
    'death and self-destruction'                = '🟫'
    'death and self destruction'                = '🟫'
    'abuse and exploitation of others'          = '◻️'
    'division and relational destruction'       = '🟧'
    'mental oppression and confusion'           = '🟪'
    'physical weakness and infirmity'           = '⬜'
    'false religion and doctrinal error'        = '🟦🟩'
    'false religion and occultism'              = '🟦🟩'
    'destructive attitudes against god''s image' = '⛔️'
    'destructive identities against god''s image' = '❔'
    'anti-christ or separation from god'        = '▫'
}

function Strip-Emoji([string]$text) {
    if (-not $text) { return '' }
    return ($text -replace '[^\x00-\x7F\u0080-\u024F\u1E00-\u1EFF]+', ' ' -replace '\s+', ' ').Trim()
}

function Has-Emoji([string]$text) {
    return [bool]($text -match '[^\x00-\x7F\u0080-\u024F\u1E00-\u1EFF]')
}

function Clean-FallbackText([string]$text) {
    if (-not $text) { return '' }
    return (Strip-Emoji $text) -replace '\s+', ' '
}

function Slugify([string]$text) {
    if (-not $text) { return '' }
    $t = $text.ToLower()
    $t = $t -replace '[\u201c\u201d\u2018\u2019''"]', ' '
    $t = $t -replace '^(spirit of|familiar identity of|interacting with the spirit of)\s+', ''
    $t = $t -replace '^(being in|being|having|using|going to|reading|playing with|participating in|a |an )\s+', ''
    $t = $t -replace '[^a-z0-9]+', ' '
    return ($t.Trim() -replace '\s+', ' ')
}

function Get-RootEmoji([string]$rootName) {
    $key = (Strip-Emoji $rootName).ToLower().Trim()
    if ($RootEmoji.ContainsKey($key)) { return $RootEmoji[$key] }
    return ''
}

function Format-Root([string]$rootName) {
    $plain = (Strip-Emoji $rootName).Trim()
    if (-not $plain) { return '' }
    $em = Get-RootEmoji $plain
    if ($em) { return "$em $plain" }
    return $plain
}

function Inject-RootEmoji([string]$text) {
    if (-not $text) { return '' }
    return [regex]::Replace($text, '(?i)(from a root of|with the root of|root of)\s+([^;,\n]+)', {
        param($m)
        $prefix = $m.Groups[1].Value
        $root = $m.Groups[2].Value.Trim()
        if (Has-Emoji $root) { return $m.Value }
        $formatted = Format-Root $root
        return "$prefix $formatted"
    })
}

function Inject-FruitEmoji([string]$text) {
    if (-not $text) { return '' }
    $out = $text
    foreach ($pair in $FruitEmoji.GetEnumerator()) {
        $pattern = [regex]::Escape($pair.Key)
        $emoji = $pair.Value
        $out = [regex]::Replace($out, "(?i)($pattern)", {
            param($m)
            $start = $m.Index
            if ($start -gt 0) {
                $prev = $out[$start - 1]
                if ($prev -notmatch '[\x00-\x7F\u0080-\u024F\u1E00-\u1EFF\s,;.]') { return $m.Value }
            }
            return "$emoji $($m.Groups[1].Value)"
        })
    }
    return $out
}

function Extract-RootFromLine([string]$line) {
    if (-not $line) { return '' }
    if ($line -match '(?i)root\s*of\s+([^;,\n]+)') {
        $name = $Matches[1].Trim().TrimEnd('.')
        $before = $line.Substring(0, $Matches.Index)
        if ($before -match '([\u0080-\uFFFF]+)\s*root\s*of\s*$') {
            $em = $Matches[1].Trim()
            return "$em $name".Trim()
        }
        if (Has-Emoji $name) { return $name }
        return (Format-Root $name)
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
    $line = Strip-Emoji $line.Trim()
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
    Get-Content -LiteralPath $path -Encoding UTF8 | ForEach-Object {
        if ($_ -match '^\s*(\d{3})\.\s*(.+?)\s*$') {
            $chart[[int]$Matches[1]] = $Matches[2].Trim()
        }
    }
    return $chart
}

function Parse-ExistingTopics([string]$path) {
    $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8
    $blocks = [regex]::Split($raw, '(?=\d{3}\.\s+\S)')
    $out = @{}
    foreach ($block in $blocks) {
        $b = $block.Trim()
        if (-not $b -or $b -notmatch '^(\d{3})\.') { continue }
        $num = [int]$Matches[1]
        $parts = $b -split '~~~~~~~~~~~~', 2
        $body = $parts[0].Trim()
        $lines = @($body -split "`r?`n" | Where-Object { $_.Trim() })
        $header = if ($lines.Count -gt 0) { $lines[0].Trim() } else { '' }
        $detail = if ($lines.Count -gt 1) { ($lines[1..($lines.Count - 1)] -join "`n").Trim() } else { '' }
        $out[$num] = @{ header = $header; detail = $detail }
    }
    return $out
}

function Match-ChartNumber([string]$phrase, $chart) {
    $key = Slugify $phrase
    if (-not $key) { return $null }

    foreach ($entry in ($chart.GetEnumerator() | Sort-Object Name)) {
        $num = [int]$entry.Key
        $nameKey = Slugify $entry.Value
        if ($key -eq $nameKey) { return $num }
    }

    # Manual aliases for presentation phrasing vs chart labels
    $aliases = @{
        'writing fan fiction stories to create and worship my own narrative' = 665
        'being dictator like' = 31
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

    $best = $null
    $bestScore = 0
    foreach ($entry in $chart.GetEnumerator()) {
        $num = [int]$entry.Key
        $nameKey = Slugify $entry.Value
        if ($key.Contains($nameKey) -or $nameKey.Contains($key)) {
            $score = [Math]::Min($key.Length, $nameKey.Length)
            if ($score -gt $bestScore) { $bestScore = $score; $best = $num }
        }
    }
    return $best
}

function Parse-Presentation([string]$path) {
    $entries = @()
    $pendingTopic = $null
    $pendingRoot = ''

    function Flush-Pending {
        if ($script:pendingTopic) {
            $script:entries += [pscustomobject]@{
                phrase  = (Extract-TopicPhrase $script:pendingTopic)
                root    = $(if ($script:pendingRoot) { $script:pendingRoot } else { Extract-RootFromLine $script:pendingTopic })
                because = ''
            }
        }
        $script:pendingTopic = $null
        $script:pendingRoot = ''
    }

    foreach ($rawLine in (Get-Content -LiteralPath $path -Encoding UTF8)) {
        $line = $rawLine.Trim()
        if (-not $line) { continue }
        if ($line -match '(?i)^DAY\s+\d+') { Flush-Pending; continue }

        if ($line -match '(?i)^(because|happening because|is happening because|is happening$)') {
            $because = $line.Trim().TrimEnd('.') + '.'
            if ($pendingTopic) {
                $entries += [pscustomobject]@{
                    phrase  = Extract-TopicPhrase $pendingTopic
                    root    = $(if ($pendingRoot) { $pendingRoot } else { Extract-RootFromLine $pendingTopic })
                    because = $because
                }
                $pendingTopic = $null
                $pendingRoot = ''
            } elseif ($entries.Count -gt 0 -and -not $entries[-1].because) {
                $entries[-1].because = $because
            }
            continue
        }

        Flush-Pending
        $pendingTopic = $line
        $pendingRoot = Extract-RootFromLine $line
    }
    Flush-Pending
    return @($entries | Where-Object { $_.phrase })
}

function Build-Detail([string]$phrase, [string]$rootDisplay, [string]$because, [int]$num) {
    if (Has-Emoji $rootDisplay) {
        $rootOut = $rootDisplay
    } else {
        $rootOut = Format-Root (Strip-Emoji $rootDisplay)
    }
    $topicLower = $phrase.ToLower()
    $because = $because.Trim().TrimEnd('.').Trim() + '.'

    if ($num -ge 574) {
        if ($because -match '(?i)7 agreements|FRUITS of') {
            $fruitBlob = if ($because -match '(?i)(?:FRUITS of|because of)\s+(.+)\.$') { $Matches[1].Trim() } else {
$SpiritSpouseBlob = '🟧🟩⬛Sexual Corruption of Human and Hybrid DNA, Counterfeit Spirituality (think KUNDALINI), and Confusing Preferences with Stewardship with the parent Principality of Spirit Spouse Gods'
            }
            return "$topicLower with the root of $rootOut; is happening because of 7 agreements AND because FRUITS of $fruitBlob"
        }
        return "$topicLower with the root of $rootOut; $($because -replace '(?i)^because\s+','')"
    }

    if ($because -match '(?i)^happening because') {
        return "$topicLower with the root of $rootOut; $because"
    }
    if ($because -match '(?i)^because of agreements') {
        return "$topicLower with the root of $rootOut; $($because -replace '(?i)^because\s+','is happening because ')"
    }
    if ($because -match '(?i)^agreements because of') {
        return $because
    }
    return "$topicLower with the root of $rootOut; is happening because of agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements $($because -replace '(?i)^because\s+','')"
}

function Build-Header([int]$num, [string]$chartName, [string]$rootDisplay, [string]$phrase) {
    if (Has-Emoji $rootDisplay) {
        $rootOut = $rootDisplay
    } else {
        $rootOut = Format-Root (Strip-Emoji $rootDisplay)
    }
    if ($num -ge 574) {
        $topic = $phrase.ToLower()
        if ($topic -notmatch '^interacting') {
            if ($topic -match '^spirit') { $topic = "interacting with the $topic" }
            elseif ($topic -match '^disembodied') { $topic = "interacting with $topic" }
            else { $topic = "interacting with the spirit of $topic" }
        }
        return ('{0:D3}. {1}, from a root of {2}.' -f $num, $topic, $rootOut)
    }
    return ('{0:D3}. {1}, from a root of {2}.' -f $num, $chartName.ToLower(), $rootOut)
}

# --- main ---
if (-not (Test-Path -LiteralPath $PresentationFile)) {
    throw "Presentation file not found: $PresentationFile"
}
if (-not (Test-Path -LiteralPath $ChartFile)) {
    throw "Chart file not found: $ChartFile"
}

$backupFile = "$FallbackFile.pre-convert.bak"
if ($FallbackFile -eq $OutputFile -and (Test-Path -LiteralPath $FallbackFile) -and -not (Test-Path -LiteralPath $backupFile)) {
    Copy-Item -LiteralPath $FallbackFile -Destination $backupFile
}
$fallbackSource = if (Test-Path -LiteralPath $backupFile) { $backupFile } else { $FallbackFile }

$chart = Get-Chart $ChartFile
$existing = if (Test-Path -LiteralPath $fallbackSource) { Parse-ExistingTopics $fallbackSource } else { @{} }
$presentation = Parse-Presentation $PresentationFile

$byNumber = @{}
$unmatched = @()
foreach ($entry in $presentation) {
    $num = Match-ChartNumber $entry.phrase $chart
    if (-not $num) {
        $unmatched += $entry.phrase
        continue
    }
    $byNumber[$num] = $entry
}

$blocks = New-Object System.Collections.Generic.List[string]
for ($num = 1; $num -le 666; $num++) {
    $chartName = if ($chart.ContainsKey($num)) { $chart[$num] } else { "Topic $num" }

    if ($byNumber.ContainsKey($num)) {
        $meta = $byNumber[$num]
        $root = if ($meta.root) { $meta.root.Trim() } else { '' }
        $header = Build-Header $num $chartName $root $meta.phrase
        $because = if ($meta.because) { $meta.because } elseif ($existing.ContainsKey($num)) { $existing[$num].detail } else { '' }
        $detail = Build-Detail $meta.phrase $root $because $num
    } elseif ($existing.ContainsKey($num)) {
        # Preserve fallback topics (108-573 etc.) — strip prior bad inject pass, keep plain text
        $header = Clean-FallbackText $existing[$num].header
        $detail = Clean-FallbackText $existing[$num].detail
    } else {
        $header = ('{0:D3}. {1}, from a root of unknown.' -f $num, $chartName.ToLower())
        $detail = ''
    }

    [void]$blocks.Add("$header`n`n$detail`n~~~~~~~~~~~~")
}

$content = ($blocks -join "`n`n") + "`n"
[System.IO.File]::WriteAllText($OutputFile, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host "Wrote $OutputFile"
Write-Host "  Matched from presentation: $($byNumber.Count) / 666"
Write-Host "  Numbering: 001-666 per ROOT-SPIRITS-CHART.txt"
if ($unmatched.Count -gt 0) {
    Write-Host "  Unmatched presentation phrases: $($unmatched.Count)"
    $unmatched | Select-Object -First 10 | ForEach-Object { Write-Host "    - $_" }
}
