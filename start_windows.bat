@echo off
echo ========================================
echo   Seeking 网站快速启动脚本 (Windows)
echo ========================================
echo.

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

REM 检查pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到pip，请检查Python安装
    pause
    exit /b 1
)

echo 1. 安装Python依赖...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo 错误: 依赖安装失败
    cd ..
    pause
    exit /b 1
)

echo.
echo 2. 初始化数据库...
python init_db.py
if errorlevel 1 (
    echo 错误: 数据库初始化失败
    cd ..
    pause
    exit /b 1
)

echo.
echo 3. 启动Seeking网站服务...
echo.
echo 网站将在以下地址启动:
echo   - 前台网站: http://localhost:5000
echo   - 管理员后台: http://localhost:5000/admin
echo   - 管理员账号: admin / seeking123
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

python app.py

cd ..
pause