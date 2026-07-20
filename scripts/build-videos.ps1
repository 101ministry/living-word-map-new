# Builds public/videos.js from data/teaching-videos.json and YouTube auto-captions.
param(
    [string]$VideosFile = "$PSScriptRoot\..\data\teaching-videos.json",
    [string]$ChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt",
    [string]$OutputFile = "$PSScriptRoot\..\public\videos.js",
    [switch]$SkipCaptions
)

$ErrorActionPreference = 'Stop'

function Normalize-TopicText([string]$text) {
    if (-not $text) { return '' }
    return ($text.ToLower() -replace '[^a-z0-9\s]', ' ' -replace '\s+', ' ').Trim()
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

function Get-YouTubeCaptionUrl([string]$videoId) {
    try {
        $page = Invoke-WebRequest -Uri "https://www.youtube.com/watch?v=$videoId" -UseBasicParsing -Headers @{
            'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        $match = [regex]::Match($page.Content, 'ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;')
        if (-not $match.Success) {
            $match = [regex]::Match($page.Content, 'ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*var')
        }
        if ($match.Success) {
            $player = $match.Groups[1].Value | ConvertFrom-Json
            $tracks = $player.captions.playerCaptionsTracklistRenderer.captionTracks
            if ($tracks -and $tracks.Count -gt 0) {
                $en = $tracks | Where-Object { $_.languageCode -like 'en*' } | Select-Object -First 1
                if (-not $en) { $en = $tracks[0] }
                return $en.baseUrl
            }
        }
    } catch {
        Write-Warning "Could not load caption URL for ${videoId}: $($_.Exception.Message)"
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
    } elseif ($xml -match '<p t=') {
        [regex]::Matches($xml, '<p t="(\d+)"[^>]*>(.*?)</p>') | ForEach-Object {
            $raw = [System.Net.WebUtility]::HtmlDecode($_.Groups[2].Value -replace '<[^>]+>', '')
            $segments += [pscustomobject]@{
                start = [double]$_.Groups[1].Value / 1000.0
                text  = $raw
                norm  = Normalize-TopicText $raw
            }
        }
    }
    return $segments
}

function Find-TopicTimestamps($segments, $topics, [int[]]$candidateNumbers) {
    $found = @{}
    $patterns = @(
        @{ re = 'guilty of {0}'; weight = 3 },
        @{ re = 'serve {0}'; weight = 2 },
        @{ re = '{0} is happening'; weight = 2 },
        @{ re = '{0}'; weight = 1 }
    )

    foreach ($num in $candidateNumbers) {
        $topic = $topics | Where-Object { $_.number -eq $num } | Select-Object -First 1
        if (-not $topic) { continue }
        $normTopic = $topic.norm
        if (-not $normTopic) { continue }

        $bestStart = $null
        $bestWeight = 0
        foreach ($seg in $segments) {
            if (-not $seg.norm) { continue }
            foreach ($pat in $patterns) {
                $needle = ($pat.re -f $normTopic)
                if ($seg.norm -like "*$needle*") {
                    if ($pat.weight -gt $bestWeight -or ($pat.weight -eq $bestWeight -and ($null -eq $bestStart -or $seg.start -lt $bestStart))) {
                        $bestWeight = $pat.weight
                        $bestStart = [int][Math]::Floor($seg.start)
                    }
                }
            }
        }
        if ($null -ne $bestStart) {
            $found[$num] = $bestStart
        }
    }
    return $found
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

$videosOut = @()
$topicIndex = @{}
$nextTopic = 1
$maxTopic = $topics.Count

foreach ($video in $config.videos) {
    Write-Host "Processing Day $($video.day)$(if ($video.part -gt 1) { " part $($video.part)" }) ($($video.youtubeId))..."

    $chapters = @()
    $segments = @()

    if (-not $SkipCaptions) {
        $captionUrl = Get-YouTubeCaptionUrl $video.youtubeId
        if ($captionUrl) {
            try {
                $xml = (Invoke-WebRequest -Uri $captionUrl -UseBasicParsing).Content
                $segments = Parse-CaptionSegments $xml
                Write-Host "  Captions: $($segments.Count) segments"
            } catch {
                Write-Warning "  Caption fetch failed: $($_.Exception.Message)"
            }
        } else {
            Write-Warning "  No captions found"
        }
    }

    # Scan forward from next expected topic (up to 25 topics per video).
    $candidateNumbers = @()
    for ($n = $nextTopic; $n -lt [Math]::Min($nextTopic + 25, $maxTopic + 1); $n++) {
        $candidateNumbers += $n
    }

    $timestamps = @{}
    if ($segments.Count -gt 0) {
        $timestamps = Find-TopicTimestamps $segments $topics $candidateNumbers
    }

    $matched = @($timestamps.Keys | Sort-Object)
    if ($matched.Count -gt 0) {
        foreach ($num in $matched) {
            $chapters += [pscustomobject]@{
                topicNumber  = $num
                topicName    = $topicByNumber[$num]
                startSeconds = $timestamps[$num]
            }
            $topicIndex["$num"] = [pscustomobject]@{
                youtubeId    = $video.youtubeId
                day          = $video.day
                part         = $video.part
                startSeconds = $timestamps[$num]
                videoKey     = "day-$($video.day)-part-$($video.part)"
            }
        }
        $nextTopic = ($matched[-1] + 1)
    } else {
        Write-Warning "  No topic timestamps matched - video registered without chapters"
    }

    $videosOut += [pscustomobject]@{
        key          = "day-$($video.day)-part-$($video.part)"
        day          = [int]$video.day
        part         = [int]$video.part
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
Write-Host "Wrote $OutputFile - $($videosOut.Count) videos, $chapterTotal topic timestamps"
