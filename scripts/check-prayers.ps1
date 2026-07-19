$d = Get-Content "$PSScriptRoot\..\public\prayers\en.json" -Raw | ConvertFrom-Json
$nums = @($d.topics.PSObject.Properties.Name | ForEach-Object { [int]$_ })
$missing = 1..666 | Where-Object { $_ -notin $nums }
Write-Host "Count: $($nums.Count)"
Write-Host "Missing: $($missing -join ', ')"
Write-Host "Sample #1 spirit: $($d.topics.'1'.spirit)"
Write-Host "Sample #1 open: $(($d.topics.'1'.text -split "`n")[0])"
