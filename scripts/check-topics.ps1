$topicsRaw = [System.IO.File]::ReadAllText("$env:USERPROFILE\Downloads\Telegram Desktop\topics 666.txt")
$blocks = $topicsRaw -split '~~~~~~~~~~~~'
$found = @{}
foreach ($block in $blocks) {
    $b = $block.Trim()
    if ($b -match '(?m)^(\d{3})\.') { $found[[int]$matches[1]] = $true }
}
$missing = 1..666 | Where-Object { -not $found.ContainsKey($_) }
Write-Host "Parsed topic blocks: $($found.Count)"
Write-Host "Missing numbers: $($missing -join ', ')"

$chart = Get-Content "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT SPIRITS CHART - vertical revamp.txt"
$chartCount = ($chart | Where-Object { $_ -match '^\d{3}\.' }).Count
Write-Host "Chart lines: $chartCount"
