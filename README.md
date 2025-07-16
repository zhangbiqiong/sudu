# 数独网页游戏项目 Sudoku Web Game

## 项目简介 | Project Introduction

本项目是一个前后端分离的网页数独游戏，支持4x4、5x5、6x6三种模式，面向多用户，具备排行榜、国际化和高分辨率适配等功能。

This project is a web-based Sudoku game with separated frontend and backend, supporting 4x4, 5x5, and 6x6 modes, multi-user, leaderboard, internationalization, and high-resolution adaptation.

---

## 技术栈 | Tech Stack

- 前端 Frontend：Vue3, Element-Plus, Vite (port: 5173)
- 后端 Backend：Node.js 18, Koa2, ioredis
- 数据库 Database：Redis 7 (localhost:6379, no auth)

---

## 功能列表 | Features

- 支持4x4、5x5、6x6三种数独模式
- 多用户注册、登录、修改密码
- 排行榜（记录用户、模式、用时）
- 中英文语言切换
- 仅支持PC端，适配1080p、2K、4K分辨率
- 页面风格典雅简洁

---

## 开发环境搭建 | Development Setup

1. 安装 Node.js 18 及以上
2. 安装 Redis 7 并启动，监听本地6379端口，无需用户名和密码
3. 前端依赖安装：
   ```bash
   cd frontend
   npm install
   ```
4. 后端依赖安装：
   ```bash
   cd backend
   npm install
   ```

---

## 运行方式 | How to Run

### 启动前端 | Start Frontend
```bash
cd frontend
npm run dev
# 默认端口 5173
```

### 启动后端 | Start Backend
```bash
cd backend
npm run dev
# 默认端口可在配置中设置
```

---

## 目录结构建议 | Suggested Directory Structure

```
project-root/
├── frontend/    # 前端源码 Frontend source
├── backend/     # 后端源码 Backend source
├── docs/        # 文档 Documentation
├── README.md    # 项目说明 Project readme
└── 基本说明.md  # 需求说明 Requirement
```

---

## 国际化与适配 | Internationalization & Adaptation

- 使用 i18n 方案实现中英文切换
- 页面布局和样式需适配1080p、2K、4K分辨率，建议使用响应式布局和rem/em单位

---

## 后续开发建议 | Further Suggestions

- 增加单元测试和端到端测试
- 集成CI/CD流程
- 增加API文档
- 优化性能和安全性

