/*
 * Seeking 管理员后台JavaScript文件
 * 处理预约记录管理、审核操作和统计信息
 */

// 定义API基础URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : '';

// 全局变量
let currentBookings = [];
let currentFilter = {};

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkAdminLogin();

    // 初始化后台功能
    initAdminDashboard();

    // 更新当前时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

/**
 * 检查管理员登录状态
 */
async function checkAdminLogin() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status !== 200) {
            // 未登录，跳转到登录页
            window.location.href = '/admin';
            return false;
        }

        return true;
    } catch (error) {
        console.error('检查登录状态失败:', error);
        window.location.href = '/admin';
        return false;
    }
}

/**
 * 初始化管理员后台功能
 */
function initAdminDashboard() {
    // 初始化事件监听器
    initEventListeners();

    // 加载统计数据
    loadStats();

    // 加载预约记录
    loadBookings();

    // 初始化筛选表单
    initFilterForm();

    // 初始化审核模态框
    initReviewModal();
}

/**
 * 初始化事件监听器
 */
function initEventListeners() {
    // 退出登录按钮
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutAdmin);
    }

    // 刷新按钮
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadStats();
            loadBookings();
            showToast('数据已刷新', 'success');
        });
    }

    // 重置筛选按钮
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilter);
    }

    // 筛选表单提交
    const filterForm = document.getElementById('adminFilterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(event) {
            event.preventDefault();
            applyFilter();
        });
    }
}

/**
 * 加载统计数据
 */
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                updateStatsDisplay(result.data.stats);
            }
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showToast('加载统计数据失败', 'error');
    }
}

/**
 * 更新统计数据显示
 * @param {Object} stats - 统计数据
 */
function updateStatsDisplay(stats) {
    if (!stats) return;

    const elements = {
        'statTotal': stats.total || 0,
        'statPending': stats.pending || 0,
        'statApproved': stats.approved || 0,
        'statRejected': stats.rejected || 0
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];

            // 添加动画效果
            animateCounter(element, elements[id]);
        }
    });
}

/**
 * 数字计数器动画
 * @param {HTMLElement} element - 目标元素
 * @param {number} targetValue - 目标值
 */
function animateCounter(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    if (currentValue === targetValue) return;

    const duration = 500; // 动画持续时间（毫秒）
    const startTime = performance.now();
    const startValue = currentValue;

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数
        const easeOutQuad = t => t * (2 - t);
        const current = Math.floor(startValue + (targetValue - startValue) * easeOutQuad(progress));

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }

    requestAnimationFrame(updateCounter);
}

/**
 * 加载预约记录
 */
async function loadBookings(filter = {}) {
    // 显示加载指示器
    showLoadingIndicator();

    try {
        // 构建查询参数
        const params = new URLSearchParams();
        if (filter.status) params.append('status', filter.status);
        if (filter.phone_last4) params.append('phone_last4', filter.phone_last4);
        if (filter.booking_date) params.append('booking_date', filter.booking_date);

        const url = `${API_BASE_URL}/admin/bookings${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentBookings = result.data.bookings || [];
                updateBookingsTable(currentBookings);
            }
        } else if (response.status === 401) {
            // 未授权，跳转到登录页
            window.location.href = '/admin';
        }
    } catch (error) {
        console.error('加载预约记录失败:', error);
        showToast('加载预约记录失败', 'error');
        updateBookingsTable([]);
    } finally {
        // 隐藏加载指示器
        hideLoadingIndicator();
    }
}

/**
 * 更新预约记录表格
 * @param {Array} bookings - 预约记录数组
 */
function updateBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    const noBookingsMessage = document.getElementById('noBookingsMessage');
    const bookingsCount = document.getElementById('bookingsCount');

    if (!tbody) return;

    // 更新记录数量
    if (bookingsCount) {
        bookingsCount.textContent = bookings.length;
    }

    // 清空表格
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        // 显示无数据提示
        if (noBookingsMessage) {
            noBookingsMessage.style.display = 'block';
        }
        return;
    }

    // 隐藏无数据提示
    if (noBookingsMessage) {
        noBookingsMessage.style.display = 'none';
    }

    // 按提交时间倒序排序
    bookings.sort((a, b) => new Date(b.submit_time) - new Date(a.submit_time));

    // 生成表格行
    bookings.forEach(booking => {
        const row = createBookingRow(booking);
        tbody.appendChild(row);
    });
}

/**
 * 创建预约记录表格行
 * @param {Object} booking - 预约记录
 * @returns {HTMLElement} 表格行元素
 */
function createBookingRow(booking) {
    const row = document.createElement('tr');

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

    // 构建行内容
    row.innerHTML = `
        <td>${booking.id}</td>
        <td>${escapeHtml(booking.name)}</td>
        <td>${escapeHtml(booking.phone)}</td>
        <td>${bookingDate}</td>
        <td>${escapeHtml(booking.location)}</td>
        <td>${escapeHtml(booking.software)}</td>
        <td>${submitTime}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${booking.reviewer || '-'}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-action btn-view" data-id="${booking.id}" title="查看详情">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-review" data-id="${booking.id}" ${booking.status !== 'pending' ? 'disabled' : ''} title="审核">
                    <i class="fas fa-check-circle"></i>
                </button>
            </div>
        </td>
    `;

    // 添加事件监听器
    const viewBtn = row.querySelector('.btn-view');
    const reviewBtn = row.querySelector('.btn-review');

    if (viewBtn) {
        viewBtn.addEventListener('click', () => viewBookingDetails(booking.id));
    }

    if (reviewBtn && booking.status === 'pending') {
        reviewBtn.addEventListener('click', () => openReviewModal(booking.id));
    }

    return row;
}

/**
 * 查看预约详情
 * @param {number} bookingId - 预约ID
 */
async function viewBookingDetails(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const booking = result.data.bookings.find(b => b.id === bookingId);
                if (booking) {
                    showBookingDetailsModal(booking);
                }
            }
        }
    } catch (error) {
        console.error('查看预约详情失败:', error);
        showToast('查看详情失败', 'error');
    }
}

/**
 * 显示预约详情模态框
 * @param {Object} booking - 预约记录
 */
function showBookingDetailsModal(booking) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.id = 'detailsModal';

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

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><span class="seeking-text">Seeking</span> - 预约详情 #${booking.id}</h2>
                <button type="button" class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="booking-details">
                    <div class="details-section">
                        <h3>基本信息</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <label>学生姓名：</label>
                                <span>${escapeHtml(booking.name)}</span>
                            </div>
                            <div class="detail-item">
                                <label>手机号：</label>
                                <span>${escapeHtml(booking.phone)}</span>
                            </div>
                            <div class="detail-item">
                                <label>预约日期：</label>
                                <span>${formatDate(booking.booking_date)}</span>
                            </div>
                            <div class="detail-item">
                                <label>预约地点：</label>
                                <span>${escapeHtml(booking.location)}</span>
                            </div>
                            <div class="detail-item">
                                <label>软件名称：</label>
                                <span>${escapeHtml(booking.software)}</span>
                            </div>
                            <div class="detail-item">
                                <label>提交时间：</label>
                                <span>${formatDateTime(booking.submit_time)}</span>
                            </div>
                            <div class="detail-item">
                                <label>审核状态：</label>
                                <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>

                    ${booking.problem_description ? `
                        <div class="details-section">
                            <h3>问题描述</h3>
                            <div class="problem-description">
                                ${escapeHtml(booking.problem_description)}
                            </div>
                        </div>
                    ` : ''}

                    ${booking.status !== 'pending' ? `
                        <div class="details-section">
                            <h3>审核信息</h3>
                            <div class="details-grid">
                                <div class="detail-item">
                                    <label>审核人：</label>
                                    <span>${escapeHtml(booking.reviewer || '-')}</span>
                                </div>
                                <div class="detail-item">
                                    <label>审核时间：</label>
                                    <span>${formatDateTime(booking.review_time)}</span>
                                </div>
                                ${booking.review_notes ? `
                                    <div class="detail-item full-width">
                                        <label>审核备注：</label>
                                        <div class="review-notes">
                                            ${escapeHtml(booking.review_notes)}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="closeDetailsModal">关闭</button>
                ${booking.status === 'pending' ? `
                    <button type="button" class="btn btn-primary" id="reviewFromDetails" data-id="${booking.id}">
                        <i class="fas fa-check-circle"></i> 审核此预约
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(modal);

    // 显示模态框
    setTimeout(() => modal.style.display = 'flex', 10);

    // 事件监听器
    const closeBtn = modal.querySelector('.modal-close');
    const closeDetailsBtn = modal.querySelector('#closeDetailsModal');
    const reviewBtn = modal.querySelector('#reviewFromDetails');

    const closeModal = () => {
        modal.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => modal.remove(), 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeModal);

    // 点击模态框外部关闭
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    // 审核按钮
    if (reviewBtn) {
        reviewBtn.addEventListener('click', () => {
            closeModal();
            setTimeout(() => openReviewModal(booking.id), 300);
        });
    }
}

/**
 * 初始化筛选表单
 */
function initFilterForm() {
    // 日期输入框设置为今天
    const dateInput = document.getElementById('filterBookingDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // 手机号后4位输入限制
    const phoneInput = document.getElementById('filterPhoneLast4');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            if (this.value.length > 4) {
                this.value = this.value.substring(0, 4);
            }
        });
    }
}

/**
 * 应用筛选
 */
function applyFilter() {
    const filter = {
        status: document.getElementById('filterStatus').value,
        phone_last4: document.getElementById('filterPhoneLast4').value.trim(),
        booking_date: document.getElementById('filterBookingDate').value
    };

    // 更新当前筛选条件
    currentFilter = filter;

    // 加载预约记录
    loadBookings(filter);
}

/**
 * 重置筛选
 */
function resetFilter() {
    const filterForm = document.getElementById('adminFilterForm');
    if (filterForm) {
        filterForm.reset();

        // 重新设置日期为今天
        const dateInput = document.getElementById('filterBookingDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // 清空筛选条件
        currentFilter = {};

        // 重新加载预约记录
        loadBookings();
    }
}

/**
 * 初始化审核模态框
 */
function initReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;

    // 关闭按钮
    const closeBtn = document.getElementById('closeReviewModal');
    const cancelBtn = document.getElementById('cancelReviewBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeReviewModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeReviewModal);
    }

    // 点击模态框外部关闭
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeReviewModal();
        }
    });

    // 审核表单提交
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }

    // 监听审核状态变化，更新备注必填状态
    const statusRadios = document.querySelectorAll('input[name="status"]');
    statusRadios.forEach(radio => {
        radio.addEventListener('change', updateReviewNotesRequired);
    });
}

/**
 * 打开审核模态框
 * @param {number} bookingId - 预约ID
 */
async function openReviewModal(bookingId) {
    try {
        // 获取预约详情
        const booking = currentBookings.find(b => b.id === bookingId);
        if (!booking) {
            showToast('预约记录不存在', 'error');
            return;
        }

        // 更新模态框内容
        updateReviewModalContent(booking);

        // 显示模态框
        const modal = document.getElementById('reviewModal');
        modal.style.display = 'flex';

        // 设置焦点到第一个输入框
        setTimeout(() => {
            const firstRadio = modal.querySelector('input[name="status"]');
            if (firstRadio) firstRadio.focus();
        }, 100);
    } catch (error) {
        console.error('打开审核模态框失败:', error);
        showToast('加载预约详情失败', 'error');
    }
}

/**
 * 更新审核模态框内容
 * @param {Object} booking - 预约记录
 */
function updateReviewModalContent(booking) {
    // 设置预约ID
    document.getElementById('reviewBookingId').value = booking.id;

    // 更新预约信息
    document.getElementById('reviewBookingName').textContent = escapeHtml(booking.name);
    document.getElementById('reviewBookingPhone').textContent = escapeHtml(booking.phone);
    document.getElementById('reviewBookingDate').textContent = formatDate(booking.booking_date);
    document.getElementById('reviewBookingLocation').textContent = escapeHtml(booking.location);
    document.getElementById('reviewBookingSoftware').textContent = escapeHtml(booking.software);
    document.getElementById('reviewBookingProblem').textContent = booking.problem_description
        ? escapeHtml(booking.problem_description)
        : '无';

    // 重置表单
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.reset();
        updateReviewNotesRequired();
    }
}

/**
 * 更新备注必填状态
 */
function updateReviewNotesRequired() {
    const notesTextarea = document.getElementById('reviewNotes');
    const rejectedRadio = document.querySelector('input[name="status"][value="rejected"]');

    if (notesTextarea && rejectedRadio) {
        notesTextarea.required = rejectedRadio.checked;
    }
}

/**
 * 提交审核
 * @param {Event} event - 表单提交事件
 */
async function submitReview(event) {
    event.preventDefault();

    const bookingId = document.getElementById('reviewBookingId').value;
    const status = document.querySelector('input[name="status"]:checked')?.value;
    const reviewNotes = document.getElementById('reviewNotes').value.trim();

    if (!bookingId || !status) {
        showToast('请选择审核结果', 'error');
        return;
    }

    if (status === 'rejected' && !reviewNotes) {
        showToast('拒绝预约时必须填写原因', 'error');
        document.getElementById('reviewNotes').focus();
        return;
    }

    // 显示加载状态
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/booking/${bookingId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, review_notes: reviewNotes }),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            // 关闭模态框
            closeReviewModal();

            // 显示成功提示
            showReviewSuccessToast();

            // 刷新数据
            setTimeout(() => {
                loadStats();
                loadBookings(currentFilter);
            }, 500);
        } else {
            showToast(result.message || '审核失败', 'error');
        }
    } catch (error) {
        console.error('提交审核失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * 关闭审核模态框
 */
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'none';

        // 重置表单
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.reset();
        }
    }
}

/**
 * 显示审核成功提示
 */
function showReviewSuccessToast() {
    const toast = document.getElementById('reviewSuccessToast');
    if (toast) {
        toast.style.display = 'flex';

        // 3秒后自动隐藏
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                toast.style.display = 'none';
                toast.style.animation = '';
            }, 300);
        }, 3000);
    }
}

/**
 * 退出登录
 */
async function logoutAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            // 跳转到登录页
            window.location.href = '/admin';
        }
    } catch (error) {
        console.error('退出登录失败:', error);
        // 仍然跳转到登录页
        window.location.href = '/admin';
    }
}

/**
 * 显示加载指示器
 */
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }

    const tbody = document.getElementById('bookingsTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading-cell"><div class="spinner"></div><p>正在加载数据...</p></td></tr>';
    }
}

/**
 * 隐藏加载指示器
 */
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * 显示Toast提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：'success' 或 'error'
 */
function showToast(message, type = 'success') {
    // 创建Toast元素
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const title = type === 'success' ? '操作成功' : '操作失败';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => toast.style.opacity = '1', 10);

    // 3秒后自动移除
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 更新当前时间显示
 */
function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('zh-CN');
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
            day: 'numeric'
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
 * 添加必要的样式
 */
function addAdminStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-cell {
            text-align: center;
            padding: 40px !important;
        }

        .loading-cell .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #0066cc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        .action-buttons {
            display: flex;
            gap: 5px;
        }

        .btn-action {
            width: 30px;
            height: 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .btn-action:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .btn-action:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .btn-view {
            background-color: #17a2b8;
            color: white;
        }

        .btn-review {
            background-color: #28a745;
            color: white;
        }

        .booking-details {
            max-height: 60vh;
            overflow-y: auto;
            padding-right: 10px;
        }

        .details-section {
            margin-bottom: 25px;
        }

        .details-section h3 {
            margin-bottom: 15px;
            color: #444;
            padding-bottom: 8px;
            border-bottom: 2px solid #0066cc;
        }

        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .detail-item {
            display: flex;
            flex-direction: column;
        }

        .detail-item label {
            font-weight: 500;
            color: #666;
            margin-bottom: 5px;
            font-size: 14px;
        }

        .detail-item.full-width {
            grid-column: 1 / -1;
        }

        .problem-description {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #0066cc;
            white-space: pre-wrap;
            line-height: 1.6;
        }

        .review-notes {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            white-space: pre-wrap;
            line-height: 1.6;
        }

        .modal-footer {
            padding: 20px 30px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 15px;
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 添加样式
document.addEventListener('DOMContentLoaded', addAdminStyles);