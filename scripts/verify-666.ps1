$d = Get-Content "$PSScriptRoot\..\public\prayer-index.js" -Raw
if ($d -match '"665":(\d+)') { Write-Host "665 -> prayer $($matches[1])" }
if ($d -match '"666":(\d+)') { Write-Host "666 -> prayer $($matches[1])" }
$g = (Get-Content "$PSScriptRoot\..\public\data.js" -Raw) -replace '^window\.GRAPH_DATA = ','' -replace ';$','' | ConvertFrom-Json
$t665 = $g.topics | Where-Object { $_.number -eq 665 }
$t666 = $g.topics | Where-Object { $_.number -eq 666 }
Write-Host "665: $($t665.name)"
Write-Host "666: $($t666.name)"
