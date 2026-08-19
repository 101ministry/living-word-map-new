param(
    [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\public')).Path
$prefixes = @(
    "http://localhost:$Port/"
    "http://127.0.0.1:$Port/"
)

$listener = New-Object System.Net.HttpListener
foreach ($prefix in $prefixes) {
    $listener.Prefixes.Add($prefix)
}

try {
    $listener.Start()
}
catch {
    Write-Host ''
    Write-Host 'Could not start the local server on port' $Port
    Write-Host $_.Exception.Message
    Write-Host ''
    Write-Host 'Usually this means another Living Word Map server is already running,'
    Write-Host 'or a previous server did not shut down cleanly.'
    Write-Host ''
    Write-Host 'Try: close any minimized "Living Word Map Server" PowerShell windows,'
    Write-Host 'then run open.bat again — or use restart-server.bat.'
    Write-Host ''
    Read-Host 'Press Enter to close'
    exit 1
}

Write-Host 'Living Word Map'
Write-Host "Serving: $root"
Write-Host "Open:    http://localhost:$Port/index.html"
Write-Host 'Press Ctrl+C to stop.'
Write-Host ''

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.mp3'  = 'audio/mpeg'
    '.txt'  = 'text/plain; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.ico'  = 'image/x-icon'
}

function Send-Bytes($context, [byte[]]$bytes, [string]$contentType) {
    $response = $context.Response
    $response.ContentType = $contentType
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
}

function Send-Text($context, [string]$text, [int]$statusCode, [string]$contentType) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    $context.Response.StatusCode = $statusCode
    Send-Bytes $context $bytes $contentType
}

$nominatimUa = 'LivingWordMap/1.0 (experimental prayer builder; local serve.ps1)'

function Invoke-NominatimUrl([string]$url) {
    return Invoke-WebRequest -Uri $url -UserAgent $nominatimUa -Headers @{ Accept = 'application/json'; 'Accept-Language' = 'en' } -UseBasicParsing -TimeoutSec 25
}

function Send-Nominatim($context, [string]$url) {
    try {
        $resp = Invoke-NominatimUrl $url
        Send-Text $context $resp.Content 200 'application/json; charset=utf-8'
    }
    catch {
        Send-Text $context '{"error":"Nominatim upstream failed"}' 502 'application/json; charset=utf-8'
    }
}

function Handle-Api($context) {
    $abs = $context.Request.Url.AbsolutePath.TrimEnd('/')
    $qs = $context.Request.QueryString

    if ($abs -eq '/api/geocode') {
        $q = [string]$qs['q']
        if ([string]::IsNullOrWhiteSpace($q) -or $q.Length -lt 2) {
            Send-Text $context '{"error":"Missing q"}' 400 'application/json; charset=utf-8'
            return $true
        }
        $url = "https://nominatim.openstreetmap.org/search?q=$([Uri]::EscapeDataString($q))&format=json&addressdetails=1&limit=1"
        try {
            $resp = Invoke-NominatimUrl $url
            $hits = $resp.Content | ConvertFrom-Json
            $hit = $null
            if ($hits -is [System.Array] -and $hits.Count -gt 0) { $hit = $hits[0] }
            elseif ($hits) { $hit = $hits }
            if (-not $hit) {
                Send-Text $context '{"ok":true,"found":false}' 200 'application/json; charset=utf-8'
                return $true
            }
            $addr = $hit.address
            $out = @{
                ok          = $true
                found       = $true
                lat         = [double]$hit.lat
                lon         = [double]$hit.lon
                displayName = [string]$hit.display_name
                city        = [string]($(if ($addr.city) { $addr.city } elseif ($addr.town) { $addr.town } elseif ($addr.village) { $addr.village } else { '' }))
                state       = [string]($(if ($addr.state) { $addr.state } elseif ($addr.region) { $addr.region } elseif ($addr.province) { $addr.province } else { '' }))
                country     = [string]$addr.country
                countryCode = ([string]$addr.country_code).ToLowerInvariant()
                boundingbox = $hit.boundingbox
            }
            Send-Text $context ($out | ConvertTo-Json -Compress -Depth 6) 200 'application/json; charset=utf-8'
        }
        catch {
            Send-Text $context '{"error":"Geocode upstream failed"}' 502 'application/json; charset=utf-8'
        }
        return $true
    }

    if ($abs -eq '/api/nominatim') {
        $mode = ([string]$qs['mode']).ToLowerInvariant()
        $polygon = [string]$qs['polygon'] -eq '1'
        $extra = '&format=json&addressdetails=1'
        if ($polygon) { $extra += '&polygon_geojson=1&polygon_threshold=0.002' }
        if ($mode -eq 'reverse') {
            $lat = [string]$qs['lat']
            $lon = [string]$qs['lon']
            $zoom = [string]$qs['zoom']
            if ([string]::IsNullOrWhiteSpace($lat) -or [string]::IsNullOrWhiteSpace($lon)) {
                Send-Text $context '{"error":"Missing lat/lon"}' 400 'application/json; charset=utf-8'
                return $true
            }
            if ([string]::IsNullOrWhiteSpace($zoom)) { $zoom = '5' }
            Send-Nominatim $context "https://nominatim.openstreetmap.org/reverse?lat=$([Uri]::EscapeDataString($lat))&lon=$([Uri]::EscapeDataString($lon))&zoom=$([Uri]::EscapeDataString($zoom))$extra"
            return $true
        }
        if ($mode -eq 'search') {
            $q = [string]$qs['q']
            $city = [string]$qs['city']
            $state = [string]$qs['state']
            $county = [string]$qs['county']
            $country = [string]$qs['country']
            $structured = -not [string]::IsNullOrWhiteSpace($city) -or -not [string]::IsNullOrWhiteSpace($state) -or -not [string]::IsNullOrWhiteSpace($country)
            if (-not $structured -and ([string]::IsNullOrWhiteSpace($q) -or $q.Length -lt 2)) {
                Send-Text $context '{"error":"Missing q"}' 400 'application/json; charset=utf-8'
                return $true
            }
            $nom = "https://nominatim.openstreetmap.org/search?limit=8$extra"
            if ($structured) {
                if (-not [string]::IsNullOrWhiteSpace($city)) { $nom += "&city=$([Uri]::EscapeDataString($city))" }
                if (-not [string]::IsNullOrWhiteSpace($county)) { $nom += "&county=$([Uri]::EscapeDataString($county))" }
                if (-not [string]::IsNullOrWhiteSpace($state)) { $nom += "&state=$([Uri]::EscapeDataString($state))" }
                if (-not [string]::IsNullOrWhiteSpace($country)) { $nom += "&country=$([Uri]::EscapeDataString($country))" }
            } else {
                $nom += "&q=$([Uri]::EscapeDataString($q))"
            }
            Send-Nominatim $context $nom
            return $true
        }
        Send-Text $context '{"error":"mode must be search or reverse"}' 400 'application/json; charset=utf-8'
        return $true
    }

    if ($abs -eq '/api/experimental-account') {
        if ($context.Request.HttpMethod -ne 'POST') {
            Send-Text $context '{"error":"Method not allowed"}' 405 'application/json; charset=utf-8'
            return $true
        }
        $reader = New-Object System.IO.StreamReader($context.Request.InputStream, [System.Text.Encoding]::UTF8)
        $raw = $reader.ReadToEnd()
        $reader.Close()
        try {
            $body = $raw | ConvertFrom-Json
        }
        catch {
            Send-Text $context '{"error":"Invalid JSON"}' 400 'application/json; charset=utf-8'
            return $true
        }
        $name = [string]$body.name
        $hash = [string]$body.passwordHash
        $action = [string]$body.action
        if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($hash) -or ($action -ne 'save' -and $action -ne 'load')) {
            Send-Text $context '{"error":"Missing name, password, or action"}' 400 'application/json; charset=utf-8'
            return $true
        }
        $storePath = Join-Path (Split-Path $root -Parent) '.experimental-accounts.json'
        $store = @{}
        if (Test-Path -LiteralPath $storePath) {
            try {
                $parsed = Get-Content -LiteralPath $storePath -Raw -Encoding UTF8 | ConvertFrom-Json
                if ($parsed) {
                    $parsed.PSObject.Properties | ForEach-Object { $store[$_.Name] = $_.Value }
                }
            }
            catch { $store = @{} }
        }
        $key = ($name.Trim() -replace '\s+', ' ').ToLowerInvariant()
        $rec = $store[$key]
        if ($action -eq 'load') {
            if (-not $rec) {
                Send-Text $context '{"ok":true,"found":false}' 200 'application/json; charset=utf-8'
                return $true
            }
            if ([string]$rec.passwordHash -ne $hash) {
                Send-Text $context '{"error":"auth"}' 401 'application/json; charset=utf-8'
                return $true
            }
            $out = @{ ok = $true; found = $true; snapshot = $rec.snapshot }
            Send-Text $context ($out | ConvertTo-Json -Compress -Depth 20) 200 'application/json; charset=utf-8'
            return $true
        }
        if ($rec -and [string]$rec.passwordHash -ne $hash) {
            Send-Text $context '{"error":"auth"}' 401 'application/json; charset=utf-8'
            return $true
        }
        $store[$key] = @{
            passwordHash = $hash
            snapshot     = $body.snapshot
            updatedAt    = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        }
        ($store | ConvertTo-Json -Depth 20) | Set-Content -LiteralPath $storePath -Encoding UTF8
        Send-Text $context '{"ok":true,"saved":true}' 200 'application/json; charset=utf-8'
        return $true
    }

    return $false
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            if (Handle-Api $context) { continue }
            $path = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
            if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
            $path = $path -replace '/', [System.IO.Path]::DirectorySeparatorChar
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $path))

            if (-not $fullPath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
                Send-Text $context 'Forbidden' 403 'text/plain; charset=utf-8'
                continue
            }

            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                Send-Text $context 'Not found' 404 'text/plain; charset=utf-8'
                continue
            }

            $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
            $type = $mime[$ext]
            if (-not $type) { $type = 'application/octet-stream' }
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            Send-Bytes $context $bytes $type
        }
        catch {
            try {
                Send-Text $context 'Internal Server Error' 500 'text/plain; charset=utf-8'
            }
            catch { }
        }
    }
}
finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
}
