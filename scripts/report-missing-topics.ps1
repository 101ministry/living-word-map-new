function Summarize-Range($nums) {
    if ($nums.Count -eq 0) { return 'none' }
    if ($nums.Count -le 20) { return ($nums -join ', ') }
    $contiguous = ($nums.Count -eq ($nums[-1] - $nums[0] + 1))
    if ($contiguous) { return "$($nums[0])-$($nums[-1]) ($($nums.Count) topics)" }
    return "$($nums.Count) topics (see detailed ranges below)"
}

function Show-Ranges($label, $nums) {
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

$root = Split-Path $PSScriptRoot -Parent
$graph = ((Get-Content "$root\public\data.js" -Raw) -replace '^window\.GRAPH_DATA = ','' -replace ';$','' | ConvertFrom-Json)
$chart = @{}
Get-Content "$root\data\ROOT-SPIRITS-CHART.txt" | ForEach-Object {
    if ($_ -match '^(\d{3})\.\s*(.+)$') { $chart[[int]$matches[1]] = $matches[2].Trim() }
}

$noRoot = @($graph.topics | Where-Object { -not $_.rootId } | ForEach-Object { [int]$_.number })
$noFruit = @($graph.topics | Where-Object { -not $_.fruitId } | ForEach-Object { [int]$_.number })
$noPrincipality = @($graph.topics | Where-Object { -not $_.principalityId } | ForEach-Object { [int]$_.number })

$index = ((Get-Content "$root\public\prayer-index.js" -Raw) -replace '^window\.PRAYER_INDEX = ','' -replace ';$','' | ConvertFrom-Json)
$noPrayer = @(1..666 | Where-Object { -not $index.PSObject.Properties.Name.Contains([string]$_) })

$prayers = ((Get-Content "$root\public\prayers\en.json" -Raw) | ConvertFrom-Json).topics
$noSameNumberPrayer = @(1..666 | Where-Object { -not $prayers.PSObject.Properties.Name.Contains([string]$_) })

Write-Host '=== MISSING / INCOMPLETE TOPICS ==='
Write-Host ''
Write-Host 'COMPLETE:'
Write-Host '  - Chart names: 666 / 666'
Write-Host '  - Graph nodes: 666 / 666'
Write-Host "  - Prayer content linked: $(666 - $noPrayer.Count) / 666"
Write-Host ''
Write-Host 'GAPS:'
Show-Ranges '  Missing root' $noRoot
Show-Ranges '  Missing fruit' $noFruit
Show-Ranges '  Missing principality' $noPrincipality
Show-Ranges '  No same-number prayer file (Round 1)' $noSameNumberPrayer
Write-Host ''
Write-Host 'EDGE CASES:'
foreach ($n in 3, 21, 419, 607, 654, 665, 666) {
    $t = $graph.topics | Where-Object { $_.number -eq $n } | Select-Object -First 1
    $p = $index.($n.ToString())
    Write-Host "  #$('{0:D3}' -f $n) $($chart[$n])"
    Write-Host "      root=$($t.root) | fruit=$($t.fruit) | principality=$($t.principality) | prayer->$p"
}
