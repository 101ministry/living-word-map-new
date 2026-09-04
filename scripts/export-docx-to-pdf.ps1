param(
    [Parameter(Mandatory = $true)][string]$DocxPath,
    [Parameter(Mandatory = $true)][string]$PdfPath
)

$ErrorActionPreference = 'Stop'

$htmlPath = [System.IO.Path]::ChangeExtension($PdfPath, '.html')
$tmpDir   = Join-Path $env:TEMP ('docx-export-' + [guid]::NewGuid().ToString())
$extract  = Join-Path $tmpDir 'extracted'

New-Item -ItemType Directory -Path $extract -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($DocxPath, $extract)

[xml]$docXml = Get-Content -Raw -Encoding UTF8 (Join-Path $extract 'word\document.xml')
$ns = New-Object System.Xml.XmlNamespaceManager($docXml.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

function Get-ParagraphHtml([System.Xml.XmlElement]$p) {
    $styleNode = $p.SelectSingleNode('w:pPr/w:pStyle', $ns)
    $styleVal = if ($styleNode) { $styleNode.GetAttribute('w:val') } else { $null }
    $alignNode = $p.SelectSingleNode('w:pPr/w:jc', $ns)
    $align = if ($alignNode) { $alignNode.GetAttribute('w:val') } else { $null }

    $parts = New-Object System.Collections.Generic.List[string]
    foreach ($node in $p.ChildNodes) {
        if ($node.LocalName -ne 'r') { continue }
        if ($node.NamespaceURI -ne 'http://schemas.openxmlformats.org/wordprocessingml/2006/main') { continue }

        $bold = $null -ne $node.SelectSingleNode('w:rPr/w:b', $ns)
        $italic = $null -ne $node.SelectSingleNode('w:rPr/w:i', $ns)
        $underline = $null -ne $node.SelectSingleNode('w:rPr/w:u', $ns)
        $text = ($node.SelectNodes('w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
        if ($text) {
            $escaped = [System.Net.WebUtility]::HtmlEncode($text)
            if ($bold) { $escaped = '<strong>' + $escaped + '</strong>' }
            if ($italic) { $escaped = '<em>' + $escaped + '</em>' }
            if ($underline) { $escaped = '<u>' + $escaped + '</u>' }
            $parts.Add($escaped)
        }
        foreach ($br in $node.SelectNodes('w:br', $ns)) { $parts.Add('<br>') }
    }

    $inner = ($parts -join '')
    if ([string]::IsNullOrWhiteSpace($inner)) { return '<p>&nbsp;</p>' }

    if ($styleVal -match '^(Heading1|Title)$') { return '<h1>' + $inner + '</h1>' }
    if ($styleVal -eq 'Heading2') { return '<h2>' + $inner + '</h2>' }
    if ($styleVal -eq 'Heading3') { return '<h3>' + $inner + '</h3>' }

    $paraStyle = 'margin:0 0 0.75em;line-height:1.5;'
    if ($align -and $align -ne 'left') { $paraStyle += 'text-align:' + $align + ';' }
    return '<p style="' + $paraStyle + '">' + $inner + '</p>'
}

$bodyParts = New-Object System.Collections.Generic.List[string]
foreach ($p in $docXml.SelectNodes('//w:body/w:p', $ns)) {
    $bodyParts.Add((Get-ParagraphHtml $p))
}

$title = [System.IO.Path]::GetFileNameWithoutExtension($DocxPath)
try {
    [xml]$core = Get-Content -Raw -Encoding UTF8 (Join-Path $extract 'docProps\core.xml')
    $coreNs = New-Object System.Xml.XmlNamespaceManager($core.NameTable)
    $coreNs.AddNamespace('dc', 'http://purl.org/dc/elements/1.1/')
    $t = $core.SelectSingleNode('//dc:title', $coreNs)
    if ($t -and $t.InnerText.Trim()) { $title = $t.InnerText.Trim() }
} catch {}

$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>$([System.Net.WebUtility]::HtmlEncode($title))</title>
<style>
  @page { margin: 1in; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #111; max-width: 6.5in; margin: 0 auto; }
  h1,h2,h3 { page-break-after: avoid; }
</style>
</head>
<body>
$($bodyParts -join "`n")
</body>
</html>
"@

[System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.UTF8Encoding]::new($false))

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
$fileUri = ([Uri](Resolve-Path $htmlPath)).AbsoluteUri
$p = Start-Process -FilePath $edge -ArgumentList @('--headless=new','--disable-gpu','--no-pdf-header-footer',"--print-to-pdf=$PdfPath",$fileUri) -Wait -PassThru -WindowStyle Hidden

Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

if (-not (Test-Path $PdfPath)) { throw "PDF was not created. Edge exit code: $($p.ExitCode)" }
$info = Get-Item $PdfPath
Write-Output "Created: $($info.FullName)"
Write-Output "Size: $([math]::Round($info.Length/1KB, 1)) KB"
