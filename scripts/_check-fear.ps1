$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$raw = Get-Content "$repo\public\data.js" -Raw
$json = $raw -replace '^window\.GRAPH_DATA\s*=\s*', '' -replace ';\s*$', ''
$data = $json | ConvertFrom-Json

function Normalize-Label($s) {
    ($s -replace '[^a-z0-9]', '').ToLower()
}

foreach ($p in $data.principalities) {
    $topics = @($data.topics | Where-Object { $_.principalityIds -contains $p.id })
    if ($topics.Count -eq 0 -or $p.manifestations.Count -eq 0) { continue }
    $topicKeys = @{}
    foreach ($t in $topics) { $topicKeys[(Normalize-Label $t.name)] = $true }
    $matched = 0
    foreach ($m in $p.manifestations) {
        if ($topicKeys.ContainsKey((Normalize-Label $m))) { $matched++ }
    }
    $pct = [math]::Round(100 * $matched / $p.manifestations.Count)
    if ($pct -ge 80) {
        Write-Host ("{0}: {1}/{2} manifestations match topics ({3}%) topics={4}" -f $p.name, $matched, $p.manifestations.Count, $pct, $topics.Count)
    }
}

