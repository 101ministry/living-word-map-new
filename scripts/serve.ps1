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

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
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
