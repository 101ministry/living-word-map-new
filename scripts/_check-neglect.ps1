$raw = (Get-Content "$PSScriptRoot\..\public\data.js" -Raw) -replace '^window\.GRAPH_DATA\s*=\s*','' -replace ';$',''
$d = $raw | ConvertFrom-Json
Write-Host '=== Neglect fruits ==='
$d.fruits | Where-Object { $_.name -match 'Neglect' } | ForEach-Object {
    Write-Host "$($_.id) | $($_.name) | topicCount=$($_.topicCount)"
}
Write-Host '=== fruit_principality for neglect ==='
$d.edges | Where-Object { $_.type -eq 'fruit_principality' -and $_.source -match 'neglect' } | ForEach-Object {
    Write-Host "$($_.source) -> $($_.target) weight=$($_.weight)"
}
Write-Host '=== Bondage topics with any neglect fruit ==='
foreach ($t in ($d.topics | Where-Object { $_.principalityIds -contains 'bondage' -or $_.principalityId -eq 'bondage' })) {
    $fruitEdges = $d.edges | Where-Object { $_.type -eq 'has_fruit' -and $_.source -eq "topic-$($t.number)" }
    foreach ($e in $fruitEdges) {
        if ($e.target -match 'neglect') {
            Write-Host "#$($t.number) $($t.name) -> $($e.target)"
        }
    }
}
