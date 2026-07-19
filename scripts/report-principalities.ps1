# Principality & master-list coverage report for Living Word Map.
# Roots/Fruits come from topics 666.txt — this report does not replace that taxonomy.
param(
    [switch]$Detail,
    [string]$DataFile = "$PSScriptRoot\..\public\data.js",
    [string]$MembershipFile = $(if (Test-Path "$PSScriptRoot\..\data\PRINCIPALITY-MEMBERSHIPS.txt") {
        (Resolve-Path "$PSScriptRoot\..\data\PRINCIPALITY-MEMBERSHIPS.txt").Path
    } else {
        $null
    })
)

function Read-GraphData([string]$path) {
    $raw = Get-Content $path -Raw -Encoding UTF8
    $json = $raw -replace '^window\.GRAPH_DATA = ', '' -replace ';\s*$', ''
    return $json | ConvertFrom-Json
}

function Show-Ranges([string]$label, [int[]]$nums) {
    Write-Host "$label ($($nums.Count)):"
    if ($nums.Count -eq 0) {
        Write-Host '  none'
        return
    }
    if ($nums.Count -le 25) {
        Write-Host "  $($nums -join ', ')"
        return
    }
    $ranges = @()
    $start = $nums[0]
    $prev = $nums[0]
    for ($i = 1; $i -lt $nums.Count; $i++) {
        if ($nums[$i] -ne ($prev + 1)) {
            if ($start -eq $prev) { $ranges += "$start" } else { $ranges += "$start-$prev" }
            $start = $nums[$i]
        }
        $prev = $nums[$i]
    }
    if ($start -eq $prev) { $ranges += "$start" } else { $ranges += "$start-$prev" }
    Write-Host "  $($ranges -join ', ')"
}

function Count-MembershipLabels([string]$path) {
    if (-not $path -or -not (Test-Path -LiteralPath $path)) { return $null }
    $count = 0
    $sections = 0
    foreach ($line in (Get-Content -LiteralPath $path -Encoding UTF8)) {
        if ($line -match '^\[(.+)\]\s*$') {
            $sections++
            continue
        }
        if ($line -match '^(ROOT SPIRITS CHART|JACKIE|MITCH|KIMBERLY|ASHTON)') { continue }
        $trimmed = $line.Trim()
        if (-not $trimmed) { continue }
        if ($trimmed -match '^\[') { continue }
        if ($trimmed -match '\t') {
            $count += @($trimmed -split "`t" | Where-Object { $_.Trim() }).Count
        } else {
            $parts = @($trimmed -split '\s{2,}' | Where-Object { $_.Trim() })
            if ($parts.Count -le 1) {
                $parts = @($trimmed -split '\s{4,}' | Where-Object { $_.Trim() })
            }
            $count += $parts.Count
        }
    }
    return @{ labels = $count; sections = $sections }
}

$graph = Read-GraphData (Resolve-Path $DataFile).Path
$topics = @($graph.topics)
$principalities = @($graph.principalities | Sort-Object name)

$noRoot = @($topics | Where-Object { -not $_.rootId } | ForEach-Object { [int]$_.number } | Sort-Object)
$noFruit = @($topics | Where-Object { -not $_.fruitId } | ForEach-Object { [int]$_.number } | Sort-Object)
$noPrincipality = @($topics | Where-Object { -not $_.principalityId } | ForEach-Object { [int]$_.number } | Sort-Object)
$multi = @($topics | Where-Object { @($_.principalityIds).Count -gt 1 })
$multiNums = @($multi | ForEach-Object { [int]$_.number } | Sort-Object)

$membershipInfo = Count-MembershipLabels $MembershipFile
$manifestationTotal = ($principalities | ForEach-Object { @($_.manifestations).Count } | Measure-Object -Sum).Sum

Write-Host '=== PRINCIPALITY & MASTER LIST REPORT ==='
Write-Host ''
Write-Host 'Note: Roots and Fruits define the primary topic taxonomy (topics 666.txt).'
Write-Host '      The master list adds principality memberships and manifestations only.'
Write-Host ''
Write-Host 'GRAPH SUMMARY'
Write-Host "  Topics:                 $($graph.stats.topicCount)"
Write-Host "  Principalities:         $($graph.stats.principalityCount)"
Write-Host "  Roots:                  $($graph.stats.rootCount)"
Write-Host "  Fruits:                 $($graph.stats.fruitCount)"
Write-Host "  Multi-principality:     $($graph.stats.multiPrincipalityTopicCount) topics"
Write-Host "  Manifestations stored:  $manifestationTotal (from master list, in data.js)"
if ($membershipInfo) {
    Write-Host "  Master list file:       $MembershipFile"
    Write-Host "  Master list sections:   $($membershipInfo.sections)"
    Write-Host "  Master list labels:     $($membershipInfo.labels)"
}
Write-Host ''
Write-Host 'TAXONOMY GAPS (roots/fruits/principality on topics)'
Show-Ranges '  Missing root' $noRoot
Show-Ranges '  Missing fruit' $noFruit
Show-Ranges '  Missing principality' $noPrincipality
Write-Host ''
Write-Host ('{0,-52} {1,6} {2,6} {3,6} {4,6} {5,6}' -f 'Principality', 'Topics', 'Manif.', 'Themes', 'Quotes', 'Lore')
Write-Host ('{0,-52} {1,6} {2,6} {3,6} {4,6} {5,6}' -f ('-' * 52), ('-' * 6), ('-' * 6), ('-' * 6), ('-' * 6), ('-' * 6))

foreach ($p in ($principalities | Sort-Object { $_.topicCount } -Descending)) {
    $themeCount = @($p.themes).Count
    $manifCount = @($p.manifestations).Count
    $quoteCount = @($p.quotes).Count
    $lore = if ($themeCount -gt 0 -or $quoteCount -gt 0) { 'yes' } else { '-' }
    Write-Host ('{0,-52} {1,6} {2,6} {3,6} {4,6} {5,6}' -f $p.name, $p.topicCount, $manifCount, $themeCount, $quoteCount, $lore)
}

$low = @($principalities | Where-Object { $_.topicCount -lt 10 } | Sort-Object topicCount, name)
if ($low.Count -gt 0) {
    Write-Host ''
    Write-Host "LOW TOPIC COUNT (<10): $($low.Count) principalities"
    $low | ForEach-Object { Write-Host ("  {0,-48} {1,4} topics" -f $_.name, $_.topicCount) }
}

if ($Detail) {
    Write-Host ''
    Write-Host 'MULTI-PRINCIPALITY TOPICS (detail)'
    foreach ($t in ($multi | Sort-Object number)) {
        $plist = @($t.principalities) -join ' · '
        Write-Host ("  #{0:D3} {1}" -f [int]$t.number, $t.name)
        Write-Host "      primary: $($t.principality) | all: $plist"
        Write-Host "      root: $($t.root) | fruit: $($t.fruit)"
    }
} else {
    Write-Host ''
    Write-Host 'Tip: re-run with -Detail to list every multi-principality topic.'
}

Write-Host ''
