# Phrase-translate Round 2 or Round 3 compiled prayers into public/prayers/{lang}-round{N}.json
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(2, 3)]
    [int]$Round,
    [Parameter(Mandatory = $true)]
    [string]$LangCode,
    [string]$CompiledFile = "",
    [string]$PhrasesFile = "",
    [string]$ExtraPhrasesFile = "",
    [string]$OutputFile = ""
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not $CompiledFile) {
    $CompiledFile = Join-Path $repoRoot "data\COMPILED-PRAYERS-ROUND$Round.txt"
}
if (-not $PhrasesFile) {
    $PhrasesFile = Join-Path $repoRoot "data\translations\$LangCode-phrases.json"
}
if (-not $ExtraPhrasesFile) {
    $ExtraPhrasesFile = Join-Path $repoRoot "data\translations\round$Round-extra-phrases.json"
}
if (-not $OutputFile) {
    $OutputFile = Join-Path $repoRoot "public\prayers\$LangCode-round$Round.json"
}

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.UTF8Encoding]::new($false))
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

function Get-MergedPhrasePairs([string]$basePath, [string]$extraPath, [string]$code) {
    $map = [ordered]@{}
    if (Test-Path -LiteralPath $basePath) {
        $raw = Read-Utf8 $basePath | ConvertFrom-Json
        foreach ($prop in $raw.PSObject.Properties) {
            $map[$prop.Name] = [string]$prop.Value
        }
    }
    if (Test-Path -LiteralPath $extraPath) {
        $extraRoot = Read-Utf8 $extraPath | ConvertFrom-Json
        if ($extraRoot.PSObject.Properties.Name -contains $code) {
            foreach ($prop in $extraRoot.$code.PSObject.Properties) {
                $map[$prop.Name] = [string]$prop.Value
            }
        }
    }
    $pairs = @()
    foreach ($key in $map.Keys) {
        $pairs += [PSCustomObject]@{ Key = $key; Value = $map[$key]; Len = $key.Length }
    }
    return @($pairs | Sort-Object -Property Len -Descending)
}

function ConvertTo-TranslatedPrayerText([string]$text, $pairs) {
    if (-not $text) { return $text }
    $out = Normalize-EnglishPrayerText $text
    foreach ($pair in $pairs) {
        $out = $out.Replace($pair.Key, $pair.Value)
    }
    return $out
}

if (-not (Test-Path -LiteralPath $CompiledFile)) {
    throw "Compiled Round $Round file not found: $CompiledFile"
}
if (-not (Test-Path -LiteralPath $PhrasesFile) -and -not (Test-Path -LiteralPath $ExtraPhrasesFile)) {
    throw "No phrase pack for $LangCode (missing $PhrasesFile and $ExtraPhrasesFile)"
}

$pairs = Get-MergedPhrasePairs $PhrasesFile $ExtraPhrasesFile $LangCode
$raw = Read-Utf8 $CompiledFile
$blocks = [regex]::Split($raw, '(?=\d{3}\.\s*PLEASE NOTE:)')
$topics = [ordered]@{}
$textKey = "round${Round}Text"

foreach ($block in $blocks) {
    $b = $block.Trim()
    if (-not $b -or $b -notmatch '(?m)^(\d{3})\.\s*PLEASE NOTE:') { continue }
    $topicNumber = [int]$Matches[1]
    $note = 'PLEASE NOTE: THESE PRAYERS ARE TO BE SPOKEN, NOT SIMPLY READ SILENTLY.'
    if ($b -match '(?m)^\d{3}\.\s*(PLEASE NOTE:.+)$') {
        $note = $Matches[1].Trim()
    }
    $body = $b
    $body = [regex]::Replace($body, '(?m)^\d{3}\.\s*PLEASE NOTE:.+\r?\n?', '')
    $body = [regex]::Replace($body, '(?m)^~+\s*$', '')
    $body = $body.Trim()

    $topics[[string]$topicNumber] = @{
        number = $topicNumber
        note = ConvertTo-TranslatedPrayerText $note $pairs
        text = ConvertTo-TranslatedPrayerText $body $pairs
    }
}

$payload = @{
    language = $LangCode
    round = $Round
    complete = $true
    source = "translated from COMPILED-PRAYERS-ROUND$Round.txt via build-lang-round23-prayers.ps1"
    topics = $topics
}

Write-Utf8Json $OutputFile $payload
Write-Host "Built Round $Round $LangCode prayers:"
Write-Host "  Topics: $($topics.Count)"
Write-Host "  Output: $OutputFile"
