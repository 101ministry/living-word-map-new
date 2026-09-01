# Copy teaching PDFs from data/ to public/downloads/ and generate downloads-pdfs.js
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$Data = Join-Path $Root 'data'
$OutDir = Join-Path $Root 'public\downloads'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$items = @(
  @{
    src = 'A Grumpy 2 Corinthians 9.pdf'
    file = 'grumpy-2-corinthians-9.pdf'
    title = 'A Grumpy 2 Corinthians 9'
    summary = '2 Corinthians 9 on cheerful giving through the grumpy heart and the refuser.'
  },
  @{
    src = 'CARM-PART6-STUDY.pdf'
    file = 'carm-part6-study.pdf'
    title = 'CARM Part 6 Study'
    summary = 'Religions, discipleship costs, and biblical response from CARM articles.'
  },
  @{
    src = 'Christianity Without Christ.pdf'
    file = 'christianity-without-christ.pdf'
    title = 'Christianity Without Christ'
    summary = 'Faith without accountability, community, or Jesus at the forefront: OT lined up with NT.'
  },
  @{
    src = 'DEPORTATION-BIBLICAL-STUDY.pdf'
    file = 'deportation-biblical-study.pdf'
    title = 'Is Deportation Biblical?'
    summary = 'Scripture and church history on sojourners, nations, and deportation today.'
  },
  @{
    src = 'DEPORTATION-STATUTES-COMPARATIVE-STUDY.pdf'
    file = 'deportation-statutes-comparative-study.pdf'
    title = 'Deportation Statutes (30 Countries)'
    summary = 'Part 4 extension: modern statutes compared to biblical law.'
  },
  @{
    src = 'FIRE-PRAYERS-ED-CITRONELLI.pdf'
    file = 'fire-prayers-ed-citronelli.pdf'
    title = 'Fire Prayers (Ed Citronelli)'
    summary = 'Territorial warfare prayer: breakthrough, binding, and closing declarations.'
  },
  @{
    src = 'FORGIVENESS-VS-ABUSE.pdf'
    file = 'forgiveness-vs-abuse.pdf'
    title = 'Forgiveness vs Abuse'
    summary = 'When bitterness and trauma-as-lordship block the Fruit of the Spirit.'
  },
  @{
    src = 'Gates Prayer.pdf'
    file = 'gates-prayer.pdf'
    title = 'Gates Prayer'
    summary = 'Repentance over eye, ear, nose, mouth, and touch gates; soul ties burned out.'
  },
  @{
    src = 'How to Confront Another''s Ungodly Actions.pdf'
    file = 'how-to-confront-ungodly-actions.pdf'
    title = 'How to Confront Ungodly Actions'
    summary = 'Matthew 18 steps: private correction before public accusation.'
  },
  @{
    src = 'Humility-Gods-Definition.pdf'
    file = 'humility-gods-definition.pdf'
    title = 'Humility - God''s Definition'
    summary = 'What humility looks like in Scripture, Old Testament and New.'
  },
  @{
    src = 'ISRAEL-NATIONS-KILLED-REFERENCES.pdf'
    file = 'israel-nations-killed-references.pdf'
    title = 'Israel: Nations & Cities Killed'
    summary = 'Chronological scripture chart: judgment references, no commentary.'
  },
  @{
    src = 'Matthew 6.33 Protocol.pdf'
    file = 'matthew-633-protocol.pdf'
    title = 'Matthew 6:33 Protocol'
    summary = 'Greek order, 2 Timothy 1:7, and Living Word Map walk-out vs compromise.'
  },
  @{
    src = 'Rebellion + Desertion = Curses.pdf'
    file = 'rebellion-desertion-curses.pdf'
    title = 'Rebellion + Desertion = Curses (Part 1)'
    summary = 'Deuteronomy 28:15-68: disease and affliction terms (Hebrew to English).'
  },
  @{
    src = 'Rebellion-Desertion-Curses-Part2.pdf'
    file = 'rebellion-desertion-curses-part2.pdf'
    title = 'Rebellion + Desertion = Curses (Part 2)'
    summary = 'Modern diseases, disorders, and cancers matching the Hebrew descriptions.'
  },
  @{
    src = 'Spirit Spouses - Identify, Root Out, and Divorce.pdf'
    file = 'spirit-spouses-identify-root-out-divorce.pdf'
    title = 'Spirit Spouses - Identify, Root Out, Divorce'
    summary = 'Spirit husbands/wives, soul ties, and breaking illegal covenant marriage.'
  },
  @{
    src = 'SUPERSESSIONISM-BIBLICAL-STUDY.pdf'
    file = 'supersessionism-biblical-study.pdf'
    title = 'Supersessionism vs Scripture'
    summary = 'Replace vs graft: passages on Israel and the church side by side.'
  },
  @{
    src = 'THE-POWER-OF-VIBRATING-FOR-EVIL.pdf'
    file = 'power-of-vibrating-for-evil.pdf'
    title = 'The Power of Vibrating for Evil'
    summary = 'Ephesians 6:12, word-agreement, election, and the twelve-gate zodiac covenant.'
  },
  @{
    src = 'TREACHERY-MIND-ADULTERY-NEGLECT.pdf'
    file = 'treachery-mind-adultery-neglect.pdf'
    title = 'The Treachery Mind'
    summary = 'Adultery, neglect, abandonment, robbery, cursing, and dishonoring parents.'
  },
  @{
    src = 'Understanding Life in Simplified Terms.pdf'
    file = 'understanding-life-simplified-terms.pdf'
    title = 'Understanding Life in Simplified Terms'
    summary = 'Plain-language definitions for Amojo Life emotion and attitude lists.'
  },
  @{
    src = 'What-God-Wont-Tolerate-about-BDSM.pdf'
    file = 'what-god-wont-tolerate-about-bdsm.pdf'
    title = 'What God Won''t Tolerate about BDSM'
    summary = 'Masochism, sadism, wicked imaginations; Living Word Map topic 378.'
  },
  @{
    src = 'Why is Bloodline Repentance blessed by God according to the Bible.pdf'
    file = 'why-bloodline-repentance.pdf'
    title = 'Why Bloodline Repentance Is Blessed'
    summary = 'Scripture warrant for the Core Prayer and Rounds 1-3: mercy on a line.'
    publicRoot = $true
  }
)

$manifest = New-Object System.Collections.Generic.List[object]
foreach ($item in $items) {
  $srcPath = Join-Path $Data $item.src
  if (-not (Test-Path -LiteralPath $srcPath)) {
    Write-Warning "Missing source PDF: $($item.src)"
    continue
  }
  if ($item.publicRoot) {
    $destPath = Join-Path $Root "public\$($item.file)"
  } else {
    $destPath = Join-Path $OutDir $item.file
  }
  Copy-Item -LiteralPath $srcPath -Destination $destPath -Force
  $href = if ($item.publicRoot) { $item.file } else { "downloads/$($item.file)" }
  $made = (Get-Item -LiteralPath $srcPath).CreationTime.ToString('yyyy-MM-dd')
  $manifest.Add([ordered]@{
    title = $item.title
    summary = $item.summary
    href = $href
    download = $item.src
    made = $made
  })
  Write-Host "Copied $($item.title)"
}

$jsPath = Join-Path $Root 'public\downloads-pdfs.js'
$json = ($manifest | ConvertTo-Json -Depth 4)
@"
window.DOWNLOADS_PDFS = {
  title: "Teaching PDFs",
  description: "Studies and prayers from the ministry library. Tap to download.",
  items: $json
};
"@ | Set-Content -LiteralPath $jsPath -Encoding UTF8

Write-Host "Wrote $jsPath ($($manifest.Count) PDFs)"
