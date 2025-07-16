# 数独游戏项目启动指南

## 项目概述

这是一个完整的前后端分离的网页数独游戏项目，包含以下功能：

- ✅ 支持4x4、5x5、6x6三种数独模式
- ✅ 用户注册、登录、修改密码
- ✅ 排行榜系统
- ✅ 中英文国际化支持
- ✅ 响应式设计，适配1080p、2K、4K分辨率
- ✅ 游戏计时、提示、撤销等功能
- ✅ 个人统计数据

## 技术栈

### 前端
- Vue 3
- Element Plus UI组件库
- Vite 构建工具
- Vue Router 路由管理
- Vue I18n 国际化
- Axios HTTP客户端

### 后端
- Node.js 18+
- Koa2 Web框架
- Redis 数据存储
- JWT 身份认证
- bcryptjs 密码加密

## 环境要求

- Node.js 18+
- Redis 7+
- 现代浏览器（Chrome, Firefox, Safari, Edge）

## 快速开始

### 1. 安装Redis

#### Windows
```bash
# 使用Chocolatey安装
choco install redis-64

# 或下载并安装Redis Windows版本
# https://github.com/microsoftarchive/redis/releases
```

#### macOS
```bash
# 使用Homebrew安装
brew install redis

# 启动Redis服务
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server

# 启动Redis服务
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 验证Redis安装
```bash
redis-cli ping
# 应该返回 PONG
```

### 2. 安装项目依赖

#### 安装前端依赖
```bash
cd frontend
npm install
```

#### 安装后端依赖
```bash
cd backend
npm install
```

### 3. 启动项目

#### 启动后端服务
```bash
cd backend
npm run dev
```
后端服务将在 http://localhost:3000 启动

#### 启动前端服务
```bash
cd frontend
npm run dev
```
前端服务将在 http://localhost:5173 启动

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 项目结构

```
sudoku-game/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/       # Vue组件
│   │   ├── views/           # 页面组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # 状态管理
│   │   ├── utils/           # 工具函数
│   │   ├── locales/         # 国际化文件
│   │   └── api/             # API接口
│   ├── package.json
│   └── vite.config.js
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/          # 路由处理
│   │   ├── utils/           # 工具函数
│   │   ├── config.js        # 配置文件
│   │   ├── redis.js         # Redis连接
│   │   └── index.js         # 应用入口
│   └── package.json
├── docs/                     # 文档
└── README.md
```

## API接口文档

### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息
- `POST /auth/change-password` - 修改密码

### 游戏接口
- `POST /game/generate` - 生成新游戏
- `POST /game/check` - 检查答案
- `POST /game/submit` - 提交完成的游戏
- `GET /game/:gameId` - 获取游戏状态

### 排行榜接口
- `GET /leaderboard` - 获取排行榜
- `GET /leaderboard/all` - 获取所有模式排行榜
- `GET /leaderboard/rank/:username` - 获取用户排名
- `GET /leaderboard/stats` - 获取排行榜统计

### 用户接口
- `GET /user/stats` - 获取用户统计信息
- `GET /user/games` - 获取用户游戏历史
- `GET /user/best-records` - 获取用户最佳记录
- `GET /user/profile` - 获取用户资料

## 配置说明

### 后端环境变量

在backend目录下创建`.env`文件（可选）：

```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 前端代理配置

前端已配置代理，将`/api`请求转发到后端`http://localhost:3000`

## 游戏玩法

1. **注册/登录**：首先注册账号或登录已有账号
2. **选择模式**：在首页选择4x4、5x5或6x6模式
3. **开始游戏**：
   - 点击空格输入数字
   - 使用数字键盘快速输入
   - 支持键盘导航（方向键）
   - 使用提示功能（限制3次）
   - 使用撤销功能
   - 检查答案功能
4. **完成游戏**：完成后自动提交到排行榜
5. **查看排行榜**：查看各模式的最佳成绩
6. **个人中心**：查看个人统计和修改密码

## 故障排除

### 常见问题

1. **Redis连接失败**
   ```
   确保Redis服务正在运行：
   redis-cli ping
   ```

2. **前端无法连接后端**
   ```
   检查后端是否在3000端口运行
   检查防火墙设置
   ```

3. **依赖安装失败**
   ```bash
   # 清除npm缓存
   npm cache clean --force
   
   # 删除node_modules重新安装
   rm -rf node_modules
   npm install
   ```

4. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -ano | findstr :3000  # Windows
   lsof -i :3000                 # macOS/Linux
   
   # 修改配置文件中的端口
   ```

### 开发模式

开发时建议：
1. 使用`npm run dev`启动开发服务器
2. 开启浏览器开发者工具
3. 查看控制台日志排查问题

## 生产部署

### 前端构建
```bash
cd frontend
npm run build
```

### 使用PM2部署后端
```bash
npm install -g pm2
cd backend
pm2 start src/index.js --name sudoku-backend
```

### 使用Nginx代理
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题请提交Issue或联系开发者。