$src = Get-Content 'public/data.js' -Raw
$data = ($src -replace '^[\s\S]*window\.GRAPH_DATA\s*=\s*','' -replace ';\s*$','') | ConvertFrom-Json
$t = $data.topics | Where-Object { $_.number -eq 577 }
Write-Output "Topic 577: $($t.name)"
Write-Output "  fruit: $($t.fruit)"
Write-Output "  fruits: $($t.fruits -join '; ')"
Write-Output "  principality: $($t.principalities -join '; ')"
$es = @($data.edges | Where-Object { $_.source -eq "topic-$($t.id)" -or $_.target -eq "topic-$($t.id)" })
foreach ($e in $es) { Write-Output "  edge $($e.type): $($e.source) -> $($e.target)" }
