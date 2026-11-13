let studentsData = [];

// Cookie Helpers
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/;';
}

// 1. GỌI API /api/tacke
async function fetchApiData() {
    const statusDiv = document.getElementById('statusMessage');
    const searchContainer = document.getElementById('searchContainer');
    const statsRow = document.getElementById('statsRow');
    
    statusDiv.innerHTML = '<span class="text-primary"><i class="fa-solid fa-spinner fa-spin me-1"></i>Đang tải dữ liệu từ API Node-RED...</span>';

    try {
        const response = await fetch('/api/tacke');
        const data = await response.json();

        if (data.ok === 1 && Array.isArray(data.dssv)) {
            statusDiv.innerHTML = `<span class="text-success"><i class="fa-solid fa-check me-1"></i>Truy vấn thành công! Hệ thống: ${data.system}</span>`;
            searchContainer.classList.remove('d-none');
            statsRow.classList.remove('d-none');
            studentsData = data.dssv;
            renderStudents(studentsData);
        } else {
            statusDiv.innerHTML = '<span class="text-danger">Không nhận được định dạng dữ liệu hợp lệ!</span>';
        }
    } catch (err) {
        statusDiv.innerHTML = '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i>Lỗi kết nối tới Reverse Proxy /api/tacke</span>';
    }
}

// 2. RENDER VÀ THỐNG KÊ
function renderStudents(list) {
    const container = document.getElementById('studentListContainer');
    let total = 0;

    if (list.length === 0) {
        container.innerHTML = '<div class="alert alert-warning py-3 text-center mb-0">Không tìm thấy sinh viên nào phù hợp!</div>';
        document.getElementById('statTotalCount').textContent = 0;
        document.getElementById('statTotalMoney').textContent = '0 VNĐ';
        return;
    }

    let html = '<div class="list-group shadow-sm">';
    list.forEach((item, index) => {
        const moneyNum = Number(item.money) || 0;
        total += moneyNum;
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div class="d-flex align-items-center">
                    <span class="badge bg-secondary rounded-pill me-3">${index + 1}</span>
                    <strong class="text-dark">${item.name}</strong>
                </div>
                <span class="badge-money">${moneyNum.toLocaleString('vi-VN')} VNĐ</span>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
    document.getElementById('statTotalCount').textContent = list.length;
    document.getElementById('statTotalMoney').textContent = total.toLocaleString('vi-VN') + ' VNĐ';
}

// 3. TÌM KIẾM THEO TÊN
function filterStudents() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = studentsData.filter(st => st.name.toLowerCase().includes(keyword));
    renderStudents(filtered);
}

// 4. XỬ LÝ ĐĂNG NHẬP COOKIE (/api/login)
async function handleLogin() {
    const uid = document.getElementById('username').value.trim();
    const pwd = document.getElementById('password').value.trim();
    const alertDiv = document.getElementById('loginAlert');

    alertDiv.classList.add('d-none');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, pwd })
        });
        const res = await response.json();

        if (res.ok === 1) {
            setCookie('session_token', res.ck, 7);
            showLoggedInUI(res.fullname);
        } else {
            alertDiv.textContent = res.msg || 'Đăng nhập thất bại!';
            alertDiv.classList.remove('d-none');
        }
    } catch (e) {
        alertDiv.textContent = 'Không thể kết nối đến máy chủ API!';
        alertDiv.classList.remove('d-none');
    }
}

function showLoggedInUI(fullname) {
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('profileSection').classList.remove('d-none');
    document.getElementById('loggedFullname').textContent = fullname || 'Người dùng';
}

function handleLogout() {
    eraseCookie('session_token');
    document.getElementById('loginSection').classList.remove('d-none');
    document.getElementById('profileSection').classList.add('d-none');
    document.getElementById('gradesResult').innerHTML = '';
}

// 5. TẢI DỮ LIỆU MẬT (/api/mat)
async function fetchSecretGrades() {
    const ck = getCookie('session_token');
    const resultDiv = document.getElementById('gradesResult');

    if (!ck) {
        resultDiv.innerHTML = '<div class="alert alert-danger py-2 small mb-0">Chưa tìm thấy Cookie hợp lệ!</div>';
        return;
    }

    try {
        const response = await fetch('/api/mat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ck })
        });
        const res = await response.json();

        if (res.ok === 1 && Array.isArray(res.data)) {
            let html = '<ul class="list-group small">';
            res.data.forEach(item => {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${item.mon}</span><strong class="text-danger">${item.diem}</strong></li>`;
            });
            html += '</ul>';
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = `<div class="alert alert-danger py-2 small mb-0">${res.msg}</div>`;
        }
    } catch (e) {
        resultDiv.innerHTML = '<div class="alert alert-danger py-2 small mb-0">Lỗi khi truy xuất dữ liệu mật!</div>';
    }
}

// Tự động kiểm tra Cookie khi mở trang
window.addEventListener('DOMContentLoaded', async () => {
    const ck = getCookie('session_token');
    if (ck) {
        try {
            const res = await fetch('/api/check_logined', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ck })
            });
            const data = await res.json();
            if (data.ok === 1) {
                showLoggedInUI('Ngọc Linh (Session Active)');
            }
        } catch(e) {}
    }
});