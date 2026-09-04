$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$raw = Get-Content "$repo\public\data.js" -Raw
$json = $raw -replace '^window\.GRAPH_DATA\s*=\s*', '' -replace ';\s*$', ''
$data = $json | ConvertFrom-Json

$daagP = 'destructive-attitudes-against-god'
$daagTopics = @($data.topics | Where-Object { $_.principalityIds -contains $daagP })
$multi = @($daagTopics | Where-Object { $_.principalityIds.Count -gt 1 })

Write-Host "DAAG topics: $($daagTopics.Count)"
Write-Host "Multi-principality: $($multi.Count)"
Write-Host ""
Write-Host "Sample multi-principality DAAG topics:"
$multi | Select-Object -First 12 | ForEach-Object {
    $others = @($_.principalities | Where-Object { $_ -ne 'Destructive Attitudes Against God' })
    Write-Host "  #$($_.number) $($_.name)"
    Write-Host "    also: $($others -join ', ')"
}

# Jealousy highlight pollution: roots shared between jealousy and DAAG
$jTopics = @($data.topics | Where-Object { $_.principalityIds -contains 'jealousy' })
$jRoots = @($jTopics | ForEach-Object { $_.rootIds } | Select-Object -Unique)
$daagRoots = @($daagTopics | ForEach-Object { $_.rootIds } | Select-Object -Unique)
$sharedRoots = @($jRoots | Where-Object { $daagRoots -contains $_ })
Write-Host ""
Write-Host "Shared roots between Jealousy and DAAG: $($sharedRoots.Count)"
foreach ($rid in $sharedRoots | Select-Object -First 8) {
    $r = $data.roots | Where-Object id -eq $rid
    Write-Host "  $($r.name)"
}

$jFruits = @($jTopics | ForEach-Object { $_.fruitIds } | Select-Object -Unique)
$daagFruits = @($daagTopics | ForEach-Object { $_.fruitIds } | Select-Object -Unique)
$sharedFruits = @($jFruits | Where-Object { $daagFruits -contains $_ })
Write-Host "Shared fruits between Jealousy and DAAG: $($sharedFruits.Count)"
foreach ($fid in $sharedFruits | Select-Object -First 8) {
    $f = $data.fruits | Where-Object id -eq $fid
    Write-Host "  $($f.name)"
}

# DAAG fruit nodes
Write-Host ""
Write-Host "Fruits matching Destructive Attitudes:"
$data.fruits | Where-Object { $_.name -like '*Destructive Attitudes*' } | ForEach-Object {
    Write-Host "  $($_.id) | $($_.name) | topics=$($_.topicIds.Count)"
}
