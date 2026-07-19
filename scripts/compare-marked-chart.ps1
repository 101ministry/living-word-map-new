# Compare marked principality chart (7-19) against repo ROOT-SPIRITS-CHART.txt order.
param(
    [string]$NewChartFile = "$env:USERPROFILE\Downloads\Telegram Desktop\ROOT_SPIRITS_CHART,_GENERATIONAL_INIQUITIES,_WAYS_SATAN_TRIES_TO (7-19).txt",
    [string]$RepoChartFile = "$PSScriptRoot\..\data\ROOT-SPIRITS-CHART.txt"
)

function Normalize-Name([string]$text) {
    if (-not $text) { return '' }
    $t = $text.ToLower()
    $t = $t -replace '[^a-z0-9]+', ' '
    return ($t.Trim() -replace '\s+', ' ')
}

function Parse-MarkedChart([string]$path) {
    $lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
    $topics = @()
    $principalities = @()
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
        $principalities += $principality
    }
    return @{ topics = $topics; principalities = $principalities }
}

function Parse-NumberedChart([string]$path) {
    $topics = @()
    foreach ($line in ([System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8))) {
        if ($line -match '^(\d{3})\.\s*(.+)$') {
            $topics += [PSCustomObject]@{ num = [int]$matches[1]; name = $matches[2].Trim() }
        }
    }
    return $topics
}

if (-not (Test-Path -LiteralPath $NewChartFile)) {
    throw "New chart not found: $NewChartFile"
}
if (-not (Test-Path -LiteralPath $RepoChartFile)) {
    throw "Repo chart not found: $RepoChartFile"
}

$new = Parse-MarkedChart $NewChartFile
$repo = Parse-NumberedChart $RepoChartFile

Write-Host '=== MARKED CHART vs REPO CHART ==='
Write-Host "New file:  $NewChartFile"
Write-Host "Repo file: $RepoChartFile"
Write-Host "New topics: $($new.topics.Count)"
Write-Host "Repo topics: $($repo.Count)"
Write-Host ''

$mismatches = @()
$max = [Math]::Max($new.topics.Count, $repo.Count)
for ($i = 0; $i -lt $max; $i++) {
    $n = $i + 1
    $newName = if ($i -lt $new.topics.Count) { $new.topics[$i] } else { $null }
    $repoName = if ($i -lt $repo.Count) { $repo[$i].name } else { $null }
    if ((Normalize-Name $newName) -ne (Normalize-Name $repoName)) {
        $mismatches += [PSCustomObject]@{
            Number = $n
            Principality = $new.principalities[$i]
            NewChart = $newName
            RepoChart = $repoName
        }
    }
}

if ($mismatches.Count -eq 0) {
    Write-Host 'RESULT: All 666 topic names match in order.'
} else {
    Write-Host "RESULT: $($mismatches.Count) position(s) differ."
    Write-Host ''
    $mismatches | Format-Table -AutoSize Number, Principality, NewChart, RepoChart
}

Write-Host ''
Write-Host 'Principality ranges in new file:'
$groups = @{}
for ($i = 0; $i -lt $new.topics.Count; $i++) {
    $p = $new.principalities[$i]
    if (-not $groups.ContainsKey($p)) {
        $groups[$p] = @{ start = ($i + 1); count = 0 }
    }
    $groups[$p].count++
}
$groups.GetEnumerator() | Sort-Object { $_.Value.start } | ForEach-Object {
    $s = $_.Value.start
    $e = $s + $_.Value.count - 1
    Write-Host ("  {0,-48} #{1:D3}-#{2:D3} ({3})" -f $_.Key, $s, $e, $_.Value.count)
}
