#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Seeking 网站数据库初始化脚本
创建预约记录表和管理员表
"""

import sqlite3
import os

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'seeking.db')

def init_database():
    """初始化数据库表结构"""
    # 如果数据库文件已存在，先删除（仅用于初始化）
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    # 连接数据库（如果不存在会自动创建）
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 创建预约记录表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        booking_date DATE NOT NULL,
        location TEXT NOT NULL,
        software TEXT NOT NULL,
        problem_description TEXT,
        submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',  -- pending/approved/rejected
        reviewer TEXT,
        review_time TIMESTAMP,
        review_notes TEXT
    )
    ''')

    # 创建管理员表（简单账号密码存储）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    ''')

    # 插入默认管理员账号（用户名：admin，密码：seeking123）
    # 注意：实际部署时应修改默认密码
    cursor.execute(
        "INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)",
        ('admin', 'seeking123')
    )

    # 插入一些测试预约数据（仅用于演示）
    cursor.execute('''
    INSERT INTO bookings (name, phone, booking_date, location, software, problem_description, status)
    VALUES
        ('张三', '13812345678', '2026-03-10', '图书馆3楼电子阅览室', 'MATLAB', '需要安装MATLAB R2024a', 'pending'),
        ('李四', '13987654321', '2026-03-11', '计算机与信息学院楼201室', 'Python', 'Python环境配置问题', 'approved'),
        ('王五', '13711223344', '2026-03-12', '创新创业中心105室', 'Office 365', 'Office激活问题', 'rejected')
    ''')

    # 提交事务并关闭连接
    conn.commit()
    conn.close()

    print("Seeking 数据库初始化完成！")
    print(f"数据库文件: {DB_PATH}")
    print("默认管理员账号: admin / seeking123")

if __name__ == '__main__':
    init_database()