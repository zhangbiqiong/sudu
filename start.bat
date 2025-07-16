@echo off
chcp 65001 >nul
setlocal

echo 🎮 启动数独游戏项目...

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: 检查Redis是否安装
where redis-cli >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Redis 未安装，请先安装 Redis 7+
    echo    下载地址: https://github.com/microsoftarchive/redis/releases
    pause
    exit /b 1
)

:: 测试Redis连接
redis-cli ping >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Redis 未运行，请启动 Redis 服务
    echo    请确保 Redis 服务正在运行
    pause
    exit /b 1
)

echo ✅ Redis 连接正常

:: 安装前端依赖
if not exist "frontend\node_modules" (
    echo 📦 安装前端依赖...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
    cd ..
)

:: 安装后端依赖
if not exist "backend\node_modules" (
    echo 📦 安装后端依赖...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
    cd ..
)

echo 🚀 启动服务...

:: 启动后端服务
echo 🔧 启动后端服务 (http://localhost:3000)...
cd backend
start "Sudoku Backend" cmd /k "npm run dev"
cd ..

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端服务
echo 🎨 启动前端服务 (http://localhost:5173)...
cd frontend
start "Sudoku Frontend" cmd /k "npm run dev"
cd ..

echo.
echo 🎉 服务启动成功！
echo 📱 前端地址: http://localhost:5173
echo 🔌 后端地址: http://localhost:3000
echo 📊 健康检查: http://localhost:3000/health
echo.
echo 关闭此窗口不会停止服务
echo 要停止服务，请关闭对应的命令行窗口
echo.

:: 自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:5173

pause