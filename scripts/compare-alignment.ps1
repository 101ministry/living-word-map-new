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
    $line = ($chart | Where-Object { $_ -match "^$num\." } | Select-Object -First 1) -replace "^\d{3}\.\s*", ""
    return $line.ToLower() -replace '[^a-z0-9]+', ' '
}

Write-Host "Checking alignment prayer N -> chart N, N+1, N+2..."
$mismatches = 0
for ($n = 1; $n -le 664; $n++) {
    $p = Get-PrayerSpirit $n
    if (-not $p) { continue }
    $c0 = Get-ChartName $n
    $c1 = Get-ChartName ($n + 1)
    $c2 = Get-ChartName ($n + 2)
    $ok = ($c0 -like "*$($p.Substring(0, [Math]::Min(8, $p.Length)))*") -or
          ($c1 -like "*$($p.Substring(0, [Math]::Min(8, $p.Length)))*") -or
          ($c2 -like "*$($p.Substring(0, [Math]::Min(8, $p.Length)))*")
    if (-not $ok) {
        $mismatches++
        if ($mismatches -le 15) {
            Write-Host "$n prayer='$p' | chart=$c0"
        }
    }
}
Write-Host "Total rough mismatches: $mismatches"
