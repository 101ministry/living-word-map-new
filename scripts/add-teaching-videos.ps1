# Suggest next teaching-video entries from YouTube URLs/IDs.
# Does not modify files — prints JSON snippets and schedule hints.
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Urls,
    [string]$ScheduleFile = "$PSScriptRoot\..\data\TEACHING-SCHEDULE.txt",
    [string]$VideosFile = "$PSScriptRoot\..\data\teaching-videos.json"
)

$ErrorActionPreference = 'Stop'

function Get-YouTubeId([string]$input) {
    if ($input -match '(?:v=|youtu\.be/|\/live\/)([A-Za-z0-9_-]{11})') { return $Matches[1] }
    if ($input -match '^[A-Za-z0-9_-]{11}$') { return $input }
    return $null
}

function Read-ScheduleNext([string]$path) {
    $next = @{ day = $null; mode = $null; principalityId = $null; titleSuffix = $null }
    if (-not (Test-Path -LiteralPath $path)) { return $next }
    foreach ($line in (Get-Content -LiteralPath $path)) {
        if ($line -match '^nextDay=(\d+)') { $next.day = [int]$Matches[1] }
        if ($line -match '^nextMode=(\S+)') { $next.mode = $Matches[1] }
        if ($line -match '^nextPrincipalityId=(\S+)') { $next.principalityId = $Matches[1] }
        if ($line -match '^nextTitleSuffix=(.+)$') { $next.titleSuffix = $Matches[1].Trim() }
    }
    return $next
}

$ids = @()
foreach ($u in $Urls) {
    $id = Get-YouTubeId $u
    if ($id) { $ids += $id } else { Write-Warning "Could not parse YouTube ID: $u" }
}
if ($ids.Count -eq 0) {
    Write-Host 'Usage: .\scripts\add-teaching-videos.ps1 <youtube-url-or-id> [...]'
    exit 1
}

$config = Get-Content -LiteralPath $VideosFile -Raw | ConvertFrom-Json
$maxDay = ($config.videos | ForEach-Object { [int]$_.day } | Measure-Object -Maximum).Maximum
$schedule = Read-ScheduleNext $ScheduleFile
$startDay = if ($schedule.day) { $schedule.day } else { $maxDay + 1 }

Write-Host "Last day in teaching-videos.json: $maxDay"
Write-Host "Schedule suggests starting at day: $startDay"
if ($schedule.mode -eq 'full' -and $schedule.principalityId) {
    Write-Host "Expected mode: full principality — $($schedule.principalityId) ($($schedule.titleSuffix))"
} elseif ($schedule.mode -eq 'presentation') {
    Write-Host 'Expected mode: presentation — update TOPICS-666-PRESENTATION.txt'
}

Write-Host ''
Write-Host 'Suggested entries for teaching-videos.json:'
$day = $startDay
foreach ($id in $ids) {
    $part = 1
    $title = "Day $day - Prayer Topics"
    $entry = [ordered]@{
        day       = $day
        part      = $part
        title     = $title
        youtubeId = $id
        url       = "https://www.youtube.com/watch?v=$id"
    }
    if ($schedule.mode -eq 'full' -and $schedule.principalityId -and $ids.Count -eq 1) {
        $entry.title = "Day $day - Prayer Topics ($($schedule.titleSuffix))"
        $entry.principalityId = $schedule.principalityId
    }
    $entry | ConvertTo-Json -Compress | Write-Host
    $day++
    if ($schedule.mode -eq 'full') {
        # Advance through chart order for multi-link batches (caller should verify TEACHING-SCHEDULE)
        Write-Host "# After adding: update TEACHING-SCHEDULE.txt nextDay/nextPrincipalityId"
    }
}
