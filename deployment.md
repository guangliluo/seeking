# Seeking 网站部署指南

## 项目概述
Seeking 是三峡大学本科线下软件下载&答疑预约网站，基于 Flask + SQLite + HTML/CSS/JavaScript 构建的轻量级应用。

## 系统要求
- Python 3.7+
- 现代浏览器（Chrome/Edge/Firefox）
- 至少 100MB 磁盘空间
- Windows/macOS/Linux 系统

## 目录结构
```
seeking/
├── backend/              # 后端代码
│   ├── app.py           # Flask主应用
│   ├── database.py      # 数据库操作
│   ├── init_db.py       # 数据库初始化脚本
│   └── seeking.db       # SQLite数据库文件（初始化后生成）
├── frontend/            # 前端代码
│   ├── css/
│   │   └── style.css   # 样式文件
│   ├── js/
│   │   ├── script.js   # 通用JavaScript
│   │   ├── booking.js  # 预约表单逻辑
│   │   ├── query.js    # 结果查询逻辑
│   │   ├── admin.js    # 管理员登录逻辑
│   │   └── admin_dashboard.js # 管理员后台逻辑
│   ├── index.html      # 首页
│   ├── booking.html    # 预约表单页
│   ├── query.html      # 结果查询页
│   ├── faq.html        # 常见问题页
│   ├── admin.html      # 管理员登录页
│   └── admin_dashboard.html # 管理员后台页
├── deployment.md       # 部署说明（本文件）
└── test_cases.md      # 测试用例
```

## 部署步骤

### 1. 环境准备
```bash
# 克隆或下载项目代码
git clone <项目地址>
cd seeking

# 创建虚拟环境（推荐）
python -m venv venv

# Windows 激活虚拟环境
venv\Scripts\activate

# Linux/macOS 激活虚拟环境
source venv/bin/activate
```

### 2. 安装依赖
```bash
# 安装必要的Python包
pip install flask flask-cors

# 或者使用 requirements.txt（如果存在）
# pip install -r requirements.txt
```

### 3. 初始化数据库
```bash
cd backend
python init_db.py
```
初始化脚本将：
- 创建 `seeking.db` 数据库文件
- 创建预约记录表和管理员表
- 插入默认管理员账号：`admin` / `seeking123`
- 插入测试预约数据

### 4. 启动后端服务
```bash
# 在backend目录中运行
python app.py
```
后端服务将启动在 `http://localhost:5000`，控制台显示访问地址。

### 5. 访问网站
- 前台网站：http://localhost:5000
- 管理员后台：http://localhost:5000/admin
- 默认管理员账号：admin / seeking123

### 6. 停止服务
在终端按 `Ctrl+C` 停止Flask服务。

## 配置说明

### 数据库配置
- 数据库文件：`backend/seeking.db`
- 如需重置数据库：删除 `seeking.db` 文件，重新运行 `init_db.py`
- 数据库位置可修改 `backend/database.py` 中的 `DB_PATH`

### 管理员账号
- 默认账号：admin / seeking123
- 修改密码：运行以下Python脚本
```python
from database import change_admin_password
change_admin_password('admin', 'seeking123', '新密码')
```

### Flask配置
- 服务地址：`0.0.0.0:5000`（可在 `app.py` 中修改）
- 调试模式：默认开启（生产环境应关闭）
- 密钥：`seeking-secret-key-2026`（生产环境应修改）

## 生产环境部署建议

### 1. 安全配置
```python
# 修改 app.py 中的配置
app.secret_key = '强密码字符串'  # 使用强密码
app.config['SESSION_COOKIE_SECURE'] = True  # 仅HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
```

### 2. 使用生产WSGI服务器
```bash
# 安装gunicorn（Linux/macOS）
pip install gunicorn

# 启动服务
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### 3. 使用Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 启用HTTPS
使用Let's Encrypt获取SSL证书：
```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## 维护说明

### 备份数据库
```bash
# 备份数据库文件
cp backend/seeking.db seeking_backup_$(date +%Y%m%d).db

# 或导出为SQL
sqlite3 backend/seeking.db .dump > seeking_backup.sql
```

### 查看日志
- Flask日志：控制台输出
- 错误日志：查看 `app.py` 中的日志记录
- 访问日志：Nginx或服务器日志

### 性能优化
1. 启用数据库连接池
2. 添加缓存机制
3. 压缩静态文件
4. 使用CDN分发静态资源

## 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查找占用端口的进程
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/macOS

# 修改端口
python app.py --port 5001
```

#### 2. 数据库连接失败
- 检查 `seeking.db` 文件权限
- 确保有写入权限
- 检查磁盘空间

#### 3. 管理员无法登录
- 检查默认密码：admin / seeking123
- 检查数据库是否初始化
- 查看Flask控制台错误信息

#### 4. 静态文件无法加载
- 检查 `frontend` 目录结构
- 检查CSS/JS文件路径
- 查看浏览器开发者工具控制台

### 日志级别
修改 `app.py` 中的日志配置：
```python
import logging
logging.basicConfig(level=logging.DEBUG)  # 调试模式
```

## 更新部署

### 更新代码
```bash
# 备份数据库
cp backend/seeking.db seeking.db.backup

# 更新代码
git pull origin main

# 重启服务
pkill -f "python app.py"
python app.py
```

### 数据库迁移
如需修改数据库结构：
1. 备份当前数据库
2. 修改 `init_db.py` 中的表结构
3. 删除旧数据库文件
4. 重新运行 `init_db.py`
5. 恢复数据（如需）

## 技术支持
- 查看控制台错误信息
- 检查浏览器开发者工具
- 查看数据库文件完整性
- 参考Flask官方文档

## 注意事项
1. 生产环境务必修改默认密码
2. 定期备份数据库
3. 监控服务器资源使用
4. 及时更新安全补丁
5. 限制管理员访问IP（如需要）

---

*本部署指南最后更新：2026年3月6日*