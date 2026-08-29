param(
    [int]$Count = 9,
    [switch]$SyncToKv,
    [switch]$Force
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

function Get-InviteStore {
    if (-not (Test-Path -LiteralPath $invitesPath)) {
        return @{ codes = @{} }
    }
    try {
        $parsed = Get-Content -LiteralPath $invitesPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $codes = @{}
        if ($parsed.codes) {
            $parsed.codes.PSObject.Properties | ForEach-Object { $codes[$_.Name] = $_.Value }
        }
        return @{ codes = $codes; note = $parsed.note }
    }
    catch {
        return @{ codes = @{} }
    }
}

$store = Get-InviteStore
$existing = @($store.codes.Keys)
$unused = @($existing | Where-Object { -not [bool]$store.codes[$_].used })

if ($unused.Count -gt 0 -and -not $Force) {
    Write-Host ''
    Write-Host "Already have $($unused.Count) unused invite code(s). Use -Force to add more."
    Write-Host ''
    Write-Host 'Unused codes (copy for Slack):'
    foreach ($code in $unused) {
        Write-Host "  $code"
    }
    Write-Host ''
    Write-Host "Link format: https://map.repentance101.com/experimental.html?invite=$($unused[0])"
    Write-Host ''
    if (-not $SyncToKv) { exit 0 }
}

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

$out = @{
    codes = $store.codes
    note  = 'One-time invite codes for Experimental Prayer Builder. Sync invites-v1 to EXPERIMENTAL_KV for production.'
}
($out | ConvertTo-Json -Depth 6) | Set-Content -LiteralPath $invitesPath -Encoding UTF8

Write-Host ''
Write-Host "Created $($created.Count) invite code(s) in data/experimental-invites.json"
Write-Host ''
Write-Host 'Send each person one code (Slack DM works well):'
foreach ($code in $created) {
    Write-Host "  $code"
    Write-Host "    https://map.repentance101.com/experimental.html?invite=$code"
}
Write-Host ''

if ($SyncToKv) {
    $wrangler = Get-Command wrangler -ErrorAction SilentlyContinue
    if (-not $wrangler) {
        Write-Warning 'wrangler not found — upload manually:'
        Write-Host "  wrangler kv key put --binding=EXPERIMENTAL_KV invites-v1 --path=`"$invitesPath`""
        exit 1
    }
    Push-Location $repoRoot
    try {
        & wrangler kv key put --binding=EXPERIMENTAL_KV invites-v1 --path=$invitesPath
        Write-Host 'Synced invites-v1 to EXPERIMENTAL_KV.'
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host 'After deploy, sync to production:'
    Write-Host "  .\scripts\generate-experimental-invites.ps1 -SyncToKv"
    Write-Host '  — or —'
    Write-Host "  wrangler kv key put --binding=EXPERIMENTAL_KV invites-v1 --path=`"data/experimental-invites.json`""
    Write-Host ''
}
