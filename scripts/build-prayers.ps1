# Builds prayer content and language catalog for the Living Word Map.
param(
    [string]$PrayersFile = $(if (Test-Path "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt") {
        "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt"
    } else {
        "$env:USERPROFILE\Downloads\Telegram Desktop\compiled_prayers - round 1 {7-13.1}"
    }),
    [string]$CorePrayerFile = "$env:USERPROFILE\Downloads\Telegram Desktop\Prayer of Freedom.txt",
    [string]$ChartFile = $(if (Test-Path "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt") {
        "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt"
    } else {
        "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT SPIRITS CHART - vertical revamp.txt"
    }),
    [string]$TopicsFile = "$env:USERPROFILE\Downloads\Telegram Desktop\topics 666.txt",
    [string]$OutputDir = "$PSScriptRoot\..\public"
)

function Normalize-MatchKey([string]$text) {
    if (-not $text) { return '' }
    $t = $text.ToLower()
    $t = $t -replace 'interacting with the spirit of\s+', ''
    $t = $t -replace 'spirit of\s+', ''
    $t = $t -replace 'thought suggestions of\s+', ''
    $t = $t -replace '[^a-z0-9]+', ' '
    return ($t.Trim() -replace '\s+', ' ')
}

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8Json([string]$path, $object) {
    $json = $object | ConvertTo-Json -Depth 6 -Compress:$false
    [System.IO.File]::WriteAllText($path, $json, [System.Text.UTF8Encoding]::new($false))
}

$languages = Read-Utf8 (Join-Path $PSScriptRoot 'languages.json') | ConvertFrom-Json

# --- Parse core prayer ---
$coreRaw = Read-Utf8 $CorePrayerFile
$coreLines = ($coreRaw -split '\r?\n') | ForEach-Object { $_.TrimEnd() }
$coreTitle = ($coreLines | Where-Object { $_ -and $_ -notmatch '^\(' } | Select-Object -First 1).Trim()
$coreInstruction = ($coreLines | Where-Object { $_ -match 'Make sure you pray OUT LOUD' } | Select-Object -First 1)
$coreBodyLines = @()
$inBody = $false
foreach ($line in $coreLines) {
    if ($line -match '^Lord, I forgive anyone') { $inBody = $true }
    if ($inBody) { $coreBodyLines += $line }
}
$corePrayer = @{
    title = $coreTitle
    instruction = $coreInstruction
    text = ($coreBodyLines -join "`n").Trim()
    audioPath = 'audio/en/core.mp3'
}

# --- Parse topic prayers ---
$prayersRaw = Read-Utf8 $PrayersFile
. (Join-Path $PSScriptRoot 'fix-compiled-prayer-numbering.ps1')
$prayerFileStatus = Test-CompiledPrayers $prayersRaw
if ($prayerFileStatus.Count -ne 666 -or $prayerFileStatus.Unnumbered -gt 0) {
    Write-Host "Aligning compiled prayers (guile #607, stupor #654): $($prayerFileStatus.Count) numbered, $($prayerFileStatus.Unnumbered) unnumbered"
    $prayersRaw = Repair-CompiledPrayers $prayersRaw
    $prayerFileStatus = Test-CompiledPrayers $prayersRaw
    if ($prayerFileStatus.Count -ne 666) {
        throw "Compiled prayers must contain 666 numbered entries after alignment (got $($prayerFileStatus.Count))."
    }
}
$blocks = [regex]::Split($prayersRaw, '(?=\d{3}\.\s*PLEASE NOTE:)')
$topicPrayers = @{}

foreach ($block in $blocks) {
    $b = $block.Trim()
    if (-not $b -or $b -notmatch '(?m)^(\d{3})\.\s*PLEASE NOTE:') { continue }

    $topicNumber = [int]$matches[1]

    $note = $null
    if ($b -match '(?m)^\d{3}\.\s*(PLEASE NOTE:.+)$') {
        $note = $matches[1].Trim()
    }

    $spiritName = $null
    if ($b -match 'thought suggestions of\s+(?:interacting with the spirit of\s+)?([^,\r\n]+?)(?:,\s*|\s+from a root|\.\s*(?:\r?\n|$))') {
        $spiritName = ($matches[1] -replace ',+$', '').Trim().TrimEnd('.')
    } elseif ($b -match 'spirit of\s+(?:interacting with the spirit of\s+)?([^,\r\n]+?)(?:,\s*|\s+from a root|\.\s*(?:\r?\n|$))') {
        $spiritName = ($matches[1] -replace ',+$', '').Trim().TrimEnd('.')
    }

    $lines = ($b -split '\r?\n') | ForEach-Object { $_.TrimEnd() }
    $bodyLines = @()
    $passedHeader = $false
    foreach ($line in $lines) {
        if (-not $passedHeader) {
            if ($line -match '^\d{3}\.\s*(PLEASE NOTE:.+)$') {
                $note = $matches[1].Trim()
                $passedHeader = $true
            }
            continue
        }
        if ($line -match '^\d{3}\.\s*PLEASE NOTE:') { break }
        $bodyLines += $line
    }

    while ($bodyLines.Count -gt 0 -and [string]::IsNullOrWhiteSpace($bodyLines[0])) {
        $bodyLines = $bodyLines[1..($bodyLines.Count - 1)]
    }
    while ($bodyLines.Count -gt 0 -and [string]::IsNullOrWhiteSpace($bodyLines[-1])) {
        $bodyLines = $bodyLines[0..($bodyLines.Count - 2)]
    }
    if ($bodyLines.Count -gt 0 -and $bodyLines[-1] -match '^(In the name of Jesus, Amen)\s*~+') {
        $bodyLines[-1] = $matches[1]
    }

    $text = ($bodyLines -join "`n").Trim()
    if (-not $text) { continue }

    $key = [string]$topicNumber
    $topicPrayers[$key] = @{
        number = $topicNumber
        spirit = $spiritName
        note = $note
        text = $text
        audioPath = ('audio/en/{0:D3}.mp3' -f $topicNumber)
    }
}

$prayersDir = Join-Path $OutputDir 'prayers'
$audioDir = Join-Path $OutputDir 'audio'
New-Item -ItemType Directory -Force -Path $prayersDir | Out-Null
New-Item -ItemType Directory -Force -Path $audioDir | Out-Null

foreach ($lang in $languages) {
    $langDir = Join-Path $audioDir $lang.code
    New-Item -ItemType Directory -Force -Path $langDir | Out-Null
}

# English — full content
$enPayload = @{
    language = 'en'
    complete = $true
    source = 'compiled_prayers - round 1 {7-13.1}'
    corePrayer = $corePrayer
    topics = $topicPrayers
}
Write-Utf8Json (Join-Path $prayersDir 'en.json') $enPayload
$enJs = "window.PRAYER_EN = $($enPayload | ConvertTo-Json -Depth 6 -Compress);"
[System.IO.File]::WriteAllText((Join-Path $prayersDir 'en.js'), $enJs, [System.Text.UTF8Encoding]::new($false))

# Generate translated prayer sources from English
$buildEs = Join-Path $PSScriptRoot 'build-es-prayers.ps1'
if (Test-Path $buildEs) {
    & $buildEs -EnglishFile (Join-Path $prayersDir 'en.json')
}
$buildFr = Join-Path $PSScriptRoot 'build-fr-prayers.ps1'
if (Test-Path $buildFr) {
    & $buildFr -EnglishFile (Join-Path $prayersDir 'en.json')
}
$buildDe = Join-Path $PSScriptRoot 'build-de-prayers.ps1'
if (Test-Path $buildDe) {
    & $buildDe -EnglishFile (Join-Path $prayersDir 'en.json')
}
$buildSw = Join-Path $PSScriptRoot 'build-sw-prayers.ps1'
if (Test-Path $buildSw) {
    & $buildSw -EnglishFile (Join-Path $prayersDir 'en.json')
}
$buildRu = Join-Path $PSScriptRoot 'build-ru-prayers.ps1'
if (Test-Path $buildRu) {
    & $buildRu -EnglishFile (Join-Path $prayersDir 'en.json')
}
$buildAr = Join-Path $PSScriptRoot 'build-ar-prayers.ps1'
if (Test-Path $buildAr) {
    & $buildAr -EnglishFile (Join-Path $prayersDir 'en.json')
}

$translationsDir = Join-Path $PSScriptRoot '..\data\translations'
$buildLang = Join-Path $PSScriptRoot 'build-lang-prayers.ps1'
if (Test-Path $buildLang) {
    foreach ($code in @('hi', 'bn', 'pt', 'ur', 'id', 'ja', 'ko')) {
        $phrases = Join-Path $translationsDir "$code-phrases.json"
        if (Test-Path -LiteralPath $phrases) {
            & $buildLang -LangCode $code -EnglishFile (Join-Path $prayersDir 'en.json')
        }
    }
}

# Other languages — load translated packs from data/translations when present
foreach ($lang in $languages) {
    if ($lang.code -eq 'en') { continue }

    $jsonPath = Join-Path $prayersDir "$($lang.code).json"
    $translationSource = Join-Path $translationsDir "$($lang.code)-prayers.json"
    $stub = @{
        language = $lang.code
        complete = $false
        corePrayer = $null
        topics = @{}
    }

    if (Test-Path -LiteralPath $translationSource) {
        try {
            $translated = Get-Content -LiteralPath $translationSource -Raw -Encoding UTF8 | ConvertFrom-Json
            $stub = @{
                language = $lang.code
                complete = [bool]$translated.complete
                corePrayer = $translated.corePrayer
                topics = @{}
            }
            if ($translated.topics) {
                foreach ($prop in $translated.topics.PSObject.Properties) {
                    $stub.topics[$prop.Name] = $prop.Value
                }
            }
        } catch {
            Write-Warning "Could not read translation $translationSource"
        }
    } elseif (Test-Path $jsonPath) {
        try {
            $existing = Get-Content $jsonPath -Raw | ConvertFrom-Json
            if ($existing.corePrayer -or ($existing.topics -and ($existing.topics.PSObject.Properties | Measure-Object).Count -gt 0)) {
                $stub = @{
                    language = $lang.code
                    complete = [bool]$existing.complete
                    corePrayer = $existing.corePrayer
                    topics = @{}
                }
                if ($existing.topics) {
                    foreach ($prop in $existing.topics.PSObject.Properties) {
                        $stub.topics[$prop.Name] = $prop.Value
                    }
                }
            }
        } catch {
            Write-Warning "Could not read existing $jsonPath, using empty shell."
        }
    }

    Write-Utf8Json $jsonPath $stub
    $jsonRaw = Read-Utf8 $jsonPath
    $stubJs = "window.PRAYER_$($lang.code.ToUpper()) = $jsonRaw;"
    [System.IO.File]::WriteAllText((Join-Path $prayersDir "$($lang.code).js"), $stubJs, [System.Text.UTF8Encoding]::new($false))
}

# --- Map chart topic numbers to prayer numbers (handles minor numbering drift) ---
$chartRaw = Read-Utf8 $ChartFile
$chartNames = @{}
foreach ($line in ($chartRaw -split '\r?\n')) {
    if ($line -match '^(\d{3})\.\s*(.+)$') { $chartNames[[int]$matches[1]] = $matches[2].Trim() }
}

$topicsRaw = Read-Utf8 $TopicsFile
$metaBlocks = [regex]::Split($topicsRaw, '(?=\d{3}\.\s+\S)')
$metaByNumber = @{}
foreach ($block in $metaBlocks) {
    $b = $block.Trim()
    if ($b -match '(?m)^(\d{3})\.\s*(.+?),\s*from a root of') {
        $metaByNumber[[int]$matches[1]] = $matches[2].Trim()
    }
}

$prayerBySpirit = @{}
foreach ($prop in $topicPrayers.Keys) {
    $p = $topicPrayers[$prop]
    if ($p.spirit) {
        $key = Normalize-MatchKey $p.spirit
        if ($key -and -not $prayerBySpirit.ContainsKey($key)) {
            $prayerBySpirit[$key] = [int]$prop
        }
    }
}

$prayerIndex = @{}
for ($topicNum = 1; $topicNum -le 666; $topicNum++) {
    $matchedPrayer = $null
    $chartKey = if ($chartNames.ContainsKey($topicNum)) { Normalize-MatchKey $chartNames[$topicNum] } else { '' }

    # Prefer same-number prayer when its spirit matches the chart name
    if ($topicPrayers.ContainsKey([string]$topicNum)) {
        $pSpirit = Normalize-MatchKey $topicPrayers[[string]$topicNum].spirit
        if (-not $chartKey -or -not $pSpirit -or $chartKey -eq $pSpirit -or $chartKey.Contains($pSpirit) -or $pSpirit.Contains($chartKey)) {
            $matchedPrayer = $topicNum
        }
    }

    if (-not $matchedPrayer) {
        $candidates = @()
        if ($chartNames.ContainsKey($topicNum)) { $candidates += $chartNames[$topicNum] }
        if ($metaByNumber.ContainsKey($topicNum)) { $candidates += $metaByNumber[$topicNum] }

        foreach ($candidate in $candidates) {
            $key = Normalize-MatchKey $candidate
            if ($key -and $prayerBySpirit.ContainsKey($key)) {
                $matchedPrayer = $prayerBySpirit[$key]
                break
            }
        }
    }

    if (-not $matchedPrayer -and $topicPrayers.ContainsKey([string]$topicNum)) {
        $matchedPrayer = $topicNum
    }

    if ($matchedPrayer) {
        $prayerIndex[[string]$topicNum] = $matchedPrayer
    }
}

$indexJs = "window.PRAYER_INDEX = $($prayerIndex | ConvertTo-Json -Depth 4 -Compress);"
[System.IO.File]::WriteAllText((Join-Path $OutputDir 'prayer-index.js'), $indexJs, [System.Text.UTF8Encoding]::new($false))

# Language catalog for the app
$langItems = @($languages | ForEach-Object {
    $code = $_.code
    $complete = [bool]$_.complete
    $translationSource = Join-Path $PSScriptRoot "..\data\translations\$code-prayers.json"
    if (Test-Path -LiteralPath $translationSource) {
        try {
            $translated = Get-Content -LiteralPath $translationSource -Raw -Encoding UTF8 | ConvertFrom-Json
            $complete = [bool]$translated.complete
        } catch { }
    }
    [PSCustomObject]@{
        code = $code
        name = $_.name
        native = $_.native
        rtl = [bool]$_.rtl
        complete = $complete
    }
})

$uiEnglish = [ordered]@{
    prayerTitle = 'Prayer'
    corePrayerTitle = 'Prayer of Freedom'
    corePrayerHint = 'Prayed after forgiving all people tied to a root spirit. Speak out loud.'
    spokenNote = 'These prayers are to be spoken, not simply read silently.'
    openCorePrayer = 'Core Prayer'
    listenPrayer = 'Listen'
    audioComingSoon = 'Audio recording coming soon, for now read the prayer aloud.'
    translationComingSoon = 'Translation in progress. English shown until this language is complete.'
    noPrayer = 'No prayer found for this topic.'
    languageLabel = 'Language'
    prayerLanguageLabel = 'Prayer language'
    mapLanguageNote = 'Map labels stay in English. This sets prayer text and audio.'
    prayerLanguageReady = 'Prayers loaded'
}

$uiOverridesPath = Join-Path $PSScriptRoot '..\data\languages-ui-overrides.json'
$uiOverrideRoot = $null
if (Test-Path -LiteralPath $uiOverridesPath) {
    $uiOverrideRoot = Read-Utf8 $uiOverridesPath | ConvertFrom-Json
}

$uiByLang = [ordered]@{}
foreach ($lang in $languages) {
    $code = $lang.code
    $merged = [ordered]@{}
    foreach ($entry in $uiEnglish.GetEnumerator()) {
        $merged[$entry.Key] = $entry.Value
    }
    if ($uiOverrideRoot -and $uiOverrideRoot.PSObject.Properties.Name -contains $code) {
        $uiOverrideRoot.$code.PSObject.Properties | ForEach-Object {
            $merged[$_.Name] = $_.Value
        }
    }
    $uiByLang[$code] = [PSCustomObject]$merged
}

$catalog = [PSCustomObject]@{
    defaultLanguage = 'en'
    audioConvention = [PSCustomObject]@{
        core = 'audio/{lang}/core.mp3'
        topic = 'audio/{lang}/{number}.mp3'
    }
    ui = [PSCustomObject]$uiByLang
    languages = [object[]]$langItems
}
$catalogJson = $catalog | ConvertTo-Json -Depth 6 -Compress:$false
Write-Utf8Json (Join-Path $OutputDir 'languages.json') ($catalogJson | ConvertFrom-Json)
$catalogJs = "window.LANGUAGE_CATALOG = $catalogJson;"
[System.IO.File]::WriteAllText((Join-Path $OutputDir 'languages.js'), $catalogJs, [System.Text.UTF8Encoding]::new($false))

Write-Host "Built prayer content:"
Write-Host "  Source: $PrayersFile"
Write-Host "  Topic prayers (English): $($topicPrayers.Count)"
Write-Host "  Topic-to-prayer links: $($prayerIndex.Count)"
Write-Host "  Languages: $($languages.Count)"
Write-Host "  Output: $prayersDir"
