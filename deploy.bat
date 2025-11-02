@echo off
REM Blood Pressure Tracker - Quick Deployment Script
REM Simple batch file for quick deployments

echo.
echo ========================================
echo  Blood Pressure Tracker Deployment
echo ========================================
echo.

REM Check for commit message parameter
if "%1"=="" (
    set /p commit_msg="Enter commit message (or press Enter for default): "
    if "!commit_msg!"=="" (
        set commit_msg=Deploy: Updated application
    )
) else (
    set commit_msg=%1
)

echo.
echo Staging changes...
git add .

echo.
echo Committing changes...
git commit -m "%commit_msg%"

if errorlevel 1 (
    echo.
    echo Error: Failed to commit changes
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub...
git push

if errorlevel 1 (
    echo.
    echo Error: Failed to push to GitHub
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Success! Deployment initiated.
echo ========================================
echo.
echo Railway will automatically deploy in 2-3 minutes.
echo Monitor at: https://railway.app
echo.
pause



