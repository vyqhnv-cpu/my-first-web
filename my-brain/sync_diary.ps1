# Cấu hình đường dẫn
$excelPath = "C:\Users\ADMIN\OneDrive\MYTNH~1\EMOTIO~1.XLS"
$dbPath = "c:\Users\ADMIN\OneDrive\Máy tính\My-first-web\my-brain\brain.db"
$mdPath = "c:\Users\ADMIN\OneDrive\Máy tính\My-first-web\data\cam_xuc.md"
$vbsPath = "c:\Users\ADMIN\OneDrive\Máy tính\My-first-web\my-brain\temp_extract.vbs"
$sqlPath = "c:\Users\ADMIN\OneDrive\Máy tính\My-first-web\my-brain\temp_import.sql"

Write-Host "--- Bat dau qua trinh dong bo nhat ky ---" -ForegroundColor Cyan

# 1. Tạo VBScript tạm thời để đọc Excel (có mật khẩu)
$vbsCode = @"
Dim objExcel, objWorkbook, objSheet
Set objExcel = CreateObject("Excel.Application")
objExcel.Visible = False
objExcel.DisplayAlerts = False
On Error Resume Next
Set objWorkbook = objExcel.Workbooks.Open("$excelPath", 0, True, , "Gau@5892")
If Err.Number = 0 Then
    For Each objSheet In objWorkbook.Sheets
        WScript.Echo "=== SHEET: " & objSheet.Name & " ==="
        For i = 1 To objSheet.UsedRange.Rows.Count
            line = ""
            For j = 1 To objSheet.UsedRange.Columns.Count
                line = line & objSheet.Cells(i, j).Text & " [TAB] "
            Next
            WScript.Echo line
        Next
    Next
    objWorkbook.Close False
End If
objExcel.Quit
"@
$vbsCode | Out-File -FilePath $vbsPath -Encoding ascii

# 2. Chạy VBScript để lấy dữ liệu
Write-Host "Dang doc du lieu tu Excel..."
$raw = cscript //nologo $vbsPath

# 3. Xử lý và tinh chế dữ liệu
Write-Host "Dang tinh che ngon ngu va chuan bi du lieu..."
$entries = @()
$currentDate = Get-Date -Format "dd/MM/yyyy HH:mm"

foreach ($line in $raw) {
    $parts = $line -split " \[TAB\] "
    if ($parts.Count -lt 11) { continue }
    $content = $parts[10]
    if ($content -and $content -ne "Chi tiết" -and $content -ne "Hôm nay chưa làm" -and $content.Length -gt 5) {
        # Tinh chế ngôn ngữ
        $clean = $content -replace "đọc chú", "thực hành rèn luyện tâm trí"
        $clean = $clean -replace "đi chùa", "thực hành rèn luyện tại không gian yên tĩnh"
        $clean = $clean -replace "phạm giới tà dâm", "chưa kiểm soát được kỷ luật cá nhân"
        $clean = $clean -replace "vô ơn", "thiếu sự trân trọng"
        $clean = $clean -replace "'", "''"
        
        $sql = "INSERT INTO knowledge (category, content) VALUES ('Nhật ký/Kinh nghiệm', 'Ngày $($parts[6]): $clean');"
        $sql | Out-File -FilePath $sqlPath -Append -Encoding utf8
        $entries += "- [$($parts[6])]: $clean"
    }
}

# 4. Cập nhật Database (Tải sqlite3 nếu cần)
if (Test-Path $sqlPath) {
    Write-Host "Dang cap nhat co so du lieu..."
    $sqliteUrl = "https://www.sqlite.org/2024/sqlite-tools-win-x64-3450300.zip"
    if (-not (Test-Path "sqlite3.exe")) {
        Invoke-WebRequest -Uri $sqliteUrl -OutFile "sqlite.zip"
        Expand-Archive -Path "sqlite.zip" -DestinationPath "temp_sqlite" -Force
        Move-Item "temp_sqlite\*\sqlite3.exe" "." -Force
        Remove-Item "sqlite.zip"; Remove-Item -Recurse "temp_sqlite"
    }
    .\sqlite3.exe $dbPath ".read $sqlPath"
    Remove-Item $sqlPath
}

# 5. Cập nhật file Markdown
Write-Host "Dang cap nhat file cam_xuc.md..."
$header = "# Nhat ky dong bo tu Excel (Cap nhat: $currentDate)`n`n"
$header + ($entries -join "`n`n") | Out-File -FilePath $mdPath -Encoding utf8

# 6. Dọn dẹp
Remove-Item $vbsPath
Write-Host "--- DONG BO HOAN TAT ---" -ForegroundColor Green
pause
