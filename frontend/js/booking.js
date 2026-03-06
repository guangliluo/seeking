/*
 * Seeking 预约表单JavaScript文件
 * 处理预约表单的提交、验证和交互
 */

// 定义API基础URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化表单
    initBookingForm();

    // 设置日期输入框的最小值（今天）
    setMinDate();

    // 初始化软件名称输入框的自动完成
    initSoftwareAutocomplete();

    // 监听表单重置按钮
    document.querySelector('button[type="reset"]')?.addEventListener('click', function() {
        setTimeout(setMinDate, 0); // 重置后重新设置最小日期
    });
});

/**
 * 初始化预约表单
 */
function initBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const successMessage = document.getElementById('successMessage');
    const newBookingBtn = document.getElementById('newBookingBtn');

    if (!bookingForm) return;

    // 表单提交事件
    bookingForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // 验证表单
        if (!validateForm()) {
            return;
        }

        // 收集表单数据
        const formData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            booking_date: document.getElementById('booking_date').value,
            location: document.getElementById('location').value,
            software: document.getElementById('software').value.trim(),
            problem_description: document.getElementById('problem_description').value.trim()
        };

        // 显示加载状态
        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
        submitBtn.disabled = true;

        try {
            // 发送API请求
            const response = await fetch(`${API_BASE_URL}/booking/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                // 显示成功消息
                bookingForm.style.display = 'none';
                successMessage.style.display = 'block';

                // 滚动到成功消息
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // 显示成功提示
                showMessage('预约信息已提交，等待审核', 'success');
            } else {
                // 显示错误消息
                showMessage(result.message || '提交失败，请重试', 'error');
            }
        } catch (error) {
            console.error('提交预约失败:', error);
            showMessage('网络错误，请检查连接后重试', 'error');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // "再次预约"按钮事件
    if (newBookingBtn) {
        newBookingBtn.addEventListener('click', function() {
            successMessage.style.display = 'none';
            bookingForm.style.display = 'block';
            bookingForm.reset();
            setMinDate();

            // 滚动到表单顶部
            bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

/**
 * 设置日期输入框的最小值为今天
 */
function setMinDate() {
    const dateInput = document.getElementById('booking_date');
    if (!dateInput) return;

    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // 如果日期输入框为空，设置为明天
    if (!dateInput.value) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
}

/**
 * 初始化软件名称自动完成
 */
function initSoftwareAutocomplete() {
    const softwareInput = document.getElementById('software');
    if (!softwareInput) return;

    // 预定义的软件列表
    const softwareList = [
        'Office 365',
        'MATLAB',
        'Python',
        'AutoCAD',
        'SPSS',
        'Origin',
        'Visio',
        'Adobe Creative Cloud',
        'Visual Studio',
        'EndNote',
        'Citespace',
        'NVivo',
        'LaTeX',
        'WPS Office',
        'IntelliJ IDEA',
        'PyCharm',
        'Eclipse',
        'Android Studio',
        'Xcode',
        'VMware',
        'VirtualBox',
        'Docker',
        'Git',
        'Node.js',
        'Java JDK',
        'MySQL',
        'PostgreSQL',
        'MongoDB',
        'Redis',
        'Nginx',
        'Apache',
        'Tomcat'
    ];

    // 创建数据列表
    let datalist = document.getElementById('software-suggestions');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'software-suggestions';
        softwareInput.parentNode.appendChild(datalist);
    }

    // 清空现有选项
    datalist.innerHTML = '';

    // 添加软件选项
    softwareList.forEach(software => {
        const option = document.createElement('option');
        option.value = software;
        datalist.appendChild(option);
    });

    // 设置输入框的list属性
    softwareInput.setAttribute('list', 'software-suggestions');
}

/**
 * 验证表单数据
 * @returns {boolean} 表单是否有效
 */
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const bookingDate = document.getElementById('booking_date').value;
    const location = document.getElementById('location').value;
    const software = document.getElementById('software').value.trim();

    // 验证姓名
    if (!name) {
        showMessage('Seeking：姓名不能为空', 'error');
        document.getElementById('name').focus();
        return false;
    }

    if (name.length < 2 || name.length > 20) {
        showMessage('Seeking：姓名长度应为2-20个字符', 'error');
        document.getElementById('name').focus();
        return false;
    }

    // 验证手机号
    if (!phone) {
        showMessage('Seeking：手机号不能为空', 'error');
        document.getElementById('phone').focus();
        return false;
    }

    if (!/^\d{11}$/.test(phone)) {
        showMessage('Seeking：手机号格式错误，请输入11位数字', 'error');
        document.getElementById('phone').focus();
        return false;
    }

    // 验证预约日期
    if (!bookingDate) {
        showMessage('Seeking：请选择预约日期', 'error');
        document.getElementById('booking_date').focus();
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(bookingDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showMessage('Seeking：预约日期不能选择过去的时间', 'error');
        document.getElementById('booking_date').focus();
        return false;
    }

    // 验证预约地点
    if (!location) {
        showMessage('Seeking：请选择预约地点', 'error');
        document.getElementById('location').focus();
        return false;
    }

    // 验证软件名称
    if (!software) {
        showMessage('Seeking：软件名称不能为空', 'error');
        document.getElementById('software').focus();
        return false;
    }

    if (software.length < 2 || software.length > 100) {
        showMessage('Seeking：软件名称长度应为2-100个字符', 'error');
        document.getElementById('software').focus();
        return false;
    }

    // 验证问题描述（可选）
    const problemDescription = document.getElementById('problem_description').value.trim();
    if (problemDescription.length > 500) {
        showMessage('Seeking：问题描述不能超过500个字符', 'error');
        document.getElementById('problem_description').focus();
        return false;
    }

    return true;
}

/**
 * 实时验证手机号格式
 */
function initPhoneValidation() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function() {
        const phone = this.value.trim();
        const phoneError = document.getElementById('phone-error');

        if (!phone) {
            hideError(phoneInput);
            return;
        }

        if (!/^\d{0,11}$/.test(phone)) {
            showError(phoneInput, '只能输入数字');
            return;
        }

        if (phone.length > 11) {
            this.value = phone.substring(0, 11);
            showError(phoneInput, '手机号不能超过11位');
            return;
        }

        hideError(phoneInput);
    });

    phoneInput.addEventListener('blur', function() {
        const phone = this.value.trim();
        if (phone && !/^\d{11}$/.test(phone)) {
            showError(phoneInput, '手机号必须是11位数字');
        }
    });
}

/**
 * 实时验证日期
 */
function initDateValidation() {
    const dateInput = document.getElementById('booking_date');
    if (!dateInput) return;

    dateInput.addEventListener('change', function() {
        const date = this.value;
        if (!date) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            showError(dateInput, '预约日期不能选择过去的时间');
        } else {
            hideError(dateInput);
        }
    });
}

/**
 * 显示字段错误
 * @param {HTMLElement} input - 输入框元素
 * @param {string} message - 错误消息
 */
function showError(input, message) {
    // 移除现有的错误提示
    hideError(input);

    // 添加错误样式
    input.classList.add('error');

    // 创建错误消息元素
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    errorEl.style.color = '#dc3545';
    errorEl.style.fontSize = '14px';
    errorEl.style.marginTop = '5px';

    // 插入错误消息
    input.parentNode.appendChild(errorEl);
}

/**
 * 隐藏字段错误
 * @param {HTMLElement} input - 输入框元素
 */
function hideError(input) {
    input.classList.remove('error');

    const existingError = input.parentNode.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
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

// 初始化实时验证
document.addEventListener('DOMContentLoaded', function() {
    initPhoneValidation();
    initDateValidation();
});

/**
 * 自动格式化手机号输入（添加空格）
 */
function initPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');

        // 限制长度为11位
        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        // 格式化显示：3-4-4格式
        if (value.length > 7) {
            value = value.substring(0, 3) + ' ' + value.substring(3, 7) + ' ' + value.substring(7);
        } else if (value.length > 3) {
            value = value.substring(0, 3) + ' ' + value.substring(3);
        }

        this.value = value;
    });

    phoneInput.addEventListener('blur', function() {
        // 移除空格，只保留数字
        this.value = this.value.replace(/\s/g, '');
    });

    phoneInput.addEventListener('focus', function() {
        // 添加空格格式化
        let value = this.value.replace(/\D/g, '');
        if (value.length > 7) {
            value = value.substring(0, 3) + ' ' + value.substring(3, 7) + ' ' + value.substring(7);
        } else if (value.length > 3) {
            value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        this.value = value;
    });
}

// 初始化手机号格式化
document.addEventListener('DOMContentLoaded', initPhoneFormatting);