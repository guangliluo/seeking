# Seeking - 三峡大学软件下载&答疑预约网站

## 项目简介
Seeking 是为三峡大学本科学生开发的轻量级线下预约网站，解决学生线下获取软件安装包、咨询软件使用问题的需求。网站核心是「预约」功能，学生提交预约信息后，后台管理员可审核，审核结果同步反馈给学生。

## 核心功能
- **预约表单**：学生填写姓名、手机号、预约日期、地点、软件名称等信息提交预约
- **结果查询**：仅需手机号后4位即可查询预约审核状态
- **管理员后台**：管理员审核预约，填写审核备注
- **常见问题**：校内常用软件下载指南和使用说明

## 技术栈
- **前端**：HTML5 + CSS3 + JavaScript（原生）
- **后端**：Python Flask + SQLite
- **数据库**：SQLite（轻量级，适合线下部署）
- **通信**：RESTful API（JSON格式）

## 快速开始

### 1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 初始化数据库
```bash
python init_db.py
```
默认管理员账号：admin / seeking123

### 3. 启动服务
```bash
python app.py
```

### 4. 访问网站
- 前台网站：http://localhost:5000
- 管理员后台：http://localhost:5000/admin

## 项目结构
```
seeking/
├── backend/           # 后端Flask应用
│   ├── app.py        # 主应用，包含所有API路由
│   ├── database.py   # 数据库操作模块
│   ├── init_db.py    # 数据库初始化脚本
│   └── requirements.txt # Python依赖
├── frontend/         # 前端静态文件
│   ├── css/          # 样式文件
│   ├── js/           # JavaScript文件
│   └── *.html        # 各功能页面
├── deployment.md     # 详细部署指南
├── test_cases.md     # 功能测试用例
└── README.md         # 本文件
```

## 功能特点
1. **简单易用**：学生无需注册登录，仅通过手机号后4位验证
2. **名称统一**：全站统一使用「Seeking」品牌名称
3. **响应式设计**：适配桌面和移动端浏览器
4. **数据安全**：SQLite本地存储，无需云服务
5. **完整测试**：包含详细的功能测试用例

## 开发说明
- 网站名称「Seeking」在界面中样式突出（字体加粗）
- 所有错误提示格式为「Seeking：XXX错误」
- 页面标题格式为「Seeking - 功能名称」
- 管理员后台标题为「Seeking - 预约管理后台」

## 部署说明
详细部署步骤请查看 [deployment.md](deployment.md)

## 测试说明
完整测试用例请查看 [test_cases.md](test_cases.md)

## 注意事项
1. 生产环境务必修改默认管理员密码
2. 定期备份数据库文件（backend/seeking.db）
3. 适合校内局域网部署使用
4. 无需复杂配置，开箱即用

## 许可证
本项目为三峡大学校内使用开发，仅供学习参考。

---
*项目创建时间：2026年3月6日*