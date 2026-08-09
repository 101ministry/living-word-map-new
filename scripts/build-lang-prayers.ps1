# Generates a translated prayer pack from English source via phrase-template translation.
param(
    [Parameter(Mandatory = $true)]
    [string]$LangCode,
    [string]$EnglishFile = "",
    [string]$PhrasesFile = "",
    [string]$CoreFile = "",
    [string]$MetaFile = "",
    [string]$OutputFile = ""
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $EnglishFile) { $EnglishFile = Join-Path $repoRoot 'public\prayers\en.json' }
if (-not $PhrasesFile) { $PhrasesFile = Join-Path $repoRoot "data\translations\$LangCode-phrases.json" }
if (-not $CoreFile) { $CoreFile = Join-Path $repoRoot "data\translations\$LangCode-core-prayer.txt" }
if (-not $MetaFile) { $MetaFile = Join-Path $repoRoot "data\translations\$LangCode-meta.json" }
if (-not $OutputFile) { $OutputFile = Join-Path $repoRoot "data\translations\$LangCode-prayers.json" }

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8Json([string]$path, $object) {
    $dir = Split-Path $path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $json = $object | ConvertTo-Json -Depth 8 -Compress:$false
    [System.IO.File]::WriteAllText($path, $json, [System.Text.UTF8Encoding]::new($false))
}

function Normalize-EnglishPrayerText([string]$text) {
    if (-not $text) { return $text }
    return $text.Replace([char]0x2019, "'").Replace([char]0x2018, "'")
}

$phrasePairs = $null
function Get-PhrasePairs() {
    if ($script:phrasePairs) { return $script:phrasePairs }
    $raw = Read-Utf8 $PhrasesFile | ConvertFrom-Json
    $pairs = @()
    foreach ($prop in $raw.PSObject.Properties) {
        $pairs += [PSCustomObject]@{ Key = $prop.Name; Value = [string]$prop.Value; Len = $prop.Name.Length }
    }
    $script:phrasePairs = $pairs | Sort-Object -Property Len -Descending
    return $script:phrasePairs
}

function ConvertTo-TranslatedPrayerText([string]$text) {
    if (-not $text) { return $text }
    $out = Normalize-EnglishPrayerText $text
    foreach ($pair in Get-PhrasePairs) {
        $out = $out.Replace($pair.Key, $pair.Value)
    }
    return $out
}

function Get-CorePrayer() {
    . "$PSScriptRoot\core-prayer-i18n.ps1"
    return Get-TranslatedCorePrayer -LangCode $LangCode -PhrasesFile $PhrasesFile -MetaFile $MetaFile
}

$en = Read-Utf8 $EnglishFile | ConvertFrom-Json
$topics = @{}

foreach ($prop in $en.topics.PSObject.Properties) {
    $p = $prop.Value
    $num = [int]$p.number
    $topics[$prop.Name] = @{
        number = $num
        spirit = $p.spirit
        note = ConvertTo-TranslatedPrayerText $p.note
        text = ConvertTo-TranslatedPrayerText $p.text
        audioPath = ('audio/{0}/{1:D3}.mp3' -f $LangCode, $num)
    }
}

$payload = @{
    language = $LangCode
    complete = $true
    source = "translated from en via build-lang-prayers.ps1 ($LangCode)"
    corePrayer = Get-CorePrayer
    topics = $topics
}

Write-Utf8Json $OutputFile $payload
Write-Host "Built $LangCode prayers:"
Write-Host "  Topics: $($topics.Count)"
Write-Host "  Output: $OutputFile"
