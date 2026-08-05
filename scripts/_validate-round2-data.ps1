$ErrorActionPreference = 'Stop'
$path = Join-Path $PSScriptRoot '..\public\round2-data.js'
$raw = [IO.File]::ReadAllText($path)
$json = $raw -replace '(?s)^window\.ROUND2_DATA\s*=\s*', '' -replace ';\s*$', ''
try {
    $d = $json | ConvertFrom-Json
    $t1 = $d.topics.'1'
    if (-not $t1) { throw 'Topic 1 missing' }
    if (-not $t1.round2Text) { throw 'Topic 1 round2Text empty' }
    Write-Host "OK: $($d.topicCount) topics, $($d.sections.Count) sections"
    Write-Host "Topic 1 preview: $($t1.round2Text.Substring(0, [Math]::Min(80, $t1.round2Text.Length)))..."
}
catch {
    Write-Host "FAIL: $($_.Exception.Message)"
    exit 1
}
