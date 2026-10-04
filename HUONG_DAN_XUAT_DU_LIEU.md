# HƯỚNG DẪN XUẤT VÀ XỬ LÝ DỮ LIỆU BÀI TEST GẮN BÓ

Tài liệu này hướng dẫn bạn cách tải dữ liệu bài test dạng file CSV về máy tính và xử lý bằng Excel mà không cần nhờ đến lập trình viên.

## 1. Cách tải dữ liệu (Xuất CSV)

1. Mở trình duyệt web và truy cập vào đường link sau:
   - Khi chạy ở máy cá nhân: `http://localhost:3000/admin/export-attachment`
   - Khi chạy trên mạng (nếu có tên miền): `https://thelifeskillhub.com/admin/export-attachment`
2. Trình duyệt sẽ hiện một cửa sổ nhỏ yêu cầu nhập **Tên đăng nhập** và **Mật khẩu**.
   - Thông tin này được cấu hình ở file `.env` trên máy chủ của bạn (tìm dòng `ADMIN_USER=` và `ADMIN_PASSWORD=`).
   - Nếu bạn dùng mật khẩu mặc định (chưa đổi): User là `admin`, Pass là `change_me_in_env_file`.
3. Sau khi nhập đúng, máy tính sẽ tự động tải xuống file `attachment_responses.csv`.

## 2. Cách mở file CSV không bị lỗi font

File CSV đã được mã hóa UTF-8 để hỗ trợ tiếng Việt. Để mở trong Excel:

**Cách 1: Nháy đúp trực tiếp**
- Thường thì Excel phiên bản mới sẽ tự động nhận diện và hiển thị đúng tiếng Việt.

**Cách 2: Nếu nháy đúp bị lỗi font (chữ bị biến dạng)**
1. Mở một trang Excel mới trắng tinh (Blank Workbook).
2. Chọn tab **Data** > **From Text/CSV**.
3. Chọn file `attachment_responses.csv` vừa tải về.
4. Ở bảng hiện lên, mục **File Origin** hãy chọn `65001: Unicode (UTF-8)`.
5. Bấm **Load**.

**Mở bằng Google Sheets (Google Trang Tính):**
1. Vào Google Drive, tạo một Google Sheets mới.
2. Chọn **Tệp (File)** > **Nhập (Import)** > **Tải lên (Upload)**.
3. Kéo thả file CSV vào. Nó sẽ tự động nhận diện tiếng Việt hoàn hảo.

## 3. Cách kiểm tra chất lượng dữ liệu (Lọc rác)

Khi có file dữ liệu, bạn nên lọc bớt những người làm không nghiêm túc:
1. **Lọc người làm quá nhanh:** Ở cột `duration_seconds` (thời gian tính bằng giây), bạn có thể xóa những dòng làm dưới 90 giây.
2. **Lọc người click bừa 1 đáp án:** Ở 24 cột đáp án (từ `q1` đến `q24`), nếu người dùng chọn toàn số 1 hoặc toàn số 7, có thể họ làm không nghiêm túc. Bạn có thể dùng hàm `=STDEV(M2:AJ2)` (nếu M2 đến AJ2 là các ô q1-q24), nếu kết quả bằng 0 (nghĩa là độ lệch chuẩn bằng 0, tất cả đáp án giống hệt nhau) thì nên xóa.
3. **Lọc theo tuổi/địa điểm:** Hệ thống vốn dĩ đã TỪ CHỐI không lưu những người dưới 18, trên 30 hoặc ở ngoài TP.HCM. Cột này chỉ lưu những dữ liệu hợp lệ.

## 4. Cách tự tính lại điểm nếu muốn đổi ngưỡng (Cutoff)

Hiện tại, hệ thống phân loại "An toàn" hay "Né tránh" dựa trên ngưỡng cố định là **4.0**. Nếu nghiên cứu của bạn yêu cầu dùng trung vị (median) của mẫu, bạn có thể tự tính lại trong Excel:

**Bước 1: Tính lại điểm trung bình 12 câu Lo âu (A)**
- Các câu Lo âu: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23.
- Chú ý: Câu 7 và 15 là câu **đảo ngược**.
- Công thức cho một dòng (ví dụ ở ô AK2):
  `=AVERAGE(q1, q3, q5, 8-q7, q9, q11, q13, 8-q15, q17, q19, q21, q23)`

**Bước 2: Tính lại điểm trung bình 12 câu Né tránh (V)**
- Các câu Né tránh: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24.
- Chú ý: Câu 4, 10, 18, 22 là câu **đảo ngược**.
- Công thức cho một dòng (ví dụ ở ô AL2):
  `=AVERAGE(q2, 8-q4, q6, q8, 8-q10, q12, q14, q16, 8-q18, q20, 8-q22, q24)`

**Bước 3: Phân loại theo ngưỡng mới**
- Giả sử ngưỡng mới của bạn là 3.5. Bạn có thể dùng hàm IF lồng nhau để phân loại lại:
  `=IF(AND(AK2<3.5, AL2<3.5), "An toàn", IF(AND(AK2>=3.5, AL2<3.5), "Lo âu – bận tâm", IF(AND(AK2<3.5, AL2>=3.5), "Xa cách – né tránh", "Sợ hãi – né tránh")))`

## 5. Xử lý sự cố thường gặp

- **Nhập Admin Password xong hiện màn hình trắng / lỗi:** Nghĩa là server đang báo lỗi nội bộ. Hãy báo lại cho kỹ thuật viên kiểm tra log file.
- **Tải về file trống:** Nếu file CSV chỉ có 1 dòng tiêu đề và không có dữ liệu, nghĩa là chưa có ai làm bài test (hoặc tất cả các lượt làm đều không hợp lệ/tuổi không phù hợp nên bị hệ thống từ chối lưu).
- **Lỗi Font chữ khi mở bằng Excel cũ:** Hãy dùng cách mở bằng "From Text/CSV" đã hướng dẫn ở mục 2, hoặc upload lên Google Sheets, sau đó download lại dưới dạng file `.xlsx` là được.

## 6. Cách quản lý Đăng ký phỏng vấn

Hệ thống cung cấp một trang quản trị riêng để bạn xem những ai đã đăng ký tham gia phỏng vấn sâu.

1. **Truy cập trang Quản trị Đăng ký:**
   - Link: `http://localhost:3000/admin/interviews.html` (hoặc tên miền của bạn + `/admin/interviews.html`).
   - Yêu cầu mật khẩu Admin giống hệt lúc tải file CSV.

2. **Cách xem và lọc đăng ký:**
   - Tại trang này, bạn sẽ thấy danh sách tất cả những người đăng ký (có Tên, Cách liên hệ, Trạng thái, và cột Liên kết Test).
   - Nếu ở cột Liên kết Test hiển thị **"Có mã"**, bạn bấm nút **Xem** thì sẽ thấy được Điểm Lo âu, Điểm Né tránh và Phong cách gắn bó của họ hiện ra. (Hệ thống tự đi tìm trong kho test dựa trên mã liên kết).

3. **Cách đổi trạng thái và Ghi chú:**
   - Khi bấm **Xem**, bạn có thể đổi trạng thái (Ví dụ: Từ "Mới" sang "Đã liên hệ", "Đã phỏng vấn") và nhập nội dung vào ô **Ghi chú** (VD: "Người này rảnh tối thứ 3"). Sau đó bấm **Lưu thay đổi**.

4. **Cách xuất file CSV Đăng ký:**
   - Bấm nút xanh **"📥 Xuất CSV Đăng ký"** ở góc trên cùng bên phải.
   - File này sẽ xuất toàn bộ danh sách định danh (Tên, SĐT, Zalo...).
   - **CẢNH BÁO:** File này CHỨA THÔNG TIN CÁ NHÂN nên cần được bảo mật tuyệt đối, không chia sẻ bừa bãi. Mã liên kết KHÔNG có trong file CSV bài test ẩn danh.

5. **Xử lý yêu cầu Rút lui / Xóa dữ liệu:**
   - Khi có người nhắn: *"Tôi muốn rút lui, hãy xóa số điện thoại của tôi"* -> Bạn bấm nút **Xem** người đó, rồi bấm nút đỏ **Xóa dữ liệu (Rút lui)**.
   - Khi đó, hệ thống sẽ xóa vĩnh viễn tên, Zalo, SĐT của họ (Bước 1).
   - Nếu người đó có liên kết bài test bằng mã, hệ thống sẽ hỏi bạn (Bước 2): *"Có muốn xóa luôn kết quả bài test của họ không?"*. Bạn có thể chọn OK (xóa cả bài test) hoặc Cancel (giữ lại bài test ẩn danh, chỉ xóa thông tin định danh).

