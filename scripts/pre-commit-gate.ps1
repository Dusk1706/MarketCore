param(
  [switch]$IncludeDocker
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host "\n==> $Name" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $Name" -ForegroundColor Red
    exit $LASTEXITCODE
  }
  Write-Host "OK: $Name" -ForegroundColor Green
}

Write-Host "Running pre-commit gate from $repoRoot" -ForegroundColor Yellow

Run-Step -Name 'Backend lint (ruff)' -Action {
  Set-Location -Path (Join-Path $repoRoot 'backend')
  ruff check .
}

Run-Step -Name 'Backend tests (pytest)' -Action {
  Set-Location -Path (Join-Path $repoRoot 'backend')
  $env:FLASK_ENV = 'testing'
  $env:JWT_SECRET_KEY = 'ci-secret-key'
  $env:PYTHONPATH = '.'
  pytest tests/
}

Run-Step -Name 'Frontend unit tests (ChromeHeadless)' -Action {
  Set-Location -Path (Join-Path $repoRoot 'frontend')
  npm.cmd test -- --watch=false --browsers=ChromeHeadless --progress=false
}

Run-Step -Name 'Frontend production build' -Action {
  Set-Location -Path (Join-Path $repoRoot 'frontend')
  npm.cmd run build -- --configuration production
}

if ($IncludeDocker) {
  Run-Step -Name 'Backend Docker build (deploy parity)' -Action {
    Set-Location -Path $repoRoot
    docker build -f backend/Dockerfile backend
  }

  Run-Step -Name 'Frontend Docker build (deploy parity)' -Action {
    Set-Location -Path $repoRoot
    docker build -f frontend/Dockerfile frontend
  }
}

Write-Host '\nPre-commit gate completed successfully.' -ForegroundColor Green
