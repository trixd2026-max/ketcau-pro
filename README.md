# KetCau Pro

**Công cụ hỗ trợ thiết kế kết cấu bê tông cốt thép theo TCVN 5574:2018**

Web app hiện đại giúp kỹ sư tính toán nhanh cột, móng đơn, dầm, sàn và xuất báo cáo.

## Tính năng hiện có

- **Dashboard** tổng hợp hệ số sử dụng + trạng thái Đạt / Không đạt
- **Thiết kế Cột**: tiết diện chữ nhật / tròn / chữ T, tải trọng N-Mx-My-Q, độ mảnh
- **Móng đơn**: kích thước đáy, sức chịu tải đất, kiểm tra lệch tâm
- **Dầm & Sàn**: kiểm tra uốn + cắt sơ bộ
- **Quản lý nhiều dự án** (lưu LocalStorage)
- **Xuất báo cáo PDF**
- **Bảng tra nhanh** neo, nối chồng, cốt đai theo TCVN 5574:2018
- Dark / Light mode
- Responsive

## Cảnh báo quan trọng

> Toàn bộ kết quả tính toán chỉ là **công cụ hỗ trợ thiết kế**.  
> Kỹ sư thiết kế phải tự kiểm tra số liệu đầu vào, đối chiếu tiêu chuẩn TCVN 5574:2018 / TCVN 9362:2012 và chịu trách nhiệm phê duyệt trước khi đưa vào hồ sơ.

Các công thức hiện tại là **xấp xỉ kỹ thuật** để demo. Phiên bản production cần implement đầy đủ mô hình biến dạng và các công thức chính xác của tiêu chuẩn.

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:5173

## Build

```bash
npm run build
```

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (state + persist)
- React Router
- jsPDF + autoTable

## Repository

https://github.com/trixd2026-max/ketcau-pro

---

Made for Vietnamese structural engineers.
