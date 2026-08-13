param([string]$InstallPath = "$env:USERPROFILE\JapaneseLesson-Local\app")

$ErrorActionPreference = "Stop"
$user = "$env:USERDOMAIN\$env:USERNAME"
$startScript = Join-Path $InstallPath "scripts\local-start.ps1"
$backupScript = Join-Path $InstallPath "scripts\local-backup.ps1"
$dataPath = "$env:USERPROFILE\JapaneseLesson-Local\data"
$backupPath = "$env:USERPROFILE\JapaneseLesson-Local\backups"

$serverAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -Port 3101 -DataPath `"$dataPath`"" -WorkingDirectory $InstallPath
$serverTrigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$serverSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName "JapaneseLesson-Local" -Action $serverAction -Trigger $serverTrigger -Settings $serverSettings -Principal $principal -Description "Runs the Japanese learning site on localhost:3101" -Force | Out-Null

$backupAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -DataPath `"$dataPath`" -BackupPath `"$backupPath`"" -WorkingDirectory $InstallPath
$backupTrigger = New-ScheduledTaskTrigger -Daily -At 3:00am
$backupSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "JapaneseLesson-Backup" -Action $backupAction -Trigger $backupTrigger -Settings $backupSettings -Principal $principal -Description "Keeps the latest 30 local JapaneseLesson database backups" -Force | Out-Null

Get-ScheduledTask -TaskName "JapaneseLesson-Local", "JapaneseLesson-Backup" | Select-Object TaskName, State
