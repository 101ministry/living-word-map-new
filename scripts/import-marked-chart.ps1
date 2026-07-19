# Imports a marked principality chart ([PRINCIPALITY OF ...] headers) into numbered ROOT-SPIRITS-CHART.txt.
param(
    [string]$MarkedChartFile = "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT_SPIRITS_CHART,_GENERATIONAL_INIQUITIES,_WAYS_SATAN_TRIES_TO (7-19).txt",
    [string]$OutputFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt"
)

function Parse-MarkedChart([string]$path) {
    $lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
    $topics = @()
    $principality = $null
    foreach ($line in $lines) {
        if ($line -match '^\[(.+)\]\s*$') {
            $principality = ($matches[1] -replace '^(PRINCIPALITY|CATEGORY|SPIRIT)\s+OF\s+', '').Trim()
            continue
        }
        $t = $line.Trim()
        if (-not $t) { continue }
        if ($t -match '^ROOT SPIRITS CHART') { continue }
        if ($t -match '^\d{3}\.') { continue }
        $topics += $t
    }
    return $topics
}

if (-not (Test-Path -LiteralPath $MarkedChartFile)) {
    throw "Marked chart not found: $MarkedChartFile"
}

$topics = Parse-MarkedChart $MarkedChartFile
if ($topics.Count -ne 666) {
    throw "Marked chart must contain 666 topics (got $($topics.Count))."
}

$lines = for ($i = 0; $i -lt $topics.Count; $i++) {
    '{0:D3}. {1}' -f ($i + 1), $topics[$i]
}

$dir = Split-Path $OutputFile -Parent
if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

[System.IO.File]::WriteAllLines($OutputFile, $lines, [System.Text.UTF8Encoding]::new($false))

Write-Host "Imported marked chart:"
Write-Host "  Source: $MarkedChartFile"
Write-Host "  Topics: $($topics.Count)"
Write-Host "  Output: $OutputFile"
