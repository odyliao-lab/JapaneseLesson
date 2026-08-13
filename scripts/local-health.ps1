param([int]$Port = 3101)

$ErrorActionPreference = "Stop"
$response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/japanese" -UseBasicParsing -TimeoutSec 15
if ($response.StatusCode -ne 200 -or $response.RawContentLength -lt 5000) {
  throw "JapaneseLesson local health check failed."
}
Write-Output "healthy"
