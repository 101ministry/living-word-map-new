param(
    [string]$PrayersFile = "$env:USERPROFILE\Downloads\Telegram Desktop\compiled_prayers - round 1 {7-13}.txt",
    [string]$TopicsFile = "$env:USERPROFILE\Downloads\Telegram Desktop\topics 666.txt"
)

function Get-NumberedEntries([string]$path, [string]$pattern) {
    $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    [regex]::Matches($raw, $pattern) | ForEach-Object { [int]$_.Groups[1].Value } | Sort-Object -Unique
}

function Get-SpiritFromPrayer([string]$block) {
    if ($block -match 'thought suggestions of\s+(?:interacting with the spirit of\s+)?([^,\r\n]+?)(?:,|\s+from a root)') {
        return ($matches[1] -replace ',+$', '').Trim().ToLower()
    }
    return $null
}

function Get-SpiritFromTopic([string]$block) {
    if ($block -match '(?m)^\d{3}\.\s*(.+?),\s*from a root of') {
        return $matches[1].Trim().ToLower()
    }
    if ($block -match '(?m)^\d{3}\.\s*(.+?)\s+is with the root of') {
        return $matches[1].Trim().ToLower()
    }
    if ($block -match '(?m)^\d{3}\.\s*(.+?)\s+with the root of') {
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

$prayerNums = @(Get-NumberedEntries $PrayersFile '(?m)^(\d{3})\.\s*PLEASE NOTE:')
$topicNums = @(Get-NumberedEntries $TopicsFile '(?m)^(\d{3})\.')

Write-Host '=== COUNTS ==='
Write-Host "Prayers file: $($prayerNums.Count) entries (1-$($prayerNums[-1]))"
Write-Host "Topics file:  $($topicNums.Count) entries (1-$($topicNums[-1]))"
Write-Host "Difference:   $($topicNums.Count - $prayerNums.Count) more topics than prayers"
Write-Host ''

$onlyPrayers = @($prayerNums | Where-Object { $_ -notin $topicNums })
$onlyTopics = @($topicNums | Where-Object { $_ -notin $prayerNums })
Write-Host '=== NUMBERS IN ONE FILE ONLY ==='
Write-Host "In prayers only: $(if ($onlyPrayers.Count) { $onlyPrayers -join ', ' } else { 'none' })"
Write-Host "In topics only:  $(if ($onlyTopics.Count) { $onlyTopics -join ', ' } else { 'none' })"
Write-Host ''

$prayerRaw = [System.IO.File]::ReadAllText($PrayersFile, [System.Text.Encoding]::UTF8)
$topicRaw = [System.IO.File]::ReadAllText($TopicsFile, [System.Text.Encoding]::UTF8)
$prayerBlocks = [regex]::Split($prayerRaw, '(?=\d{3}\.\s*PLEASE NOTE:)')
$topicBlocks = [regex]::Split($topicRaw, '(?=\d{3}\.\s+\S)')

$prayerByNum = @{}
foreach ($b in $prayerBlocks) {
    if ($b -match '(?m)^(\d{3})\.') {
        $prayerByNum[[int]$matches[1]] = Get-SpiritFromPrayer $b
    }
}
$topicByNum = @{}
foreach ($b in $topicBlocks) {
    if ($b -match '(?m)^(\d{3})\.') {
        $topicByNum[[int]$matches[1]] = Get-SpiritFromTopic $b
    }
}

Write-Host '=== SAME-NUMBER SPIRIT MISMATCHES ==='
$mm = @()
foreach ($n in ($prayerNums | Where-Object { $_ -in $topicNums })) {
    $p = $prayerByNum[$n]
    $t = $topicByNum[$n]
    if ($p -and $t -and -not (MatchSpirit $p $t)) {
        $mm += [PSCustomObject]@{ Num = $n; Prayer = $p; Topic = $t }
    }
}
Write-Host "Total at same number: $($mm.Count)"
$mm | Select-Object -First 25 | ForEach-Object {
    Write-Host ("  #{0:D3} prayer: {1}" -f $_.Num, $_.Prayer)
    Write-Host ("       topic:  {0}" -f $_.Topic)
}

Write-Host ''
Write-Host '=== TAIL: TOPICS 660-666 vs PRAYERS 660-664 ==='
660..666 | ForEach-Object {
    $n = $_
    $p = if ($prayerByNum.ContainsKey($n)) { $prayerByNum[$n] } else { '(no prayer)' }
    $t = if ($topicByNum.ContainsKey($n)) { $topicByNum[$n] } else { '(no topic)' }
    Write-Host ("#{0:D3}" -f $n)
    Write-Host "  topic:  $t"
    Write-Host "  prayer: $p"
}

Write-Host ''
Write-Host '=== WHERE PRAYER N MATCHES TOPIC N+2 (shift at end) ==='
660..664 | ForEach-Object {
    $n = $_
    $p = $prayerByNum[$n]
    if (-not $p) { return }
    foreach ($off in 0, 1, 2) {
        $tn = $n + $off
        if ($topicByNum.ContainsKey($tn) -and (MatchSpirit $p $topicByNum[$tn])) {
            Write-Host ("  prayer #{0:D3} matches topic #{1:D3} (offset +{2})" -f $n, $tn, $off)
            break
        }
    }
}

Write-Host ''
Write-Host '=== PRAYER GAPS (missing numbers inside 1..664) ==='
$prayerGaps = @(1..$prayerNums[-1] | Where-Object { $_ -notin $prayerNums })
Write-Host $(if ($prayerGaps.Count) { $prayerGaps -join ', ' } else { 'none' })
