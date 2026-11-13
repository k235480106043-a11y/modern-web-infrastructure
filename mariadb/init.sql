-- Thiết lập Database
CREATE DATABASE IF NOT EXISTS my_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE my_app;

-- 1. Bảng Sinh Viên (phục vụ API danh sách và tính tổng tiền)
CREATE TABLE IF NOT EXISTS SinhVien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    money INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu bảng SinhVien
INSERT INTO SinhVien (name, money) VALUES
('NgocLinh', 999),
('Thầy Cợp', 123),
('David', 456),
('Minh Anh', 650),
('Hoàng Nam', 820);

-- 2. Bảng Users (phục vụ chức năng Đăng nhập)
CREATE TABLE IF NOT EXISTS Users (
    uid VARCHAR(50) PRIMARY KEY,
    pwd VARCHAR(100) NOT NULL,
    fullname VARCHAR(100) NOT NULL
);

-- Dữ liệu mẫu tài khoản đăng nhập
INSERT INTO Users (uid, pwd, fullname) VALUES
('ngoclinh', '123456', 'Nguyễn Thị Ngọc Linh'),
('admin', '123456', 'Quản trị viên Hệ thống'),
('duycop', '123456', 'Thầy Đỗ Duy Cợp');

-- 3. Bảng Cookies (Lưu session token đăng nhập)
CREATE TABLE IF NOT EXISTS Cookies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) NOT NULL,
    ck VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Diem (Dữ liệu mật chỉ hiển thị sau khi đã đăng nhập)
CREATE TABLE IF NOT EXISTS Diem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) NOT NULL,
    mon VARCHAR(100) NOT NULL,
    diem FLOAT NOT NULL
);

-- Dữ liệu điểm thi demo
INSERT INTO Diem (uid, mon, diem) VALUES
('ngoclinh', 'Phát triển ứng dụng Web', 10.0),
('ngoclinh', 'An toàn & Bảo mật thông tin', 9.5),
('ngoclinh', 'Kiến trúc máy tính', 9.0),
('admin', 'Quản trị hệ thống Cloud', 10.0);