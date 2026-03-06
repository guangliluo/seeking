/*
 * Seeking 网站通用JavaScript文件
 * 包含公共功能和工具函数
 */

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化常见问题页面的展开/收起功能
    initFaqAccordion();

    // 初始化日期输入框的最小值（今天）
    initDateInputs();

    // 设置当前年份（页脚）
    setCurrentYear();

    // 初始化导航栏活动状态
    highlightActiveNav();
});

/**
 * 初始化常见问题页面的手风琴效果
 */
function initFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isActive = this.classList.contains('active');

            // 关闭所有其他FAQ
            document.querySelectorAll('.faq-question').forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.classList.remove('active');
            });

            // 如果当前FAQ未激活，则激活它
            if (!isActive) {
                this.classList.add('active');
                answer.classList.add('active');
            }
        });
    });
}

/**
 * 初始化日期输入框，设置最小值为今天
 */
function initDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');

    dateInputs.forEach(input => {
        input.min = today;

        // 如果输入框没有值，设置为明天
        if (!input.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            input.value = tomorrow.toISOString().split('T')[0];
        }
    });
}

/**
 * 设置页脚中的当前年份
 */
function setCurrentYear() {
    const yearElements = document.querySelectorAll('.current-year');
    const currentYear = new Date().getFullYear();

    yearElements.forEach(element => {
        element.textContent = currentYear;
    });
}

/**
 * 高亮当前页面对应的导航菜单项
 */
function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-menu a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');

        // 如果当前路径包含链接路径（或相反），则设置为活动状态
        if (currentPath === linkPath ||
            (currentPath.startsWith(linkPath) && linkPath !== '/') ||
            (linkPath !== '/' && currentPath.includes(linkPath))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * 显示消息提示（成功/错误）
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：'success' 或 'error'
 * @param {number} duration - 显示时间（毫秒），默认3000
 */
function showMessage(message, type = 'success', duration = 3000) {
    // 移除现有的消息提示
    const existingMessage = document.getElementById('seeking-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.id = 'seeking-message';
    messageEl.className = `seeking-message seeking-message-${type}`;

    // 创建消息内容
    messageEl.innerHTML = `
        <div class="message-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(messageEl);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .seeking-message {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        }

        .seeking-message-success {
            background-color: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }

        .seeking-message-error {
            background-color: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }

        .message-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .message-content i {
            font-size: 20px;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // 自动消失
    setTimeout(() => {
        messageEl.style.animation = 'slideOutRight 0.3s ease-out forwards';

        // 添加消失动画
        const slideOutStyle = document.createElement('style');
        slideOutStyle.textContent = `
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
        document.head.appendChild(slideOutStyle);

        // 移除元素
        setTimeout(() => {
            messageEl.remove();
            style.remove();
            slideOutStyle.remove();
        }, 300);
    }, duration);
}

/**
 * 验证手机号格式（11位数字）
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
    return /^\d{11}$/.test(phone);
}

/**
 * 验证日期是否为未来或今天
 * @param {string} dateStr - 日期字符串（YYYY-MM-DD）
 * @returns {boolean} 是否有效
 */
function validateFutureDate(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inputDate = new Date(dateStr);
    inputDate.setHours(0, 0, 0, 0);

    return inputDate >= today;
}

/**
 * 格式化日期显示
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}

/**
 * 格式化日期时间显示
 * @param {string} datetimeStr - 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(datetimeStr) {
    const date = new Date(datetimeStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 从API响应中提取Seeking消息
 * @param {Object} response - API响应对象
 * @returns {string} 消息内容
 */
function extractSeekingMessage(response) {
    if (response && response.message) {
        // 移除开头的"Seeking："前缀（如果存在）
        return response.message.replace(/^Seeking：/, '');
    }
    return '';
}

/**
 * 处理API请求错误
 * @param {Error} error - 错误对象
 * @returns {string} 错误消息
 */
function handleApiError(error) {
    console.error('API请求错误:', error);

    if (error.response) {
        // 服务器返回了错误状态码
        if (error.response.data && error.response.data.message) {
            return extractSeekingMessage(error.response.data);
        }
        return `服务器错误 (${error.response.status})`;
    } else if (error.request) {
        // 请求已发出但没有收到响应
        return '网络连接失败，请检查网络设置';
    } else {
        // 请求配置出错
        return '请求配置错误';
    }
}

/**
 * 检查用户是否已登录（管理员）
 * @returns {Promise<boolean>} 是否已登录
 */
async function checkAdminLogin() {
    try {
        // 这里可以添加检查管理员登录状态的逻辑
        // 暂时返回true（假设已登录）
        return true;
    } catch (error) {
        console.error('检查登录状态失败:', error);
        return false;
    }
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
function getApiBaseUrl() {
    // 如果已定义全局变量，使用全局变量
    if (window.API_BASE_URL) {
        return window.API_BASE_URL;
    }

    // 否则根据当前环境判断
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    } else {
        return '/api';
    }
}

/**
 * 安全的JSON解析
 * @param {string} text - JSON字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析结果或默认值
 */
function safeJsonParse(text, defaultValue = null) {
    try {
        return JSON.parse(text);
    } catch (error) {
        console.error('JSON解析失败:', error);
        return defaultValue;
    }
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('复制失败:', error);

        // 降级方案：使用textarea元素
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (fallbackError) {
            console.error('降级复制也失败:', fallbackError);
            return false;
        }
    }
}