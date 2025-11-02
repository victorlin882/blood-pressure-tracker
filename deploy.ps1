# Blood Pressure Tracker - Deployment Script
# Automatically commits changes and deploys to Railway via GitHub

Write-Host "🚀 Blood Pressure Tracker - Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# Check if git is available
try {
    $gitVersion = git --version
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "✗ Error: Not a git repository. Run this script from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Checking for changes...`n" -ForegroundColor Yellow

# Check git status
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "ℹ No changes detected. Nothing to deploy." -ForegroundColor Yellow
    Write-Host "`nTo deploy, make some changes first, then run this script again." -ForegroundColor Gray
    exit 0
}

# Show what files have changed
Write-Host "📝 Files changed:" -ForegroundColor Yellow
git status --short | ForEach-Object {
    Write-Host "   $_" -ForegroundColor Gray
}

Write-Host "`n"

# Prompt for commit message
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Deploy: Updated application - $timestamp"
    Write-Host "Using default message: $commitMessage" -ForegroundColor Gray
}

Write-Host "`n📦 Staging changes...`n" -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Failed to stage changes" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Changes staged" -ForegroundColor Green

Write-Host "`n💾 Committing changes...`n" -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Failed to commit changes" -ForegroundColor Red
    Write-Host "This might be because there are no changes to commit." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Changes committed" -ForegroundColor Green

Write-Host "`n☁️  Pushing to GitHub...`n" -ForegroundColor Yellow
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Check your internet connection and GitHub credentials." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Pushed to GitHub successfully!" -ForegroundColor Green

Write-Host "`n🚂 Railway Deployment:" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✓ Changes pushed to GitHub" -ForegroundColor Green
Write-Host "⏳ Railway will automatically detect and deploy your changes" -ForegroundColor Yellow
Write-Host "⏱️  Deployment typically takes 2-3 minutes" -ForegroundColor Yellow
Write-Host "`n📊 Monitor deployment at: https://railway.app" -ForegroundColor Cyan
Write-Host "🌐 Your site: https://blood-pressure-tracker-production.up.railway.app" -ForegroundColor Cyan
Write-Host "`n💡 Tip: Wait 2-3 minutes, then hard refresh (Ctrl+F5) your browser!" -ForegroundColor Gray
Write-Host "`n✅ Deployment initiated successfully!`n" -ForegroundColor Green



