# Builds graph data for the Living Word Map from source files.
param(
    [string]$TopicsFile = "$env:USERPROFILE\Downloads\Telegram Desktop\topics 666.txt",
    [string]$ChartFile = $(if (Test-Path "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt") {
        (Resolve-Path "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt").Path
    } else {
        "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT SPIRITS CHART - vertical revamp.txt"
    }),
    [string]$MembershipFile = $(if (Test-Path "$PSScriptRoot\..\data\PRINCIPALITY-MEMBERSHIPS.txt") {
        (Resolve-Path "$PSScriptRoot\..\data\PRINCIPALITY-MEMBERSHIPS.txt").Path
    } elseif (Test-Path "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT_SPIRITS_CHART,_GENERATIONAL_INIQUITIES,_WAYS_SATAN_TRIES_TO (master list).txt") {
        "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT_SPIRITS_CHART,_GENERATIONAL_INIQUITIES,_WAYS_SATAN_TRIES_TO (master list).txt"
    } else {
        "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT_SPIRITS_CHART,_GENERATIONAL_INIQUITIES,_WAYS_SATAN_TRIES_TO (2).txt"
    }),
    [string]$ObsidianVault = "$env:USERPROFILE\OneDrive\Documents\Obsidian Vault",
    [string]$TranscriptsDir = $(if (Test-Path "$env:USERPROFILE\Downloads\Telegram Desktop\Transcripts\Opimized_Transcripts") {
        "$env:USERPROFILE\Downloads\Telegram Desktop\Transcripts\Opimized_Transcripts"
    } else {
        "$PSScriptRoot\..\data\transcripts"
    }),
    [string]$OutputFile = "$PSScriptRoot\..\public\data.js"
)

function Slugify([string]$text) {
    $t = $text.ToLower() -replace '[^a-z0-9]+', '-'
    return $t.Trim('-')
}

function Normalize-Principality([string]$name) {
    $map = @{
        'Sleep-Slumber' = 'Slothfulness'
        'Lying' = 'Lies'
        'Lies' = 'Lies'
        'Spirit of Heaviness' = 'Heaviness'
        'Spirit of Anti-Christ' = 'Anti-Christ'
        'Deaf & Dumb' = 'Deaf & Dumb'
        'Deaf' = 'Deaf & Dumb'
        'Anti' = 'Anti-Christ'
        'Murder' = 'Shedding of Innocent Blood'
        'Treachery' = 'Treachery Against Others'
        'Jealousy' = 'Jealousy'
        'Using and Abusing Others Verbally, Physically, Emotionally and Spiritually' = 'Using and Abusing Others Emotionally, Physically, Spiritually, and Verbally'
        'Spirit Spouse' = 'Spirit Spouse Gods'
        'Spirit Spouse Gods' = 'Spirit Spouse Gods'
    }
    if ($map.ContainsKey($name)) { return $map[$name] }
    return $name
}

function Resolve-PrincipalityFromFruit([string]$fruit) {
    if (-not $fruit) { return $null }
    $f = $fruit.Trim().TrimEnd('.')
    $map = @{
        'Sexual Corruption of Human and Hybrid DNA, Counterfeit Spirituality, and Confusing Preferences with Stewardship' = 'Spirit Spouse Gods'
    }
    if ($map.ContainsKey($f)) { return $map[$f] }
    foreach ($key in $map.Keys) {
        if ($f.StartsWith($key)) { return $map[$key] }
    }
    return $null
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

function Get-TopicKind([string]$text) {
    if (-not $text) { return 'plain' }
    $t = $text.ToLower().Trim()
    if ($t -match '^(spirit of|interacting with the spirit of)\b') { return 'spirit' }
    if ($t -match '^(being in|being)\b') { return 'being' }
    if ($t -match '^familiar identity of\b') { return 'familiar' }
    return 'plain'
}

function Parse-FruitList([string]$text) {
    if (-not $text) { return @() }
    $t = $text.Trim().TrimEnd('.')
    $t = $t -replace '\s*\(think [^)]+\)', ''
    $t = $t -replace '\s+with the parent Principality of.+$', ''
    $t = $t -replace '\s+with Using and Abusing.+$', ''
    $t = $t.Trim().TrimEnd('.')

    if ($t -match '^(.+),\s*and\s+(.+)$') {
        $last = $Matches[2].Trim()
        $rest = $Matches[1]
        $items = @($rest -split ',\s*' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        if ($last) { $items += $last }
        return @($items | Select-Object -Unique)
    }

    $simple = @($t -split ',\s*' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($simple.Count -gt 1) { return $simple }

    return @($t)
}

function Resolve-PrincipalityName([string]$header, [string[]]$knownNames) {
    $clean = ($header -replace '^(PRINCIPALITY|CATEGORY|SPIRIT)\s+OF\s+', '').Trim()
    $cleanSlug = Slugify $clean
    foreach ($p in $knownNames) {
        if ((Slugify $p) -eq $cleanSlug) { return $p }
    }
    foreach ($p in $knownNames) {
        $pSlug = Slugify $p
        if ($cleanSlug.Contains($pSlug) -or $pSlug.Contains($cleanSlug)) { return $p }
    }
    return Normalize-Principality $clean
}

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Parse-ObsidianPrincipality([string]$path) {
    $content = Read-Utf8 $path
    $name = ([System.IO.Path]::GetFileNameWithoutExtension($path)) -replace '^Principality of ', ''

    $themes = @()
    if ($content -match '(?s)Core [Tt]hemes:\s*\r?\n((?:- .+\r?\n)+)') {
        $themes = [regex]::Matches($matches[1], '- (.+)') | ForEach-Object { $_.Groups[1].Value.Trim() }
    }

    $quotes = @()
    if ($content -match '(?s):::writing\s*\r?\n(.+?):::') {
        $quotes = ($matches[1] -split '\r?\n') |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ -match '^"' -and $_ -match '"$' } |
            ForEach-Object { $_ -replace '^"|"$', '' }
    }

    $character = $null
    if ($content -match 'Character:\s*(.+)') { $character = $matches[1].Trim() }

    return @{
        name = $name
        character = $character
        themes = $themes
        quotes = $quotes
    }
}

function Get-PrincipalityAliasMap() {
    return @{
        'jealousy' = 'Jealousy'
        'sleep' = 'Slothfulness'
        'slumber' = 'Slothfulness'
        'sleep slumber' = 'Slothfulness'
        'sleep-slumber' = 'Slothfulness'
        'sleep, slumber' = 'Slothfulness'
        'slothfulness' = 'Slothfulness'
        'haughtiness' = 'Haughtiness'
        'lies' = 'Lies'
        'bondage' = 'Bondage'
        'poverty' = 'Bondage'
        'idolatry' = 'Idolatry'
        'error' = 'Error'
        'fear' = 'Fear'
        'divination' = 'Divination'
        'gemini' = 'Divination'
        'heaviness' = 'Heaviness'
        'anti-christ' = 'Anti-Christ'
        'anti christ' = 'Anti-Christ'
        'deaf' = 'Deaf & Dumb'
        'deaf & dumb' = 'Deaf & Dumb'
        'deaf and dumb' = 'Deaf & Dumb'
        'perversion' = 'Perversion'
        'sexual perversion' = 'Sexual Perversion'
        'whoredom' = 'Whoredom'
        'infirmity' = 'Infirmity'
        'death' = 'Shedding of Innocent Blood'
        'murder' = 'Shedding of Innocent Blood'
        'treachery' = 'Treachery Against Others'
        'gluttony' = 'Gluttony'
        'self-righteousness' = 'Self-Righteousness'
        'rebellion' = 'Rebellion'
        'destructive attitudes against god' = 'Destructive Attitudes Against God'
        'destructive identities against god' = 'Destructive Identities Against God'
        'spirit spouse' = 'Spirit Spouse Gods'
        'spirit spouse gods' = 'Spirit Spouse Gods'
    }
}

function Resolve-TranscriptPrincipality([string]$raw, $aliasMap, [string[]]$knownNames) {
    if (-not $raw) { return $null }
    $clean = ($raw -replace '\s+', ' ').Trim().Trim(',').Trim('.').ToLower()
    $clean = $clean -replace '^the ', ''
    $clean = $clean -replace '^(spirit|principality) of ', ''
    $clean = $clean -replace '\band the\b.*$', ''
    $clean = $clean.Trim()

    if ($aliasMap.ContainsKey($clean)) { return $aliasMap[$clean] }

    $header = (Get-Culture).TextInfo.ToTitleCase($clean)
    $resolved = Resolve-PrincipalityName "PRINCIPALITY OF $header" $knownNames
    if ($knownNames -contains $resolved) { return $resolved }

    foreach ($p in $knownNames) {
        $pKey = ($p.ToLower() -replace '[^a-z0-9]+', ' ').Trim()
        if ($clean -eq $pKey -or $clean.Contains($pKey) -or $pKey.Contains($clean)) { return $p }
    }
    return $null
}

function Test-VoiceCandidate([string]$text) {
    if (-not $text) { return $false }
    if ($text.Length -lt 20 -or $text.Length -gt 320) { return $false }
    if ($text -match '(?i)I agree that I am guilty|Rebecca Enos Yoder|spiritual decree of divorce from this record|lay my life down on my mother|In the name of Jesus, amen|blood covenants, blood contracts') { return $false }
    if ($text -match '^(?:2 Timothy|John \d|Matthew \d|Ephesians|Genesis|Jeremiah)\b') { return $false }
    return $true
}

function Normalize-VoiceText([string]$text) {
    $t = $text.Trim()
    $t = $t -replace '\*\*(?:Norm|Speaker \d+|Kyrie|Melissa|JP|Someone|Audience Member):\*\*\s*', ''
    $t = $t -replace '^>\s*', ''
    $t = $t -replace '\s+', ' '
    return $t.Trim()
}

function Convert-ToFirstPersonVoice([string]$sentence) {
    $s = Normalize-VoiceText $sentence
    if (-not (Test-VoiceCandidate $s)) { return $null }

    $s = [regex]::Replace($s, '(?i)the (?:principality|spirit) of [^,.;]+', 'I')
    $s = [regex]::Replace($s, '(?i)(?<=\s)(?:principality|spirit) of [^,.;]+', 'I')
    $s = $s -replace '(?i)^This is I\.', 'This is who I am.'
    $s = $s -replace '(?i)\bIt will\b', 'I will'
    $s = $s -replace '(?i)\bIt would\b', 'I would'
    $s = $s -replace '(?i)\bIt is\b', 'I am'
    $s = $s -replace '(?i)\bIt can\b', 'I can'
    $s = $s -replace '(?i)\bIt makes\b', 'I make'
    $s = $s -replace '(?i)\bIt had\b', 'I had'
    $s = $s -replace '(?i)\bIt has\b', 'I have'
    $s = $s -replace '(?i)\bIt doesn''t\b', 'I don''t'
    $s = $s -replace '(?i)\bIt don''t\b', 'I don''t'
    $s = $s -replace '\bI I\b', 'I'
    $s = $s -replace '^[\s\.,\-–—]+|[\s\.,\-–—]+$', ''
    if (-not (Test-VoiceCandidate $s)) { return $null }
    if ($s -notmatch '[.!?]"?$') { $s += '.' }
    return $s
}

function Get-TranscriptFilePrincipality([string]$fileName, [string[]]$knownNames) {
    $map = @{
        'Rebellion' = 'Rebellion'
        'Destructive Attitudes Against God' = 'Destructive Attitudes Against God'
        'Familiar Spirits' = 'Destructive Identities Against God'
        'Trigger Warning' = 'Whoredom'
    }
    foreach ($entry in $map.GetEnumerator()) {
        if ($fileName -match [regex]::Escape($entry.Key)) { return $entry.Value }
    }
    return $null
}

function Add-BehavioralSentences([System.Collections.Generic.HashSet[string]]$set, [string]$text, [string]$pName) {
    foreach ($sent in ($text -split '(?<=[.!?])\s+')) {
        if ($sent -notmatch '(?i)(serve the|spirit of|principality of|will have you|will make sure|would suggest|targets us|literally serve|because they|It is because|That''s the|This is the|against you|break the|camp in|speaking through)') { continue }
        $voice = Convert-ToFirstPersonVoice $sent
        if ($voice) { [void]$set.Add($voice) }
        foreach ($qm in [regex]::Matches($sent, '"([^"]{20,220})"')) {
            Add-VoiceQuote $set $qm.Groups[1].Value
        }
    }
}

function Add-VoiceQuote([System.Collections.Generic.HashSet[string]]$set, [string]$quote) {
    $q = Normalize-VoiceText $quote
    if (-not (Test-VoiceCandidate $q)) { return }
    [void]$set.Add($q)
}

function Find-NearbyPrincipality([string]$content, [int]$index, $aliasMap, [string[]]$knownNames) {
    $start = [Math]::Max(0, $index - 500)
    $window = $content.Substring($start, $index - $start)
    $matches = [regex]::Matches($window, '(?i)(?:the )?(?:principality|spirit) of ([a-z][a-z\s,&-]{1,45})')
    if ($matches.Count -eq 0) { return $null }
    return Resolve-TranscriptPrincipality $matches[$matches.Count - 1].Groups[1].Value $aliasMap $knownNames
}

function Extract-TranscriptVoices([string]$transcriptsDir, $aliasMap, [string[]]$knownNames) {
    $byPrincipality = @{}
    foreach ($p in $knownNames) {
        $byPrincipality[$p] = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    }

    if (-not (Test-Path -LiteralPath $transcriptsDir)) {
        Write-Warning "Transcripts directory not found: $transcriptsDir"
        return $byPrincipality
    }

    $files = Get-ChildItem -LiteralPath $transcriptsDir -Filter '*.txt' -File
    foreach ($file in $files) {
        $content = Read-Utf8 $file.FullName
        $filePrincipality = Get-TranscriptFilePrincipality $file.Name $knownNames

        foreach ($m in [regex]::Matches($content, '(?i)\bthe principality of ([^.,;]{2,55}?)\s+(will|would|is very|is|makes|had|has|can|doesn''t|don''t|wants)\s+([^\.]{15,240}\.)')) {
            $pName = Resolve-TranscriptPrincipality $m.Groups[1].Value $aliasMap $knownNames
            if (-not $pName) { continue }
            $voice = Convert-ToFirstPersonVoice ("It $($m.Groups[2].Value) $($m.Groups[3].Value)")
            if ($voice) { [void]$byPrincipality[$pName].Add($voice) }
        }

        foreach ($m in [regex]::Matches($content, '(?i)\bthis is the principality of ([^\.]{2,45})\.\s+(It\s+[^\.]{15,240}\.)')) {
            $pName = Resolve-TranscriptPrincipality $m.Groups[1].Value $aliasMap $knownNames
            if (-not $pName) { continue }
            $voice = Convert-ToFirstPersonVoice $m.Groups[2].Value
            if ($voice) { [void]$byPrincipality[$pName].Add($voice) }
        }

        foreach ($m in [regex]::Matches($content, '(?i)\bpart of the principality of ([^,]{2,45}) is\s+(?:that\s+)?([^\.]{15,240}\.)')) {
            $pName = Resolve-TranscriptPrincipality $m.Groups[1].Value $aliasMap $knownNames
            if (-not $pName) { continue }
            $voice = Convert-ToFirstPersonVoice $m.Groups[2].Value
            if ($voice) { [void]$byPrincipality[$pName].Add($voice) }
        }

        foreach ($m in [regex]::Matches($content, '(?i)\bthe spirit of ([a-z][a-z\s-]{1,30}?)\s+would suggest[^"]*"([^"]{20,240})"')) {
            $pName = Resolve-TranscriptPrincipality $m.Groups[1].Value $aliasMap $knownNames
            if ($pName) { Add-VoiceQuote $byPrincipality[$pName] $m.Groups[2].Value }
        }

        foreach ($m in [regex]::Matches($content, '(?i)(?:familiar identity|familiar spirit|spirit) of ([a-z][a-z\s-]{1,30}?)[^.]{0,80}?said,\s*"([^"]{20,240})"')) {
            $pName = Resolve-TranscriptPrincipality $m.Groups[1].Value $aliasMap $knownNames
            if ($pName) { Add-VoiceQuote $byPrincipality[$pName] $m.Groups[2].Value }
        }

        foreach ($m in [regex]::Matches($content, '(?i)familiar identity of ([a-z][a-z\s-]{1,35}) said,\s*"([^"]{20,240})"')) {
            $pName = Resolve-TranscriptPrincipality $m.Groups[1].Value $aliasMap $knownNames
            if ($pName) { Add-VoiceQuote $byPrincipality[$pName] $m.Groups[2].Value }
        }

        foreach ($m in [regex]::Matches($content, '(?i)"([^"]{20,200})"\.\s*(?:That''s|That is|This is)\s+(?:the )?(?:spirit|principality) of ([^\.]+)\.')) {
            $pName = Resolve-TranscriptPrincipality $m.Groups[2].Value $aliasMap $knownNames
            if ($pName) { Add-VoiceQuote $byPrincipality[$pName] $m.Groups[1].Value }
        }

        foreach ($m in [regex]::Matches($content, '(?i)suggested to me,\s*"([^"]{20,240})"')) {
            $pName = Find-NearbyPrincipality $content $m.Index $aliasMap $knownNames
            if ($pName) { Add-VoiceQuote $byPrincipality[$pName] $m.Groups[1].Value }
        }

        foreach ($m in [regex]::Matches($content, '(?m)^## (.+)$')) {
            $header = $m.Groups[1].Value
            if ($header -notmatch '(?i)(?:principality|spirit) of (.+)') { continue }
            $rawP = $Matches[1] -replace '(?i)\band the\b.*', ''
            $pName = Resolve-TranscriptPrincipality $rawP $aliasMap $knownNames
            if (-not $pName) { continue }

            $rest = $content.Substring($m.Index + $m.Length)
            $nextMatch = [regex]::Match($rest, '(?m)^## ')
            $section = if ($nextMatch.Success) {
                $content.Substring($m.Index, $m.Length + $nextMatch.Index)
            } else {
                $content.Substring($m.Index)
            }

            foreach ($para in [regex]::Matches($section, '(?m)^\*\*(?:Norm|Speaker 1):\*\*\s*(.+)$')) {
                Add-BehavioralSentences $byPrincipality[$pName] $para.Groups[1].Value $pName
            }
        }

        if ($filePrincipality) {
            foreach ($para in [regex]::Matches($content, '(?m)^\*\*(?:Norm|Speaker 1):\*\*\s*(.+)$')) {
                Add-BehavioralSentences $byPrincipality[$filePrincipality] $para.Groups[1].Value $filePrincipality
            }
        }

        foreach ($para in [regex]::Matches($content, '(?m)^\*\*(?:Norm|Speaker 1):\*\*\s*(.+)$')) {
            foreach ($spiritM in [regex]::Matches($para.Groups[1].Value, '(?i)(?:the )?(?:spirit|principality) of ([a-z][a-z\s-]{1,35})')) {
                $pName = Resolve-TranscriptPrincipality $spiritM.Groups[1].Value $aliasMap $knownNames
                if ($pName) { Add-BehavioralSentences $byPrincipality[$pName] $para.Groups[1].Value $pName }
            }
        }
    }

    return $byPrincipality
}

function Merge-VoiceQuotes([string[]]$primary, [System.Collections.Generic.HashSet[string]]$supplement, [int]$max = 50) {
    $merged = [System.Collections.Generic.List[string]]::new()
    $seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($q in $primary) {
        $n = Normalize-VoiceText $q
        if ($n -and $seen.Add($n)) { [void]$merged.Add($n) }
    }
    foreach ($q in $supplement) {
        if ($merged.Count -ge $max) { break }
        $n = Normalize-VoiceText $q
        if ($n -and $seen.Add($n)) { [void]$merged.Add($n) }
    }
    return ,@($merged)
}

if (-not (Test-Path -LiteralPath $ChartFile)) {
    throw "Chart file not found: $ChartFile"
}
$chartRaw = Read-Utf8 $ChartFile
$chartNames = @{}
foreach ($line in ($chartRaw -split '\r?\n')) {
    if ($line -match '^(\d{3})\.\s*(.+)$') {
        $chartNames[[int]$matches[1]] = $matches[2].Trim()
    }
}

$chartKeyToNum = @{}
$chartKindByNum = @{}
foreach ($entry in $chartNames.GetEnumerator()) {
    $key = Normalize-TopicKey $entry.Value
    $kind = Get-TopicKind $entry.Value
    $chartKindByNum[[int]$entry.Key] = $kind
    if ($key -and -not $chartKeyToNum.ContainsKey($key)) {
        $chartKeyToNum[$key] = @()
    }
    if ($key) { $chartKeyToNum[$key] += [int]$entry.Key }
}

function Find-TopicNumbersByLabel([string]$label) {
    $key = Normalize-TopicKey $label
    if (-not $key) { return @() }
    if ($chartKeyToNum.ContainsKey($key)) {
        return @($chartKeyToNum[$key])
    }
    return @()
}

function Split-MembershipLabels([string]$line) {
    $trimmed = $line.Trim()
    if (-not $trimmed) { return @() }

    # Lines may mix tabs and wide-space runs (e.g. Sexual Perversion, Spirit Spouse Gods).
    $normalized = ($trimmed -replace "`t", '    ').Trim()
    $labels = @($normalized -split '\s{4,}' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($labels.Count -gt 1) { return $labels }

    if ($trimmed -match "`t") {
        return @($trimmed -split "`t" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    }

    $labels = @($trimmed -split '\s{2,}' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    return $labels
}

$allPrincipalityNames = @(
    'Jealousy', 'Slothfulness', 'Haughtiness', 'Lies', 'Bondage', 'Idolatry', 'Error',
    'Fear', 'Divination', 'Heaviness', 'Anti-Christ', 'Deaf & Dumb', 'Perversion',
    'Whoredom', 'Infirmity', 'Shedding of Innocent Blood', 'Treachery Against Others',
    'Using and Abusing Others Emotionally, Physically, Spiritually, and Verbally',
    'Trading Floor Transactions with Demons', 'Gluttony', 'Self-Righteousness',
    'Sexual Perversion', 'Rebellion', 'Destructive Attitudes Against God',
    'Destructive Identities Against God', 'Spirit Spouse Gods'
)

# --- Parse root / fruit / principality metadata from topics file ---
$topicsRaw = Read-Utf8 $TopicsFile
$metadataBlocks = [regex]::Split($topicsRaw, '(?=\d{3}\.\s+\S)')
$metadataByNumber = @{}

foreach ($block in $metadataBlocks) {
    $b = $block.Trim()
    if (-not $b -or $b -notmatch '(?m)^(\d{3})\.') { continue }

    $num = [int]$matches[1]
    $metaName = $null
    $root = $null

    if ($b -match '(?m)^(\d{3})\.\s*(.+?),\s*from a root of\s*(.+?)\.') {
        $metaName = $matches[2].Trim()
        $root = $matches[3].Trim()
    } elseif ($b -match '(?m)^(\d{3})\.\s*(.+)') {
        $metaName = $matches[2].Trim()
    }

    $fruit = $null
    $fruits = @()
    $principality = $null

    if ($b -match '(?is)FRUITS of\s+(.+?)(?:\s+with the parent Principality of|\s+with Using and Abusing|\s*$|\.)') {
        $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        $fruits = Parse-FruitList $fruitBlob
        if ($fruits.Count -gt 0) { $fruit = $fruits[0] }
    } elseif ($b -match '(?is)because FRUITS of\s+(.+?)(?:\s+with the parent Principality of|\s+with Using and Abusing|\s*$|\.)') {
        $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        $fruits = Parse-FruitList $fruitBlob
        if ($fruits.Count -gt 0) { $fruit = $fruits[0] }
    } elseif ($b -match '(?is)FRUITS with because of\s+(.+?)(?:\s+with the parent Principality of|\s*$|\.)') {
        $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        $fruits = Parse-FruitList $fruitBlob
        if ($fruits.Count -gt 0) { $fruit = $fruits[0] }
    } elseif ($b -match '(?is)because of FRUITS with because of\s+(.+?)(?:\s+with the parent Principality of|\s*$|\.)') {
        $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        $fruits = Parse-FruitList $fruitBlob
        if ($fruits.Count -gt 0) { $fruit = $fruits[0] }
    } elseif ($b -match '(?is)because of FRUITS with\s+(.+?)(?:\s+with the parent Principality of|\s+is happening because|\s*$|\.)') {
        $fruitBlob = $Matches[1].Trim().TrimEnd('.')
        $fruits = Parse-FruitList $fruitBlob
        if ($fruits.Count -gt 0) { $fruit = $fruits[0] }
    } elseif ($b -match 'because of\s+(?!7 agreements)(.+?)\s+with the parent Principality of\s+(.+?)(?:\s|$|\.)') {
        $fruit = $matches[1].Trim().TrimEnd('.')
        $fruits = @($fruit)
        $principality = Normalize-Principality $matches[2].Trim().TrimEnd('.')
    } elseif ($b -match 'parent Principality of\s+(.+?)(?:\s|$|\.)') {
        $principality = Normalize-Principality $matches[1].Trim().TrimEnd('.')
    }

    $metadataByNumber[$num] = @{
        metaName = $metaName
        root = $root
        fruit = $fruit
        fruits = $fruits
        principality = $principality
    }
}

# --- Parse master list: ADDITIVE principality memberships only ---
# The master list links symptom labels to Principalities (including multi-membership).
# It does NOT define Roots or Fruits — those always come from topics 666.txt metadata.
$topicPrincipalitySets = @{}
for ($num = 1; $num -le 666; $num++) {
    $topicPrincipalitySets[$num] = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
}

$membershipManifestationsByPrincipality = @{}
$membershipLabelsMatched = 0
$membershipLabelsUnmatched = 0
$unmatchedMembershipLabels = @()

if (Test-Path -LiteralPath $MembershipFile) {
    $membershipRaw = Read-Utf8 $MembershipFile
    $currentPrincipality = $null
    foreach ($line in ($membershipRaw -split '\r?\n')) {
        if ($line -match '^\[(.+)\]\s*$') {
            $currentPrincipality = Resolve-PrincipalityName $matches[1].Trim() $allPrincipalityNames
            if ($currentPrincipality -and -not $membershipManifestationsByPrincipality.ContainsKey($currentPrincipality)) {
                $membershipManifestationsByPrincipality[$currentPrincipality] = @()
            }
            continue
        }
        if (-not $currentPrincipality) { continue }
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed -match '^(ROOT SPIRITS CHART|JACKIE|MITCH|KIMBERLY|ASHTON)') { continue }

        foreach ($label in (Split-MembershipLabels $trimmed)) {
            $label = $label -replace '^\d+Self-', 'Self-'
            if (-not $membershipManifestationsByPrincipality.ContainsKey($currentPrincipality)) {
                $membershipManifestationsByPrincipality[$currentPrincipality] = @()
            }
            if ($membershipManifestationsByPrincipality[$currentPrincipality].Count -lt 250) {
                $membershipManifestationsByPrincipality[$currentPrincipality] += $label
            }

            $nums = Find-TopicNumbersByLabel $label
            if ($nums -and $nums.Count -gt 0) {
                $membershipLabelsMatched++
                foreach ($n in $nums) {
                    [void]$topicPrincipalitySets[$n].Add($currentPrincipality)
                }
            } else {
                $membershipLabelsUnmatched++
                if ($unmatchedMembershipLabels.Count -lt 40) {
                    $unmatchedMembershipLabels += "$currentPrincipality :: $label"
                }
            }
        }
    }
}

# --- Merge chart names with metadata into 666 topics ---
$topics = @()
$rootsMap = @{}
$fruitsMap = @{}
$principalityTopicCounts = @{}
$themesByPrincipality = @{}

for ($num = 1; $num -le 666; $num++) {
    $name = if ($chartNames.ContainsKey($num)) { $chartNames[$num] } else { "Topic $num" }
    $meta = $metadataByNumber[$num]
    $root = if ($meta) { $meta.root } else { $null }
    $fruitNames = @()
    if ($meta -and $meta.fruits -and $meta.fruits.Count -gt 0) {
        $fruitNames = @($meta.fruits)
    } elseif ($meta -and $meta.fruit) {
        $fruitNames = @($meta.fruit)
    }
    $fruit = if ($fruitNames.Count -gt 0) { $fruitNames[0] } else { $null }

    $principalityNames = [System.Collections.Generic.List[string]]::new()
    if ($meta -and $meta.principality) { [void]$principalityNames.Add($meta.principality) }
    foreach ($p in $topicPrincipalitySets[$num]) {
        if ($p -and -not $principalityNames.Contains($p)) {
            [void]$principalityNames.Add($p)
        }
    }

    $rootNames = @()
    if ($root) { $rootNames = @($root) }
    $rootIds = @($rootNames | ForEach-Object { Slugify $_ })
    $fruitIds = @($fruitNames | ForEach-Object { Slugify $_ })

    $principalityIds = @($principalityNames | ForEach-Object { Slugify $_ })
    $principality = if ($principalityNames.Count -gt 0) { $principalityNames[0] } else { $null }
    $principalityId = if ($principalityIds.Count -gt 0) { $principalityIds[0] } else { $null }

    foreach ($rName in $rootNames) {
        $rootId = Slugify $rName
        if (-not $rootsMap.ContainsKey($rootId)) {
            $rootsMap[$rootId] = @{ id = $rootId; name = $rName; topicIds = @() }
        }
        $rootsMap[$rootId].topicIds += $num
    }

    foreach ($fName in $fruitNames) {
        $fruitId = Slugify $fName
        if (-not $fruitsMap.ContainsKey($fruitId)) {
            $fruitsMap[$fruitId] = @{ id = $fruitId; name = $fName; topicIds = @() }
        }
        $fruitsMap[$fruitId].topicIds += $num
    }

    if ($principality) {
        foreach ($pName in $principalityNames) {
            if (-not $principalityTopicCounts.ContainsKey($pName)) {
                $principalityTopicCounts[$pName] = 0
            }
            $principalityTopicCounts[$pName]++
            if (-not $themesByPrincipality.ContainsKey($pName)) {
                $themesByPrincipality[$pName] = @()
            }
            if ($themesByPrincipality[$pName].Count -lt 40) {
                $themesByPrincipality[$pName] += $name
            }
        }
    }

    $topics += @{
        id = $num
        number = $num
        name = $name
        kind = if ($chartKindByNum.ContainsKey($num)) { $chartKindByNum[$num] } else { Get-TopicKind $name }
        metaName = if ($meta) { $meta.metaName } else { $null }
        root = $root
        roots = @($rootNames)
        rootId = if ($rootIds.Count -gt 0) { $rootIds[0] } else { $null }
        rootIds = @($rootIds)
        fruit = $fruit
        fruits = @($fruitNames)
        fruitId = if ($fruitIds.Count -gt 0) { $fruitIds[0] } else { $null }
        fruitIds = @($fruitIds)
        principality = $principality
        principalityId = $principalityId
        principalities = @($principalityNames)
        principalityIds = @($principalityIds)
    }
}

$chartPrincipalities = $themesByPrincipality

# --- Load Obsidian character lore ---
$principalityLore = @{}
Get-ChildItem "$ObsidianVault\Principality*.md" -ErrorAction SilentlyContinue | ForEach-Object {
    $parsed = Parse-ObsidianPrincipality $_.FullName
    $principalityLore[$parsed.name] = $parsed
}

# --- Load transcript-derived character voices ---
$aliasMap = Get-PrincipalityAliasMap
$transcriptVoices = Extract-TranscriptVoices $TranscriptsDir $aliasMap $allPrincipalityNames
$transcriptQuoteTotal = 0
$principalitiesWithTranscriptVoices = 0

# --- Build principality nodes ---
$principalities = @()
foreach ($pName in $allPrincipalityNames) {
    $id = Slugify $pName
    $lore = $principalityLore[$pName]
    $topicCount = if ($principalityTopicCounts.ContainsKey($pName)) { $principalityTopicCounts[$pName] } else { 0 }

    # Core themes come from Obsidian lore only (Roots/Fruits taxonomy is separate on each topic).
    $themes = @()
    if ($lore -and $lore.themes.Count -gt 0) { $themes = $lore.themes }

    $manifestations = if ($membershipManifestationsByPrincipality.ContainsKey($pName)) {
        $membershipManifestationsByPrincipality[$pName]
    } else { @() }

    $obsidianQuotes = if ($lore -and $lore.quotes) { @($lore.quotes) } else { @() }
    $transcriptSet = $transcriptVoices[$pName]
    $quotes = Merge-VoiceQuotes $obsidianQuotes $transcriptSet
    if ($transcriptSet.Count -gt 0) { $principalitiesWithTranscriptVoices++ }
    $transcriptQuoteTotal += [Math]::Max(0, $quotes.Count - $obsidianQuotes.Count)

    $principalities += @{
        id = $id
        name = $pName
        character = if ($lore) { $lore.character } else { "The Principality of $pName" }
        themes = $themes
        manifestations = $manifestations
        quotes = $quotes
        topicCount = $topicCount
    }
}

# --- Build edges ---
$edges = @()
foreach ($topic in $topics) {
    foreach ($principalityId in $topic.principalityIds) {
        $edges += @{ source = "topic-$($topic.id)"; target = $principalityId; type = 'belongs_to' }
    }
    foreach ($rootId in $topic.rootIds) {
        if ($rootId) {
            $edges += @{ source = "topic-$($topic.id)"; target = $rootId; type = 'has_root' }
        }
    }
    foreach ($fruitId in $topic.fruitIds) {
        if ($fruitId) {
            $edges += @{ source = "topic-$($topic.id)"; target = $fruitId; type = 'has_fruit' }
        }
    }
}

# Cross-links: root <-> principality when they share topics
$rootPrincipalityPairs = @{}
foreach ($topic in $topics) {
    foreach ($rootId in $topic.rootIds) {
        if (-not $rootId) { continue }
        foreach ($principalityId in $topic.principalityIds) {
            $key = "$rootId|$principalityId"
            if (-not $rootPrincipalityPairs.ContainsKey($key)) {
                $rootPrincipalityPairs[$key] = 0
            }
            $rootPrincipalityPairs[$key]++
        }
    }
}
foreach ($key in $rootPrincipalityPairs.Keys) {
    $parts = $key -split '\|'
    $edges += @{ source = $parts[0]; target = $parts[1]; type = 'root_principality'; weight = $rootPrincipalityPairs[$key] }
}

# Cross-links: fruit <-> principality
$fruitPrincipalityPairs = @{}
foreach ($topic in $topics) {
    foreach ($fruitId in $topic.fruitIds) {
        if (-not $fruitId) { continue }
        foreach ($principalityId in $topic.principalityIds) {
            $key = "$fruitId|$principalityId"
            if (-not $fruitPrincipalityPairs.ContainsKey($key)) {
                $fruitPrincipalityPairs[$key] = 0
            }
            $fruitPrincipalityPairs[$key]++
        }
    }
}
foreach ($key in $fruitPrincipalityPairs.Keys) {
    $parts = $key -split '\|'
    $edges += @{ source = $parts[0]; target = $parts[1]; type = 'fruit_principality'; weight = $fruitPrincipalityPairs[$key] }
}

# Cross-links: root <-> fruit when they co-occur on topics (AnyType-style shared-detail links)
$rootFruitPairs = @{}
foreach ($topic in $topics) {
    foreach ($rootId in $topic.rootIds) {
        if (-not $rootId) { continue }
        foreach ($fruitId in $topic.fruitIds) {
            if (-not $fruitId) { continue }
            $key = "$rootId|$fruitId"
            if (-not $rootFruitPairs.ContainsKey($key)) { $rootFruitPairs[$key] = 0 }
            $rootFruitPairs[$key]++
        }
    }
}
foreach ($key in $rootFruitPairs.Keys) {
    $parts = $key -split '\|'
    $edges += @{ source = $parts[0]; target = $parts[1]; type = 'root_fruit'; weight = $rootFruitPairs[$key] }
}

# --- Stats ---
$stats = @{
    topicCount = $topics.Count
    chartTopicCount = $chartNames.Count
    metadataTopicCount = $metadataByNumber.Count
    principalityCount = $principalities.Count
    rootCount = $rootsMap.Count
    fruitCount = $fruitsMap.Count
    edgeCount = $edges.Count
    principalitiesWithLore = ($principalityLore.Keys | Measure-Object).Count
    principalitiesWithTranscriptVoices = $principalitiesWithTranscriptVoices
    transcriptQuoteCount = $transcriptQuoteTotal
    multiPrincipalityTopicCount = @($topics | Where-Object { $_.principalityIds.Count -gt 1 }).Count
    multiFruitTopicCount = @($topics | Where-Object { $_.fruitIds.Count -gt 1 }).Count
    topicLiteralEdgeCount = @($edges | Where-Object { $_.type -in @('has_root','has_fruit','belongs_to') }).Count
    membershipLabelsMatched = $membershipLabelsMatched
    membershipLabelsUnmatched = $membershipLabelsUnmatched
    membershipSource = [System.IO.Path]::GetFileName($MembershipFile)
    sources = @{
        chart = 'ROOT SPIRITS CHART - vertical revamp.txt'
        metadata = 'topics 666.txt'
        memberships = [System.IO.Path]::GetFileName($MembershipFile)
        transcripts = $TranscriptsDir
    }
}

$graph = @{
    stats = $stats
    principalities = $principalities
    roots = @($rootsMap.Values | ForEach-Object {
        @{ id = $_.id; name = $_.name; topicCount = $_.topicIds.Count }
    })
    fruits = @($fruitsMap.Values | ForEach-Object {
        @{ id = $_.id; name = $_.name; topicCount = $_.topicIds.Count }
    })
    topics = $topics
    edges = $edges
}

$json = $graph | ConvertTo-Json -Depth 10 -Compress
$js = "window.GRAPH_DATA = $json;"
[System.IO.File]::WriteAllText($OutputFile, $js, [System.Text.UTF8Encoding]::new($false))

Write-Host "Built Living Word Map data:"
Write-Host "  Source chart: $ChartFile"
Write-Host "  Membership master: $MembershipFile (additive principality links; roots/fruits unchanged)"
Write-Host "  Membership labels matched to topics: $membershipLabelsMatched"
Write-Host "  Membership labels unmatched: $membershipLabelsUnmatched"
if ($unmatchedMembershipLabels.Count -gt 0) {
    Write-Host "  Sample unmatched labels:"
    $unmatchedMembershipLabels | Select-Object -First 5 | ForEach-Object { Write-Host "    - $_" }
}
Write-Host "  Topics (chart master): $($stats.topicCount)"
Write-Host "  Metadata linked: $($stats.metadataTopicCount)"
Write-Host "  Multi-principality topics: $($stats.multiPrincipalityTopicCount)"
Write-Host "  Principalities: $($stats.principalityCount) ($($stats.principalitiesWithLore) Obsidian lore, $($stats.principalitiesWithTranscriptVoices) with transcript voices, +$($stats.transcriptQuoteCount) transcript quotes)"
Write-Host "  Roots: $($stats.rootCount)"
Write-Host "  Fruits: $($stats.fruitCount)"
Write-Host "  Edges: $($stats.edgeCount)"
Write-Host "  Output: $OutputFile"
