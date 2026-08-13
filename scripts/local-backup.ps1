param(
  [string]$DataPath = "$env:USERPROFILE\JapaneseLesson-Local\data",
  [string]$BackupPath = "$env:USERPROFILE\JapaneseLesson-Local\backups"
)

$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
Set-Location $project
node scripts/backup-local-db.mjs $DataPath $BackupPath
