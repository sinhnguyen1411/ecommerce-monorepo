Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.yml"

function Run-Step {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command
    )

    Write-Host "`n==> $Label"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Label"
    }
}

function Wait-HttpGet {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 20
            Write-Host "GET $Url -> $($response.StatusCode)"
            return
        }
        catch {
            if ($attempt -eq $MaxAttempts) {
                Write-Host "GET $Url failed after $MaxAttempts attempts."
                throw
            }
            Start-Sleep -Seconds $DelaySeconds
        }
    }
}

Run-Step -Label "Rebuild and restart web service" -Command {
    docker compose -f $composeFile up -d --build web
}

Run-Step -Label "Show compose status" -Command {
    docker compose -f $composeFile ps
}

Write-Host "`n==> Endpoint checks"
Wait-HttpGet -Url "http://localhost:3000"
Wait-HttpGet -Url "http://localhost:8080/healthz"

Write-Host "`nRestart workflow completed."
