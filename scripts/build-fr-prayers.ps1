# Generates French (fr) prayer pack from English source via phrase-template translation.
param(
    [string]$EnglishFile = "$PSScriptRoot\..\public\prayers\en.json",
    [string]$PhrasesFile = "$PSScriptRoot\..\data\translations\fr-phrases.json",
    [string]$CoreFile = "$PSScriptRoot\..\data\translations\fr-core-prayer.txt",
    [string]$MetaFile = "$PSScriptRoot\..\data\translations\fr-meta.json",
    [string]$OutputFile = "$PSScriptRoot\..\data\translations\fr-prayers.json"
)

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

function Get-FrPhrasePairs() {
    $raw = Read-Utf8 $PhrasesFile | ConvertFrom-Json
    $pairs = @()
    foreach ($prop in $raw.PSObject.Properties) {
        $pairs += [PSCustomObject]@{ Key = $prop.Name; Value = [string]$prop.Value; Len = $prop.Name.Length }
    }
    return $pairs | Sort-Object -Property Len -Descending
}

function ConvertTo-FrenchPrayerText([string]$text) {
    if (-not $text) { return $text }
    $out = Normalize-EnglishPrayerText $text
    foreach ($pair in Get-FrPhrasePairs) {
        $out = $out.Replace($pair.Key, $pair.Value)
    }
    return $out
}

function Get-FrCorePrayer() {
    $meta = Read-Utf8 $MetaFile | ConvertFrom-Json
    $coreText = Read-Utf8 $CoreFile
    return @{
        title = [string]$meta.coreTitle
        instruction = [string]$meta.coreInstruction
        text = $coreText.Trim()
        audioPath = 'audio/fr/core.mp3'
    }
}

$en = Read-Utf8 $EnglishFile | ConvertFrom-Json
$topics = @{}

foreach ($prop in $en.topics.PSObject.Properties) {
    $p = $prop.Value
    $num = [int]$p.number
    $topics[$prop.Name] = @{
        number = $num
        spirit = $p.spirit
        note = ConvertTo-FrenchPrayerText $p.note
        text = ConvertTo-FrenchPrayerText $p.text
        audioPath = ('audio/fr/{0:D3}.mp3' -f $num)
    }
}

$payload = @{
    language = 'fr'
    complete = $true
    source = 'translated from en via build-fr-prayers.ps1'
    corePrayer = Get-FrCorePrayer
    topics = $topics
}

Write-Utf8Json $OutputFile $payload
Write-Host "Built French prayers:"
Write-Host "  Topics: $($topics.Count)"
Write-Host "  Output: $OutputFile"
