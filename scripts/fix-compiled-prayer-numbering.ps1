# Renumbers compiled_prayers so guile=607 and stupor=654 align with topics 666.txt.
param(
    [string[]]$Files = @(
        "$env:USERPROFILE\Downloads\Telegram Desktop\compiled_prayers - round 1 {7-13}.txt",
        "$env:USERPROFILE\Downloads\Telegram Desktop\compiled_prayers - round 1 {7-13.1}",
        "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt"
    ),
    [switch]$WhatIf
)

function Read-Utf8([string]$path) {
    [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8([string]$path, [string]$text) {
    [System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
}

function Repair-CompiledPrayers([string]$raw) {
    $status = Test-CompiledPrayers $raw
    if ($status.Count -eq 666 -and $status.Has607Guile -and $status.Has654Stupor -and $status.Unnumbered -eq 0) {
        return $raw
    }

    $normalized = $raw -replace "`r`n", "`n"
    $guilePattern = '(?ms)^PLEASE NOTE: THESE PRAYERS ARE TO BE SPOKEN, NOT SIMPLY READ SILENTLY, from a root of deception and falsehood\.\s*\n\s*\nI agree that I am guilty of keeping and not casting down thought suggestions of interacting with the spirit of guile\.'
    $stuporPattern = '(?ms)^PLEASE NOTE: THESE PRAYERS ARE TO BE SPOKEN, NOT SIMPLY READ SILENTLY, from a root of deception and falsehood\.\s*\n\s*\nI agree that I am guilty of keeping and not casting down thought suggestions of interacting with the spirit of stupor\.'

    if (-not $status.Has607Guile -and $normalized -notmatch $guilePattern) {
        throw 'Could not locate unnumbered guile prayer block.'
    }
    if (-not $status.Has654Stupor -and $normalized -notmatch $stuporPattern) {
        throw 'Could not locate unnumbered stupor prayer block.'
    }

    $out = $normalized

    if ($status.Count -lt 666) {
        for ($n = 664; $n -ge 653; $n--) {
            $old = '{0:D3}' -f $n
            $new = '{0:D3}' -f ($n + 2)
            $out = [regex]::Replace($out, "(?m)^$old\. PLEASE NOTE:", "$new. PLEASE NOTE:")
        }
        for ($n = 652; $n -ge 607; $n--) {
            $old = '{0:D3}' -f $n
            $new = '{0:D3}' -f ($n + 1)
            $out = [regex]::Replace($out, "(?m)^$old\. PLEASE NOTE:", "$new. PLEASE NOTE:")
        }
    }

    if (-not $status.Has607Guile) {
        $out = [regex]::Replace($out, $guilePattern, "607. PLEASE NOTE: THESE PRAYERS ARE TO BE SPOKEN, NOT SIMPLY READ SILENTLY.`n`nI agree that I am guilty of keeping and not casting down thought suggestions of interacting with the spirit of guile.")
    }

    if (-not $status.Has654Stupor) {
        $out = [regex]::Replace($out, $stuporPattern, "654. PLEASE NOTE: THESE PRAYERS ARE TO BE SPOKEN, NOT SIMPLY READ SILENTLY.`n`nI agree that I am guilty of keeping and not casting down thought suggestions of interacting with the spirit of stupor.")
    }

    if ($raw -match "`r`n") { return $out -replace "`n", "`r`n" }
    return $out
}

function Test-CompiledPrayers([string]$raw) {
    $nums = [regex]::Matches($raw, '(?m)^(\d{3})\.\s*PLEASE NOTE:') | ForEach-Object { [int]$_.Groups[1].Value } | Sort-Object
    $unique = $nums | Select-Object -Unique
    $dupes = $nums | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { $_.Name }
    $gaps = 1..666 | Where-Object { $_ -notin $unique }

    [PSCustomObject]@{
        Count = $unique.Count
        Duplicates = ($dupes -join ', ')
        Gaps = ($gaps -join ', ')
        Has607Guile = ($raw -match '(?m)^607\.\s*PLEASE NOTE:[\s\S]*?spirit of guile')
        Has654Stupor = ($raw -match '(?m)^654\.\s*PLEASE NOTE:[\s\S]*?spirit of stupor')
        Unnumbered = ([regex]::Matches($raw, '(?m)^PLEASE NOTE: THESE PRAYERS')).Count
    }
}

if ($MyInvocation.InvocationName -ne '.') {
foreach ($file in $Files) {
    if (-not (Test-Path -LiteralPath $file)) {
        Write-Warning "Skip missing file: $file"
        continue
    }

    Write-Host "Repairing: $file"
    $raw = Read-Utf8 $file
    $before = Test-CompiledPrayers $raw
    Write-Host ("  Before: {0} numbered, unnumbered={1}, 607-guile={2}, 654-stupor={3}" -f $before.Count, $before.Unnumbered, $before.Has607Guile, $before.Has654Stupor)

    if ($before.Count -eq 666 -and $before.Has607Guile -and $before.Has654Stupor -and $before.Unnumbered -eq 0) {
        Write-Host '  Already aligned — no changes.'
        continue
    }

    $fixed = Repair-CompiledPrayers $raw
    $after = Test-CompiledPrayers $fixed
    Write-Host ("  After:  {0} numbered, unnumbered={1}, gaps={2}, dupes={3}" -f $after.Count, $after.Unnumbered, $after.Gaps, $after.Duplicates)

    if ($after.Count -ne 666 -or $after.Gaps -or $after.Duplicates -or -not $after.Has607Guile -or -not $after.Has654Stupor) {
        throw "Repair validation failed for $file"
    }

    if ($WhatIf) {
        Write-Host '  WhatIf — not writing.'
    } else {
        Write-Utf8 $file $fixed
        Write-Host '  Saved.'
    }
}
}