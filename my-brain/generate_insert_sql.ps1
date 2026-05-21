# PowerShell script to generate INSERT statements for customers table (Unicode‑safe)
$jsonPath = "c:/Users/ADMIN/OneDrive/Máy tính/My-first-web/waitlist.json"
$sqlPath   = "c:/Users/ADMIN/OneDrive/Máy tính/My-first-web/my-brain/insert_customers.sql"

# Ensure the JSON file exists (use -LiteralPath to avoid wildcard expansion)
if (-Not (Test-Path -LiteralPath $jsonPath)) {
    Write-Error "waitlist.json not found at $jsonPath"
    exit 1
}

# Read and parse JSON (UTF‑8)
$raw = Get-Content -LiteralPath $jsonPath -Raw
$customers = $raw | ConvertFrom-Json

# Begin transaction for speed
"BEGIN TRANSACTION;" | Out-File -FilePath $sqlPath -Encoding utf8

foreach ($c in $customers) {
    $fullName = ($c.full_name -replace "'", "''")
    $phone    = ($c.phone -replace "'", "''")
    $zalo     = ($c.zalo -replace "'", "''")
    $regAt    = ($c.registered_at -replace "'", "''")
    $stmt = "INSERT OR IGNORE INTO customers (full_name, phone, zalo, registered_at) VALUES ('$fullName', '$phone', '$zalo', '$regAt');"
    $stmt | Out-File -FilePath $sqlPath -Append -Encoding utf8
}

"COMMIT;" | Out-File -FilePath $sqlPath -Append -Encoding utf8

Write-Host "SQL file generated at $sqlPath"
