# Sync COMPILED-PRAYERS topic, root, recognize, and serve lines from data/TOPICS-666.txt
param(
    [string]$TopicsFile = "$PSScriptRoot\..\data\TOPICS-666.txt",
    [string]$PrayersFile = "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt",
    [string[]]$AlsoWriteTo = @(
        "$env:USERPROFILE\Downloads\Telegram Desktop\compiled_prayers - round 1 (latest edit).txt",
        "$env:USERPROFILE\Downloads\Telegram Desktop\compiled_prayers - round 1 {7-13.1}"
    )
)

$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, $Utf8)
}

function Strip-NonAscii([string]$text) {
    if (-not $text) { return '' }
    return ($text -replace '[^\x00-\x7F\u0080-\u024F\u1E00-\u1EFF''\u2019]+', ' ' -replace '\s+', ' ').Trim()
}

function Extract-PlainRoot([string]$line) {
    if (-not $line) { return '' }
    if ($line -match '(?i)from a root of\s+([^.\n]+)\.?') {
        return (Strip-NonAscii $Matches[1]).Trim().TrimEnd('.')
    }
    if ($line -match '(?i)root\s*of\s+([^;,\n]+)') {
        return (Strip-NonAscii $Matches[1]).Trim().TrimEnd('.')
    }
    return ''
}

function Parse-Topics666([string]$raw) {
    $result = @{}
    $blocks = [regex]::Split($raw, '(?=\d{3}\.\s+\S)')
    foreach ($block in $blocks) {
        $b = $block.Trim()
        if ($b -notmatch '(?ms)^(\d{3})\.\s*(.+?),\s*from a root of\s*(.+?)\.\s*\r?\n\r?\n(.+)$') { continue }
        $num = [int]$Matches[1]
        $detail = $Matches[4].Trim()
        $detail = ($detail -split '~~~~~~~~~~~~')[0].Trim()
        $detail = (Strip-NonAscii $detail).TrimEnd('.')
        $result[$num] = @{
            topicPlain  = (Strip-NonAscii $Matches[2]).Trim().TrimEnd('.')
            rootPlain   = Extract-PlainRoot $Matches[0]
            detailPlain = $detail
        }
    }
    return $result
}

$topicsRaw = Read-Utf8 $TopicsFile
$topics = Parse-Topics666 $topicsRaw
if ($topics.Count -lt 666) {
    throw "Expected 666 topics in $TopicsFile (got $($topics.Count))."
}

$prayersRaw = Read-Utf8 $PrayersFile
$blocks = [regex]::Split($prayersRaw, '(?=\d{3}\.\s*PLEASE NOTE:)')
$updated = 0
$outBlocks = @()

foreach ($block in $blocks) {
    if ($block -notmatch '(?m)^(\d{3})\.\s*PLEASE NOTE:') {
        if ($block) { $outBlocks += $block }
        continue
    }
    $num = [int]$Matches[1]
    if (-not $topics.ContainsKey($num)) {
        $outBlocks += $block
        continue
    }

    $meta = $topics[$num]
    $lines = ($block -split '\r?\n')
    $changed = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match '^I agree that I am guilty of keeping and not casting down thought suggestions of ') {
            $newLine = "I agree that I am guilty of keeping and not casting down thought suggestions of $($meta.topicPlain), from a root of $($meta.rootPlain)."
            if ($newLine -ne $line) {
                $lines[$i] = $newLine
                $changed = $true
            }
        }
        elseif ($line -match '^I recognize that ') {
            $newLine = "I recognize that $($meta.detailPlain) "
            if ($newLine.Trim() -ne $line.Trim()) {
                $lines[$i] = $newLine
                $changed = $true
            }
        }
        elseif ($line -match '^I no longer want to serve ') {
            $newLine = "I no longer want to serve $($meta.topicPlain). In fact, I am asking for the forgiveness of God on this and for the Blood of Jesus to cover the record and speak instead."
            if ($newLine -ne $line) {
                $lines[$i] = $newLine
                $changed = $true
            }
            while ($i + 1 -lt $lines.Count -and $lines[$i + 1] -match '^(?:lewdness|thoughts, words|and actions|In fact, I am asking)') {
                $lines[$i + 1] = ''
                $changed = $true
                $i++
            }
        }
    }

    if ($changed) { $updated++ }
    $outBlocks += ($lines -join "`r`n")
}

$newPrayers = ($outBlocks -join '').TrimEnd() + "`r`n"
[System.IO.File]::WriteAllText($PrayersFile, $newPrayers, $Utf8)
Write-Host "Updated $updated prayer blocks in $PrayersFile"

foreach ($dest in $AlsoWriteTo) {
    if (-not $dest) { continue }
    $dir = Split-Path -Parent $dest
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { continue }
    [System.IO.File]::WriteAllText($dest, $newPrayers, $Utf8)
    Write-Host "Copied to $dest"
}
