# Builds public/videos.js from teaching-videos.json, chart, and TOPICS-666-PRESENTATION.txt
param(
    [string]$VideosFile = "$PSScriptRoot\..\data\teaching-videos.json",
    [string]$ChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt",
    [string]$PresentationFile = "$PSScriptRoot\..\data\TOPICS-666-PRESENTATION.txt",
    [string]$OutputFile = "$PSScriptRoot\..\public\videos.js",
    [switch]$SkipCaptions
)

$ErrorActionPreference = 'Stop'

function Normalize-TopicText([string]$text) {
    if (-not $text) { return '' }
    $t = $text.ToLower()
    $t = $t -replace '[\u201c\u201d\u2018\u2019''"]', ' '
    $t = $t -replace '[^a-z0-9\s]', ' '
    $t = $t -replace '\s+', ' '
    return $t.Trim()
}

function Get-ChartTopics([string]$chartPath) {
    $topics = @()
    Get-Content -LiteralPath $chartPath | ForEach-Object {
        if ($_ -match '^\s*(\d{3})\.\s*(.+?)\s*$') {
            $topics += [pscustomobject]@{
                number = [int]$Matches[1]
                name   = $Matches[2].Trim()
                norm   = Normalize-TopicText $Matches[2]
            }
        }
    }
    return $topics
}

function Strip-Emoji([string]$text) {
    if (-not $text) { return '' }
    return ($text -replace '[^\x00-\x7F]+', ' ' -replace '\s+', ' ').Trim()
}

function Extract-SpiritPhrase([string]$line) {
    $line = Strip-Emoji $line.Trim()
    if (-not $line -or $line -match '^(because|happening because)' ) { return $null }

    if ($line -match '(?i)^interacting with (?:the )?(?:spirit of |spirit )?(.+)$') {
        $phrase = $Matches[1]
        $phrase = ($phrase -split ', from a')[0]
        $phrase = ($phrase -split ' from a ')[0]
        $phrase = ($phrase -split ', with the')[0]
        $phrase = ($phrase -split ' with the root')[0]
        $phrase = ($phrase -split ' with .*root')[0]
        $phrase = ($phrase -split ' and its')[0]
        $phrase = ($phrase -split ';')[0]
        $phrase = ($phrase -split ' is happening')[0]
        return $phrase.Trim()
    }
    if ($line -match '(?i)^spirit of (.+)$') {
        $phrase = $Matches[1]
        $phrase = ($phrase -split ' with the root')[0]
        $phrase = ($phrase -split ' with .*root')[0]
        $phrase = ($phrase -split ';')[0]
        $phrase = ($phrase -split ' is happening')[0]
        return $phrase.Trim()
    }
    if ($line -match '(?i)^interacting with (?:the )?(.+?) spirit\b') {
        return $Matches[1].Trim()
    }
    if ($line -match '(?i)^interacting with (disembodied .+)$') {
        $phrase = ($Matches[1] -split ', with the')[0]
        return $phrase.Trim()
    }
    if ($line -match '(?i)^([a-z][^,]+),\s*with the\b') {
        return $Matches[1].Trim()
    }
    if ($line -match '(?i)^([a-z][^,]+),\s*from a root\b') {
        return $Matches[1].Trim()
    }
    if ($line -match '(?i)^([a-z][^,]+)\s+from a root\b') {
        return $Matches[1].Trim()
    }
    return $null
}

function Match-ChartTopic([string]$phrase, $allTopics, [int]$day = 0) {
    if (-not $phrase) { return $null }
    $norm = Normalize-TopicText $phrase
    if (-not $norm) { return $null }

    if ($norm -like '*keeps loving relationships*' -or $norm -like '*keeps people single*') {
        return ($allTopics | Where-Object { $_.number -eq 666 } | Select-Object -First 1)
    }
    if ($norm -like '*fan fiction*' -or $norm -like '*fan fiction*') {
        return ($allTopics | Where-Object { $_.number -eq 665 } | Select-Object -First 1)
    }

    $candidates = @()
    foreach ($t in $allTopics) {
        $score = 0
        if ($t.norm -eq $norm) { $score += 200 }
        elseif ($t.norm -like "*$norm*") { $score += 80 + $norm.Length }
        elseif ($norm -like "*$($t.norm)*" -and $t.norm.Length -gt 4) { $score += 60 + $t.norm.Length }

        $words = @($norm -split '\s+' | Where-Object { $_.Length -gt 2 })
        foreach ($w in $words) {
            if ($t.norm -like "*$w*") { $score += 8 }
        }

        if ($t.norm -like 'spirit of*' -or $t.norm -like 'spirit of *') { $score += 25 }
        if ($day -ge 1 -and $day -le 8 -and $t.number -ge 574) { $score += 40 }
        if ($day -ge 9 -and $t.number -le 250) { $score += 25 }

        if ($score -gt 0) {
            $candidates += [pscustomobject]@{ topic = $t; score = $score }
        }
    }

    if ($candidates.Count -eq 0) { return $null }
    return ($candidates | Sort-Object { -$_.score }, { $_.topic.number } | Select-Object -First 1).topic
}

function Parse-Presentation([string]$path, $allTopics) {
    $raw = Get-Content -LiteralPath $path -Raw
    $dayMap = @{}
    $currentDay = $null

    foreach ($line in ($raw -split "`r?`n")) {
        if ($line -match '(?i)^DAY\s+(\d+)\s*$') {
            $currentDay = [int]$Matches[1]
            if (-not $dayMap.ContainsKey($currentDay)) {
                $dayMap[$currentDay] = @()
            }
            continue
        }
        if ($null -eq $currentDay) { continue }

        $phrase = Extract-SpiritPhrase $line
        if (-not $phrase) { continue }

        $topic = Match-ChartTopic $phrase $allTopics $currentDay
        if ($topic) {
            $dayMap[$currentDay] += [pscustomobject]@{
                phrase = $phrase
                number = $topic.number
                name   = $topic.name
            }
        } else {
            Write-Warning "Day $currentDay`: could not match topic phrase: $phrase"
        }
    }
    return $dayMap
}

function Get-YouTubePlayerInfo([string]$videoId) {
    try {
        $page = Invoke-WebRequest -Uri "https://www.youtube.com/watch?v=$videoId" -UseBasicParsing -Headers @{
            'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        $match = [regex]::Match($page.Content, 'ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;')
        if (-not $match.Success) {
            $match = [regex]::Match($page.Content, 'ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*var')
        }
        if ($match.Success) {
            return $match.Groups[1].Value | ConvertFrom-Json
        }
    } catch {
        Write-Warning "Could not load player info for ${videoId}: $($_.Exception.Message)"
    }
    return $null
}

function Parse-CaptionSegments([string]$xml) {
    $segments = @()
    if ($xml -match '<transcript') {
        [regex]::Matches($xml, '<text start="([0-9.]+)"[^>]*>([^<]*)</text>') | ForEach-Object {
            $raw = [System.Net.WebUtility]::HtmlDecode($_.Groups[2].Value)
            $segments += [pscustomobject]@{
                start = [double]$_.Groups[1].Value
                text  = $raw
                norm  = Normalize-TopicText $raw
            }
        }
    }
    return $segments
}

function Find-CaptionTimestamp($segments, $topicNorm) {
    if (-not $segments -or -not $topicNorm) { return $null }
    $patterns = @(
        "guilty of $topicNorm",
        "serve $topicNorm",
        "$topicNorm is happening",
        $topicNorm
    )
    foreach ($pat in $patterns) {
        foreach ($seg in $segments) {
            if ($seg.norm -like "*$pat*") {
                return [int][Math]::Floor($seg.start)
            }
        }
    }
    return $null
}

function Estimate-Timestamp([int]$index, [int]$count, [int]$durationSeconds) {
    if ($count -le 0) { return 0 }
    return [int][Math]::Floor($durationSeconds * $index / $count)
}

function Write-Js([object]$payload, [string]$path) {
    $json = $payload | ConvertTo-Json -Depth 20 -Compress
    $js = "window.VIDEO_DATA = $json;"
    [System.IO.File]::WriteAllText($path, $js, [System.Text.UTF8Encoding]::new($false))
}

$config = Get-Content -LiteralPath $VideosFile -Raw | ConvertFrom-Json
$topics = Get-ChartTopics $ChartFile
$topicByNumber = @{}
foreach ($t in $topics) { $topicByNumber[$t.number] = $t.name }

$dayTopics = Parse-Presentation $PresentationFile $topics

$videosByDay = @{}
foreach ($video in $config.videos) {
    $d = [string]$video.day
    if (-not $videosByDay.ContainsKey($d)) { $videosByDay[$d] = @() }
    $videosByDay[$d] += $video
}
foreach ($key in @($videosByDay.Keys)) {
    $videosByDay[$key] = @($videosByDay[$key] | Sort-Object { [int]$_.part })
}

$videosOut = @()
$topicIndex = @{}

foreach ($video in ($config.videos | Sort-Object { [int]$_.day }, { [int]$_.part })) {
    $day = [int]$video.day
    $part = [int]$video.part
    Write-Host "Processing Day $day$(if ($part -gt 1) { " part $part" }) ($($video.youtubeId))..."

    $allDayTopics = @($dayTopics[$day])
    $dayVideoList = $videosByDay["$day"]
    $partIndex = [array]::IndexOf($dayVideoList, $video)
    $partCount = $dayVideoList.Count
    $chunkSize = if ($allDayTopics.Count -gt 0 -and $partCount -gt 0) {
        [int][Math]::Ceiling($allDayTopics.Count / $partCount)
    } else { 0 }
    $startIdx = $partIndex * $chunkSize
    $slice = @()
    if ($chunkSize -gt 0 -and $startIdx -lt $allDayTopics.Count) {
        $endIdx = [Math]::Min($startIdx + $chunkSize - 1, $allDayTopics.Count - 1)
        $slice = $allDayTopics[$startIdx..$endIdx]
    }

    Write-Host "  Topics: $($slice.Count) mapped from presentation"

    $duration = 3600
    $segments = @()
    $player = Get-YouTubePlayerInfo $video.youtubeId
    if ($player -and $player.videoDetails -and $player.videoDetails.lengthSeconds) {
        $duration = [int]$player.videoDetails.lengthSeconds
    }
    if (-not $SkipCaptions -and $player -and $player.captions -and $player.captions.playerCaptionsTracklistRenderer) {
        $tracks = $player.captions.playerCaptionsTracklistRenderer.captionTracks
        if ($tracks -and $tracks.Count -gt 0) {
            $captionUrl = ($tracks | Where-Object { $_.languageCode -like 'en*' } | Select-Object -First 1).baseUrl
            if (-not $captionUrl) { $captionUrl = $tracks[0].baseUrl }
            try {
                $xml = (Invoke-WebRequest -Uri $captionUrl -UseBasicParsing -Headers @{
                    'Referer' = "https://www.youtube.com/watch?v=$($video.youtubeId)"
                }).Content
                if ($xml) { $segments = Parse-CaptionSegments $xml }
                Write-Host "  Captions: $($segments.Count) segments, duration ${duration}s"
            } catch {
                Write-Warning "  Caption fetch failed: $($_.Exception.Message)"
            }
        }
    } else {
        Write-Host "  Duration estimate: ${duration}s (proportional timestamps)"
    }

    $chapters = @()
    for ($i = 0; $i -lt $slice.Count; $i++) {
        $entry = $slice[$i]
        $topicNorm = Normalize-TopicText $entry.name
        $startSeconds = Find-CaptionTimestamp $segments $topicNorm
        if ($null -eq $startSeconds) {
            $startSeconds = Estimate-Timestamp $i $slice.Count $duration
        }

        $chapters += [pscustomobject]@{
            topicNumber  = $entry.number
            topicName    = $entry.name
            startSeconds = $startSeconds
        }
        $topicIndex["$($entry.number)"] = [pscustomobject]@{
            youtubeId    = $video.youtubeId
            day          = $day
            part         = $part
            startSeconds = $startSeconds
            videoKey     = "day-$day-part-$part"
        }
    }

    $videosOut += [pscustomobject]@{
        key          = "day-$day-part-$part"
        day          = $day
        part         = $part
        title        = [string]$video.title
        youtubeId    = [string]$video.youtubeId
        url          = [string]$video.url
        topicStart   = if ($chapters.Count) { $chapters[0].topicNumber } else { $null }
        topicEnd     = if ($chapters.Count) { $chapters[-1].topicNumber } else { $null }
        chapters     = $chapters
    }
}

$payload = [pscustomobject]@{
    series     = $config.series
    platform   = $config.platform
    builtAt    = (Get-Date).ToUniversalTime().ToString('o')
    videos     = $videosOut
    topicIndex = $topicIndex
}

Write-Js $payload $OutputFile
$chapterTotal = ($videosOut | ForEach-Object { $_.chapters.Count } | Measure-Object -Sum).Sum
Write-Host "Wrote $OutputFile - $($videosOut.Count) videos, $chapterTotal topic chapters"
