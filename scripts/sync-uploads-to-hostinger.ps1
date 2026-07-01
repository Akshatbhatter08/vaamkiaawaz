# Upload migrated media files to Hostinger (run from project root in PowerShell)
# You will be prompted for your SSH password.

$ErrorActionPreference = "Stop"
$Remote = "u505641209@145.79.58.49"
$Port = 65002
$LocalUploads = Join-Path $PSScriptRoot "..\uploads"
$RemoteUploads = "/home/u505641209/vaamkiaawaz-uploads"

Write-Host "Syncing uploads to Hostinger (580 files)..."
Write-Host "Local:  $LocalUploads"
Write-Host "Remote: $RemoteUploads"

foreach ($folder in @("posts", "content", "authors", "resources")) {
  $localPath = Join-Path $LocalUploads $folder
  if (-not (Test-Path $localPath)) {
    Write-Warning "Skipping missing folder: $folder"
    continue
  }
  $count = (Get-ChildItem $localPath -File).Count
  Write-Host "Uploading $folder ($count files)..."
  scp -P $Port -r "$localPath" "${Remote}:${RemoteUploads}/"
}

Write-Host ""
Write-Host "Upload complete. On SSH, run:"
Write-Host "  export PATH=/opt/alt/alt-nodejs22/root/usr/bin:`$PATH"
Write-Host "  cd ~/domains/test.vaamkiaawaz.in/nodejs"
Write-Host "  bash scripts/server-finish-migration.sh"
