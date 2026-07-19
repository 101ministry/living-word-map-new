param([int]$From = 663, [int]$To = 666)
$index = ((Get-Content "$PSScriptRoot\..\public\prayer-index.js" -Raw) -replace '^window\.PRAYER_INDEX = ','' -replace ';$','' | ConvertFrom-Json)
$From..$To | ForEach-Object { Write-Host "topic $_ -> prayer $($index.([string]$_))" }
