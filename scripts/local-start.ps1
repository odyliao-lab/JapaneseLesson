param(
  [int]$Port = 3101,
  [string]$DataPath = "$env:USERPROFILE\JapaneseLesson-Local\data"
)

$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force -Path $DataPath | Out-Null
Set-Location $project

npx wrangler d1 migrations apply japanese-lesson-local --local --config wrangler.local.jsonc --persist-to $DataPath
npx wrangler dev --local --config wrangler.local.jsonc --persist-to $DataPath --port $Port --ip 127.0.0.1
