# Living Word Map — migrate to new GitHub + Cloudflare (from local repo)
# Run from repo root: powershell -File scripts\migrate-new-github-cloudflare.ps1
#
# Prerequisites (you do these in the browser first):
#   1. New GitHub account (repentance101ministry.admin@gmail.com or similar)
#   2. New empty repo, e.g. living-word-map (private recommended)
#   3. New Cloudflare account (same email is fine)
#   4. DNS access for map.repentance101.com

param(
    [string]$GitHubUser = '',
    [string]$RepoName = 'living-word-map-new',
    [switch]$SkipPush,
    [switch]$DeployOnly
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Write-Step([string]$n, [string]$msg) {
    Write-Host ""
    Write-Host "=== Step $n : $msg ===" -ForegroundColor Cyan
}

function Pause-Continue([string]$msg) {
    Write-Host $msg -ForegroundColor Yellow
    Read-Host "Press Enter when ready (or Ctrl+C to stop)"
}

if (-not $DeployOnly) {
    Write-Step '0' 'Checklist before running commands'
    Write-Host @"
  [ ] GitHub: new account created
  [ ] GitHub: empty repo '$RepoName' created (no README/license — or we force-push)
  [ ] Cloudflare: account created at https://dash.cloudflare.com/sign-up
  [ ] Resend: API key ready (https://resend.com) — notifications@repentance101.com domain still verified OR update RESEND_FROM in wrangler.toml
  [ ] Cal.com: note to update webhook after deploy
  [ ] Optional: old Cloudflare login if copying R2 audio from old bucket
"@

    if (-not $GitHubUser) {
        $GitHubUser = Read-Host 'New GitHub username'
    }
    if (-not $GitHubUser) { throw 'GitHub username required' }

    Write-Step '1' 'Point git remote at new GitHub repo'
    $newRemote = "https://github.com/$GitHubUser/$RepoName.git"
    Write-Host "Setting origin -> $newRemote"
    git remote set-url origin $newRemote
    git remote -v

    if (-not $SkipPush) {
        Pause-Continue "Next: push main to the new repo (requires gh auth login as $GitHubUser or Git Credential Manager)."
        Write-Host 'Tip: gh auth login --hostname github.com --git-protocol https' -ForegroundColor DarkGray
        git push -u origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host 'Push failed. Run: gh auth login (new account), then re-run with -SkipPush after manual push.' -ForegroundColor Red
        }
    }
}

Write-Step '2' 'Cloudflare CLI login (new account)'
Write-Host 'A browser window will open — sign in to your NEW Cloudflare account.'
Pause-Continue ''
npm install
npx wrangler login
npx wrangler whoami

Write-Step '3' 'Create R2 bucket for Accelerated Discipleship audio'
Write-Host 'Creating bucket living-word-map-downloads (skip if it already exists)...'
npx wrangler r2 bucket create living-word-map-downloads 2>$null
Write-Host 'If copy from OLD Cloudflare account is needed, run separately (see script footer).' -ForegroundColor DarkGray

Write-Step '4' 'Worker secrets'
Write-Host @"
Set secrets when prompted (paste values; input is hidden for API keys):

  RESEND_API_KEY     — from Resend dashboard
  CAL_WEBHOOK_SECRET — optional; same string as Cal.com webhook Secret
"@
Pause-Continue 'Run wrangler secret put for each secret now? (Enter to continue)'
npx wrangler secret put RESEND_API_KEY
$setCal = Read-Host 'Set CAL_WEBHOOK_SECRET too? (y/N)'
if ($setCal -eq 'y') { npx wrangler secret put CAL_WEBHOOK_SECRET }

Write-Step '5' 'First deploy'
npx wrangler deploy
Write-Host ''
Write-Host 'Note the *.workers.dev URL from the deploy output.' -ForegroundColor Green

Write-Step '6' 'GitHub Actions secrets (browser)'
$whoami = npx wrangler whoami 2>&1 | Out-String
Write-Host $whoami
Write-Host @"

In GitHub -> Settings -> Secrets and variables -> Actions, add:

  CLOUDFLARE_API_TOKEN  — Cloudflare: My Profile -> API Tokens -> Create Token
                          Use template 'Edit Cloudflare Workers' or custom with:
                          Account: Workers Scripts Edit, Workers R2 Storage Edit
  CLOUDFLARE_ACCOUNT_ID — shown in wrangler whoami output above (Account ID line)

Then push to main to test CI deploy, or run: npx wrangler deploy
"@

Write-Step '7' 'DNS for map.repentance101.com'
Write-Host @"
In Cloudflare dashboard -> Workers & Pages -> living-word-map -> Settings -> Domains & Routes
  confirm map.repentance101.com is listed (wrangler.toml custom_domain).

At your DNS host for repentance101.com, set:

  Type: CNAME
  Name: map
  Target: (value Cloudflare shows for the custom domain — often <worker>.workers.dev or a cf route target)

Remove or update any OLD CNAME pointing map to the previous Worker account.
TTL: 300 (5 min) during cutover, then raise if desired.

After DNS propagates, test:
  https://map.repentance101.com/
  https://map.repentance101.com/api/cal-booking  (GET should return JSON ok)
"@

Write-Step '8' 'Cal.com webhook'
Write-Host 'Update Cal.com webhook URL to: https://map.repentance101.com/api/cal-booking'

Write-Step '9' 'R2 audio migration (optional)'
Write-Host @"
MP3 files are NOT in git. If downloads 404 after deploy:

  A) Still logged into OLD Cloudflare: use dashboard R2 -> living-word-map-downloads -> export,
     then upload to new bucket under prefix audio/accelerated-discipleship/

  B) From local source files (if you have them):
     npx wrangler r2 object put living-word-map-downloads/audio/accelerated-discipleship/FILE.mp3 --file=PATH

  Playlist filenames: see public/downloads-playlist.js
"@

Write-Host ''
Write-Host 'Migration script finished. Verify map.repentance101.com loads the site.' -ForegroundColor Green
