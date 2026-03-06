#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Seeking 网站数据库操作模块
提供预约记录和管理员的CRUD操作
"""

import sqlite3
import os
from datetime import datetime

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'seeking.db')

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    # 设置返回字典格式的行
    conn.row_factory = sqlite3.Row
    return conn

# ==================== 预约记录操作 ====================

def create_booking(booking_data):
    """
    创建新的预约记录
    booking_data: dict包含name, phone, booking_date, location, software, problem_description
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
        INSERT INTO bookings (name, phone, booking_date, location, software, problem_description)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            booking_data['name'],
            booking_data['phone'],
            booking_data['booking_date'],
            booking_data['location'],
            booking_data['software'],
            booking_data.get('problem_description', '')
        ))

        booking_id = cursor.lastrowid
        conn.commit()
        return booking_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_bookings_by_phone_last4(last4):
    """
    根据手机号后4位查询预约记录
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 使用LIKE匹配手机号后4位
    cursor.execute('''
    SELECT * FROM bookings
    WHERE phone LIKE ?
    ORDER BY submit_time DESC
    ''', ('%' + last4,))

    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return bookings

def get_all_bookings(status=None, phone_last4=None, booking_date=None):
    """
    获取所有预约记录（管理员用）
    支持按状态、手机号后4位、预约日期筛选
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 构建查询条件和参数
    query = 'SELECT * FROM bookings'
    conditions = []
    params = []

    if status:
        conditions.append('status = ?')
        params.append(status)

    if phone_last4:
        conditions.append('phone LIKE ?')
        params.append('%' + phone_last4)

    if booking_date:
        conditions.append('booking_date = ?')
        params.append(booking_date)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)

    query += ' ORDER BY submit_time DESC'

    cursor.execute(query, params)
    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return bookings

def update_booking_status(booking_id, status, reviewer, review_notes):
    """
    更新预约审核状态
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
        UPDATE bookings
        SET status = ?, reviewer = ?, review_time = CURRENT_TIMESTAMP, review_notes = ?
        WHERE id = ?
        ''', (status, reviewer, review_notes, booking_id))

        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_booking_by_id(booking_id):
    """
    根据ID获取预约记录
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM bookings WHERE id = ?', (booking_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# ==================== 管理员操作 ====================

def verify_admin(username, password):
    """
    验证管理员账号密码
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        'SELECT id FROM admins WHERE username = ? AND password = ?',
        (username, password)
    )
    result = cursor.fetchone()
    conn.close()
    return result is not None

def change_admin_password(username, old_password, new_password):
    """
    修改管理员密码
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 先验证旧密码
        cursor.execute(
            'SELECT id FROM admins WHERE username = ? AND password = ?',
            (username, old_password)
        )
        if not cursor.fetchone():
            return False

        # 更新密码
        cursor.execute(
            'UPDATE admins SET password = ? WHERE username = ?',
            (new_password, username)
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ==================== 统计信息 ====================

def get_booking_stats():
    """
    获取预约统计信息
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM bookings
    ''')

    stats = dict(cursor.fetchone())
    conn.close()
    return stats