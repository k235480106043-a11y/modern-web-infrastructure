# Enterprise Web Infrastructure & Microservices Architecture Showcase
### Hệ Thống Hạ Tầng & Kiến Trúc Dịch Vụ Web Hiện Đại

[![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2.24+-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
[![Node-RED](https://img.shields.io/badge/Node--RED-Microservices_API-8F0000?style=for-the-badge&logo=nodered&logoColor=white)](https://nodered.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-11.x-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare-Zero_Trust_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

---

## 📌 1. Tổng Quan Dự Án (Executive Summary)

Dự án này là giải pháp kỹ thuật toàn diện về **Hạ tầng và Kiến trúc Dịch vụ Web Doanh nghiệp (Enterprise Web Infrastructure & Services)**, được nghiên cứu và hiện thực hóa trong khuôn khổ học phần **Phát triển ứng dụng Web**. 

Hệ thống được thiết kế theo tư duy kiến trúc hướng dịch vụ (**Service-Oriented Architecture - SOA**) và vùng chứa (**Containerization**), loại bỏ các rào cản truyền thống của máy chủ vật lý để mang lại khả năng triển khai tức thời, khả năng mở rộng linh hoạt, bảo mật đa tầng và tối ưu hóa tài nguyên.

* **Sinh viên thực hiện:** Nguyễn Thị Ngọc Linh
* **Mã sinh viên:** K235480106043
* **Lớp:** K59KMT.K01 (K59KTP.K01) - Khoa Công nghệ Thông tin
* **Giảng viên hướng dẫn:** Thầy Đỗ Duy Cợp (`duycop`)

---

## 🏗️ 2. Sơ Đồ Kiến Trúc Hệ Thống (System Architecture)

Toàn bộ hệ thống giao tiếp qua mạng nội bộ ảo độc lập (`app_network`), đứng sau cơ chế bảo vệ kép của **Cloudflare Edge** và **Nginx Reverse Proxy Gateway**:

```mermaid
flowchart TD
    subgraph Internet ["🌐 Không Gian Mạng (Public Internet)"]
        UserBrowser["💻 Người Dùng (Client Browser)"]
        AdminUser["🔑 Quản Trị Viên (Admin)"]
    end

    subgraph CloudflareEdge ["🛡️ Lớp Bảo Mật Vành Đai Cloudflare"]
        CF_DNS["Cloudflare DNS & WAF (DDoS Mitigation)"]
        CF_Tunnel["Cloudflare Zero-Trust Tunnel Client"]
    end

    subgraph HostServer ["🖥️ Máy Chủ Ứng Dụng (Docker Compose Network: app_network)"]
        NginxGateway["🚪 Nginx Reverse Proxy (Port 80)\n[Gateway & Virtual Host Dispatcher]"]
        
        subgraph StaticWebsites ["📁 Khối Giao Diện Web (Frontend Static)"]
            Web1["🌐 Website 1 (Portal & Dashboard)\nngoclinh1.tnut.cuong.id.vn"]
            Web2["🌐 Website 2 (Company Landing)\nngoclinh2.tnut.cuong.id.vn"]
        end

        subgraph BackendServices ["⚡ Khối Dịch Vụ Microservices (Backend)"]
            NodeRed["🟢 Node-RED Engine (Port 1880)\n- REST API: /api/tacke\n- Auth API: /api/login\n- Secure API: /api/mat"]
        end

        subgraph DatabaseTier ["💾 Khối Cơ Sở Dữ Liệu (Persistence Layer)"]
            MariaDB["🐬 MariaDB Server (Port 3306)\n- Database: my_app\n- Tables: SinhVien, Users, Cookies, Diem"]
            PhpMyAdmin["📊 phpMyAdmin Interface (Port 8081)"]
        end
    end

    UserBrowser -->|Truy cập Domain| CF_DNS
    AdminUser -->|Quản trị| CF_DNS
    CF_DNS <==>|Encrypted Tunnel| CF_Tunnel
    CF_Tunnel -->|Forward HTTP| NginxGateway

    NginxGateway -->|Host: ngoclinh1.*| Web1
    NginxGateway -->|Host: ngoclinh2.*| Web2
    NginxGateway -->|Route: /api/* (Proxy Pass)| NodeRed

    NodeRed <-->|Query SQL / Connection Pool| MariaDB
    PhpMyAdmin <-->|SQL Management| MariaDB
```

---

## ⚙️ 3. Phân Tích Kỹ Thuật 5 Dịch Vụ Cốt Lõi

### 3.1. Reverse Proxy & Virtual Hosting (Nginx Gateway)
* **Định tuyến đa tên miền (Multi-Tenancy):** Cấu hình Nginx sử dụng cơ chế Virtual Host nhận diện trường `Host` trong HTTP Header để phục vụ đồng thời 2 website riêng biệt trên cùng một địa chỉ IP và Port 80 duy nhất:
  - `ngoclinh1.tnut.cuong.id.vn`: Cổng thông tin điều hành chính (Portal & API consumer).
  - `ngoclinh2.tnut.cuong.id.vn`: Trang giới thiệu doanh nghiệp độc lập (Resource isolation).
* **Triệt tiêu lỗi CORS (Cross-Origin Resource Sharing):** Nginx đóng vai trò trung chuyển ngược: mọi yêu cầu bắt đầu bằng `/api/` được chuyển hướng ngầm tới `http://nodered:1880/api/`. Mã JavaScript tại Frontend chỉ cần gọi URL tương đối (`fetch('/api/tacke')`) mà không bị rào cản Same-Origin Policy của trình duyệt.

### 3.2. Low-Code Microservices API (Node-RED)
* Kiến trúc xử lý luồng sự kiện non-blocking tối ưu hóa hiệu năng I/O.
* **Các Endpoint chính:**
  - `GET /api/tacke`: Cung cấp danh sách sinh viên kèm số tiền theo thời gian thực dưới định dạng JSON chuẩn.
  - `POST /api/login`: Tiếp nhận thông tin định danh, xác thực và cấp phát Session Cookie token.
  - `POST /api/check_logined`: Xác thực tính hợp lệ của phiên làm việc.
  - `POST /api/mat`: Trả về dữ liệu điểm thi và hồ sơ cá nhân bảo mật chỉ khi kiểm tra Token thành công.

### 3.3. Cơ Sở Dữ Liệu Quan Hệ & Khởi Tạo Tự Động (MariaDB)
* Lưu trữ an toàn các bảng thực thể: `SinhVien`, `Users`, `Cookies`, `Diem`.
* **Cơ chế DDL Auto-Provisioning:** Ánh xạ tệp `./mariadb/init.sql` vào `/docker-entrypoint-initdb.d/init.sql` của Container MariaDB. Khi máy chủ khởi động lần đầu, toàn bộ cấu trúc bảng và dữ liệu mẫu được nạp tự động, loại bỏ 100% thao tác thủ công.

### 3.4. Quản Trị CSDL Trực Quan (phpMyAdmin)
* Độc lập, giao tiếp trực tiếp với container MariaDB qua cổng `8081`. Cho phép quan sát, sao lưu và kiểm tra tính toàn vẹn dữ liệu.

### 3.5. Đường Hầm Bảo Mật Zero-Trust (Cloudflare Tunnel)
* **Bảo vệ toàn diện:** Máy chủ không cần mở bất kỳ cổng nào trên modem/router (No Port Forwarding), không yêu cầu địa chỉ IP tĩnh công cộng đắt đỏ.
* Mọi lưu lượng từ Internet được bọc mã hóa TLS/HTTPS qua đường hầm ra ngoài và được bảo vệ trước các đòn tấn công từ chối dịch vụ (DDoS) tại Cloudflare Edge.

---

## 🔐 4. Cơ Chế Xác Thực & Duy Trì Phiên (State & Session Management)

Hệ thống triển khai cơ chế xác thực **Token-Based Session** thông qua HTTP Cookie:

1. **Client Submission:** Người dùng gửi `uid` và `pwd` qua phương thức `POST` tới `/api/login`.
2. **Server Validation & Token Generation:** Backend Node-RED đối soát thông tin; nếu hợp lệ sẽ tạo một chuỗi mã định danh duy nhất (UUID/Token) với tiền tố `session_` kết hợp timestamp.
3. **Cookie Storage:** Trình duyệt nhận mã và lưu trữ dưới dạng Cookie an toàn (`SameSite=Lax`, thời hạn 7 ngày).
4. **Protected Resource Access:** Khi truy cập trang mật (`/api/mat`), mã Cookie được tự động đính kèm để thẩm định quyền trước khi xuất dữ liệu.

---

## 🛠️ 5. Post-Mortem: Phân Tích Sự Cố Kỹ Thuật & Bài Học Kinh Nghiệm

Trong quá trình phát triển phiên bản ban đầu (v1.0), hệ thống gặp sự cố đường dẫn khi ánh xạ thư mục trong Nginx:

| Hạng mục | Phiên bản v1.0 (Lỗi sự cố) | Phiên bản v2.0 (Chuẩn Kỹ Sư Hiện Tại) |
| :--- | :--- | :--- |
| **Cấu trúc Host** | `web1/` và `web2/` nằm ngang hàng `docker-compose.yml` | Gom toàn bộ website vào thư mục cha `html/` (`html/web1/`, `html/web2/`) |
| **Mount Volume** | `- ./html:/usr/share/nginx/html` *(lệch cấu trúc)* | `- ./html:/usr/share/nginx/html:ro` |
| **Nginx Root Path**| `root /usr/share/nginx/html/web1;` | `root /usr/share/nginx/html/web1;` *(Khớp 100%)* |
| **Hiện tượng** | Container Nginx báo **404 Not Found** khi khởi chạy | **Hệ thống chạy mượt mà ngay sau 1 lệnh khởi động** |

> **💡 Bài học cốt lõi:** Khi làm việc với Docker Volume, việc quy hoạch thư mục gốc (Parent Directory Mounting) đồng bộ tuyệt đối giữa Host OS và Container Filesystem là nguyên tắc sống còn để tránh lỗi Path Traversal.

---

## 🚀 6. Hướng Dẫn Triển Khai Nhanh (Quick Start)

### Yêu cầu tiên quyết
* Máy tính đã cài đặt **Docker Desktop** (trên Windows/macOS) hoặc **Docker Engine & Docker Compose** (trên Ubuntu/WSL).
* Git CLI.

### 3 Bước khởi chạy hệ thống:

```bash
# 1. Sao chép mã nguồn dự án
git clone https://github.com/k235480106043-a11y/modern-web-infrastructure.git
cd modern-web-infrastructure

# 2. Khởi chạy toàn bộ 5 dịch vụ ngầm bằng Docker Compose
docker compose up -d

# 3. Kiểm tra trạng thái các container đang chạy
docker compose ps
```

### Các cổng dịch vụ cục bộ:
* **Website 1 (Cổng thông tin & API):** [http://localhost](http://localhost)
* **Website 2 (Trang độc lập Virtual Host):** [http://web2.localhost](http://web2.localhost)
* **Backend Node-RED Flow Editor:** [http://localhost:1880](http://localhost:1880)
* **Quản trị CSDL phpMyAdmin:** [http://localhost:8081](http://localhost:8081)

---

## 📊 7. So Sánh Kiến Trúc Truyền Thống vs Kiến Trúc Hiện Đại

| Tiêu chí | Ngăn xếp truyền thống (IIS + ASP.NET + SQL Server) | Ngăn xếp hiện đại (Docker + Nginx + Node-RED + MariaDB) |
| :--- | :--- | :--- |
| **Môi trường** | Phụ thuộc chặt chẽ vào Windows OS và IIS runtime | Chạy độc lập, nhất quán trên mọi hệ điều hành qua Container |
| **Khả năng mở rộng**| Khó co giãn, cấu hình phức tạp | Co giãn tức thì với `docker compose up --scale` |
| **Triển khai** | Cài đặt thủ công từng cấu phần | Đóng gói toàn bộ hạ tầng thành mã nguồn (**IaC**) |
| **Bảo mật mạng** | Cần mở cổng NAT/Router dễ bị tấn công | Zero-Trust Tunnel không mở cổng, ẩn IP máy chủ |

---

## 📜 8. Bản Quyền & Giấy Phép
Dự án được thực hiện bởi sinh viên **Nguyễn Thị Ngọc Linh** cho đồ án học phần **Phát triển ứng dụng Web**. Toàn bộ mã nguồn mở phục vụ mục đích học thuật, nghiên cứu và trình diễn năng lực kỹ thuật.
