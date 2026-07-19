$g = ((Get-Content "$PSScriptRoot\..\public\data.js" -Raw) -replace '^window\.GRAPH_DATA = ','' -replace ';$','' | ConvertFrom-Json)
$t3 = $g.topics | Where-Object { $_.number -eq 3 } | Select-Object -First 1
Write-Host "Topic 3: $($t3.name)"
Write-Host "Principalities: $($t3.principalities -join ' | ')"
Write-Host "Principality IDs: $($t3.principalityIds -join ', ')"
Write-Host "Multi-principality topics: $($g.stats.multiPrincipalityTopicCount)"
