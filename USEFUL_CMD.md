function Get-DirectoryTree {
    param (
        [string]$Path = (Get-Location),
        [int]$Level = 0,
        [string]$ExcludeDir = "node_modules"
    )

    $indent = "    " * $Level
    $children = Get-ChildItem -LiteralPath $Path | Sort-Object -Property PSIsContainer, Name -Descending

    foreach ($child in $children) {
        if ($child.PSIsContainer) { # It's a directory
            if ($child.Name -ne $ExcludeDir) {
                Write-Host "$($indent)+-- $($child.Name)\" -ForegroundColor Green
                Get-DirectoryTree -Path $child.FullName -Level ($Level + 1) -ExcludeDir $ExcludeDir
            }
        } else { # It's a file
            Write-Host "$($indent)|-- $($child.Name)" -ForegroundColor Cyan
        }
    }
}

Get-DirectoryTree