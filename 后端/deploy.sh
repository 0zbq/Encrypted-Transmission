#!/bin/bash

# 部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署加密图片传输服务..."

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node --version
npm --version

# 安装依赖
echo "📦 安装依赖..."
npm ci --production

# 创建必要的目录
echo "📁 创建目录..."
mkdir -p logs
mkdir -p storage

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  .env文件不存在，请复制.env.example并配置"
    exit 1
fi

# 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop encrypted-image-backend || true
pm2 delete encrypted-image-backend || true

# 启动新服务
echo "🔄 启动新服务..."
pm2 start ecosystem.config.json

# 保存PM2配置
echo "💾 保存PM2配置..."
pm2 save

# 设置开机自启
echo "🔧 设置开机自启..."
pm2 startup

echo "✅ 部署完成！"
echo "📊 查看服务状态: pm2 status"
echo "📋 查看日志: pm2 logs encrypted-image-backend"
echo "🔄 重启服务: pm2 restart encrypted-image-backend"