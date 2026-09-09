# Build Soul Ties Prayer HTML -> PDF

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$OutHtml = Join-Path $Root 'data\Soul-Ties-Prayer.html'
$OutPdfTemp = Join-Path $Root 'data\soul-ties-prayer.pdf'
$OutPdf     = Join-Path $Root 'data\Soul Ties Prayer - update 9-9-2026.pdf'

if (-not (Test-Path $OutHtml)) {
    Write-Error "HTML not found: $OutHtml"
}

Write-Host "Source HTML: $OutHtml"

$chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
$browser = if (Test-Path $chrome) { $chrome } elseif (Test-Path $edge) { $edge } else { $null }
if (-not $browser) {
    Write-Warning 'Chrome/Edge not found - HTML only. Open the HTML file and Print to PDF.'
    exit 0
}

$htmlPath = (Resolve-Path $OutHtml).Path
$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')
if (Test-Path $OutPdfTemp) { Remove-Item $OutPdfTemp -Force }
if (Test-Path $OutPdf) { Remove-Item $OutPdf -Force }

$browserArgs = @(
    '--headless=new'
    '--disable-gpu'
    '--no-pdf-header-footer'
    "--print-to-pdf=$OutPdfTemp"
    $fileUri
)
Write-Host "Browser: $browser"
$p = Start-Process -FilePath $browser -ArgumentList $browserArgs -Wait -PassThru -WindowStyle Hidden
if ($p.ExitCode -ne 0) { Write-Warning "Browser exit code $($p.ExitCode)" }

if (Test-Path $OutPdfTemp) {
    Copy-Item -Force $OutPdfTemp $OutPdf
    Write-Host "Wrote PDF: $OutPdf ($((Get-Item $OutPdf).Length) bytes)"
} else {
    Write-Warning 'PDF not created - open HTML in browser and Print to PDF.'
}
