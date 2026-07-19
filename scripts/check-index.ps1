$index = ((Get-Content "$PSScriptRoot\..\public\prayer-index.js" -Raw) -replace '^window\.PRAYER_INDEX = ','' -replace ';$','' | ConvertFrom-Json)
1..10 | ForEach-Object { Write-Host "topic $_ -> prayer $($index.([string]$_))" }
