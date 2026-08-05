# Fetch CARM pages for Part 6 study - saves raw HTML + extracted text
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$OutDir = Join-Path $Root 'data/carm-part6-cache'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$urls = @(
    'https://carm.org/bahai'
    'https://carm.org/buddhism'
    'https://carm.org/orthodox-church'
    'https://carm.org/hinduism'
    'https://carm.org/islam'
    'https://carm.org/jehovahs-witnesses'
    'https://carm.org/kingdom-of-jesus-christ'
    'https://carm.org/mormonism'
    'https://carm.org/oneness-pentecostal'
    'https://carm.org/roman-catholicism'
    'https://carm.org/seventh-day-adventist'
    'https://carm.org/wicca'
    'https://carm.org/christian-science'
    'https://carm.org/amish'
    'https://carm.org/black-hebrew-israelite'
    'https://carm.org/kabbalah'
    'https://carm.org/open-theism'
    'https://carm.org/philadelphia-church-of-god'
    'https://carm.org/rastafari'
    'https://carm.org/scientology'
    'https://carm.org/westboro-baptist-church'
    'https://carm.org/about-occult'
    'https://carm.org/what-is-the-biblical-view-of-discipleship'
    'https://carm.org/what-is-the-cost-of-discipleship'
    'https://carm.org/you-may-buy-slaves'
    'https://carm.org/a-slave-is-property'
    'https://carm.org/why-were-only-the-virgins-left-alive-among-the-midianites-in-numbers-3117-18'
)

function Get-Slug([string]$url) {
    ($url -replace 'https://carm.org/', '') -replace '/', '_'
}

function Extract-CarmLinks([string]$html, [string]$baseUrl) {
    $links = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $pattern = 'href="(https://carm\.org/[^"#?]+|/[^"#?]+)"'
    foreach ($m in [regex]::Matches($html, $pattern)) {
        $href = $m.Groups[1].Value
        if ($href.StartsWith('/')) { $href = 'https://carm.org' + $href }
        if ($href -match '/wp-content/|/feed/|\.(jpg|png|pdf|css|js)$') { continue }
        [void]$links.Add($href.TrimEnd('/'))
    }
    return @($links)
}

function Strip-Html([string]$html) {
    $t = $html -replace '(?s)<script.*?</script>', ''
    $t = $t -replace '(?s)<style.*?</style>', ''
    $t = $t -replace '(?s)<nav.*?</nav>', ''
    $t = $t -replace '(?s)<footer.*?</footer>', ''
    if ($t -match '(?s)<article[^>]*>(.*?)</article>') { $t = $Matches[1] }
    elseif ($t -match '(?s)<main[^>]*>(.*?)</main>') { $t = $Matches[1] }
    elseif ($t -match '(?s)<div class="entry-content"[^>]*>(.*?)</div>') { $t = $Matches[1] }
    $t = $t -replace '(?s)<h1[^>]*>(.*?)</h1>', "`n# `$1`n"
    $t = $t -replace '(?s)<h2[^>]*>(.*?)</h2>', "`n## `$1`n"
    $t = $t -replace '(?s)<h3[^>]*>(.*?)</h3>', "`n### `$1`n"
    $t = $t -replace '(?s)<li[^>]*>(.*?)</li>', "`n- `$1"
    $t = $t -replace '(?s)<p[^>]*>(.*?)</p>', "`n`$1`n"
    $t = $t -replace '<br\s*/?>', "`n"
    $t = $t -replace '<[^>]+>', ''
    $t = [System.Net.WebUtility]::HtmlDecode($t)
    $t = $t -replace '\s+\n', "`n" -replace '\n{3,}', "`n`n"
    return $t.Trim()
}

$allLinks = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$results = @()

foreach ($url in $urls) {
    $slug = Get-Slug $url
    $htmlPath = Join-Path $OutDir "$slug.html"
    $txtPath = Join-Path $OutDir "$slug.txt"
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 45 -Headers @{ 'User-Agent' = 'LivingWordMapStudy/1.0' }
        [System.IO.File]::WriteAllText($htmlPath, $resp.Content, [System.Text.UTF8Encoding]::new($false))
        $text = Strip-Html $resp.Content
        [System.IO.File]::WriteAllText($txtPath, $text, [System.Text.UTF8Encoding]::new($false))
        $childLinks = Extract-CarmLinks $resp.Content $url
        foreach ($l in $childLinks) { [void]$allLinks.Add($l) }
        $results += [pscustomobject]@{ Url = $url; Slug = $slug; Status = 'OK'; Len = $text.Length; Links = $childLinks.Count }
        Write-Host "OK $slug ($($text.Length) chars, $($childLinks.Count) links)"
    } catch {
        $results += [pscustomobject]@{ Url = $url; Slug = $slug; Status = "FAIL: $($_.Exception.Message)"; Len = 0; Links = 0 }
        Write-Host "FAIL $slug"
    }
    Start-Sleep -Milliseconds 400
}

# Fetch extra child links (one hop) not in seed list
$seedSet = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($u in $urls) { [void]$seedSet.Add($u.TrimEnd('/')) }

$extra = @($allLinks | Where-Object { -not $seedSet.Contains($_) -and $_ -match '^https://carm\.org/' })
$extra = $extra | Sort-Object -Unique
Write-Host "`nExtra CARM links found: $($extra.Count)"

$extraFetched = 0
foreach ($url in $extra) {
    if ($extraFetched -ge 80) { break }
    $slug = Get-Slug $url
    if ($slug.Length -gt 120) { $slug = $slug.Substring(0, 120) }
    $txtPath = Join-Path $OutDir "extra_$slug.txt"
    if (Test-Path $txtPath) { continue }
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 45 -Headers @{ 'User-Agent' = 'LivingWordMapStudy/1.0' }
        $text = Strip-Html $resp.Content
        if ($text.Length -lt 200) { continue }
        [System.IO.File]::WriteAllText($txtPath, $text, [System.Text.UTF8Encoding]::new($false))
        $extraFetched++
        Write-Host "EXTRA OK $slug ($($text.Length))"
    } catch { }
    Start-Sleep -Milliseconds 300
}

$results | Export-Csv -Path (Join-Path $OutDir 'fetch-log.csv') -NoTypeInformation
Write-Host "Done. Cache: $OutDir"
