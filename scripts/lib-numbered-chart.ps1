# Parses data/ROOT-SPIRITS-CHART-NUMBERED.txt into principality sections (canonical sidebar order).
# Master file is read-only — do not edit ROOT-SPIRITS-CHART-NUMBERED.txt in the repo.

function Read-NumberedChart {
    param(
        [string]$Path,
        [scriptblock]$ResolvePrincipality,
        [scriptblock]$Slugify
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Numbered chart not found: $Path"
    }

    $Utf8 = [System.Text.UTF8Encoding]::new($false)
    $raw = [System.IO.File]::ReadAllText($Path, $Utf8)

    $chartNames = @{}
    $sections = [System.Collections.Generic.List[object]]::new()
    $topicToSection = @{}
    $topicToPrincipality = @{}

    $currentName = $null
    $currentTopics = [System.Collections.Generic.List[int]]::new()

    function Flush-ChartSection {
        if (-not $currentName -or $currentTopics.Count -eq 0) { return }
        $sorted = @($currentTopics | Sort-Object)
        $slug = & $Slugify $currentName
        $items = @($sorted | ForEach-Object {
            $n = $_
            @{
                number = $n
                label = if ($chartNames.ContainsKey($n)) { $chartNames[$n] } else { "Topic $n" }
            }
        })
        [void]$sections.Add(@{
            id = $slug
            name = $currentName
            topics = $items
            firstTopic = $sorted[0]
        })
        foreach ($n in $sorted) {
            $topicToSection[$n] = $slug
            $topicToPrincipality[$n] = $currentName
        }
    }

    foreach ($line in ($raw -split '\r?\n')) {
        if ($line -match '^\[(.+)\]\s*(\d+)\.?\s*$') {
            Flush-ChartSection
            $header = $Matches[1].Trim()
            $header = ($header -replace '^(?i)PRINCIPALITY OF\s+', '').Trim()
            $currentName = & $ResolvePrincipality $header
            $currentTopics = [System.Collections.Generic.List[int]]::new()
            continue
        }
        if ($line -match '^(\d{3})\.\s*(.+)$') {
            $n = [int]$Matches[1]
            $chartNames[$n] = $Matches[2].Trim()
            if ($currentName) {
                [void]$currentTopics.Add($n)
            }
        }
    }
    Flush-ChartSection

    $orphan = @()
    for ($n = 1; $n -le 666; $n++) {
        if (-not $topicToSection.ContainsKey($n)) { $orphan += $n }
    }
    if ($orphan.Count -gt 0) {
        [void]$sections.Add(@{
            id = 'other-topics'
            name = 'Other Topics'
            topics = @($orphan | Sort-Object | ForEach-Object {
                @{ number = $_; label = if ($chartNames.ContainsKey($_)) { $chartNames[$_] } else { "Topic $_" } }
            })
            firstTopic = ($orphan | Sort-Object)[0]
        })
        foreach ($n in $orphan) {
            $topicToSection[$n] = 'other-topics'
            $topicToPrincipality[$n] = 'Other Topics'
        }
    }

    return @{
        chartNames = $chartNames
        sections = @($sections)
        topicToSection = $topicToSection
        topicToPrincipality = $topicToPrincipality
    }
}
