$ErrorActionPreference = 'Stop'
$raw = Get-Content 'C:\Users\tweed\living-word-map\public\data.js' -Raw
$json = $raw -replace '^window\.GRAPH_DATA\s*=\s*','' -replace ';\s*$',''
$d = $json | ConvertFrom-Json

Write-Host 'Principalities matching Destructive Attitudes:'
$d.principalities | Where-Object { $_.name -like 'Destructive Attitudes*' } | ForEach-Object {
    Write-Host "  $($_.id) | $($_.name) | topics=$($_.topicCount)"
}

Write-Host ''
Write-Host 'Fruits matching Destructive Attitudes:'
$d.fruits | Where-Object { $_.name -like '*Destructive Attitudes*' } | ForEach-Object {
    Write-Host "  $($_.id) | $($_.name) | topics=$($_.topicIds.Count)"
}
if (-not ($d.fruits | Where-Object { $_.name -like '*Destructive Attitudes*' })) {
    Write-Host '  (none — OK)'
}

$principalityId = 'destructive-attitudes-against-god-s-image'
$linked = @($d.topics | Where-Object { $_.principalityIds -contains $principalityId })
Write-Host ''
Write-Host "All fruit ids ($($d.fruits.Count)):"
$d.fruits | ForEach-Object { Write-Host "  $($_.id) | $($_.topicCount) topics" }
