# Собирает DeepSeek.exe (если его нет) и создаёт ярлыки: в этой папке, на рабочем столе и в меню «Пуск».
# Всё приложение живёт в этой папке: DeepSeek.exe, extension\ (голос), profile\ (вход в аккаунт).
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$exe  = Join-Path $root 'DeepSeek.exe'

# Если DeepSeek.exe уже есть (скачан из Releases), не пересобираем его.
# Пересобрать из исходника: запустите build.ps1 вручную.
if (-not (Test-Path $exe)) { & (Join-Path $root 'build.ps1') }

$sh = New-Object -ComObject WScript.Shell
foreach ($dir in @($root, [Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
  $path = Join-Path $dir 'DeepSeek.lnk'
  $lnk = $sh.CreateShortcut($path)
  $lnk.TargetPath = $exe
  $lnk.WorkingDirectory = $root
  $lnk.IconLocation = "$exe,0"
  $lnk.Description = 'DeepSeek с голосовым управлением'
  $lnk.Save()
  Write-Host "Ярлык: $path"
}

Write-Host "`nГотово. Запустите DeepSeek с рабочего стола или DeepSeek.exe в этой папке." -ForegroundColor Green
Write-Host 'Не переносите папку после установки, иначе ярлыки перестанут работать (запустите install.cmd ещё раз).'
