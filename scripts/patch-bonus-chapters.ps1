# Patch bonusChapters into existing public/videos.js without full YouTube rebuild.
param(
    [string]$VideosFile = "$PSScriptRoot\..\data\teaching-videos.json",
    [string]$OutputFile = "$PSScriptRoot\..\public\videos.js"
)

$ErrorActionPreference = 'Stop'

function Parse-Timestamp([string]$text) {
    if (-not $text) { return $null }
    $parts = @($text.Trim() -split ':')
    if ($parts.Count -eq 2) { return [int]$parts[0] * 60 + [int]$parts[1] }
    if ($parts.Count -eq 3) { return [int]$parts[0] * 3600 + [int]$parts[1] * 60 + [int]$parts[2] }
    return $null
}

function Format-BonusLabel([string]$label) {
    if ($label -notmatch '(?i)^(bonus:|trigger warning:|technical )') { return "BONUS: $label" }
    return $label
}

$config = Get-Content -LiteralPath $VideosFile -Raw | ConvertFrom-Json
$raw = [System.IO.File]::ReadAllText($OutputFile, [System.Text.Encoding]::UTF8)
$json = $raw -replace '^window\.VIDEO_DATA\s*=\s*', '' -replace ';\s*$', ''
$data = $json | ConvertFrom-Json

$bonusByDay = @{}
foreach ($video in $config.videos) {
    if ($video.bonusChapters) {
        $bonusByDay[[string]$video.day] = @($video.bonusChapters)
    }
}

foreach ($video in $data.videos) {
    $dayKey = [string]$video.day
    if (-not $bonusByDay.ContainsKey($dayKey)) { continue }

    $topicChapters = @($video.chapters | Where-Object { -not $_.isBonus })
    $bonusChapters = @()
    foreach ($bonus in $bonusByDay[$dayKey]) {
        $start = Parse-Timestamp ([string]$bonus.start)
        if ($null -eq $start) { continue }
        $bonusChapters += [pscustomobject]@{
            topicNumber  = $null
            topicName    = Format-BonusLabel ([string]$bonus.label)
            startSeconds = $start
            isBonus      = $true
        }
    }
    $video.chapters = @($topicChapters + $bonusChapters | Sort-Object startSeconds)
    Write-Host "Day $($video.day): $($topicChapters.Count) topics + $($bonusChapters.Count) bonuses"
}

$payloadJson = ($data | ConvertTo-Json -Depth 20 -Compress)
$js = "window.VIDEO_DATA = $payloadJson;"
[System.IO.File]::WriteAllText($OutputFile, $js, [System.Text.UTF8Encoding]::new($false))
Write-Host "Patched $OutputFile"
