# Seeking 网站极速启动指南

## 10秒快速启动（只需3步）

### 第一步：安装依赖
```bash
# 进入backend目录
cd backend

# 安装Python依赖
pip install -r requirements.txt
```

### 第二步：初始化数据库
```bash
# 初始化数据库（包含测试数据）
python init_db.py
# 输出：默认管理员账号 admin / seeking123
```

### 第三步：启动网站
```bash
# 启动Flask服务器
python app.py
```

### 访问网站
- **前台网站**：http://localhost:5000
- **管理员后台**：http://localhost:5000/admin
- **管理员账号**：admin / seeking123

---

## 一键启动脚本

### Windows用户
双击运行 `start_windows.bat`

### Linux/Mac用户
```bash
# 给脚本添加执行权限（首次运行需要）
chmod +x start_linux_mac.sh

# 运行启动脚本
./start_linux_mac.sh
```

---

## 快速测试

### 测试数据
数据库初始化时已插入3条测试数据：

| 姓名 | 手机号 | 状态 | 查询后4位 |
|------|--------|------|-----------|
| 张三 | 13812345678 | 待审核 | **5678** |
| 李四 | 13987654321 | 已通过 | **4321** |
| 王五 | 13711223344 | 已拒绝 | **3344** |

### 快速体验流程
1. **前台预约**：访问 http://localhost:5000/booking 提交预约
2. **查询结果**：访问 http://localhost:5000/query 输入 **5678**
3. **管理员登录**：访问 http://localhost:5000/admin 使用账号 admin / seeking123
4. **审核预约**：在后台找到待审核记录，点击"审核"按钮

---

## 常见问题

### 1. 端口5000被占用？
```bash
# 修改端口（编辑backend/app.py最后一行）
app.run(debug=True, host='0.0.0.0', port=5001)
```

### 2. 依赖安装失败？
```bash
# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 3. 想重新开始？
```bash
# 删除数据库文件重新初始化
rm backend/seeking.db
python backend/init_db.py
```

### 4. 访问网站显示404？
确保在 `backend` 目录运行 `python app.py`，不要在其他目录运行。

---

## 功能速查

### 前台功能
- ✅ 首页：http://localhost:5000
- ✅ 预约表单：http://localhost:5000/booking
- ✅ 结果查询：http://localhost:5000/query
- ✅ 常见问题：http://localhost:5000/faq

### 后台功能
- ✅ 管理员登录：http://localhost:5000/admin
- ✅ 后台管理：http://localhost:5000/admin/dashboard

### API接口
- ✅ 提交预约：POST http://localhost:5000/api/booking/submit
- ✅ 查询预约：GET http://localhost:5000/api/booking/query?last4=5678
- ✅ 管理员登录：POST http://localhost:5000/admin/login

---

## 停止服务
在运行 `python app.py` 的终端窗口按 **Ctrl+C**

---

## 下一步
查看完整文档：
- [详细部署指南](./deployment.md)
- [完整测试用例](./test_cases.md)
- [项目README](./README.md)