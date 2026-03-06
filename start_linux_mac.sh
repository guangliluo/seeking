#!/bin/bash

echo "========================================"
echo "  Seeking 网站快速启动脚本 (Linux/Mac)"
echo "========================================"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3，请先安装Python 3.7+"
    exit 1
fi

# 检查pip
if ! command -v pip3 &> /dev/null; then
    echo "错误: 未找到pip3，请检查Python安装"
    exit 1
fi

echo "1. 安装Python依赖..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    cd ..
    exit 1
fi

echo ""
echo "2. 初始化数据库..."
python3 init_db.py
if [ $? -ne 0 ]; then
    echo "错误: 数据库初始化失败"
    cd ..
    exit 1
fi

echo ""
echo "3. 启动Seeking网站服务..."
echo ""
echo "网站将在以下地址启动:"
echo "  - 前台网站: http://localhost:5000"
echo "  - 管理员后台: http://localhost:5000/admin"
echo "  - 管理员账号: admin / seeking123"
echo ""
echo "按 Ctrl+C 停止服务"
echo "========================================"
echo ""

python3 app.py

cd ..