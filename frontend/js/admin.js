/*
 * Seeking 管理员登录JavaScript文件
 * 处理管理员登录和认证
 */

// 定义API基础URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : '';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    checkLoginStatus();

    // 初始化登录表单
    initLoginForm();

    // 添加样式
    addLoginStyles();
});

/**
 * 检查登录状态
 */
async function checkLoginStatus() {
    try {
        // 尝试访问需要登录的接口
        const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
            method: 'GET',
            credentials: 'include' // 包含cookie
        });

        if (response.status === 200) {
            // 已登录，跳转到后台
            window.location.href = '/admin/dashboard';
        }
    } catch (error) {
        // 忽略错误，继续显示登录页面
        console.log('未登录或检查失败:', error);
    }
}

/**
 * 初始化登录表单
 */
function initLoginForm() {
    const loginForm = document.getElementById('adminLoginForm');
    const loginSuccess = document.getElementById('adminLoginSuccess');

    if (!loginForm) return;

    // 表单提交事件
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // 获取表单数据
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        // 验证输入
        if (!validateLoginInput(username, password)) {
            return;
        }

        // 显示加载状态
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
        submitBtn.disabled = true;

        try {
            // 发送登录请求
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // 包含cookie
            });

            const result = await response.json();

            if (result.success) {
                // 登录成功
                loginForm.style.display = 'none';
                loginSuccess.style.display = 'block';

                // 显示成功消息
                showMessage('登录成功，正在跳转...', 'success');

                // 延迟跳转到后台
                setTimeout(() => {
                    window.location.href = '/admin/dashboard';
                }, 1500);
            } else {
                // 登录失败
                showMessage(result.message || '登录失败，请检查账号密码', 'error');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            showMessage('网络错误，请检查连接后重试', 'error');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // 自动填充测试账号（仅开发环境）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        document.getElementById('adminUsername').value = 'admin';
        document.getElementById('adminPassword').value = 'seeking123';
    }

    // 回车键提交表单
    document.getElementById('adminUsername').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('adminPassword').focus();
        }
    });

    document.getElementById('adminPassword').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
}

/**
 * 验证登录输入
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {boolean} 是否有效
 */
function validateLoginInput(username, password) {
    if (!username) {
        showMessage('Seeking：请输入管理员账号', 'error');
        document.getElementById('adminUsername').focus();
        return false;
    }

    if (!password) {
        showMessage('Seeking：请输入管理员密码', 'error');
        document.getElementById('adminPassword').focus();
        return false;
    }

    if (username.length < 3 || username.length > 50) {
        showMessage('Seeking：账号长度应为3-50个字符', 'error');
        document.getElementById('adminUsername').focus();
        return false;
    }

    if (password.length < 6 || password.length > 50) {
        showMessage('Seeking：密码长度应为6-50个字符', 'error');
        document.getElementById('adminPassword').focus();
        return false;
    }

    return true;
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
 * 添加登录页面专用样式
 */
function addLoginStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .admin-login-form input.error,
        .admin-login-form select.error {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
        }

        .form-error {
            color: #dc3545;
            font-size: 14px;
            margin-top: 5px;
        }

        .admin-login-success {
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* 密码显示/隐藏按钮 */
        .password-toggle {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 5px;
        }

        .password-toggle:hover {
            color: #333;
        }

        .password-container {
            position: relative;
        }

        .password-container input {
            padding-right: 45px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);

    // 添加密码显示/隐藏功能
    addPasswordToggle();
}

/**
 * 添加密码显示/隐藏功能
 */
function addPasswordToggle() {
    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) return;

    // 创建容器
    const container = document.createElement('div');
    container.className = 'password-container';

    // 包裹输入框
    passwordInput.parentNode.insertBefore(container, passwordInput);
    container.appendChild(passwordInput);

    // 创建切换按钮
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    toggleBtn.setAttribute('aria-label', '显示/隐藏密码');

    container.appendChild(toggleBtn);

    // 切换密码可见性
    toggleBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // 更新图标
        const icon = this.querySelector('i');
        if (type === 'text') {
            icon.className = 'fas fa-eye-slash';
            this.setAttribute('aria-label', '隐藏密码');
        } else {
            icon.className = 'fas fa-eye';
            this.setAttribute('aria-label', '显示密码');
        }
    });
}

/**
 * 处理记住我功能
 */
function initRememberMe() {
    const rememberCheckbox = document.createElement('input');
    rememberCheckbox.type = 'checkbox';
    rememberCheckbox.id = 'rememberMe';
    rememberCheckbox.name = 'remember';

    const rememberLabel = document.createElement('label');
    rememberLabel.htmlFor = 'rememberMe';
    rememberLabel.textContent = '记住我';

    const rememberContainer = document.createElement('div');
    rememberContainer.className = 'remember-me';
    rememberContainer.appendChild(rememberCheckbox);
    rememberContainer.appendChild(rememberLabel);

    // 插入到表单中
    const formActions = document.querySelector('.admin-form-actions');
    if (formActions) {
        formActions.parentNode.insertBefore(rememberContainer, formActions);
    }

    // 加载保存的登录信息
    const savedUsername = localStorage.getItem('seeking_admin_username');
    const savedPassword = localStorage.getItem('seeking_admin_password');

    if (savedUsername && savedPassword) {
        document.getElementById('adminUsername').value = savedUsername;
        document.getElementById('adminPassword').value = savedPassword;
        rememberCheckbox.checked = true;
    }

    // 保存登录信息
    document.getElementById('adminLoginForm').addEventListener('submit', function() {
        if (rememberCheckbox.checked) {
            localStorage.setItem('seeking_admin_username', document.getElementById('adminUsername').value);
            localStorage.setItem('seeking_admin_password', document.getElementById('adminPassword').value);
        } else {
            localStorage.removeItem('seeking_admin_username');
            localStorage.removeItem('seeking_admin_password');
        }
    });
}

// 初始化记住我功能（可选）
// document.addEventListener('DOMContentLoaded', initRememberMe);

/**
 * 添加键盘快捷键
 */
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl+Enter 提交表单
        if (event.ctrlKey && event.key === 'Enter') {
            const loginForm = document.getElementById('adminLoginForm');
            if (loginForm) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        }

        // Esc 清空表单
        if (event.key === 'Escape') {
            const loginForm = document.getElementById('adminLoginForm');
            if (loginForm) {
                loginForm.reset();
                document.getElementById('adminUsername').focus();
            }
        }

        // F1 显示帮助
        if (event.key === 'F1') {
            event.preventDefault();
            showHelp();
        }
    });
}

/**
 * 显示帮助信息
 */
function showHelp() {
    const helpMessage = `
        Seeking 管理员登录帮助：

        1. 默认账号密码：
           - 用户名：admin
           - 密码：seeking123

        2. 登录后可以：
           - 查看所有预约记录
           - 审核预约申请
           - 查看统计信息

        3. 快捷键：
           - Enter：切换输入框/提交表单
           - Ctrl+Enter：快速提交
           - Esc：清空表单
           - F1：显示此帮助

        注意：请妥善保管管理员账号密码，定期修改密码。
    `;

    alert(helpMessage);
}

// 添加键盘快捷键
document.addEventListener('DOMContentLoaded', addKeyboardShortcuts);

/**
 * 添加表单验证样式
 */
function addValidationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .validation-message {
            font-size: 14px;
            margin-top: 5px;
            padding: 5px 10px;
            border-radius: 4px;
            display: none;
        }

        .validation-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .validation-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .input-valid {
            border-color: #28a745 !important;
            box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1) !important;
        }

        .input-invalid {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
        }
    `;
    document.head.appendChild(style);

    // 添加实时验证
    addRealTimeValidation();
}

/**
 * 添加实时验证
 */
function addRealTimeValidation() {
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');

    if (usernameInput) {
        usernameInput.addEventListener('input', validateUsernameRealTime);
        usernameInput.addEventListener('blur', validateUsernameRealTime);
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordRealTime);
        passwordInput.addEventListener('blur', validatePasswordRealTime);
    }
}

/**
 * 实时验证用户名
 */
function validateUsernameRealTime() {
    const input = this;
    const value = input.value.trim();
    const messageId = 'username-validation-message';

    // 移除现有消息
    let messageEl = document.getElementById(messageId);
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = messageId;
        messageEl.className = 'validation-message';
        input.parentNode.appendChild(messageEl);
    }

    if (!value) {
        input.classList.remove('input-valid', 'input-invalid');
        messageEl.style.display = 'none';
        return;
    }

    if (value.length < 3 || value.length > 50) {
        input.classList.remove('input-valid');
        input.classList.add('input-invalid');
        messageEl.className = 'validation-message validation-error';
        messageEl.textContent = '账号长度应为3-50个字符';
        messageEl.style.display = 'block';
    } else {
        input.classList.remove('input-invalid');
        input.classList.add('input-valid');
        messageEl.className = 'validation-message validation-success';
        messageEl.textContent = '账号格式正确';
        messageEl.style.display = 'block';
    }
}

/**
 * 实时验证密码
 */
function validatePasswordRealTime() {
    const input = this;
    const value = input.value.trim();
    const messageId = 'password-validation-message';

    // 移除现有消息
    let messageEl = document.getElementById(messageId);
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = messageId;
        messageEl.className = 'validation-message';
        input.parentNode.appendChild(messageEl);
    }

    if (!value) {
        input.classList.remove('input-valid', 'input-invalid');
        messageEl.style.display = 'none';
        return;
    }

    if (value.length < 6 || value.length > 50) {
        input.classList.remove('input-valid');
        input.classList.add('input-invalid');
        messageEl.className = 'validation-message validation-error';
        messageEl.textContent = '密码长度应为6-50个字符';
        messageEl.style.display = 'block';
    } else {
        input.classList.remove('input-invalid');
        input.classList.add('input-valid');
        messageEl.className = 'validation-message validation-success';
        messageEl.textContent = '密码格式正确';
        messageEl.style.display = 'block';
    }
}

// 添加验证样式
document.addEventListener('DOMContentLoaded', addValidationStyles);