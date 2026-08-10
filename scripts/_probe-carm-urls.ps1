$tests = @(
    'https://carm.org/seventh-day-adventists'
    'https://carm.org/seventh-day-adventist-church'
    'https://carm.org/black-hebrew-israelites'
    'https://carm.org/black-hebrew-israelite-movement'
    'https://carm.org/menu'
)
foreach ($u in $tests) {
    try {
        $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 30 -Headers @{ 'User-Agent' = 'LivingWordMapStudy/1.0' }
        Write-Host "OK $u $($r.StatusCode) len=$($r.Content.Length)"
    } catch {
        Write-Host "FAIL $u"
    }
}
