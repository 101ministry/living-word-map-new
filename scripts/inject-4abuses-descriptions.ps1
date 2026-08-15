# Inject "4 abuses / 24 cases" teaching wording into TOPICS-666 detail blocks for #279-302.
param(
    [string]$TopicsFile = "$PSScriptRoot\..\data\TOPICS-666.txt"
)

$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)

function Build-AbuseDescription([string]$phrase) {
    $p = $phrase.Trim()
    return @"
The primary reason that $p happens to anyone is because the perp sought to control your emotions, body, personality, and how you speak

The secondary reason that $p happened is because spiritually, your soul is being controlled by the 4 fruits

Anything after this becomes
The way you walk out emotions is based on how you've been treated
The way your body language speaks to others as they pass by
The way your personality is stunted
The way you address other people from the standpoint of wounding instead of firm foundation.
"@.Trim()
}

# Exact PDF phrases for cases 1-11 (#279-289); same template continues for #290-302.
$phrases = @{
    279 = 'sexual abuse'
    280 = 'walking in hatred'
    281 = 'walking in strife'
    282 = 'walking in contention'
    283 = 'walking in ill-temper'
    284 = 'walking in anger'
    285 = 'walking in rage'
    286 = 'walking in violence and cruelty'
    287 = 'hating both God and mankind'
    288 = 'blasphemy against God'
    289 = 'willfully separating self from God and men'
    290 = 'scorner, mocker, scoffer'
    291 = 'hater of all that is pure and good'
    292 = 'reckless speaking'
    293 = 'flattering for gain'
    294 = "being resentful, envious and jealous of another's life and blessings"
    295 = 'seeking revenge'
    296 = 'cursing others by thoughts'
    297 = 'cursing others by words'
    298 = 'cursing others by actions'
    299 = 'delighting in the destruction of another'
    300 = "purposeful lying to destroy another's life"
    301 = 'human trafficking'
    302 = 'slavery'
}

$raw = [System.IO.File]::ReadAllText($TopicsFile, $Utf8)
$parts = [regex]::Split($raw, '(?=\d{3}\.\s+\S)')
$out = New-Object System.Collections.Generic.List[string]
$updated = 0

foreach ($part in $parts) {
    if ($part -notmatch '(?m)^(\d{3})\.') {
        if ($part) { [void]$out.Add($part) }
        continue
    }

    $num = [int]$Matches[1]
    if (-not $phrases.ContainsKey($num)) {
        [void]$out.Add($part)
        continue
    }

    $desc = Build-AbuseDescription $phrases[$num]

    if ($part -notmatch '(?ms)^(?<head>\d{3}\.\s.+?\.\s*\r?\n\r?\n)(?<body>.*)$') {
        Write-Warning "Could not parse topic $num"
        [void]$out.Add($part)
        continue
    }

    $head = $Matches['head']
    $body = $Matches['body']

    $sep = ''
    $core = $body
    if ($body -match '(?ms)^(?<core>.*?)(?<sep>\r?\n~~~~~~~~~~~~[\s\S]*)$') {
        $core = $Matches['core']
        $sep = $Matches['sep']
    }

    # Drop a prior injection so re-runs stay idempotent.
    $core = [regex]::Replace($core, '(?ms)\r?\n\r?\nThe primary reason that .+?\bfoundation\.\s*', '').Trim()
    $firstPara = ($core -split '(\r?\n){2,}', 2)[0].Trim()

    $newPart = "$head$firstPara`r`n`r`n$desc$sep"
    [void]$out.Add($newPart)
    $updated++
}

[System.IO.File]::WriteAllText($TopicsFile, ($out -join ''), $Utf8)
Write-Host "Injected abuse descriptions into $updated topics ($TopicsFile)"
