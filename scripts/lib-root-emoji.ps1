# Shared root emoji for prayer metadata (matches data/TOPICS-666.txt).
$script:RootEmoji = @{
    'loneliness and emotional brokenness' = '🟤'
    'deception and falsehood'              = '🟣'
    'idolatry and person-worship'          = '⭕'
    'idolatry and person worship'          = '⭕'
    'idolatry and self-worship'            = '⭕'
    'pride and self-exaltation'            = '🔴'
    'pride and self exaltation'            = '🔴'
    'control and rebellion'                = '🔵'
    'bitterness and unforgiveness'         = '🟢'
    'addiction and bondage'                = '⚪'
    'unbelief and distrust of god'         = '🟡'
    'shame and false identity'             = '🩷'
    'covetousness and materialism'         = '⚫'
    'fear and insecurity'                  = '🟠'
}

function Format-RootForPrayer([string]$rootName) {
    if (-not $rootName) { return '' }
    $raw = $rootName.Trim()
    if ($raw -match '🟤|🟣|⭕|🔴|🔵|🟢|⚪|🟡|🩷|⚫|🟠') { return $raw }
    $key = ($raw.ToLower() -replace '[^\p{L}\p{Nd}]+', ' ').Trim()
    $keyHyphen = $key -replace 'person worship', 'person-worship' -replace 'self exaltation', 'self-exaltation'
    foreach ($try in @($raw.ToLower().Trim(), $key, $keyHyphen)) {
        if ($script:RootEmoji.ContainsKey($try)) {
            return "$($script:RootEmoji[$try]) $raw"
        }
    }
    return $raw
}
