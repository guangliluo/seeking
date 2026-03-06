/*
 * Seeking 结果查询JavaScript文件
 * 处理预约结果查询和显示
 */

// 定义API基础URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化查询功能
    initQueryFunction();

    // 初始化输入框限制
    initInputRestrictions();

    // 检查URL参数，自动查询
    checkUrlParams();
});

/**
 * 初始化查询功能
 */
function initQueryFunction() {
    const queryBtn = document.getElementById('queryBtn');
    const phoneLast4Input = document.getElementById('phoneLast4');
    const tryAgainBtn = document.getElementById('tryAgainBtn');

    if (!queryBtn || !phoneLast4Input) return;

    // 查询按钮点击事件
    queryBtn.addEventListener('click', performQuery);

    // 输入框回车键事件
    phoneLast4Input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performQuery();
        }
    });

    // "重新查询"按钮事件
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            // 清空输入框并聚焦
            phoneLast4Input.value = '';
            phoneLast4Input.focus();

            // 隐藏结果区域
            document.getElementById('queryResults').style.display = 'none';
        });
    }
}

/**
 * 执行查询操作
 */
async function performQuery() {
    const phoneLast4Input = document.getElementById('phoneLast4');
    const phoneLast4 = phoneLast4Input.value.trim();

    // 验证输入
    if (!validatePhoneLast4(phoneLast4)) {
        return;
    }

    // 显示加载状态
    const queryBtn = document.getElementById('queryBtn');
    const originalText = queryBtn.innerHTML;
    queryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 查询中...';
    queryBtn.disabled = true;

    // 显示加载指示器
    const resultsList = document.getElementById('resultsList');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const queryResults = document.getElementById('queryResults');

    resultsList.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>正在查询预约记录...</p></div>';
    noResultsMessage.style.display = 'none';
    queryResults.style.display = 'block';

    try {
        // 发送API请求
        const response = await fetch(`${API_BASE_URL}/booking/query?last4=${phoneLast4}`);
        const result = await response.json();

        // 处理查询结果
        handleQueryResult(result, phoneLast4);
    } catch (error) {
        console.error('查询失败:', error);
        showMessage('网络错误，请检查连接后重试', 'error');

        // 显示错误状态
        resultsList.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>查询失败，请稍后重试</p></div>';
    } finally {
        // 恢复按钮状态
        queryBtn.innerHTML = originalText;
        queryBtn.disabled = false;
    }
}

/**
 * 处理查询结果
 * @param {Object} result - API返回结果
 * @param {string} phoneLast4 - 手机号后4位
 */
function handleQueryResult(result, phoneLast4) {
    const resultsList = document.getElementById('resultsList');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsCount = document.getElementById('resultsCount');
    const resultsTitle = document.getElementById('resultsTitle');

    // 清空结果列表
    resultsList.innerHTML = '';

    if (result.success && result.data && result.data.bookings && result.data.bookings.length > 0) {
        // 有查询结果
        const bookings = result.data.bookings;

        // 更新结果计数
        resultsCount.textContent = bookings.length;

        // 更新结果标题
        if (bookings.length === 1) {
            resultsTitle.textContent = `Seeking - 查询到1条预约记录`;
        } else {
            resultsTitle.textContent = `Seeking - 查询到${bookings.length}条预约记录`;
        }

        // 按审核状态排序：待审核 → 已通过 → 已拒绝
        bookings.sort((a, b) => {
            const statusOrder = { 'pending': 0, 'approved': 1, 'rejected': 2 };
            return statusOrder[a.status] - statusOrder[b.status];
        });

        // 生成结果卡片
        bookings.forEach(booking => {
            const bookingCard = createBookingCard(booking);
            resultsList.appendChild(bookingCard);
        });

        // 显示结果区域
        noResultsMessage.style.display = 'none';
    } else {
        // 无查询结果
        resultsCount.textContent = '0';
        resultsTitle.textContent = 'Seeking - 查询结果';
        noResultsMessage.style.display = 'block';
        noResultsMessage.querySelector('h3').textContent = result.message || 'Seeking：未查询到相关预约记录';

        // 更新错误消息中的建议
        const errorMessage = noResultsMessage.querySelector('p');
        errorMessage.textContent = `请核对手机号后4位（${phoneLast4}）是否正确，或您尚未提交预约。`;
    }
}

/**
 * 创建预约卡片
 * @param {Object} booking - 预约记录
 * @returns {HTMLElement} 卡片元素
 */
function createBookingCard(booking) {
    const card = document.createElement('div');
    card.className = `booking-card ${booking.status}`;

    // 状态标签
    let statusText, statusClass;
    switch (booking.status) {
        case 'approved':
            statusText = '已通过';
            statusClass = 'status-approved';
            break;
        case 'rejected':
            statusText = '已拒绝';
            statusClass = 'status-rejected';
            break;
        default:
            statusText = '待审核';
            statusClass = 'status-pending';
    }

    // 格式化日期
    const bookingDate = formatDate(booking.booking_date);
    const submitTime = formatDateTime(booking.submit_time);

    // 构建卡片内容
    card.innerHTML = `
        <div class="booking-card-header">
            <div class="booking-card-title">
                预约记录 #${booking.id}
            </div>
            <div class="booking-status ${statusClass}">
                ${statusText}
            </div>
        </div>

        <div class="booking-card-details">
            <div class="detail-item">
                <span class="detail-label">学生姓名：</span>
                <span class="detail-value">${escapeHtml(booking.name)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">手机号：</span>
                <span class="detail-value">${escapeHtml(booking.phone)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">预约日期：</span>
                <span class="detail-value">${bookingDate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">预约地点：</span>
                <span class="detail-value">${escapeHtml(booking.location)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">软件名称：</span>
                <span class="detail-value">${escapeHtml(booking.software)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">提交时间：</span>
                <span class="detail-value">${submitTime}</span>
            </div>
        </div>

        ${booking.problem_description ? `
            <div class="booking-card-section">
                <div class="detail-label">问题描述：</div>
                <div class="detail-value">${escapeHtml(booking.problem_description)}</div>
            </div>
        ` : ''}

        ${booking.status !== 'pending' ? `
            <div class="booking-card-footer">
                <div class="review-info">
                    <div class="detail-label">审核${booking.status === 'approved' ? '通过' : '拒绝'}：</div>
                    <div class="detail-value">${formatDateTime(booking.review_time)}</div>
                    ${booking.reviewer ? `<div class="detail-label">审核人：${escapeHtml(booking.reviewer)}</div>` : ''}
                </div>
                ${booking.review_notes ? `
                    <div class="review-notes">
                        <div class="detail-label">审核备注：</div>
                        <div class="detail-value">${escapeHtml(booking.review_notes)}</div>
                    </div>
                ` : ''}
            </div>
        ` : ''}
    `;

    return card;
}

/**
 * 验证手机号后4位
 * @param {string} phoneLast4 - 手机号后4位
 * @returns {boolean} 是否有效
 */
function validatePhoneLast4(phoneLast4) {
    if (!phoneLast4) {
        showMessage('Seeking：请输入手机号后4位', 'error');
        document.getElementById('phoneLast4').focus();
        return false;
    }

    if (!/^\d{4}$/.test(phoneLast4)) {
        showMessage('Seeking：手机号后4位必须是4位数字', 'error');
        document.getElementById('phoneLast4').focus();
        return false;
    }

    return true;
}

/**
 * 初始化输入框限制
 */
function initInputRestrictions() {
    const phoneLast4Input = document.getElementById('phoneLast4');
    if (!phoneLast4Input) return;

    // 只允许输入数字
    phoneLast4Input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');

        // 限制长度为4位
        if (this.value.length > 4) {
            this.value = this.value.substring(0, 4);
        }
    });

    // 自动大写（用于显示）
    phoneLast4Input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

/**
 * 检查URL参数，自动查询
 */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneLast4 = urlParams.get('last4');

    if (phoneLast4 && /^\d{4}$/.test(phoneLast4)) {
        // 设置输入框值并自动查询
        document.getElementById('phoneLast4').value = phoneLast4;

        // 延迟执行查询，确保页面加载完成
        setTimeout(() => {
            performQuery();
        }, 500);
    }
}

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';

    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    } catch (error) {
        return dateStr;
    }
}

/**
 * 格式化日期时间
 * @param {string} datetimeStr - 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '-';

    try {
        const date = new Date(datetimeStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return datetimeStr;
    }
}

/**
 * HTML转义，防止XSS攻击
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：'success' 或 'error'
 */
function showMessage(message, type = 'success') {
    // 使用通用script.js中的showMessage函数
    if (typeof window.showMessage === 'function') {
        window.showMessage(message, type);
    } else {
        // 降级方案：使用alert
        alert(message);
    }
}

/**
 * 分享查询结果
 */
function initShareFunction() {
    // 创建分享按钮（如果需要）
    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn btn-info btn-sm';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> 分享查询';
    shareBtn.addEventListener('click', shareQueryResult);

    // 将分享按钮添加到结果区域
    const resultsHeader = document.querySelector('.results-header');
    if (resultsHeader) {
        resultsHeader.appendChild(shareBtn);
    }
}

/**
 * 分享查询结果
 */
function shareQueryResult() {
    const phoneLast4 = document.getElementById('phoneLast4').value.trim();
    if (!phoneLast4) return;

    // 创建分享URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?last4=${phoneLast4}`;

    // 复制到剪贴板
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showMessage('分享链接已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            showMessage('复制失败，请手动复制链接', 'error');
        });
    } else {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showMessage('分享链接已复制到剪贴板', 'success');
    }
}

// 初始化分享功能
document.addEventListener('DOMContentLoaded', initShareFunction);

/**
 * 添加加载指示器样式
 */
function addLoadingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-indicator {
            text-align: center;
            padding: 40px;
        }

        .loading-indicator .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0066cc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        .error-message {
            text-align: center;
            padding: 40px;
            color: #dc3545;
        }

        .error-message i {
            font-size: 48px;
            margin-bottom: 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .booking-card-section {
            margin: 15px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }

        .review-info {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);
}

// 添加加载样式
document.addEventListener('DOMContentLoaded', addLoadingStyles);