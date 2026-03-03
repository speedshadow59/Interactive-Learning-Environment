param(
  [Parameter(Mandatory = $true)]
  [string]$Surname,

  [Parameter(Mandatory = $true)]
  [string]$FirstName,

  [Parameter(Mandatory = $true)]
  [string]$BCode,

  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$baseName = "AT3_${Surname}_${FirstName}_${BCode}"

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $outputPath = Join-Path (Split-Path -Parent $repoRoot) "AT3-Submissions"
} elseif ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $outputPath = $OutputDir
} else {
  $outputPath = Join-Path $repoRoot $OutputDir
}
if (-not (Test-Path $outputPath)) {
  New-Item -ItemType Directory -Path $outputPath | Out-Null
}

$tempRoot = Join-Path $env:TEMP ("ile-at3-" + [guid]::NewGuid().ToString("N"))
$tempProject = Join-Path $tempRoot "Interactive-Learning-Environment"
New-Item -ItemType Directory -Path $tempProject -Force | Out-Null

$excludeDirNames = @(
  ".git",
  "node_modules",
  "build",
  "dist",
  "coverage",
  ".next",
  ".vscode",
  "submissions"
)

$excludeFilePatterns = @(
  "*.log",
  "npm-debug.log*",
  "yarn-error.log*"
)

Get-ChildItem -Path $repoRoot -Recurse -Force | ForEach-Object {
  $item = $_

  $relative = $item.FullName.Substring($repoRoot.Length).TrimStart('\\')
  if ([string]::IsNullOrWhiteSpace($relative)) {
    return
  }

  foreach ($excluded in $excludeDirNames) {
    if ($relative -eq $excluded -or $relative.StartsWith($excluded + "\\")) {
      return
    }
  }

  foreach ($pattern in $excludeFilePatterns) {
    if (-not $item.PSIsContainer -and $item.Name -like $pattern) {
      return
    }
  }

  $target = Join-Path $tempProject $relative

  if ($item.PSIsContainer) {
    if (-not (Test-Path $target)) {
      New-Item -ItemType Directory -Path $target -Force | Out-Null
    }
  } else {
    $targetDir = Split-Path -Parent $target
    if (-not (Test-Path $targetDir)) {
      New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    Copy-Item -Path $item.FullName -Destination $target -Force
  }
}

$zipPath = Join-Path $outputPath ($baseName + ".zip")
if (Test-Path $zipPath) {
  Remove-Item -Path $zipPath -Force
}

Compress-Archive -Path $tempProject -DestinationPath $zipPath -CompressionLevel Optimal -Force

Remove-Item -Path $tempRoot -Recurse -Force

Write-Host "Created submission zip: $zipPath"
Write-Host "Suggested video filename: $baseName.mp4"
Write-Host "Generated at: $timestamp"
