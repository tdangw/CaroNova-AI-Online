@echo off
cd C:\Users\Dang\MyProject\CaroNova
start python -m http.server 8000
timeout /t 2 /nobreak > NUL  # Dừng 2 giây để server khởi động
start http://localhost:8000    # Mở trình duyệt
