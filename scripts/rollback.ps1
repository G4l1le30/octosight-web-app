# OctoSight Rollback Script
# Usage: .\scripts\rollback.ps1 -Tag "abc123def456" [-ComposeFile "docker-compose.prod.yml"]
#
# Rolls back backend and frontend to a specific image tag,
# runs Alembic downgrade if a downgrade revision is provided.

param(
    [Parameter(Mandatory = $true)]
    [string]$Tag,

    [string]$ComposeFile = "docker-compose.prod.yml",

    [string]$DowngradeRevision = $null
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ROOT

Write-Host "[Rollback] Rolling back to image tag: $Tag" -ForegroundColor Yellow

# 1. Update image tags in compose file
$composePath = Join-Path $ROOT $ComposeFile
if (Test-Path $composePath) {
    Write-Host "[Rollback] Found compose file: $ComposeFile" -ForegroundColor Green
} else {
    Write-Host "[Rollback] No $ComposeFile found, using docker-compose.yml" -ForegroundColor Yellow
    $ComposeFile = "docker-compose.yml"
}

# 2. Pull the specific image tags
Write-Host "[Rollback] Pulling images..." -ForegroundColor Cyan
docker compose -f $ComposeFile pull backend:$Tag frontend:$Tag 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Rollback] Pull failed — trying ghcr.io images..." -ForegroundColor Yellow
    $repo = "ghcr.io/octosight"
    docker pull "$repo/backend:$Tag"
    docker pull "$repo/frontend:$Tag"
}

# 3. Run Alembic downgrade if specified
if ($DowngradeRevision) {
    Write-Host "[Rollback] Running Alembic downgrade to: $DowngradeRevision" -ForegroundColor Cyan
    docker compose -f $ComposeFile run --rm backend alembic downgrade $DowngradeRevision
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Rollback] Alembic downgrade failed — continuing with rollback" -ForegroundColor Red
    }
}

# 4. Restart services with the target tag
Write-Host "[Rollback] Restarting services..." -ForegroundColor Cyan
$env:TARGET_TAG = $Tag
docker compose -f $ComposeFile up -d --no-build

if ($LASTEXITCODE -eq 0) {
    Write-Host "[Rollback] Rollback to $Tag completed successfully." -ForegroundColor Green
    Write-Host "[Rollback] Run 'docker compose logs --tail=50' to verify." -ForegroundColor Cyan
} else {
    Write-Host "[Rollback] Rollback failed!" -ForegroundColor Red
    exit 1
}
