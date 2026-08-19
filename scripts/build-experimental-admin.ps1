<#
  Download simplified geoBoundaries ADM1 (or ADM2) polygons and compact them
  into public/experimental/geo/admin/{iso2}.json for the Experimental builder.

  Default: current case-load countries. Pass -Worldwide to add a broader first wave.
#>
param(
    [switch]$Worldwide
)

$ErrorActionPreference = 'Stop'
$outDir = Join-Path $PSScriptRoot '..\public\experimental\geo\admin'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$iso2From3 = @{
    USA = 'us'; CAN = 'ca'; GBR = 'gb'; IRL = 'ie'; PRI = 'pr'
    UGA = 'ug'; COD = 'cd'; COG = 'cg'; ZAF = 'za'; NGA = 'ng'; NAM = 'na'
    KEN = 'ke'; GHA = 'gh'; TZA = 'tz'; RWA = 'rw'; ETH = 'et'
    MEX = 'mx'; BRA = 'br'; ARG = 'ar'; COL = 'co'; PER = 'pe'
    FRA = 'fr'; DEU = 'de'; ESP = 'es'; ITA = 'it'; NLD = 'nl'; POL = 'pl'
    IND = 'in'; PHL = 'ph'; AUS = 'au'; JPN = 'jp'; KOR = 'kr'; IDN = 'id'
    PAK = 'pk'; BGD = 'bd'; VNM = 'vn'; THA = 'th'; MYS = 'my'; NZL = 'nz'
    EGY = 'eg'; MAR = 'ma'; TUR = 'tr'; JAM = 'jm'; HTI = 'ht'
    LBR = 'lr'; SLE = 'sl'; CMR = 'cm'; AGO = 'ao'; MOZ = 'mz'
    ZWE = 'zw'; BWA = 'bw'; MWI = 'mw'; ZMB = 'zm'; SEN = 'sn'
    CIV = 'ci'; CHN = 'cn'
}

$kindFromCanonical = @{
    States = 'state'; State = 'state'
    Province = 'province'; Provinces = 'province'
    Region = 'region'; Regions = 'region'
    County = 'county'; Counties = 'county'
    'Counties and Unitary Authorities' = 'county'
    Parish = 'parish'; District = 'district'; Municipality = 'municipality'
    'Administrative Division' = 'region'
    Country = 'country'
}

$core = @(
    @{ iso3 = 'USA'; adm = 'ADM1' }
    @{ iso3 = 'CAN'; adm = 'ADM1' }
    @{ iso3 = 'GBR'; adm = 'ADM2' }
    @{ iso3 = 'UGA'; adm = 'ADM1' }
    @{ iso3 = 'COD'; adm = 'ADM1' }
    @{ iso3 = 'COG'; adm = 'ADM1' }
    @{ iso3 = 'ZAF'; adm = 'ADM1' }
    @{ iso3 = 'NGA'; adm = 'ADM1' }
    @{ iso3 = 'NAM'; adm = 'ADM1' }
)

$extra = @(
    'KEN','GHA','TZA','RWA','ETH','MEX','BRA','ARG','COL','PER',
    'FRA','DEU','ESP','ITA','NLD','POL','IRL','IND','PHL','AUS',
    'JPN','KOR','IDN','PAK','BGD','VNM','THA','MYS','NZL','EGY',
    'MAR','TUR','JAM','HTI','LBR','SLE','CMR','AGO','MOZ','ZWE',
    'BWA','MWI','ZMB','SEN','CIV','CHN'
) | ForEach-Object { @{ iso3 = $_; adm = 'ADM1' } }

$targets = if ($Worldwide) { $core + $extra } else { $core }

function Json-Escape([string]$s) {
    if ($null -eq $s) { return '' }
    return (($s -replace '\\', '\\') -replace '"', '\"')
}

function Append-Num($sb, [double]$n) {
    [void]$sb.Append($n.ToString('0.0000', [cultureinfo]::InvariantCulture))
}

function Append-Ring($sb, $ring, [int]$maxPts) {
    $arr = @($ring)
    $n = $arr.Count
    if ($n -lt 2) { [void]$sb.Append('[]'); return }
    $step = if ($n -gt $maxPts) { [Math]::Max(1, [Math]::Ceiling($n / $maxPts)) } else { 1 }
    [void]$sb.Append('[')
    $firstLon = [double]$arr[0][0]
    $firstLat = [double]$arr[0][1]
    $lastLon = $firstLon
    $lastLat = $firstLat
    $wrote = 0
    for ($i = 0; $i -lt $n; $i += $step) {
        $lon = [double]$arr[$i][0]
        $lat = [double]$arr[$i][1]
        if ($wrote) { [void]$sb.Append(',') }
        [void]$sb.Append('[')
        Append-Num $sb $lon
        [void]$sb.Append(',')
        Append-Num $sb $lat
        [void]$sb.Append(']')
        $lastLon = $lon
        $lastLat = $lat
        $wrote += 1
    }
    if ($firstLon -ne $lastLon -or $firstLat -ne $lastLat) {
        [void]$sb.Append(',[')
        Append-Num $sb $firstLon
        [void]$sb.Append(',')
        Append-Num $sb $firstLat
        [void]$sb.Append(']')
    }
    [void]$sb.Append(']')
}

function Append-Geometry($sb, $geom, [int]$maxPts) {
    $type = [string]$geom.type
    if ($type -eq 'Polygon') {
        [void]$sb.Append('{"type":"Polygon","coordinates":[')
        $ri = 0
        foreach ($ring in $geom.coordinates) {
            if ($ri) { [void]$sb.Append(',') }
            Append-Ring $sb $ring $(if ($ri -eq 0) { $maxPts } else { 40 })
            $ri += 1
        }
        [void]$sb.Append(']}')
        return $true
    }
    if ($type -eq 'MultiPolygon') {
        [void]$sb.Append('{"type":"MultiPolygon","coordinates":[')
        $pi = 0
        foreach ($poly in $geom.coordinates) {
            if ($pi) { [void]$sb.Append(',') }
            [void]$sb.Append('[')
            $ri = 0
            foreach ($ring in $poly) {
                if ($ri) { [void]$sb.Append(',') }
                Append-Ring $sb $ring $(if ($ri -eq 0) { $maxPts } else { 40 })
                $ri += 1
            }
            [void]$sb.Append(']')
            $pi += 1
        }
        [void]$sb.Append(']}')
        return $true
    }
    return $false
}

function Convert-Kind([string]$canonical, [string]$adm) {
    if ($kindFromCanonical.ContainsKey($canonical)) { return $kindFromCanonical[$canonical] }
    if ($adm -eq 'ADM2') { return 'county' }
    return 'region'
}

$index = @{}
$ua = 'LivingWordMap/1.0 (experimental admin build; local)'
$prJson = $null

foreach ($t in $targets) {
    $iso2 = $iso2From3[$t.iso3]
    if (-not $iso2) {
        Write-Host "Skip $($t.iso3): no ISO2 map"
        continue
    }
    $outFile = Join-Path $outDir "$iso2.json"
    Write-Host "Building $($t.iso3) $($t.adm) -> $iso2.json"
    try {
        $metaPath = Join-Path $env:TEMP "gb-meta-$($t.iso3)-$($t.adm).json"
        if (-not (Test-Path $metaPath)) {
            $metaUrl = "https://www.geoboundaries.org/api/current/gbOpen/$($t.iso3)/$($t.adm)/"
            & curl.exe -sS -L -A $ua $metaUrl -o $metaPath
        }
        $metaRaw = Get-Content $metaPath -Raw
        if ($metaRaw -notmatch '"simplifiedGeometryGeoJSON"') {
            Write-Host "  no geoBoundaries coverage"
            continue
        }
        $meta = $metaRaw | ConvertFrom-Json
        $rawPath = Join-Path $env:TEMP "gb-raw-$($t.iso3)-$($t.adm).geojson"
        if (-not (Test-Path $rawPath) -or (Get-Item $rawPath).Length -lt 200) {
            $src = [string]$meta.simplifiedGeometryGeoJSON
            & curl.exe -sS -L -A $ua $src -o $rawPath
        }
        $bytes = (Get-Item $rawPath).Length
        if ($bytes -lt 200) {
            Write-Host "  empty download ($bytes bytes)"
            continue
        }
        Write-Host "  compacting $bytes bytes…"
        $gj = Get-Content $rawPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $kind = Convert-Kind ([string]$meta.boundaryCanonical) $t.adm
        $country = Json-Escape ([string]$meta.boundaryName)
        $sb = New-Object System.Text.StringBuilder
        [void]$sb.Append('{"type":"FeatureCollection","country":"').Append($country).Append('","iso2":"').Append($iso2).Append('","kind":"').Append($kind).Append('","source":"geoboundaries-simplified","features":[')
        $count = 0
        $prChunk = $null
        foreach ($f in $gj.features) {
            $name = [string]$f.properties.shapeName
            if (-not $name) { $name = [string]$f.properties.name }
            $feat = New-Object System.Text.StringBuilder
            [void]$feat.Append('{"type":"Feature","properties":{"name":"').Append((Json-Escape $name)).Append('","kind":"').Append($kind).Append('","iso":"').Append($iso2).Append('"},"geometry":')
            if (-not (Append-Geometry $feat $f.geometry 90)) { continue }
            [void]$feat.Append('}')
            if ($count) { [void]$sb.Append(',') }
            [void]$sb.Append($feat.ToString())
            if ($iso2 -eq 'us' -and $name -eq 'Puerto Rico') {
                $prChunk = $feat.ToString().Replace('"iso":"us"', '"iso":"pr"')
            }
            $count += 1
        }
        [void]$sb.Append(']}')
        [System.IO.File]::WriteAllText($outFile, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))
        $index[$iso2] = @{
            country = [string]$meta.boundaryName
            kind = $kind
            count = $count
            bytes = ([System.IO.FileInfo]$outFile).Length
        }
        Write-Host ("  wrote {0} units, {1} bytes" -f $count, $index[$iso2].bytes)
        if ($prChunk) { $prJson = $prChunk }
    }
    catch {
        Write-Host "  failed: $($_.Exception.Message)"
    }
}

$indexPath = Join-Path $outDir 'index.json'
[System.IO.File]::WriteAllText($indexPath, ($index | ConvertTo-Json -Compress))
Write-Host "Index: $indexPath"

$indexPath = Join-Path $outDir 'index.json'
[System.IO.File]::WriteAllText($indexPath, ($index | ConvertTo-Json -Compress), [System.Text.UTF8Encoding]::new($false))
Write-Host "Index: $indexPath"

if ($prJson) {
    $prFile = Join-Path $outDir 'pr.json'
    $prDoc = '{"type":"FeatureCollection","country":"Puerto Rico","iso2":"pr","kind":"state","source":"geoboundaries-simplified","features":[' + $prJson + ']}'
    [System.IO.File]::WriteAllText($prFile, $prDoc, [System.Text.UTF8Encoding]::new($false))
    $index['pr'] = @{ country = 'Puerto Rico'; kind = 'state'; count = 1; bytes = ([IO.FileInfo]$prFile).Length }
    [System.IO.File]::WriteAllText($indexPath, ($index | ConvertTo-Json -Compress), [System.Text.UTF8Encoding]::new($false))
    Write-Host "Extracted Puerto Rico -> pr.json"
}

Get-ChildItem $outDir | Select-Object Name, Length | Format-Table -AutoSize
