param(
    [string]$PrayersFile = "$env:USERPROFILE\Downloads\Telegram Desktop\compiled_prayers - round 1 {7-13}.txt",
    [string]$TopicsFile = "$env:USERPROFILE\Downloads\Telegram Desktop\topics 666.txt"
)

function Get-SpiritFromPrayer([string]$block) {
    if ($block -match 'thought suggestions of\s+(?:interacting with the spirit of\s+)?([^,\r\n]+?)(?:,|\s+from a root)') {
        return ($matches[1] -replace ',+$', '').Trim().ToLower()
    }
    return $null
}

function Get-SpiritFromTopic([string]$block) {
    if ($block -match '(?m)^\d{3}\.\s*(?:interacting with the spirit of\s+)?(.+?),\s*from a root of') {
        return $matches[1].Trim().ToLower()
    }
    if ($block -match '(?m)^\d{3}\.\s*(?:interacting with the spirit of\s+)?(.+?)\s+is with the root of') {
        return $matches[1].Trim().ToLower()
    }
    if ($block -match '(?m)^\d{3}\.\s*(?:interacting with the spirit of\s+)?(.+?)\s+with the root of') {
        return $matches[1].Trim().ToLower()
    }
    return $null
}

function MatchSpirit([string]$a, [string]$b) {
    if (-not $a -or -not $b) { return $false }
    $na = ($a -replace '[^a-z0-9]+', ' ').Trim()
    $nb = ($b -replace '[^a-z0-9]+', ' ').Trim()
    return ($na -eq $nb) -or $na.Contains($nb) -or $nb.Contains($na)
}

$prayerRaw = [System.IO.File]::ReadAllText($PrayersFile, [System.Text.Encoding]::UTF8)
$topicRaw = [System.IO.File]::ReadAllText($TopicsFile, [System.Text.Encoding]::UTF8)
$prayerBlocks = [regex]::Split($prayerRaw, '(?=\d{3}\.\s*PLEASE NOTE:)')
$topicBlocks = [regex]::Split($topicRaw, '(?=\d{3}\.\s+\S)')

$prayerByNum = @{}
foreach ($b in $prayerBlocks) {
    if ($b -match '(?m)^(\d{3})\.') { $prayerByNum[[int]$matches[1]] = Get-SpiritFromPrayer $b }
}
$topicByNum = @{}
foreach ($b in $topicBlocks) {
    if ($b -match '(?m)^(\d{3})\.') { $topicByNum[[int]$matches[1]] = Get-SpiritFromTopic $b }
}

Write-Host '=== BEST OFFSET PER PRAYER (0=same number, +N = topic is N ahead) ==='
$offsetCounts = @{}
1..664 | ForEach-Object {
    $n = $_
    $p = $prayerByNum[$n]
    if (-not $p) { return }
    $bestOff = $null
    foreach ($off in 0..5) {
        $tn = $n + $off
        if ($topicByNum.ContainsKey($tn) -and (MatchSpirit $p $topicByNum[$tn])) {
            $bestOff = $off
            break
        }
    }
    if ($null -eq $bestOff) { $bestOff = '?' }
    if (-not $offsetCounts.ContainsKey([string]$bestOff)) { $offsetCounts[[string]$bestOff] = 0 }
    $offsetCounts[[string]$bestOff]++
    if ($bestOff -ne 0 -and $bestOff -ne '?') {
        Write-Host ("  #{0:D3} offset +{1} | prayer: {2} -> topic #{3:D3}: {4}" -f $n, $bestOff, $p, ($n + [int]$bestOff), $topicByNum[$n + [int]$bestOff])
    }
}

Write-Host ''
Write-Host 'Offset summary:'
$offsetCounts.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host ("  offset {0}: {1} prayers" -f $_.Name, $_.Value) }

Write-Host ''
Write-Host '=== TOPICS WITH NO MATCHING PRAYER (any offset 0-5) ==='
$unmatchedTopics = @()
1..666 | ForEach-Object {
    $tn = $_
    $t = $topicByNum[$tn]
    if (-not $t) { return }
    $found = $false
    foreach ($pn in $prayerByNum.Keys) {
        if (MatchSpirit $prayerByNum[$pn] $t) { $found = $true; break }
    }
    if (-not $found) { $unmatchedTopics += $tn }
}
Write-Host $(if ($unmatchedTopics.Count) { ($unmatchedTopics | ForEach-Object { '{0:D3}' -f $_ }) -join ', ' } else { 'none' })

Write-Host ''
Write-Host '=== TOPIC #607 (likely insertion point) ==='
607..610 | ForEach-Object {
    $n = $_
    Write-Host ("#{0:D3} topic: {1}" -f $n, $topicByNum[$n])
    Write-Host ("     prayer same#: {0}" -f $prayerByNum[$n])
}
