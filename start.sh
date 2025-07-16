#!/bin/bash

# 数独游戏项目启动脚本

echo "🎮 启动数独游戏项目..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查Redis是否运行
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis 未安装，请先安装 Redis 7+"
    exit 1
fi

# 测试Redis连接
if ! redis-cli ping &> /dev/null; then
    echo "❌ Redis 未运行，请启动 Redis 服务"
    echo "   macOS: brew services start redis"
    echo "   Linux: sudo systemctl start redis-server"
    echo "   Windows: 启动 Redis 服务"
    exit 1
fi

echo "✅ Redis 连接正常"

# 安装前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败"
        exit 1
    fi
    cd ..
fi

# 安装后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 后端依赖安装失败"
        exit 1
    fi
    cd ..
fi

echo "🚀 启动服务..."

# 启动后端服务
echo "🔧 启动后端服务 (http://localhost:3000)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务 (http://localhost:5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 服务启动成功！"
echo "📱 前端地址: http://localhost:5173"
echo "🔌 后端地址: http://localhost:3000"
echo "📊 健康检查: http://localhost:3000/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT

# 保持脚本运行
wait