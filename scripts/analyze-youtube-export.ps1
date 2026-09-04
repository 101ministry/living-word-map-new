param(
    [string]$TableCsv = "$env:USERPROFILE\Downloads\Documents\redemption\yt-export-temp\Table data.csv",
    [string]$TeachingJson = "$PSScriptRoot\..\data\teaching-videos.json"
)

function Parse-Duration([string]$s) {
    if (-not $s -or $s -eq '') { return 0 }
    $parts = $s -split ':'
    if ($parts.Count -eq 3) { return [int]$parts[0] * 3600 + [int]$parts[1] * 60 + [int]$parts[2] }
    if ($parts.Count -eq 2) { return [int]$parts[0] * 60 + [int]$parts[1] }
    return 0
}

$teaching = Get-Content -LiteralPath $TeachingJson -Raw | ConvertFrom-Json
$ids = @($teaching.videos | ForEach-Object { $_.youtubeId })

$rows = Import-Csv -LiteralPath $TableCsv
$matched = @()
foreach ($row in $rows) {
    $id = $row.Content.Trim()
    if ($id -eq 'Total') { continue }
    if ($ids -contains $id) {
        $tv = $teaching.videos | Where-Object { $_.youtubeId -eq $id } | Select-Object -First 1
        $avgSec = Parse-Duration $row.'Average view duration'
        $durSec = [int]$row.Duration
        $pct = if ($durSec -gt 0) { [math]::Round(100 * $avgSec / $durSec, 1) } else { 0 }
        $matched += [pscustomobject]@{
            Day = $tv.day
            Part = $tv.part
            YouTubeId = $id
            Title = $row.'Video title'
            Views = [int]$row.Views
            WatchHours = [double]$row.'Watch time (hours)'
            AvgViewDuration = $row.'Average view duration'
            AvgViewSec = $avgSec
            VideoDurationSec = $durSec
            RetentionPct = $pct
            Subscribers = [int]$row.Subscribers
            Impressions = [int]$row.Impressions
            CTR = [double]$row.'Impressions click-through rate (%)'
        }
    }
}

Write-Host "=== R&R 2026 / Prayer Topics (matched to teaching-videos.json) ===" -ForegroundColor Cyan
Write-Host "Matched: $($matched.Count) of $($ids.Count) playlist IDs in export`n"

$byDay = $matched | Sort-Object Day, Part
$byDay | Format-Table Day, Part, Views, AvgViewDuration, RetentionPct, WatchHours, Subscribers, CTR, YouTubeId -AutoSize

Write-Host "`n=== Top by average view duration (engagement proxy) ===" -ForegroundColor Yellow
$matched | Sort-Object AvgViewSec -Descending | Select-Object -First 10 Day, Part, Title, Views, AvgViewDuration, RetentionPct, YouTubeId | Format-Table -AutoSize

Write-Host "`n=== Top by watch time (hours) ===" -ForegroundColor Yellow
$matched | Sort-Object WatchHours -Descending | Select-Object -First 10 Day, Part, Title, Views, WatchHours, AvgViewDuration, YouTubeId | Format-Table -AutoSize

Write-Host "`n=== Missing from export ===" -ForegroundColor DarkYellow
foreach ($v in ($teaching.videos | Sort-Object day, part)) {
    if (-not ($matched.YouTubeId -contains $v.youtubeId)) {
        Write-Host "  Day $($v.day) part $($v.part): $($v.youtubeId)"
    }
}

$outPath = "$PSScriptRoot\..\data\youtube-analytics-rr2026.csv"
$byDay | Export-Csv -LiteralPath $outPath -NoTypeInformation -Encoding UTF8
Write-Host "`nWrote $outPath"
