param(
    [int]$Count = 9,
    [switch]$SyncToKv,
    [switch]$Force,
    [switch]$PullFromKv
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$invitesPath = Join-Path $repoRoot 'data\experimental-invites.json'
$charset = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'.ToCharArray()

function New-InviteSegment([int]$Length) {
    $chars = New-Object char[] $Length
    for ($i = 0; $i -lt $Length; $i++) {
        $chars[$i] = $charset[(Get-Random -Maximum $charset.Length)]
    }
    return -join $chars
}

function New-InviteCode {
    return "LWM-$(New-InviteSegment 4)-$(New-InviteSegment 4)"
}

function ConvertTo-InviteCodeMap($codesObj) {
    $codes = @{}
    if ($codesObj) {
        $codesObj.PSObject.Properties | ForEach-Object { $codes[$_.Name] = $_.Value }
    }
    return $codes
}

function Get-InviteStore {
    if (-not (Test-Path -LiteralPath $invitesPath)) {
        return @{ codes = @{} }
    }
    try {
        $parsed = Get-Content -LiteralPath $invitesPath -Raw -Encoding UTF8 | ConvertFrom-Json
        return @{ codes = (ConvertTo-InviteCodeMap $parsed.codes); note = $parsed.note }
    }
    catch {
        return @{ codes = @{} }
    }
}

function Merge-InviteCodeEntry($local, $remote) {
    if (-not $local) { return $remote }
    if (-not $remote) { return $local }

    $localUsed = [bool]$local.used
    $remoteUsed = [bool]$remote.used
    if ($remoteUsed) { return $remote }
    if ($localUsed) { return $local }
    return $remote
}

function Merge-InviteStores($localStore, $remoteStore) {
    $merged = @{ codes = @{} }
    $keys = @($localStore.codes.Keys + $remoteStore.codes.Keys | Select-Object -Unique)
    foreach ($key in $keys) {
        $merged.codes[$key] = Merge-InviteCodeEntry $localStore.codes[$key] $remoteStore.codes[$key]
    }
    return $merged
}

function Get-KvInviteStore {
    $wrangler = Get-Command wrangler -ErrorAction SilentlyContinue
    if (-not $wrangler) {
        throw 'wrangler not found — install Cloudflare wrangler CLI to pull from KV.'
    }
    Push-Location $repoRoot
    try {
        $raw = & wrangler kv key get --binding=EXPERIMENTAL_KV invites-v1 2>$null
        if (-not $raw) {
            return @{ codes = @{} }
        }
        $parsed = $raw | ConvertFrom-Json
        return @{ codes = (ConvertTo-InviteCodeMap $parsed.codes); note = $parsed.note }
    }
    finally {
        Pop-Location
    }
}

function Write-InviteStore($store) {
    $out = @{
        codes = $store.codes
        note  = 'One-time invite codes for Experimental Prayer Builder. Sync invites-v1 to EXPERIMENTAL_KV for production. Use -PullFromKv before -SyncToKv so redeemed codes are preserved.'
    }
    if ($store.note) { $out.note = [string]$store.note }
    ($out | ConvertTo-Json -Depth 6) | Set-Content -LiteralPath $invitesPath -Encoding UTF8
}

$store = Get-InviteStore
$beforeCount = @($store.codes.Keys).Count

if ($PullFromKv) {
    Write-Host 'Pulling invites-v1 from EXPERIMENTAL_KV…'
    $remote = Get-KvInviteStore
    $remoteCount = @($remote.codes.Keys).Count
    $store = Merge-InviteStores $store $remote
    Write-InviteStore $store
    Write-Host "Merged KV store ($remoteCount code(s)) with local file ($beforeCount code(s)) → $(@($store.codes.Keys).Count) total."
    $beforeCount = @($store.codes.Keys).Count
}

$existing = @($store.codes.Keys)
$unused = @($existing | Where-Object { -not [bool]$store.codes[$_].used })

if ($unused.Count -gt 0 -and -not $Force -and -not $SyncToKv -and -not $PullFromKv) {
    Write-Host ''
    Write-Host "Already have $($unused.Count) unused invite code(s). Use -Force to add more."
    Write-Host ''
    Write-Host 'Unused codes (copy for Slack):'
    foreach ($code in $unused) {
        Write-Host "  $code"
    }
    Write-Host ''
    Write-Host "Link format: https://map.repentance101.com/repentance-project.html?invite=$($unused[0])"
    Write-Host ''
    exit 0
}

$shouldCreate = $Force -or ($unused.Count -eq 0 -and -not $PullFromKv -and -not $SyncToKv)
if ($shouldCreate) {
    $created = @()
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    for ($i = 0; $i -lt $Count; $i++) {
        do {
            $code = New-InviteCode
        } while ($store.codes.ContainsKey($code))
        $store.codes[$code] = @{
            used       = $false
            accountKey = $null
            name       = $null
            usedAt     = $null
            createdAt  = $now
        }
        $created += $code
    }

    Write-InviteStore $store

    if ($created.Count -gt 0) {
        Write-Host ''
        Write-Host "Created $($created.Count) invite code(s) in data/experimental-invites.json"
        Write-Host ''
        Write-Host 'Send each person one code (Slack DM works well):'
        foreach ($code in $created) {
            Write-Host "  $code"
            Write-Host "    https://map.repentance101.com/repentance-project.html?invite=$code"
        }
        Write-Host ''
    }
}

$finalCount = @($store.codes.Keys).Count
$finalUnused = @($store.codes.Keys | Where-Object { -not [bool]$store.codes[$_].used })
$usedCount = $finalCount - $finalUnused.Count
Write-Host "Invite store: $finalCount total, $usedCount used, $($finalUnused.Count) unused."

if ($SyncToKv) {
    if ($PullFromKv -eq $false) {
        Write-Host ''
        Write-Host 'Tip: run with -PullFromKv first to merge production redemptions before syncing.'
    }
    $wrangler = Get-Command wrangler -ErrorAction SilentlyContinue
    if (-not $wrangler) {
        Write-Warning 'wrangler not found — upload manually:'
        Write-Host "  wrangler kv key put --binding=EXPERIMENTAL_KV invites-v1 --path=`"$invitesPath`""
        exit 1
    }
    $backupDir = Join-Path $repoRoot 'data\backups'
    if (-not (Test-Path -LiteralPath $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    try {
        $kvRaw = & wrangler kv key get --binding=EXPERIMENTAL_KV invites-v1 2>$null
        if ($kvRaw) {
            $backupPath = Join-Path $backupDir "invites-v1-$stamp.json"
            [System.IO.File]::WriteAllText($backupPath, $kvRaw, [System.Text.UTF8Encoding]::new($false))
            Write-Host "Backed up current KV to $backupPath"
        }
    }
    catch {
        Write-Warning "Could not back up KV before sync: $($_.Exception.Message)"
    }

    Push-Location $repoRoot
    try {
        & wrangler kv key put --binding=EXPERIMENTAL_KV invites-v1 --path=$invitesPath
        Write-Host "Synced invites-v1 to EXPERIMENTAL_KV ($finalCount codes)."
    }
    finally {
        Pop-Location
    }
}
elseif (-not $PullFromKv -and -not $Force) {
    Write-Host ''
    Write-Host 'After deploy, sync to production (merge KV first):'
    Write-Host '  .\scripts\generate-experimental-invites.ps1 -PullFromKv -SyncToKv'
    Write-Host '  — or —'
    Write-Host "  wrangler kv key put --binding=EXPERIMENTAL_KV invites-v1 --path=`"data/experimental-invites.json`""
    Write-Host ''
}
