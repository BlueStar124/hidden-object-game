# Sets up the CI job that applies supabase/migrations to the Supabase project (.github/workflows/ci.yml,
# job "migrate"): stores its three secrets in the GitHub repo, then links the project locally and
# shows which migrations it already has. Run once, from the repo root, in PowerShell:
#   powershell -ExecutionPolicy Bypass -File tools/setup-supabase-ci.ps1
# Secrets are typed hidden and go straight to GitHub; nothing is written to disk.

# 'Continue': in Windows PowerShell, gh and npx writing progress to stderr would otherwise stop the
# script; real failures are checked with $LASTEXITCODE below
$ErrorActionPreference = 'Continue'
function Must($what) { if ($LASTEXITCODE -ne 0) { Write-Host "Lỗi ở bước: $what" -ForegroundColor Red; exit 1 } }
Set-Location (Split-Path $PSScriptRoot -Parent)

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Plain($secure) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

# A secret typed hidden — or, when Enter is pressed on an empty prompt, read from the clipboard (a
# hidden prompt in VS Code's terminal cannot be pasted into), then the clipboard is cleared
function Secret($prompt) {
  $typed = (Plain (Read-Host "$prompt (ẩn)" -AsSecureString)) -replace '[\x00-\x1F]', ''
  if ($typed.Trim()) { return $typed.Trim() }
  $clip = ((Get-Clipboard -Raw) -as [string])
  if ($clip) { Set-Clipboard -Value ' ' }
  return ($clip -replace '[\x00-\x1F]', '').Trim()
}

# The project's reference, from the app's public URL (https://<ref>.supabase.co)
$envFile = Get-Content 'app/.env' -Raw
if ($envFile -notmatch 'https://([a-z0-9]+)\.supabase\.co') { throw 'EXPO_PUBLIC_SUPABASE_URL không có trong app/.env' }
$projectRef = $Matches[1]
Write-Host "Dự án Supabase: $projectRef"

Step 'GitHub CLI'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host 'Đang cài GitHub CLI (winget)...'
    winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  }
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    # No winget (or it failed): the portable zip of the latest release, unpacked for this user only
    Write-Host 'Đang tải GitHub CLI (bản zip, không cần cài)...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $release = Invoke-RestMethod 'https://api.github.com/repos/cli/cli/releases/latest' -Headers @{ 'User-Agent' = 'setup-supabase-ci' } -ErrorAction Stop
    $asset = $release.assets | Where-Object { $_.name -like '*_windows_amd64.zip' } | Select-Object -First 1
    if (-not $asset) { throw 'Không tìm thấy bản GitHub CLI cho Windows' }
    $dir = Join-Path $env:LOCALAPPDATA 'gh-cli'
    $zip = Join-Path $env:TEMP $asset.name
    Invoke-WebRequest $asset.browser_download_url -OutFile $zip -UseBasicParsing -ErrorAction Stop
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    Expand-Archive $zip -DestinationPath $dir -Force -ErrorAction Stop
    Remove-Item $zip -Force
    $exe = Get-ChildItem $dir -Recurse -Filter gh.exe | Select-Object -First 1
    $env:Path = "$($exe.DirectoryName);$env:Path"
  }
}
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Đăng nhập GitHub: trình duyệt sẽ mở, nhập mã hiện ở đây rồi bấm Authorize.'
  gh auth login --web --git-protocol https --hostname github.com
  Must 'đăng nhập GitHub'
}

Step 'Supabase access token'
Write-Host 'Trình duyệt sẽ mở trang token: bấm "Generate new token", đặt tên (vd: github-ci), copy token.'
Start-Process 'https://supabase.com/dashboard/account/tokens'
Write-Host 'Token cá nhân bắt đầu bằng sbp_ (không phải key sb_publishable_/sb_secret_ của dự án).'
do {
  $token = Secret 'Copy token rồi bấm Enter (hoặc gõ tay)'
  $ok = $token -match '^sbp_[A-Za-z0-9_]{20,}$'
  if (-not $ok) { Write-Host "Token chưa đúng dạng sbp_… (nhận được $($token.Length) ký tự, bắt đầu bằng '$($token.Substring(0, [Math]::Min(4, $token.Length)))'). Thử lại." -ForegroundColor Yellow }
} until ($ok)

Step 'Mật khẩu database'
Write-Host "Quên mật khẩu thì đặt lại ở: https://supabase.com/dashboard/project/$projectRef/database/settings"
$password = Secret 'Gõ mật khẩu database, hoặc copy nó rồi bấm Enter'
if (-not $password) { throw 'Chưa có mật khẩu' }

Step 'Lưu secrets vào GitHub'
# --body, not a pipe: Windows PowerShell adds a line break to piped text, which would be stored too
gh secret set SUPABASE_ACCESS_TOKEN --body $token; Must 'lưu SUPABASE_ACCESS_TOKEN'
gh secret set SUPABASE_DB_PASSWORD --body $password; Must 'lưu SUPABASE_DB_PASSWORD'
gh secret set SUPABASE_PROJECT_ID --body $projectRef; Must 'lưu SUPABASE_PROJECT_ID'
gh secret list

Step 'Kiểm tra migration trên dự án'
$env:SUPABASE_ACCESS_TOKEN = $token
$env:SUPABASE_DB_PASSWORD = $password
npx --yes supabase link --project-ref $projectRef; Must 'liên kết dự án Supabase (kiểm tra token và mật khẩu)'
npx supabase migration list
$manual = Read-Host 'Bạn đã từng tự chạy file SQL friend_challenges trong SQL Editor chưa? (c = có / Enter = chưa)'
if ($manual -match '^[cCyY]') {
  npx supabase migration repair --status applied 20261014082317; Must 'đánh dấu migration'
  npx supabase migration list
}
Write-Host 'Xong. Lần push lên main tiếp theo, CI sẽ áp các migration còn thiếu.' -ForegroundColor Green
