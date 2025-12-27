# 加密图片传输后端服务

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19.2-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

专为微信小程序设计的加密图片上传/下载后端服务，支持多种验证方式，确保图片传输的安全性和可控性。

## 🌟 功能特性

- 🔐 **端到端加密** - 客户端加密，服务端只存储加密数据
- 🔑 **多重验证机制** - 支持密码验证、二维码验证、地理位置验证
- 📍 **地理围栏** - 基于地理位置的访问控制，精确到米级
- ⏱️ **自动过期** - 文件链接15分钟自动过期，防止滥用
- 🛡️ **安全防护** - CORS跨域支持、请求频率限制
- 🚀 **高性能** - 内存缓存、流式传输、PM2进程管理
- 📊 **监控告警** - 完整的监控脚本和日志系统

## 🛠️ 技术栈

### 后端框架
- **Node.js** (>= 16.0.0) - JavaScript运行时
- **Express.js** (v4.19.2) - Web应用框架
- **PM2** - 生产环境进程管理

### 核心依赖
- **Multer** (v1.4.5-lts.1) - 文件上传中间件
- **UUID** (v9.0.1) - 唯一标识符生成
- **CORS** (v2.8.5) - 跨域资源共享
- **Joi** (v18.0.2) - 数据验证
- **Node-Cache** (v5.1.2) - 内存缓存
- **Express-Rate-Limit** (v8.2.1) - 请求频率限制

## 📦 安装部署

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0
- PM2 (生产环境)

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd 微信小项目/后端
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

4. **启动服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 环境变量配置

创建 `.env` 文件并配置以下参数：

```env
# 服务配置
PORT=3000
NODE_ENV=production

# 安全配置
TOKEN_SECRET=your-super-strong-secret-key-change-this-in-production

# 跨域配置
CORS_ORIGINS=https://servicewechat.com,https://your-domain.com

# 文件配置
MAX_FILE_SIZE=10485760  # 10MB
FILE_EXPIRE_TIME=900000  # 15分钟（毫秒）
```

### 生产环境部署

1. **使用 PM2 部署**
```bash
# 执行部署脚本
chmod +x deploy.sh
./deploy.sh

# 或手动启动
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

2. **Nginx 反向代理**
```bash
# 复制 Nginx 配置
sudo cp nginx.conf.example /etc/nginx/sites-available/your-domain.com
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **SSL 证书配置**
```bash
# 使用 Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 📡 API 接口文档

### 基础信息
- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json` (除文件上传外)
- **认证方式**: Token-based

### 1. 初始化上传

**接口地址**: `POST /upload/init`

**功能描述**: 初始化文件上传流程，获取上传URL和文件ID

**请求参数**:
```json
{
  "verifyType": "password|location|qrcode",
  "pbkdf2Salt": "base64编码的盐值",
  "passwordVerifier": "密码验证器",
  "radius": 100,
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074
  }
}
```

**参数说明**:
- `verifyType`: 验证类型，可选值：`password`(密码)、`location`(位置)、`qrcode`(二维码)
- `pbkdf2Salt`: PBKDF2算法的盐值，Base64编码
- `passwordVerifier`: 密码验证器，用于验证用户密码
- `radius`: 地理围栏半径，单位：米
- `location`: 中心点坐标，仅位置验证时需要

**响应示例**:
```json
{
  "uploadUrl": "http://localhost:3000/upload/file/550e8400-e29b-41d4-a716-446655440000",
  "fileId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. 上传文件

**接口地址**: `POST /upload/file/:fileId`

**功能描述**: 上传加密后的图片文件

**请求类型**: `multipart/form-data`

**请求参数**:
- `file`: 加密后的图片文件（二进制流）

**路径参数**:
- `fileId`: 从初始化接口获取的文件ID

**响应示例**:
```json
{
  "ok": true
}
```

### 3. 完成上传

**接口地址**: `POST /upload/complete`

**功能描述**: 完成文件上传，生成下载ID

**请求参数**:
```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "verifyType": "password|location|qrcode",
  "nonceBase64": "base64编码的随机数",
  "pbkdf2Salt": "base64编码的盐值",
  "passwordVerifier": "密码验证器",
  "radius": 100,
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "hmacBase64": "base64编码的HMAC签名"
}
```

**响应示例**:
```json
{
  "downloadId": "aB3dE7fG"
}
```

### 4. 下载文件

**接口地址**: `POST /download`

**功能描述**: 获取文件下载链接和解密参数

**请求参数**:
```json
{
  "downloadId": "aB3dE7fG",
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074
  }
}
```

**参数说明**:
- `downloadId`: 8位随机字符的下载ID
- `location`: 用户当前位置，仅位置验证时需要

**响应示例**:
```json
{
  "cipherUrl": "http://localhost:3000/file/550e8400-e29b-41d4-a716-446655440000",
  "nonceBase64": "base64编码的随机数",
  "pbkdf2Salt": "base64编码的盐值",
  "verifyType": "location",
  "hmacBase64": "base64编码的HMAC签名"
}
```

### 5. 获取文件

**接口地址**: `GET /file/:fileId`

**功能描述**: 下载加密文件内容

**路径参数**:
- `fileId`: 文件唯一标识符

**响应**: 加密文件二进制流

## 🔐 安全机制详解

### 密码验证机制

使用 PBKDF2 算法进行密码验证：

1. **客户端流程**:
   - 生成随机盐值 `pbkdf2Salt`
   - 使用 PBKDF2 算法计算 `passwordVerifier`
   - 将盐值和验证器发送到服务端

2. **验证流程**:
   - 用户输入密码
   - 客户端使用相同盐值计算验证器
   - 比对验证器是否匹配

### 地理位置验证

基于 Haversine 公式计算地球表面两点间距离：

```javascript
function distance(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * rad
  const dLon = (b.longitude - a.longitude) * rad
  const lat1 = a.latitude * rad
  const lat2 = b.latitude * rad
  const sa = Math.sin(dLat / 2)
  const sb = Math.sin(dLon / 2)
  const c = 2 * Math.asin(Math.sqrt(sa * sa + Math.cos(lat1) * Math.cos(lat2) * sb * sb))
  return 6371000 * c  // 返回距离（米）
}
```

### 文件加密流程

1. **上传端**:
   - 生成随机 nonce
   - 使用 AES-GCM 算法加密图片
   - 计算 HMAC 签名
   - 上传加密数据

2. **下载端**:
   - 获取加密数据和参数
   - 验证 HMAC 签名
   - 使用相同参数解密文件

## 📁 项目结构

```
后端/
├── app.js                    # 主应用文件
├── package.json              # 项目配置和依赖
├── package-lock.json         # 锁定依赖版本
├── ecosystem.config.json     # PM2 进程管理配置
├── nginx.conf.example        # Nginx 配置示例
├── deploy.sh                 # 部署脚本
├── monitor.sh                # 监控脚本
├── README.md                 # 项目文档
├── .env.example              # 环境变量模板
├── storage/                  # 文件存储目录（运行时创建）
└── logs/                     # 日志目录（运行时创建）
```

## 🔧 运维管理

### 服务监控

使用提供的监控脚本：

```bash
# 添加到 crontab，每5分钟执行一次
*/5 * * * * /path/to/monitor.sh
```

监控脚本功能：
- 检查服务状态，异常时自动重启
- 清理过期文件（超过24小时）
- 监控磁盘使用率，超过80%时告警

### 日志管理

PM2 日志配置：
- **标准输出**: `./logs/out.log`
- **错误输出**: `./logs/err.log`
- **合并日志**: `./logs/combined.log`

查看日志：
```bash
# 查看实时日志
pm2 logs encrypted-image-backend

# 查看历史日志
tail -f logs/combined.log
```

### 性能优化

1. **内存管理**:
   - 最大内存限制：1GB
   - 自动重启机制

2. **文件清理**:
   - 定期清理过期文件
   - 避免磁盘空间不足

3. **并发控制**:
   - 请求频率限制
   - 连接超时设置

## 🚨 错误处理

### 常见错误码

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 认证失败 |
| 403 | Forbidden | 权限不足或文件过期 |
| 404 | Not Found | 文件不存在 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误响应格式

```json
{
  "message": "错误描述信息"
}
```

## 🧪 测试

### 本地测试

1. **启动服务**:
```bash
npm run dev
```

2. **测试上传**:
```bash
curl -X POST http://localhost:3000/upload/init \
  -H "Content-Type: application/json" \
  -d '{
    "verifyType": "location",
    "radius": 100,
    "location": {
      "latitude": 39.9042,
      "longitude": 116.4074
    }
  }'
```

3. **测试文件上传**:
```bash
curl -X POST http://localhost:3000/upload/file/{fileId} \
  -F "file=@test.jpg"
```

### 性能测试

使用 Artillery 进行压力测试：

```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: "/upload/init"
          json:
            verifyType: "password"
            pbkdf2Salt: "dGVzdHNhbHQ="
            passwordVerifier: "dGVzdHZlcmlmaWVy"
```

## 🔮 版本历史

### v1.0.0 (当前版本)
- ✅ 基础文件上传下载功能
- ✅ 多重验证机制
- ✅ 地理位置验证
- ✅ 自动过期机制
- ✅ PM2 进程管理
- ✅ 监控脚本

### 计划功能
- 🔄 Redis 缓存支持
- 🔄 分布式文件存储
- 🔄 更多验证方式
- 🔄 文件预览功能

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/0zbq/Encrypted-Transmission)
- 📖 文档: [项目 Wiki](https://github.com/0zbq/Encrypted-Transmission/wiki)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！