#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Seeking 网站后端主程序
基于Flask的API服务，提供预约提交、查询和管理功能
"""

from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_cors import CORS
import database
import re
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.secret_key = 'seeking-secret-key-2026'  # 生产环境应使用更安全的密钥
CORS(app)  # 允许跨域请求

# ==================== 工具函数 ====================

def validate_phone(phone):
    """验证手机号格式（11位数字）"""
    return re.match(r'^\d{11}$', phone) is not None

def validate_date(date_str):
    """验证日期格式（YYYY-MM-DD）且不是过去日期"""
    try:
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = datetime.now().date()
        return booking_date >= today
    except ValueError:
        return False

def get_error_response(message):
    """返回统一格式的错误响应"""
    return jsonify({
        'success': False,
        'message': f'Seeking：{message}'
    })

def get_success_response(data=None, message=None):
    """返回统一格式的成功响应"""
    response = {'success': True}
    if data:
        response['data'] = data
    if message:
        response['message'] = f'Seeking：{message}'
    return jsonify(response)

# ==================== 公共API路由 ====================

@app.route('/')
def index():
    """首页（前端将处理路由）"""
    return app.send_static_file('index.html')

@app.route('/api/booking/submit', methods=['POST'])
def submit_booking():
    """
    提交预约表单
    必填字段：name, phone, booking_date, location, software
    """
    try:
        data = request.get_json()
        if not data:
            return get_error_response('请求数据为空')

        # 验证必填字段
        required_fields = ['name', 'phone', 'booking_date', 'location', 'software']
        for field in required_fields:
            if not data.get(field):
                return get_error_response(f'{field}不能为空')

        # 验证手机号格式
        if not validate_phone(data['phone']):
            return get_error_response('手机号格式错误，请输入11位数字')

        # 验证预约日期
        if not validate_date(data['booking_date']):
            return get_error_response('预约日期不能选择过去的时间')

        # 验证软件名称
        if len(data['software'].strip()) == 0:
            return get_error_response('软件名称不能为空')

        # 保存到数据库
        booking_id = database.create_booking({
            'name': data['name'].strip(),
            'phone': data['phone'].strip(),
            'booking_date': data['booking_date'],
            'location': data['location'],
            'software': data['software'].strip(),
            'problem_description': data.get('problem_description', '').strip()
        })

        return get_success_response(
            {'booking_id': booking_id},
            '预约信息已提交，等待审核'
        )

    except Exception as e:
        app.logger.error(f'提交预约失败: {str(e)}')
        return get_error_response('服务器暂不可用，请稍后重试')

@app.route('/api/booking/query', methods=['GET'])
def query_booking():
    """
    查询预约记录（根据手机号后4位）
    参数：last4 (手机号后4位)
    """
    try:
        last4 = request.args.get('last4', '').strip()

        if not last4 or len(last4) != 4 or not last4.isdigit():
            return get_error_response('请输入正确的手机号后4位')

        bookings = database.get_bookings_by_phone_last4(last4)

        if not bookings:
            return get_error_response('未查询到相关预约记录，请核对手机号后4位')

        # 格式化返回数据
        for booking in bookings:
            # 转换日期时间格式
            booking['submit_time'] = booking['submit_time']
            booking['review_time'] = booking['review_time']

        return get_success_response({'bookings': bookings})

    except Exception as e:
        app.logger.error(f'查询预约失败: {str(e)}')
        return get_error_response('服务器暂不可用，请稍后重试')

# ==================== 管理员API路由 ====================

@app.route('/admin/login', methods=['POST'])
def admin_login():
    """管理员登录"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return get_error_response('用户名和密码不能为空')

        if database.verify_admin(username, password):
            session['admin_logged_in'] = True
            session['admin_username'] = username
            return get_success_response(message='登录成功')
        else:
            return get_error_response('用户名或密码错误')

    except Exception as e:
        app.logger.error(f'管理员登录失败: {str(e)}')
        return get_error_response('登录失败，请稍后重试')

@app.route('/admin/logout', methods=['POST'])
def admin_logout():
    """管理员退出登录"""
    session.clear()
    return get_success_response(message='已退出登录')

@app.route('/admin/bookings', methods=['GET'])
def get_admin_bookings():
    """
    获取所有预约记录（管理员用）
    支持筛选参数：status, phone_last4, booking_date
    """
    # 检查管理员登录状态
    if not session.get('admin_logged_in'):
        return get_error_response('请先登录'), 401

    try:
        status = request.args.get('status')
        phone_last4 = request.args.get('phone_last4')
        booking_date = request.args.get('booking_date')

        bookings = database.get_all_bookings(status, phone_last4, booking_date)
        return get_success_response({'bookings': bookings})

    except Exception as e:
        app.logger.error(f'获取预约列表失败: {str(e)}')
        return get_error_response('获取数据失败')

@app.route('/admin/booking/<int:booking_id>/review', methods=['POST'])
def review_booking(booking_id):
    """审核预约"""
    # 检查管理员登录状态
    if not session.get('admin_logged_in'):
        return get_error_response('请先登录'), 401

    try:
        data = request.get_json()
        status = data.get('status')  # 'approved' 或 'rejected'
        review_notes = data.get('review_notes', '').strip()

        if status not in ['approved', 'rejected']:
            return get_error_response('审核状态无效')

        if not review_notes and status == 'rejected':
            return get_error_response('拒绝预约时必须填写原因')

        reviewer = session.get('admin_username', 'admin')

        success = database.update_booking_status(
            booking_id, status, reviewer, review_notes
        )

        if success:
            return get_success_response(message='审核状态已更新')
        else:
            return get_error_response('预约记录不存在')

    except Exception as e:
        app.logger.error(f'审核预约失败: {str(e)}')
        return get_error_response('审核失败，请稍后重试')

@app.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    """获取统计信息"""
    # 检查管理员登录状态
    if not session.get('admin_logged_in'):
        return get_error_response('请先登录'), 401

    try:
        stats = database.get_booking_stats()
        return get_success_response({'stats': stats})
    except Exception as e:
        app.logger.error(f'获取统计信息失败: {str(e)}')
        return get_error_response('获取统计信息失败')

# ==================== 静态文件路由 ====================

@app.route('/booking')
def booking_page():
    """预约表单页"""
    return app.send_static_file('booking.html')

@app.route('/query')
def query_page():
    """结果查询页"""
    return app.send_static_file('query.html')

@app.route('/faq')
def faq_page():
    """常见问题页"""
    return app.send_static_file('faq.html')

@app.route('/admin')
def admin_page():
    """管理员登录页"""
    return app.send_static_file('admin.html')

@app.route('/admin/dashboard')
def admin_dashboard_page():
    """管理员后台页"""
    # 检查管理员登录状态
    if not session.get('admin_logged_in'):
        return redirect('/admin')
    return app.send_static_file('admin_dashboard.html')

# ==================== 启动应用 ====================

if __name__ == '__main__':
    print("Seeking 网站后端启动中...")
    print("访问地址: http://localhost:5002")
    print("管理员后台: http://localhost:5002/admin")
    app.run(debug=False, host='0.0.0.0', port=5002)