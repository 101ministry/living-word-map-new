# Replace duplicated "judge between me and them" after "I no longer want to serve"
# with the correct Blood-of-Jesus forgiveness line.
param(
    [string]$InputFile = "$PSScriptRoot\..\data\COMPILED-PRAYERS-ROUND1.txt",
    [string]$OutputFile = $InputFile,
    [string[]]$AlsoWriteTo = @()
)

$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)
$pattern = '(?m)^I no longer want to serve (.+?)\. I ask You to judge between me and them so that the judgment is pure and holy\.\s*$'
$replacement = 'I no longer want to serve ${1}. In fact, I am asking for the forgiveness of God on this and for the Blood of Jesus to cover the record and speak instead.'

if (-not (Test-Path -LiteralPath $InputFile)) { throw "Missing: $InputFile" }

$text = [System.IO.File]::ReadAllText($InputFile, $Utf8)
$count = ([regex]::Matches($text, $pattern)).Count
$fixed = [regex]::Replace($text, $pattern, $replacement)
[System.IO.File]::WriteAllText($OutputFile, $fixed, $Utf8)
Write-Host "Fixed $count line(s) in $OutputFile"

foreach ($dest in $AlsoWriteTo) {
    if (-not $dest) { continue }
    [System.IO.File]::WriteAllText($dest, $fixed, $Utf8)
    Write-Host "Copied to $dest"
}
