$raw = Get-Content 'C:\Users\tweed\living-word-map\public\data.js' -Raw
$json = $raw -replace '^window\.GRAPH_DATA\s*=\s*','' -replace ';\s*$',''
$d = $json | ConvertFrom-Json
$d.principalities | Where-Object { $_.name -like 'Destructive*' } | ForEach-Object { "$($_.id) | $($_.name) | topics=$($_.topicCount)" }
$d.fruits | Where-Object { $_.name -like '*Destructive Attitudes*' } | ForEach-Object { "FRUIT $($_.id) | $($_.name)" }
