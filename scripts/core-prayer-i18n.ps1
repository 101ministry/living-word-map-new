# Shared helpers for translating the English core prayer template into other languages.

function Read-Utf8Core([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Normalize-EnglishPrayerText([string]$text) {
    if (-not $text) { return $text }
    return $text.Replace([char]0x2019, "'").Replace([char]0x2018, "'")
}

function Get-PhrasePairs([string]$phrasesFile) {
    $raw = Read-Utf8Core $phrasesFile | ConvertFrom-Json
    $pairs = @()
    foreach ($prop in $raw.PSObject.Properties) {
        $pairs += [PSCustomObject]@{ Key = $prop.Name; Value = [string]$prop.Value; Len = $prop.Name.Length }
    }
    return $pairs | Sort-Object -Property Len -Descending
}

function ConvertTo-TranslatedPrayerText([string]$text, $phrasePairs) {
    if (-not $text) { return $text }
    $out = Normalize-EnglishPrayerText $text
    foreach ($pair in $phrasePairs) {
        $out = $out.Replace($pair.Key, $pair.Value)
    }
    return $out
}

function Get-TranslatedCorePrayer(
    [string]$LangCode,
    [string]$PhrasesFile,
    [string]$MetaFile,
    [string]$EnglishCoreFile = "$PSScriptRoot\..\data\en-core-prayer.txt"
) {
    if (-not (Test-Path -LiteralPath $MetaFile)) {
        throw "Missing meta file: $MetaFile"
    }
    if (-not (Test-Path -LiteralPath $PhrasesFile)) {
        throw "Missing phrases file: $PhrasesFile"
    }
    $meta = Read-Utf8Core $MetaFile | ConvertFrom-Json
    $coreText = Read-Utf8Core $EnglishCoreFile
    $pairs = Get-PhrasePairs $PhrasesFile
    $translated = ConvertTo-TranslatedPrayerText $coreText.Trim() $pairs
    return @{
        title = [string]$meta.coreTitle
        instruction = [string]$meta.coreInstruction
        text = $translated
        audioPath = "audio/$LangCode/core.mp3"
    }
}
