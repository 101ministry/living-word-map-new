# Canonical fruit emoji + range fixes for data/TOPICS-666.txt
param(
    [string]$InputFile = "$PSScriptRoot\..\data\TOPICS-666.txt",
    [string[]]$AlsoWriteTo = @(
        "$env:USERPROFILE\Downloads\Telegram Desktop\topics 666.txt"
    )
)

$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)
$apos = [char]0x2019

function Em([int]$cp) { return [System.Char]::ConvertFromUtf32($cp) }

# Canonical emoji tokens (ASCII-safe script, UTF-8 output)
$E = @{
    Occultism       = Em 0x1F7E9          # green square - Occultism and Counterfeit Spirituality (one fruit)
    FalseReligion   = (Em 0x1F7E6) + (Em 0x1F7E9)  # blue+green - False Religion and Doctrinal Error
    Attitudes       = [char]0x26D4 + [char]0xFE0F   # Destructive Attitudes Against God's Image
    Identities      = [char]0x2754              # Destructive Identities Against God's Image
    SpiritSpouse    = (Em 0x1F7E7) + (Em 0x1F7E9) + (Em 0x2B1B)  # orange+green+black trio
}

$OccultismFruit = "$($E.Occultism)Occultism and Counterfeit Spirituality"
$FalseReligionFruit = "$($E.FalseReligion)False Religion and Doctrinal Error"
$AttitudesFruit = "$($E.Attitudes)Destructive Attitudes Against God${apos}s Image"
$IdentitiesFruit = "$($E.Identities)Destructive Identities Against God${apos}s Image"

$SpiritSpouseBlob = "$($E.SpiritSpouse)Sexual Corruption of Human and Hybrid DNA, Counterfeit Spirituality (think KUNDALINI), and Confusing Preferences with Stewardship with the parent Principality of Spirit Spouse Gods"

$StandardAgreements = 'is happening because of agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements because of'

function Fix-DetailLine([string]$detail, [int]$num) {
    if (-not $detail) { return $detail }

    # Global normalizations
    $d = $detail
    $d = $d -replace '(?i)🟦False Religion and Occultism', $FalseReligionFruit
    $d = $d -replace '(?i)False Religion and Occultism', 'False Religion and Doctrinal Error'
    $d = $d -replace '(?i)🟦False Religion and Doctrinal Error', $FalseReligionFruit

    # Keep Occultism and Counterfeit Spirituality as one fruit (strip errant split emoji prefixes)
    $d = $d -replace '(?i)🟩Occultism and Counterfeit Spirituality', $OccultismFruit
    $d = $d -replace '(?i)because of Occultism and Counterfeit Spirituality', "because of $OccultismFruit"

    if ($num -eq 130) {
        if ($d -match '(?is)(.+?with the root of .+?;\s*)is happening because of.+$') {
            return "$($Matches[1])$StandardAgreements $OccultismFruit with the parent Principality of Divination."
        }
    }

    if ($num -ge 574 -and $num -le 666) {
        if ($d -match '(?is)(.+?with the root of .+?;\s*)is happening because of.+$') {
            return "$($Matches[1])is happening because of 7 agreements AND because FRUITS of $SpiritSpouseBlob."
        }
    }

    if ($num -ge 391 -and $num -le 442) {
        if ($d -match '(?is)(.+?with the root of .+?;\s*)is happening because of.+$') {
            $prefix = $Matches[1]
            $princ = 'Error'
            if ($detail -match '(?i)with the parent Principality of (.+?)\.\s*$') {
                $princ = $Matches[1].Trim()
            }
            return "${prefix}$StandardAgreements $AttitudesFruit with the parent Principality of $princ."
        }
    }

    if ($num -ge 443 -and $num -le 573) {
        if ($d -match '(?is)(.+?with the root of .+?;\s*)is happening because of.+$') {
            $prefix = $Matches[1]
            $princ = 'Destructive Identities Against God'
            if ($detail -match '(?i)with the parent Principality of (.+?)\.\s*$') {
                $princ = $Matches[1].Trim()
            }
            return "${prefix}$StandardAgreements $IdentitiesFruit with the parent Principality of $princ."
        }
    }

    return $d
}

if (-not (Test-Path -LiteralPath $InputFile)) {
    throw "Missing: $InputFile"
}

$raw = [System.IO.File]::ReadAllText($InputFile, $Utf8)
$blocks = [regex]::Split($raw, '(?=\d{3}\.\s+\S)')
$out = New-Object System.Collections.Generic.List[string]
$stats = @{
    fixed130 = 0; fixed391 = 0; fixed443 = 0; fixed574 = 0
    falseReligion = 0; occultism = 0
}

foreach ($block in $blocks) {
    $b = $block
    if (-not $b.Trim()) { continue }
    if ($b -notmatch '^(\d{3})\.') {
        [void]$out.Add($b)
        continue
    }

    $num = [int]$Matches[1]
    $parts = $b -split '~~~~~~~~~~~~', 2
    $body = $parts[0].TrimEnd()
    $sep = if ($parts.Count -gt 1) { '~~~~~~~~~~~~' } else { '' }

    $lines = @($body -split "`r?`n")
    if ($lines.Count -gt 1) {
        $header = $lines[0]
        $detail = ($lines[1..($lines.Count - 1)] -join "`n").Trim()
        $before = $detail
        $detail = Fix-DetailLine $detail $num
        if ($detail -ne $before) {
            if ($num -eq 130) { $stats.fixed130++ }
            elseif ($num -ge 391 -and $num -le 442) { $stats.fixed391++ }
            elseif ($num -ge 443 -and $num -le 573) { $stats.fixed443++ }
            elseif ($num -ge 574 -and $num -le 666) { $stats.fixed574++ }
        }
        if ($detail -match 'False Religion and Doctrinal Error') { $stats.falseReligion++ }
        if ($detail -match 'Occultism and Counterfeit Spirituality') { $stats.occultism++ }
        $body = "$header`n`n$detail"
    }

    $chunk = if ($sep) { "$body`n$sep" } else { $body }
    [void]$out.Add($chunk)
}

$content = ($out -join "`n`n") + "`n"
[System.IO.File]::WriteAllText($InputFile, $content, $Utf8)
Write-Host "Updated $InputFile"
Write-Host "  #130 fixes: $($stats.fixed130)"
Write-Host "  #391-442 fixes: $($stats.fixed391)"
Write-Host "  #443-573 fixes: $($stats.fixed443)"
Write-Host "  #574-666 fixes: $($stats.fixed574)"

foreach ($dest in $AlsoWriteTo) {
    if (-not $dest) { continue }
    $dir = Split-Path -Parent $dest
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        Write-Warning "Skip copy - directory missing: $dir"
        continue
    }
    [System.IO.File]::WriteAllText($dest, $content, $Utf8)
    Write-Host "Copied to $dest"
}
