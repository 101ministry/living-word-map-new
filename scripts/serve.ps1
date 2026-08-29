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

function Send-Json($context, $obj, [int]$statusCode, [hashtable]$extraHeaders) {
    $text = if ($obj -is [string]) { $obj } else { $obj | ConvertTo-Json -Compress -Depth 20 }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    $response = $context.Response
    $response.StatusCode = $statusCode
    $response.ContentType = 'application/json; charset=utf-8'
    if ($extraHeaders) {
        foreach ($entry in $extraHeaders.GetEnumerator()) {
            $response.Headers.Add([string]$entry.Key, [string]$entry.Value)
        }
    }
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
}

function Handle-Api($context) {
    $abs = $context.Request.Url.AbsolutePath.TrimEnd('/')
    $qs = $context.Request.QueryString

    if ($abs -eq '/api/map-tile') {
        $z = 0; $x = 0; $y = 0
        [int]::TryParse([string]$qs['z'], [ref]$z) | Out-Null
        [int]::TryParse([string]$qs['x'], [ref]$x) | Out-Null
        [int]::TryParse([string]$qs['y'], [ref]$y) | Out-Null
        if ($z -lt 0 -or $z -gt 16 -or $x -lt 0 -or $y -lt 0) {
            Send-Text $context 'Bad tile' 400 'text/plain; charset=utf-8'
            return $true
        }
        $max = [int][Math]::Pow(2, $z)
        if ($x -ge $max -or $y -ge $max) {
            Send-Text $context 'Bad tile' 400 'text/plain; charset=utf-8'
            return $true
        }
        $tileUrl = "https://basemaps.cartocdn.com/rastertiles/voyager/$z/$x/${y}@2x.png"
        try {
            $resp = Invoke-WebRequest -Uri $tileUrl -UserAgent $nominatimUa -UseBasicParsing -TimeoutSec 20
            $context.Response.Headers['Cache-Control'] = 'public, max-age=86400'
            Send-Bytes $context $resp.Content 'image/png'
        }
        catch {
            Send-Text $context 'Tile upstream failed' 502 'text/plain; charset=utf-8'
        }
        return $true
    }

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

    if ($abs -like '/api/experimental-auth*') {
        $repoRoot = Split-Path $root -Parent
        $allowPath = Join-Path $repoRoot 'data\experimental-allowlist.json'
        $sessionPath = Join-Path $repoRoot '.experimental-sessions.json'
        $presencePath = Join-Path $repoRoot '.experimental-presence.json'
        $accountPath = Join-Path $repoRoot '.experimental-accounts.json'
        $sessionCookie = 'lwm_exp_session'
        $sessionTtlMs = 30L * 24L * 60L * 60L * 1000L

        function Get-AccountKey([string]$name) {
            return ($name.Trim() -replace '\s+', ' ').ToLowerInvariant()
        }

        function Get-Allowlist {
            if (-not (Test-Path -LiteralPath $allowPath)) {
                return @{ enabled = $true; names = @() }
            }
            try {
                return Get-Content -LiteralPath $allowPath -Raw -Encoding UTF8 | ConvertFrom-Json
            }
            catch {
                return @{ enabled = $true; names = @() }
            }
        }

        function Test-Allowlisted([string]$name, $allowlist) {
            if (-not $allowlist.enabled) { return $false }
            $key = Get-AccountKey $name
            foreach ($n in @($allowlist.names)) {
                if ((Get-AccountKey ([string]$n)) -eq $key) { return $true }
            }
            return $false
        }

        function Normalize-InviteCode([string]$raw) {
            if ([string]::IsNullOrWhiteSpace($raw)) { return '' }
            return ($raw.Trim().ToUpperInvariant() -replace '\s+', '')
        }

        function Test-InviteFormat([string]$code) {
            return $code -match '^LWM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$'
        }

        function Get-InvitesStore {
            $invitesPath = Join-Path $repoRoot 'data\experimental-invites.json'
            $codes = @{}
            if (Test-Path -LiteralPath $invitesPath) {
                try {
                    $parsed = Get-Content -LiteralPath $invitesPath -Raw -Encoding UTF8 | ConvertFrom-Json
                    if ($parsed.codes) {
                        $parsed.codes.PSObject.Properties | ForEach-Object { $codes[$_.Name] = $_.Value }
                    }
                }
                catch { $codes = @{} }
            }
            return @{ codes = $codes }
        }

        function Save-InvitesStore($store) {
            $invitesPath = Join-Path $repoRoot 'data\experimental-invites.json'
            (@{ codes = $store.codes; note = 'One-time invite codes for Experimental Prayer Builder.' } | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $invitesPath -Encoding UTF8
        }

        function Test-InviteForLogin([string]$inviteRaw, [string]$acctKey, [string]$name, [bool]$acctExists) {
            if ($acctExists) { return @{ ok = $true } }
            $allowlist = Get-Allowlist
            if (Test-Allowlisted $name $allowlist) { return @{ ok = $true } }

            $inviteCode = Normalize-InviteCode $inviteRaw
            if ([string]::IsNullOrWhiteSpace($inviteCode)) {
                return @{ ok = $false; error = 'invite'; message = 'Invite code required for first-time entry. Ask in Slack for a code.' }
            }
            if (-not (Test-InviteFormat $inviteCode)) {
                return @{ ok = $false; error = 'invite'; message = 'Invite code format looks wrong (LWM-XXXX-XXXX).' }
            }
            $store = Get-InvitesStore
            if (-not $store.codes.ContainsKey($inviteCode)) {
                return @{ ok = $false; error = 'invite'; message = 'That invite code is not recognized.' }
            }
            $rec = $store.codes[$inviteCode]
            if ([bool]$rec.used) {
                if ([string]$rec.accountKey -eq $acctKey) { return @{ ok = $true } }
                return @{ ok = $false; error = 'invite'; message = 'This invite code was already used.' }
            }
            return @{ ok = $true; redeem = $inviteCode }
        }

        function Redeem-Invite([string]$inviteCode, [string]$acctKey, [string]$name) {
            $store = Get-InvitesStore
            if (-not $store.codes.ContainsKey($inviteCode)) { return }
            $rec = $store.codes[$inviteCode]
            if ([bool]$rec.used) { return }
            $store.codes[$inviteCode] = @{
                used       = $true
                accountKey = $acctKey
                name       = $name.Trim()
                usedAt     = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                createdAt  = $rec.createdAt
            }
            Save-InvitesStore $store
        }

        function Get-RequestCookies($request) {
            $out = @{}
            $header = [string]$request.Headers['Cookie']
            if ([string]::IsNullOrWhiteSpace($header)) { return $out }
            foreach ($part in ($header -split ';')) {
                $idx = $part.IndexOf('=')
                if ($idx -gt 0) {
                    $k = $part.Substring(0, $idx).Trim()
                    $v = [System.Uri]::UnescapeDataString($part.Substring($idx + 1).Trim())
                    $out[$k] = $v
                }
            }
            return $out
        }

        function Get-SessionStore {
            $store = @{}
            if (Test-Path -LiteralPath $sessionPath) {
                try {
                    $parsed = Get-Content -LiteralPath $sessionPath -Raw -Encoding UTF8 | ConvertFrom-Json
                    if ($parsed) {
                        $parsed.PSObject.Properties | ForEach-Object { $store[$_.Name] = $_.Value }
                    }
                }
                catch { $store = @{} }
            }
            return $store
        }

        function Save-SessionStore($store) {
            ($store | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $sessionPath -Encoding UTF8
        }

        function Get-SessionFromRequest($request) {
            $cookies = Get-RequestCookies $request
            $token = [string]$cookies[$sessionCookie]
            if ($token -notmatch '^[a-f0-9]{64}$') { return $null }
            $store = Get-SessionStore
            if (-not $store.ContainsKey($token)) { return $null }
            $rec = $store[$token]
            $expires = [int64]$rec.expiresAt
            if ($expires -gt 0 -and $expires -lt [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) { return $null }
            return @{ token = $token; rec = $rec }
        }

        function Get-PresenceTokens {
            $tokens = @{}
            if (Test-Path -LiteralPath $presencePath) {
                try {
                    $parsed = Get-Content -LiteralPath $presencePath -Raw -Encoding UTF8 | ConvertFrom-Json
                    if ($parsed.tokens) {
                        $parsed.tokens.PSObject.Properties | ForEach-Object { $tokens[$_.Name] = $_.Value }
                    }
                }
                catch { $tokens = @{} }
            }
            return $tokens
        }

        function Save-PresenceTokens($tokens) {
            (@{ tokens = $tokens } | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $presencePath -Encoding UTF8
        }

        function Remove-PresenceForAccount($tokens, [string]$acctKey) {
            $remove = @()
            foreach ($entry in $tokens.GetEnumerator()) {
                if ([string]$entry.Value.accountKey -eq $acctKey) { $remove += $entry.Key }
            }
            foreach ($k in $remove) { $tokens.Remove($k) | Out-Null }
        }

        function Get-PresenceRegions($entries) {
            $counts = @{}
            foreach ($rec in $entries) {
                $k = [string]$rec.key
                if ([string]::IsNullOrWhiteSpace($k)) { continue }
                if (-not $counts.ContainsKey($k)) {
                    $counts[$k] = @{
                        key   = $k
                        name  = [string]$rec.name
                        iso2  = [string]$rec.iso2
                        grain = [string]$rec.grain
                        count = 0
                    }
                }
                $counts[$k].count = [int]$counts[$k].count + 1
            }
            return @($counts.Values)
        }

        function Get-FilteredPresence($tokens, $viewer) {
            $all = @($tokens.Values | Where-Object { $_ -and $_.key })
            $viewerKey = [string]$viewer.rec.accountKey
            $viewerShares = [bool]$viewer.rec.shareProgress
            $mine = $all | Where-Object { [string]$_.accountKey -eq $viewerKey } | Select-Object -First 1

            if (-not $viewerShares) {
                $regions = @()
                if ($mine) {
                    $regions = @(@{
                        key   = [string]$mine.key
                        name  = [string]$mine.name
                        iso2  = [string]$mine.iso2
                        grain = [string]$mine.grain
                        count = 1
                    })
                }
                return @{ regions = $regions; participants = @(); shareProgress = $false }
            }

            $consenting = @($all | Where-Object { [bool]$_.shareProgress })
            $regions = @(Get-PresenceRegions $consenting)
            $participants = @($consenting | ForEach-Object {
                @{
                    regionKey  = [string]$_.key
                    regionName = [string]$_.name
                    iso2       = [string]$_.iso2
                    grain      = [string]$_.grain
                    progress   = $_.progress
                }
            })
            return @{ regions = $regions; participants = $participants; shareProgress = $true }
        }

        $sub = $abs.Substring('/api/experimental-auth'.Length).TrimStart('/')

        if ($sub -eq 'me' -and $context.Request.HttpMethod -eq 'GET') {
            $viewer = Get-SessionFromRequest $context.Request
            if (-not $viewer) {
                Send-Text $context '{"error":"auth"}' 401 'application/json; charset=utf-8'
                return $true
            }
            $out = @{
                ok            = $true
                name          = [string]$viewer.rec.name
                accountKey    = [string]$viewer.rec.accountKey
                shareProgress = [bool]$viewer.rec.shareProgress
            }
            Send-Json $context $out 200 $null
            return $true
        }

        if ($sub -eq 'logout' -and $context.Request.HttpMethod -eq 'POST') {
            $viewer = Get-SessionFromRequest $context.Request
            if ($viewer) {
                $sessions = Get-SessionStore
                $sessions.Remove($viewer.token) | Out-Null
                Save-SessionStore $sessions
                $tokens = Get-PresenceTokens
                if ($tokens.ContainsKey($viewer.token)) {
                    $tokens.Remove($viewer.token) | Out-Null
                    Save-PresenceTokens $tokens
                }
            }
            Send-Json $context @{ ok = $true } 200 @{ 'Set-Cookie' = "$sessionCookie=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" }
            return $true
        }

        if ($sub -eq 'login' -and $context.Request.HttpMethod -eq 'POST') {
            $reader = New-Object System.IO.StreamReader($context.Request.InputStream, [System.Text.Encoding]::UTF8)
            $raw = $reader.ReadToEnd()
            $reader.Close()
            try { $body = $raw | ConvertFrom-Json }
            catch {
                Send-Text $context '{"error":"Invalid JSON"}' 400 'application/json; charset=utf-8'
                return $true
            }
            $name = [string]$body.name
            $hash = [string]$body.passwordHash
            $shareProgress = [bool]$body.shareProgress
            $inviteRaw = [string]$body.inviteCode
            if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($hash)) {
                Send-Text $context '{"error":"Missing name or password"}' 400 'application/json; charset=utf-8'
                return $true
            }
            $acctKey = Get-AccountKey $name
            $accounts = @{}
            if (Test-Path -LiteralPath $accountPath) {
                try {
                    $parsed = Get-Content -LiteralPath $accountPath -Raw -Encoding UTF8 | ConvertFrom-Json
                    if ($parsed) { $parsed.PSObject.Properties | ForEach-Object { $accounts[$_.Name] = $_.Value } }
                }
                catch { $accounts = @{} }
            }
            $acctExists = $accounts.ContainsKey($acctKey)
            if ($acctExists -and [string]$accounts[$acctKey].passwordHash -ne $hash) {
                Send-Text $context '{"error":"auth"}' 401 'application/json; charset=utf-8'
                return $true
            }
            $inviteCheck = Test-InviteForLogin $inviteRaw $acctKey $name $acctExists
            if (-not $inviteCheck.ok) {
                Send-Json $context @{ error = $inviteCheck.error; message = $inviteCheck.message } 403 $null
                return $true
            }
            $tokenBytes = New-Object byte[] 32
            [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($tokenBytes)
            $token = ([BitConverter]::ToString($tokenBytes) -replace '-', '').ToLowerInvariant()
            $expiresAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() + $sessionTtlMs
            $sessions = Get-SessionStore
            $sessions[$token] = @{
                accountKey    = $acctKey
                name          = $name.Trim()
                shareProgress = $shareProgress
                passwordHash  = $hash
                createdAt     = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                expiresAt     = $expiresAt
            }
            Save-SessionStore $sessions
            if ($inviteCheck.redeem) { Redeem-Invite $inviteCheck.redeem $acctKey $name }
            $tokens = Get-PresenceTokens
            Remove-PresenceForAccount $tokens $acctKey
            Save-PresenceTokens $tokens
            $maxAge = [int]($sessionTtlMs / 1000)
            Send-Json $context @{ ok = $true; shareProgress = $shareProgress } 200 @{ 'Set-Cookie' = "$sessionCookie=$token; Path=/; HttpOnly; SameSite=Lax; Max-Age=$maxAge" }
            return $true
        }

        Send-Text $context '{"error":"Method not allowed"}' 405 'application/json; charset=utf-8'
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

    if ($abs -eq '/api/experimental-presence') {
        $repoRoot = Split-Path $root -Parent
        $sessionPath = Join-Path $repoRoot '.experimental-sessions.json'
        $presencePath = Join-Path $repoRoot '.experimental-presence.json'
        $sessionCookie = 'lwm_exp_session'

        function Get-PresenceRequestCookies($request) {
            $out = @{}
            $header = [string]$request.Headers['Cookie']
            if ([string]::IsNullOrWhiteSpace($header)) { return $out }
            foreach ($part in ($header -split ';')) {
                $idx = $part.IndexOf('=')
                if ($idx -gt 0) {
                    $k = $part.Substring(0, $idx).Trim()
                    $v = [System.Uri]::UnescapeDataString($part.Substring($idx + 1).Trim())
                    $out[$k] = $v
                }
            }
            return $out
        }

        function Get-PresenceSession($request) {
            $cookies = Get-PresenceRequestCookies $request
            $token = [string]$cookies[$sessionCookie]
            if ($token -notmatch '^[a-f0-9]{64}$') { return $null }
            if (-not (Test-Path -LiteralPath $sessionPath)) { return $null }
            try {
                $store = Get-Content -LiteralPath $sessionPath -Raw -Encoding UTF8 | ConvertFrom-Json
            }
            catch { return $null }
            $rec = $store.$token
            if (-not $rec) { return $null }
            return @{ token = $token; rec = $rec }
        }

        $viewer = Get-PresenceSession $context.Request
        if (-not $viewer) {
            Send-Text $context '{"error":"auth"}' 401 'application/json; charset=utf-8'
            return $true
        }

        $tokens = @{}
        if (Test-Path -LiteralPath $presencePath) {
            try {
                $parsed = Get-Content -LiteralPath $presencePath -Raw -Encoding UTF8 | ConvertFrom-Json
                if ($parsed.tokens) {
                    $parsed.tokens.PSObject.Properties | ForEach-Object { $tokens[$_.Name] = $_.Value }
                }
            }
            catch { $tokens = @{} }
        }

        function Get-PresenceRegionsLocal($entries) {
            $counts = @{}
            foreach ($rec in $entries) {
                $k = [string]$rec.key
                if ([string]::IsNullOrWhiteSpace($k)) { continue }
                if (-not $counts.ContainsKey($k)) {
                    $counts[$k] = @{
                        key   = $k
                        name  = [string]$rec.name
                        iso2  = [string]$rec.iso2
                        grain = [string]$rec.grain
                        count = 0
                    }
                }
                $counts[$k].count = [int]$counts[$k].count + 1
            }
            return @($counts.Values)
        }

        function Get-FilteredPresenceLocal($tokenMap, $view) {
            $all = @($tokenMap.Values | Where-Object { $_ -and $_.key })
            $viewerKey = [string]$view.rec.accountKey
            $viewerShares = [bool]$view.rec.shareProgress
            $mine = $all | Where-Object { [string]$_.accountKey -eq $viewerKey } | Select-Object -First 1
            if (-not $viewerShares) {
                $regions = @()
                if ($mine) {
                    $regions = @(@{
                        key = [string]$mine.key; name = [string]$mine.name
                        iso2 = [string]$mine.iso2; grain = [string]$mine.grain; count = 1
                    })
                }
                return @{ regions = $regions; participants = @(); shareProgress = $false }
            }
            $consenting = @($all | Where-Object { [bool]$_.shareProgress })
            $regions = @(Get-PresenceRegionsLocal $consenting)
            $participants = @($consenting | ForEach-Object {
                @{
                    regionKey = [string]$_.key; regionName = [string]$_.name
                    iso2 = [string]$_.iso2; grain = [string]$_.grain; progress = $_.progress
                }
            })
            return @{ regions = $regions; participants = $participants; shareProgress = $true }
        }

        if ($context.Request.HttpMethod -eq 'GET') {
            $filtered = Get-FilteredPresenceLocal $tokens $viewer
            $out = @{ ok = $true }
            foreach ($k in $filtered.Keys) { $out[$k] = $filtered[$k] }
            Send-Json $context $out 200 $null
            return $true
        }
        if ($context.Request.HttpMethod -ne 'POST') {
            Send-Text $context '{"error":"Method not allowed"}' 405 'application/json; charset=utf-8'
            return $true
        }
        $reader = New-Object System.IO.StreamReader($context.Request.InputStream, [System.Text.Encoding]::UTF8)
        $raw = $reader.ReadToEnd()
        $reader.Close()
        try { $body = $raw | ConvertFrom-Json }
        catch {
            Send-Text $context '{"error":"Invalid JSON"}' 400 'application/json; charset=utf-8'
            return $true
        }
        if ($null -ne $body.city -or $null -ne $body.lat -or $null -ne $body.lon -or $null -ne $body.county) {
            Send-Text $context '{"error":"city is not shared"}' 400 'application/json; charset=utf-8'
            return $true
        }
        $key = [string]$body.key
        $name = [string]$body.name
        $iso2 = ([string]$body.iso2).ToLowerInvariant()
        $grain = ([string]$body.grain).ToLowerInvariant()
        if ($key -notmatch '^[a-z]{2}:(state|nation|country):[a-z0-9-]{1,64}$' -or $iso2 -notmatch '^[a-z]{2}$' -or $grain -notmatch '^(state|nation|country)$' -or [string]::IsNullOrWhiteSpace($name) -or $name.Length -gt 64) {
            Send-Text $context '{"error":"Invalid presence"}' 400 'application/json; charset=utf-8'
            return $true
        }
        $shareProgress = [bool]$viewer.rec.shareProgress
        $progress = $null
        if ($shareProgress -and $body.progress) {
            $set = [Math]::Max(1, [Math]::Min(11, [int]$body.progress.set))
            $round = [Math]::Max(1, [Math]::Min(3, [int]$body.progress.round))
            $topic = [Math]::Max(1, [Math]::Min(666, [int]$body.progress.topic))
            $progress = @{ set = $set; round = $round; topic = $topic }
        }
        $tokens[[string]$viewer.token] = @{
            key           = $key
            name          = $name.Trim()
            iso2          = $iso2
            grain         = $grain
            accountKey    = [string]$viewer.rec.accountKey
            shareProgress = $shareProgress
            progress      = $progress
            updatedAt     = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        }
        (@{ tokens = $tokens } | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $presencePath -Encoding UTF8
        $filtered = Get-FilteredPresenceLocal $tokens $viewer
        $out = @{ ok = $true; saved = $true }
        foreach ($k in $filtered.Keys) { $out[$k] = $filtered[$k] }
        Send-Json $context $out 200 $null
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
