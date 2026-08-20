# Build Why Bloodline Repentance is blessed — HTML + PDF (data/ and public/)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$OutHtmlData = Join-Path $Root 'data\WHY-BLOODLINE-REPENTANCE-BLESSED.html'
$OutPdfData = Join-Path $Root 'data\WHY-BLOODLINE-REPENTANCE-BLESSED.pdf'
$OutPdfTitled = Join-Path $Root 'data\Why is Bloodline Repentance blessed by God according to the Bible.pdf'
$OutHtmlPublic = Join-Path $Root 'public\why-bloodline-repentance.html'
$OutPdfPublic = Join-Path $Root 'public\why-bloodline-repentance.pdf'
$OutPage1Html = Join-Path $Root 'data\WHY-BLOODLINE-REPENTANCE-BLESSED-page1.html'
$OutPage1Png = Join-Path $Root 'public\why-bloodline-repentance-page1.png'

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js not found. Install Node or run: node scripts/build-bloodline-repentance-study.js' }

& $node.Source (Join-Path $PSScriptRoot 'build-bloodline-repentance-study.js')
if ($LASTEXITCODE -ne 0) { throw "Node builder exited $LASTEXITCODE" }

$chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
$browser = if (Test-Path $chrome) { $chrome } elseif (Test-Path $edge) { $edge } else { $null }
if (-not $browser) {
    Write-Warning 'Chrome/Edge not found - HTML only. Open the HTML file and Print to PDF.'
    exit 0
}

$htmlPath = (Resolve-Path $OutHtmlData).Path
$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')
foreach ($pdf in @($OutPdfData, $OutPdfTitled, $OutPdfPublic)) {
    if (Test-Path $pdf) { Remove-Item $pdf -Force }
}

$browserArgs = @(
    '--headless=new'
    '--disable-gpu'
    '--no-pdf-header-footer'
    "--print-to-pdf=$OutPdfData"
    $fileUri
)
$p = Start-Process -FilePath $browser -Wait -PassThru -WindowStyle Hidden -ArgumentList $browserArgs
if ($p.ExitCode -ne 0) { Write-Warning "Browser exit code $($p.ExitCode)" }

if (Test-Path $OutPdfData) {
    Copy-Item -Force $OutPdfData $OutPdfTitled
    Copy-Item -Force $OutPdfData $OutPdfPublic
    Copy-Item -Force $OutHtmlData $OutHtmlPublic
    Write-Host "Wrote PDF: $OutPdfTitled ($((Get-Item $OutPdfTitled).Length) bytes)"
    Write-Host "Copied public HTML/PDF"
} else {
    Write-Warning 'PDF not created - open HTML in browser and Print to PDF.'
}

if (Test-Path $OutPage1Html) {
    $page1Path = (Resolve-Path $OutPage1Html).Path
    $page1Uri = 'file:///' + ($page1Path -replace '\\', '/')
    if (Test-Path $OutPage1Png) { Remove-Item $OutPage1Png -Force }
    $shotArgs = @(
        '--headless=new'
        '--disable-gpu'
        '--hide-scrollbars'
        '--window-size=816,1056'
        "--screenshot=$OutPage1Png"
        $page1Uri
    )
    $shot = Start-Process -FilePath $browser -Wait -PassThru -WindowStyle Hidden -ArgumentList $shotArgs
    if ($shot.ExitCode -ne 0) { Write-Warning "Page-1 screenshot exit code $($shot.ExitCode)" }
    if (Test-Path $OutPage1Png) {
        Write-Host "Wrote page 1 PNG: $OutPage1Png ($((Get-Item $OutPage1Png).Length) bytes)"
    } else {
        Write-Warning 'Page 1 PNG not created.'
    }
}
