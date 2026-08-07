# Builds generational (round 3) compiled prayers from topics 666.txt metadata.
param(
    [string]$TopicsFile = "$PSScriptRoot\..\data\TOPICS-666.txt",
    [string]$ChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART-NUMBERED.txt",
    [string]$MembershipFile = "$PSScriptRoot\..\data\PRINCIPALITY-MEMBERSHIPS.txt",
    [string]$OutputFile = "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND3.txt",
    [string]$RepoCopy = "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND3.txt"
)
$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, $Utf8)
}

function Strip-Emoji([string]$text) {
    if (-not $text) { return '' }
    return ($text -replace '[^\x00-\x7F\u0080-\u024F\u1E00-\u1EFF''\u2019\-(),./:;]+', ' ' -replace '\s+', ' ').Trim().TrimEnd('.')
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
        'Anti' = 'Anti-Christ'
        'Murder' = 'Shedding of Innocent Blood'
        'Treachery' = 'Treachery Against Others'
        'Spirit Spouse' = 'Spirit Spouse Gods'
        'Perversion' = 'Sexual Perversion'
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
    $title = (Get-Culture).TextInfo.ToTitleCase($clean.ToLower())
    $title = $title -replace '\bAnd\b', 'and' -replace '\bOf\b', 'of' -replace '\bThe\b', 'the'
    # Restore known canonical casing
    $known = @(
        'Jealousy', 'Slothfulness', 'Haughtiness', 'Lies', 'Bondage', 'Idolatry', 'Error',
        'Fear', 'Divination', 'Heaviness', 'Anti-Christ', 'Deaf & Dumb', 'Sexual Perversion',
        'Whoredom', 'Infirmity', 'Shedding of Innocent Blood', 'Treachery Against Others',
        'Using and Abusing Others Emotionally, Physically, Spiritually, and Verbally',
        'Trading Floor Transactions with Demons', 'Gluttony', 'Self-Righteousness',
        'Rebellion', "Destructive Attitudes Against God$([char]0x2019)s Image",
        'Destructive Identities Against God', 'Spirit Spouse Gods', 'Perversion'
    )
    foreach ($p in $known) {
        if ((Slugify $p) -eq (Slugify $title)) { return Normalize-Principality $p }
    }
    return Normalize-Principality $title
}

function Split-MembershipLabels([string]$line) {
    $trimmed = $line.Trim()
    if (-not $trimmed) { return @() }
    $normalized = ($trimmed -replace "`t", '    ').Trim()
    $labels = @($normalized -split '\s{4,}' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($labels.Count -gt 1) { return $labels }
    if ($trimmed -match "`t") {
        return @($trimmed -split "`t" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    }
    return @($trimmed -split '\s{2,}' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

$daagImageFruit = "Destructive Attitudes Against God$([char]0x2019)s Image"
$diagImageFruit = "Destructive Identities Against God$([char]0x2019)s Image"
$spiritSpouseFruitDisplay = 'Sexual Corruption of Human and Hybrid DNA, Counterfeit Spirituality (think KUNDALINI), and Confusing Preferences with Stewardship'

$topicFruitDisplayOverrides = @{
    130 = 'Occultism and Counterfeit Spirituality'
    284 = 'Anger and Violence, Sexual Corruption, Occultism and Counterfeit Spirituality, and Abuse and Exploitation of Others'
    304 = 'Anti-Christ Spirit / Separation From God'
}
for ($n = 391; $n -le 442; $n++) { $topicFruitDisplayOverrides[$n] = $daagImageFruit }
for ($n = 443; $n -le 573; $n++) { $topicFruitDisplayOverrides[$n] = $diagImageFruit }
for ($n = 574; $n -le 666; $n++) { $topicFruitDisplayOverrides[$n] = $spiritSpouseFruitDisplay }

$topicPrincipalityOverrides = @{ 130 = 'Divination' }
for ($n = 574; $n -le 666; $n++) { $topicPrincipalityOverrides[$n] = 'Spirit Spouse Gods' }

function Get-FruitDisplayText([string]$block, [int]$num) {
    if ($topicFruitDisplayOverrides.ContainsKey($num)) {
        return $topicFruitDisplayOverrides[$num]
    }

    $patterns = @(
        '(?is)(?:because FRUITS of|because of FRUITS of|FRUITS of)\s+(.+?)(?:\s+with the parent Principality of|\s*$|\.)',
        '(?is)because of agreements, blood covenants.+?because of\s+(.+?)\s+with the parent Principality of',
        '(?is)because of\s+(?!7 agreements)(?!agreements,)(.+?)\s+with the parent Principality of'
    )
    foreach ($pat in $patterns) {
        if ($block -match $pat) {
            $raw = Strip-Emoji $Matches[1]
            if ($raw) { return $raw }
        }
    }
    return ''
}

function Parse-TopicBlock([string]$block, [int]$num) {
    $topic = $null
    $root = $null

    if ($block -match '(?m)^(\d{3})\.\s*(.+?),\s*from a root of\s*(.*?)\.') {
        $topic = Strip-Emoji $Matches[2]
        $root = Strip-Emoji $Matches[3]
    }

    if ($block -match '(?is)with the root of\s*(.*?)\s*;') {
        $bodyRoot = Strip-Emoji $Matches[1]
        if ($bodyRoot) { $root = $bodyRoot }
    }
    if (-not $root) { $root = '.' }

    $principality = $null
    if ($block -match '(?im)parent Principality of\s+(.+)$') {
        $principality = Normalize-Principality (Strip-Emoji ($Matches[1].Trim().TrimEnd('.')))
    }
    if ($topicPrincipalityOverrides.ContainsKey($num)) {
        $principality = $topicPrincipalityOverrides[$num]
    }

    $fruits = Get-FruitDisplayText $block $num

    return @{
        topic = $topic
        root = $root
        fruits = $fruits
        principality = $principality
    }
}

function Strip-ScenarioThe([string]$label) {
    if (-not $label) { return '' }
    $x = $label.Trim()
    if ($x -match '^(?i)the\s+(.+)$') { return $Matches[1].Trim() }
    return $x
}

function Get-Round3ScenarioPhrase([string]$topic) {
    if (-not $topic) { return 'interacting with' }
    $t = $topic.Trim()
    if ($t -match '^(?i)interacting with the spirit of\s+(.+)$') {
        return "interacting with $(Strip-ScenarioThe $Matches[1])"
    }
    if ($t -match '^(?i)interacting with(?:\s+the)?\s+(.+)$') {
        return "interacting with $(Strip-ScenarioThe $Matches[1])"
    }
    return "interacting with $(Strip-ScenarioThe $t)"
}

function Build-Round3Prayer([int]$num, [hashtable]$meta) {
    $label = '{0:D3}' -f $num
    $topic = $meta.topic
    $root = $meta.root
    $fruits = $meta.fruits
    $principality = $meta.principality

    @(
        "$label. PLEASE NOTE: THESE PRAYERS ARE TO BE SPOKEN, NOT SIMPLY READ SILENTLY."
        ''
        "On behalf of the sixth generation, on behalf of the seventh generation, on behalf of the eighth generation, on behalf of the nineth generation, on behalf of the tenth generation, on behalf of the eleventh generation, on behalf of the twelfth generation, on behalf of the thirteenth generation, on behalf of the fourteenth generation, on behalf of the fifteenth generation, on behalf of the sixteenth generation, on behalf of the seventeenth generation, on behalf of the eighteenth generation, on behalf of the nineteenth generation, on behalf of the twentyith generation, I agree WE are guilty of allowing scenarios of $(Get-Round3ScenarioPhrase $topic), from a root of $root."
        ''
        'I agree that WE made it more important than God, loved it more than God, and preferred it instead of God.'
        ''
        'For this idolatry, adultery, and rebellion, I lay my life on the altar of God.'
        ''
        "I recognize that $topic, from a root of $root; is happening because of agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements because of $fruits with the parent $principality."
        ''
        'For the accusation of this record, I lay down the 6th, 7th, 8th, 9th, 10, 11th, 12th, 13th, 14th, 15th, 16th, 17th 18th, 19th and 20th generations.'
        ''
        "I refuse to blame anyone anymore for teaching me a bad habit. I take accountability for what my bloodline copied into our lives AND FORGIVE everyone who taught us how to serve this master through what they thought, spoke about, or did with actions. If people from other bloodlines have repented and we don't know about it, I STILL, on behalf of my bloodline go through our memories and forgive every way we remembered people the way Jesus doesn't. Representing my bloodline, I forgive them for not capturing every vain imagination and bringing it to Jesus as given in 2 Corinthians 10:3-5, and not warring against people as given in Ephesians 6:12."
        ''
        'I ask You Father to forgive my bloodline since I have forgiven other bloodlines. I ask You to judge between me and them so that the judgment is pure and holy.'
        ''
        "I no longer want to serve $topic or $fruits. In fact, I am asking for the forgiveness of God on this and for the Blood of Jesus to cover the record and speak instead."
        ''
        "I also ask for a spiritual decree of divorce from this record. We don't have room in my bloodline for unconfessed records. I cast off of my head the crown of iniquity that had been attached to my head. You are banned from my life, my mind, my heart, and my body."
        ''
        'Father, I ask that you give me the courage and strength to be responsible for every other temptation and accusation that the enemy has against me, so that I too can come to the point where he no longer has any more open accusations against me. I thank you for the people You have put in my life to help me walk out a life of repentance, because of walking in discipleship.'
        ''
        'In the name of Jesus, Amen'
        ''
        '~~~~~~~~~~~~'
    ) -join "`r`n"
}

# --- Chart + membership for principality fallback ---
$chartRaw = Read-Utf8 $ChartFile
$chartNames = @{}
$chartKeyToNum = @{}
foreach ($line in ($chartRaw -split '\r?\n')) {
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

$topicPrincipalitySets = @{}
for ($n = 1; $n -le 666; $n++) {
    $topicPrincipalitySets[$n] = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
}

if (Test-Path -LiteralPath $MembershipFile) {
    $membershipRaw = Read-Utf8 $MembershipFile
    $currentPrincipality = $null
    foreach ($line in ($membershipRaw -split '\r?\n')) {
        if ($line -match '^\[(.+)\]\s*$') {
            $currentPrincipality = Resolve-MembershipPrincipality $Matches[1].Trim()
            continue
        }
        if (-not $currentPrincipality) { continue }
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed -match '^(ROOT SPIRITS CHART|JACKIE|MITCH|KIMBERLY|ASHTON)') { continue }
        foreach ($label in (Split-MembershipLabels $trimmed)) {
            $key = Normalize-TopicKey $label
            if ($key -and $chartKeyToNum.ContainsKey($key)) {
                foreach ($n in $chartKeyToNum[$key]) {
                    [void]$topicPrincipalitySets[$n].Add($currentPrincipality)
                }
            }
        }
    }
}

# --- Parse topics and build prayers ---
if (-not (Test-Path -LiteralPath $TopicsFile)) {
    throw "Topics file not found: $TopicsFile"
}

$topicsRaw = Read-Utf8 $TopicsFile
$blocks = [regex]::Split($topicsRaw, '(?=\d{3}\.\s+\S)')
$metaByNum = @{}
foreach ($block in $blocks) {
    if ($block -notmatch '(?m)^(\d{3})\.') { continue }
    $num = [int]$Matches[1]
    $metaByNum[$num] = Parse-TopicBlock $block $num
}

$principalityFallbacks = @()
$prayerBlocks = [System.Collections.Generic.List[string]]::new()

for ($num = 1; $num -le 666; $num++) {
    if (-not $metaByNum.ContainsKey($num)) {
        throw "Missing topic block for #$num in $TopicsFile"
    }
    $meta = $metaByNum[$num]

    if (-not $meta.principality -and $topicPrincipalitySets[$num].Count -gt 0) {
        $meta.principality = @($topicPrincipalitySets[$num])[0]
        $principalityFallbacks += "$('{0:D3}' -f $num) -> $($meta.principality) (membership lookup)"
    }
    if (-not $meta.principality) {
        throw "No principality for topic #$num ($($meta.topic))"
    }
    if (-not $meta.topic -or -not $meta.fruits) {
        throw "Incomplete metadata for topic #$num (topic=$($meta.topic), root=$($meta.root), fruits=$($meta.fruits))"
    }

    [void]$prayerBlocks.Add((Build-Round3Prayer $num $meta))
}

$output = ($prayerBlocks -join "`r`n`r`n`r`n").TrimEnd() + "`r`n"
$outDir = Split-Path -Parent $OutputFile
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}
[System.IO.File]::WriteAllText($OutputFile, $output, $Utf8)
Write-Host "Wrote $($prayerBlocks.Count) prayers to $OutputFile"

if ($RepoCopy) {
    $repoDir = Split-Path -Parent $RepoCopy
    if ($repoDir -and -not (Test-Path -LiteralPath $repoDir)) {
        New-Item -ItemType Directory -Path $repoDir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($RepoCopy, $output, $Utf8)
    Write-Host "Copied to $RepoCopy"
}

if ($principalityFallbacks.Count -gt 0) {
    Write-Host "`nPrincipality fallbacks ($($principalityFallbacks.Count)):"
    $principalityFallbacks | ForEach-Object { Write-Host "  $_" }
}

# Spot-check output
foreach ($n in @(1, 373, 374, 375, 376, 574, 666)) {
    $m = $metaByNum[$n]
    Write-Host "`n#$('{0:D3}' -f $n): $($m.topic) | root=$($m.root) | principality=$($m.principality)"
}
