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

function Normalize-TopicKey([string]$text) {
    if (-not $text) { return '' }
    $t = $text.ToLower()
    $t = $t -replace '[\u201c\u201d\u2018\u2019''"]', ' '
    $t = $t -replace '^(spirit of|familiar identity of|interacting with the spirit of)\s+', ''
    $t = $t -replace '^(being in|being|having|using|going to|reading|playing with|participating in)\s+', ''
    $t = $t -replace '-', ''
    $t = $t -replace '[^a-z0-9]+', ' '
    return ($t.Trim() -replace '\s+', ' ')
}

function Get-TopicKind([string]$text) {
    if (-not $text) { return 'plain' }
    $t = $text.ToLower().Trim()
    if ($t -match '^(spirit of|interacting with the spirit of)\b') { return 'spirit' }
    if ($t -match '^spirit [a-z]' -and $t -notmatch '^spirit of\b') { return 'spirit' }
    if ($t -match '^(being in|being)\b') { return 'being' }
    if ($t -match '^familiar identity of\b') { return 'familiar' }
    return 'plain'
}

function Get-ChartTopics([string]$chartPath) {
    $topics = @()
    Get-Content -LiteralPath $chartPath | ForEach-Object {
        if ($_ -match '^\s*(\d{3})\.\s*(.+?)\s*$') {
            $name = $Matches[2].Trim()
            $topics += [pscustomobject]@{
                number = [int]$Matches[1]
                name   = $name
                norm   = Normalize-TopicKey $name
                kind   = Get-TopicKind $name
            }
        }
    }
    return $topics
}

function Strip-Emoji([string]$text) {
    if (-not $text) { return '' }
    return ($text -replace '[^\x00-\x7F]+', ' ' -replace '\s+', ' ').Trim()
}

function Clean-SpiritTail([string]$phrase) {
    if (-not $phrase) { return '' }
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

function Extract-SpiritPhrase([string]$line) {
    $line = Strip-Emoji $line.Trim()
    if (-not $line -or $line -match '^(because|happening because)' ) { return $null }

    if ($line -match '(?i)^interacting with (?:the )?spirit of (.+)$') {
        return Clean-SpiritTail ("spirit of " + $Matches[1])
    }
    if ($line -match '(?i)^interacting with (?:the )?spirit (.+)$') {
        return Clean-SpiritTail ("spirit of " + $Matches[1])
    }
    if ($line -match '(?i)^interacting with (?:the )?(.+)$') {
        return Clean-SpiritTail $Matches[1]
    }
    if ($line -match '(?i)^spirit of (.+)$') {
        return Clean-SpiritTail ("spirit of " + $Matches[1])
    }
    if ($line -match '(?i)^interacting with (?:the )?(.+?) spirit\b') {
        return Clean-SpiritTail ("spirit of " + $Matches[1])
    }
    if ($line -match '(?i)^interacting with (disembodied .+)$') {
        return Clean-SpiritTail $Matches[1]
    }
    if ($line -match '(?i)^being in (.+)$') {
        return Clean-SpiritTail ("being in " + $Matches[1])
    }
    if ($line -match '(?i)^being (.+)$') {
        return Clean-SpiritTail ("being " + $Matches[1])
    }
    if ($line -match '(?i)^familiar identity of (.+)$') {
        return Clean-SpiritTail ("familiar identity of " + $Matches[1])
    }
    if ($line -match '(?i)^([a-z][^,]+),\s*with the\b') {
        return Clean-SpiritTail $Matches[1]
    }
    if ($line -match '(?i)^([a-z][^,]+),\s*from a root\b') {
        return Clean-SpiritTail $Matches[1]
    }
    if ($line -match '(?i)^([a-z][^,]+)\s+from a root\b') {
        return Clean-SpiritTail $Matches[1]
    }
    return $null
}

function Match-ChartTopic([string]$phrase, $allTopics, [int]$day = 0, $usedNumbers = $null) {
    if (-not $phrase) { return $null }

    $phraseKind = Get-TopicKind $phrase
    $norm = Normalize-TopicKey $phrase
    if (-not $norm) { return $null }

    # Known full-phrase anchors (Spirit Spouse block)
    if ($norm -like '*keeps loving relationships*' -or $norm -like '*keeps people single*') {
        return ($allTopics | Where-Object { $_.number -eq 666 } | Select-Object -First 1)
    }
    if ($norm -like '*fanfiction*' -or $norm -like '*fan fiction*') {
        return ($allTopics | Where-Object { $_.number -eq 665 } | Select-Object -First 1)
    }
    if ($norm -like 'disembodied spirits*unsaved family*') {
        return ($allTopics | Where-Object { $_.number -eq 574 } | Select-Object -First 1)
    }

    $aliasNorm = @{
        'feeling i can t change' = 'thinking i can t change'
    }
    if ($aliasNorm.ContainsKey($norm)) {
        $norm = $aliasNorm[$norm]
    }

    $pool = $allTopics
    if ($day -ge 1 -and $day -le 8) {
        $pool = @($allTopics | Where-Object { $_.number -ge 574 })
    } elseif ($day -ge 9) {
        $pool = @($allTopics | Where-Object { $_.number -le 573 })
    }

    function Select-Unused($candidates) {
        if (-not $candidates -or $candidates.Count -eq 0) { return $null }
        if ($usedNumbers) {
            $unused = @($candidates | Where-Object { -not $usedNumbers.Contains($_.number) } | Sort-Object number)
            if ($unused.Count -gt 0) { return $unused[0] }
        }
        if ($candidates.Count -eq 1) { return $candidates[0] }
        return ($candidates | Sort-Object number | Select-Object -First 1)
    }

    # Exact chart key match (required - never match on shared words alone)
    $exact = @($pool | Where-Object { $_.norm -eq $norm })
    if ($exact.Count -ge 1) {
        $picked = Select-Unused $exact
        if ($picked) { return $picked }
    }

    if ($exact.Count -gt 1 -and $phraseKind -ne 'plain') {
        $kindMatch = @($exact | Where-Object { $_.kind -eq $phraseKind })
        $picked = Select-Unused $kindMatch
        if ($picked) { return $picked }
    }

    # Spirit-of phrase must not match "being in" topics (e.g. witchcraft #130 vs #664)
    if ($phraseKind -eq 'spirit') {
        $spiritMatch = @($pool | Where-Object { ($_.kind -eq 'spirit' -or ($_.kind -eq 'plain' -and $_.name -match '(?i)^spirit ')) -and ($_.norm -eq $norm -or $_.norm -eq "spirit $norm" -or $_.norm -like "*$norm") })
        $picked = Select-Unused $spiritMatch
        if ($picked) { return $picked }
        return $null
    }
    if ($phraseKind -eq 'being') {
        $beingMatch = @($pool | Where-Object { $_.kind -eq 'being' -and ($_.norm -eq $norm -or $_.norm -like "*$norm") })
        $picked = Select-Unused $beingMatch
        if ($picked) { return $picked }
        return $null
    }

    return $null
}

function Parse-Presentation([string]$path, $allTopics) {
    $raw = Get-Content -LiteralPath $path -Raw
    $dayMap = @{}
    $currentDay = $null
    $usedByDay = @{}

    foreach ($line in ($raw -split "`r?`n")) {
        if ($line -match '(?i)^DAY\s+(\d+)\s*$') {
            $currentDay = [int]$Matches[1]
            if (-not $dayMap.ContainsKey($currentDay)) {
                $dayMap[$currentDay] = @()
            }
            if (-not $usedByDay.ContainsKey($currentDay)) {
                $usedByDay[$currentDay] = [System.Collections.Generic.HashSet[int]]::new()
            }
            continue
        }
        if ($null -eq $currentDay) { continue }

        $phrase = Extract-SpiritPhrase $line
        if (-not $phrase) { continue }

        $topic = Match-ChartTopic $phrase $allTopics $currentDay $usedByDay[$currentDay]
        if ($topic) {
            [void]$usedByDay[$currentDay].Add($topic.number)
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
