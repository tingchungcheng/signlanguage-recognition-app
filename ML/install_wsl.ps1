# Run in PowerShell AS ADMINISTRATOR (right-click -> Run as administrator).
# Enables WSL2 + Virtual Machine Platform, installs Ubuntu, sets WSL2 default.

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

function Test-Admin {
    $current = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    return $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "Re-run this script as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host "==> Enabling Windows features (WSL + Virtual Machine Platform)..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Host
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Host

Write-Host "==> Installing WSL2 kernel / platform..." -ForegroundColor Cyan
wsl --install --no-distribution
wsl --set-default-version 2

Write-Host "==> Installing Ubuntu..." -ForegroundColor Cyan
wsl --install -d Ubuntu

Write-Host ""
Write-Host "IMPORTANT: Reboot Windows if prompted, then:" -ForegroundColor Yellow
Write-Host "  1. Open 'Ubuntu' from the Start menu and create your Linux user/password"
Write-Host "  2. In Ubuntu, run:"
Write-Host ""
Write-Host "     cd /mnt/e/SelfProj/signlanguage-recognition-app" -ForegroundColor Green
Write-Host "     bash ML/setup_wsl_gpu.sh" -ForegroundColor Green
Write-Host ""
Write-Host "If WSL says virtualization is disabled, enable Intel VT-x / AMD SVM in BIOS," -ForegroundColor Yellow
Write-Host "then reboot. See: https://aka.ms/enablevirtualization" -ForegroundColor Yellow
