$raw = Get-Content "$PSScriptRoot\..\public\data.js" -Raw
$json = $raw -replace '^window\.GRAPH_DATA = ', '' -replace ';\s*$', ''
$d = $json | ConvertFrom-Json
$d.principalities | Sort-Object { $_.quotes.Count } -Descending | ForEach-Object {
    Write-Host ("{0,-55} {1,3} quotes" -f $_.name, @($_.quotes).Count)
}
