# PowerShell script to import waitlist.json into SQLite using sqlite3.exe (Unicode‑safe)

# Resolve the actual path of waitlist.json (handles Unicode folder names)
$jsonPath = (Resolve-Path "c:/Users/ADMIN/OneDrive/Máy tính/My-first-web/waitlist.json").Path
$dbPath   = "c:/Users/ADMIN/OneDrive/Máy tính/My-first-web/my-brain/brain.db"
$sqliteExe = (Get-ChildItem "temp_sqlite" -Recurse -Filter "sqlite3.exe" | Select-Object -First 1).FullName

if (-Not (Test-Path -LiteralPath $jsonPath)) {
    Write-Error "waitlist.json not found at $jsonPath"
    exit 1
}
if (-Not (Test-Path -LiteralPath $sqliteExe)) {
    Write-Error "sqlite3.exe not found at $sqliteExe"
    exit 1
}

# Read and parse JSON (UTF‑8)
$raw = Get-Content -LiteralPath $jsonPath -Raw
$customers = $raw | ConvertFrom-Json

# Build temporary SQL file with INSERT statements
$sqlPath = "c:/Users/ADMIN/OneDrive/Máy tính/My-first-web/my-brain/insert_customers.sql"
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

# Execute the SQL against the database
& $sqliteExe $dbPath ".read $sqlPath"

Write-Host "Import completed."
