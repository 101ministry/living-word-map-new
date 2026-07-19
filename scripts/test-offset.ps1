$raw = [System.IO.File]::ReadAllText("$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt")
$blocks = [regex]::Split($raw, '(?=\d{3}\.\s*PLEASE NOTE:)')
$chart = Get-Content "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT SPIRITS CHART - vertical revamp.txt"

function Get-PrayerSpirit($n) {
    $num = '{0:D3}' -f $n
    $b = ($blocks | Where-Object { $_ -match "^$num\.\s*PLEASE NOTE:" } | Select-Object -First 1)
    if ($b -match 'thought suggestions of\s+(?:interacting with the spirit of\s+)?([^,\r\n]+?)(?:,|\s+from a root)') {
        return ($matches[1] -replace ',+$', '').Trim().ToLower()
    }
    return $null
}

function Get-ChartName($n) {
    $num = '{0:D3}' -f $n
    return (($chart | Where-Object { $_ -match "^$num\." } | Select-Object -First 1) -replace "^\d{3}\.\s*", "").ToLower()
}

foreach ($chartN in 650..666) {
    $prayerN = $chartN - 2
    if ($chartN -lt 657) { $prayerN = $chartN }
    $ps = Get-PrayerSpirit $prayerN
    $cn = Get-ChartName $chartN
    Write-Host "chart $chartN ($cn) <- prayer $prayerN ($ps)"
}
