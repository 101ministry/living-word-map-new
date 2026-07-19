$raw = [System.IO.File]::ReadAllText("$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt")
$blocks = [regex]::Split($raw, '(?=\d{3}\.\s*PLEASE NOTE:)')
$chartPath = "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT SPIRITS CHART - vertical revamp.txt"
$chart = Get-Content $chartPath

foreach ($n in 655..666) {
    $num = '{0:D3}' -f $n
    $b = ($blocks | Where-Object { $_ -match "^$num\.\s*PLEASE NOTE:" } | Select-Object -First 1)
    $spirit = $null
    if ($b -match 'thought suggestions of\s+(?:interacting with the spirit of\s+)?([^,\r\n]+?)(?:,|\s+from a root)') {
        $spirit = ($matches[1] -replace ',+$', '').Trim()
    }
    $chartLine = ($chart | Where-Object { $_ -match "^$num\." } | Select-Object -First 1) -replace "^\d{3}\.\s*", ""
    Write-Host "$num | prayer: $spirit"
    Write-Host "     | chart:  $chartLine"
    Write-Host ""
}
