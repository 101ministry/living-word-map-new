# Generates Swahili (sw) prayer pack from English source via phrase-template translation.
param(
    [string]$EnglishFile = "$PSScriptRoot\..\public\prayers\en.json",
    [string]$PhrasesFile = "$PSScriptRoot\..\data\translations\sw-phrases.json",
    [string]$CoreFile = "$PSScriptRoot\..\data\translations\sw-core-prayer.txt",
    [string]$MetaFile = "$PSScriptRoot\..\data\translations\sw-meta.json",
    [string]$OutputFile = "$PSScriptRoot\..\data\translations\sw-prayers.json"
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

function Get-SwPhrasePairs() {
    $raw = Read-Utf8 $PhrasesFile | ConvertFrom-Json
    $pairs = @()
    foreach ($prop in $raw.PSObject.Properties) {
        $pairs += [PSCustomObject]@{ Key = $prop.Name; Value = [string]$prop.Value; Len = $prop.Name.Length }
    }
    return $pairs | Sort-Object -Property Len -Descending
}

function ConvertTo-SwahiliPrayerText([string]$text) {
    if (-not $text) { return $text }
    $out = Normalize-EnglishPrayerText $text
    foreach ($pair in Get-SwPhrasePairs) {
        $out = $out.Replace($pair.Key, $pair.Value)
    }
    return $out
}

function Get-SwCorePrayer() {
    . "$PSScriptRoot\core-prayer-i18n.ps1"
    return Get-TranslatedCorePrayer -LangCode 'sw' -PhrasesFile $PhrasesFile -MetaFile $MetaFile
}

$en = Read-Utf8 $EnglishFile | ConvertFrom-Json
$topics = @{}

foreach ($prop in $en.topics.PSObject.Properties) {
    $p = $prop.Value
    $num = [int]$p.number
    $topics[$prop.Name] = @{
        number = $num
        spirit = $p.spirit
        note = ConvertTo-SwahiliPrayerText $p.note
        text = ConvertTo-SwahiliPrayerText $p.text
        audioPath = ('audio/sw/{0:D3}.mp3' -f $num)
    }
}

$payload = @{
    language = 'sw'
    complete = $true
    source = 'translated from en via build-sw-prayers.ps1'
    corePrayer = Get-SwCorePrayer
    topics = $topics
}

Write-Utf8Json $OutputFile $payload
Write-Host "Built Swahili prayers:"
Write-Host "  Topics: $($topics.Count)"
Write-Host "  Output: $OutputFile"
