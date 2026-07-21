# Updates core-prayer phrase maps, meta files, and translated core-prayer.txt for all languages.
param(
    [string]$EnglishCoreFile = "$PSScriptRoot\..\data\en-core-prayer.txt",
    [string]$TranslationsDir = "$PSScriptRoot\..\data\translations",
    [string]$ConfigFile = "$PSScriptRoot\..\data\translations\core-prayer-i18n.json"
)

. "$PSScriptRoot\core-prayer-i18n.ps1"

function Read-JsonObject([string]$path) {
    return Read-Utf8Core $path | ConvertFrom-Json
}

function Write-JsonObject([string]$path, $object) {
    $json = $object | ConvertTo-Json -Depth 8 -Compress:$false
    [System.IO.File]::WriteAllText($path, $json, [System.Text.UTF8Encoding]::new($false))
}

$langConfig = Read-JsonObject $ConfigFile
$coreHappeningKey = ' is happening because of agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements. '

foreach ($prop in $langConfig.PSObject.Properties) {
    $code = [string]$prop.Name
    $cfg = $prop.Value
    $phrasesPath = Join-Path $TranslationsDir "$code-phrases.json"
    $metaPath = Join-Path $TranslationsDir "$code-meta.json"
    $corePath = Join-Path $TranslationsDir "$code-core-prayer.txt"

    if (-not (Test-Path -LiteralPath $phrasesPath)) {
        Write-Warning "Skipping $code - missing phrases file"
        continue
    }

    $phrases = Read-JsonObject $phrasesPath
    $phrases | Add-Member -NotePropertyName '[topic]' -NotePropertyValue ([string]$cfg.topic) -Force
    $phrases | Add-Member -NotePropertyName $coreHappeningKey -NotePropertyValue ([string]$cfg.happening) -Force
    Write-JsonObject $phrasesPath $phrases

    $meta = [ordered]@{
        coreTitle = [string]$cfg.title
        coreInstruction = [string]$cfg.instruction
    }
    Write-JsonObject $metaPath $meta

    $translated = Get-TranslatedCorePrayer -LangCode $code -PhrasesFile $phrasesPath -MetaFile $metaPath -EnglishCoreFile $EnglishCoreFile
    [System.IO.File]::WriteAllText($corePath, $translated.text + "`n", [System.Text.UTF8Encoding]::new($false))

    Write-Host "Synced core prayer for $code"
}

Write-Host "Done syncing core prayer translations."
