# 加密传输小程序项目说明文档

## 项目概述

本项目是一个基于微信小程序的加密图片传输系统，提供端到端加密的图片上传和下载功能。系统支持两种验证模式：密码验证和地理位置验证，确保图片传输的安全性和可控性。

### 技术架构
- **前端**: 微信小程序原生开发
- **后端**: Node.js + Express.js
- **部署**: PM2进程管理 + Nginx反向代理
- **加密**: 自定义XOR变换（仅用于学习演示）

## 项目结构

```
加密传输小程序/
├── 后端/                          # Node.js后端服务
│   ├── app.js                     # 主应用文件
│   ├── package.json               # 项目配置和依赖
│   ├── ecosystem.config.json      # PM2进程管理配置
│   ├── deploy.sh                  # 部署脚本
│   ├── monitor.sh                 # 监控脚本
│   ├── nginx.conf.example         # Nginx配置示例
│   ├── README.md                  # 后端文档
│   ├── logs/                      # 日志目录（运行时创建）
│   └── storage/                   # 文件存储目录（运行时创建）
└── 前端/                          # 微信小程序
    ├── app.js                     # 小程序入口文件
    ├── app.json                   # 小程序配置
    ├── app.wxss                   # 全局样式
    ├── app.config.js              # 环境配置
    ├── project.config.json        # 项目配置
    ├── sitemap.json               # 站点地图
    ├── pages/                     # 页面目录
    │   ├── upload/                # 上传页面
    │   │   ├── index.js           # 上传页面逻辑
    │   │   ├── index.wxml         # 上传页面结构
    │   │   ├── index.wxss         # 上传页面样式
    │   │   └── index.json         # 上传页面配置
    │   └── download/              # 下载页面
    │       ├── index.js           # 下载页面逻辑
    │       ├── index.wxml         # 下载页面结构
    │       ├── index.wxss         # 下载页面样式
    │       └── index.json         # 下载页面配置
    └── utils/                     # 工具模块
        ├── api.js                 # API接口封装
        ├── crypto.js              # 加密功能
        └── util.js                # 通用工具
```

## 功能特性

### 🔐 核心功能
- **端到端加密**: 图片在客户端加密后上传，服务器无法解密
- **双重验证模式**:
  - 密码验证：使用密码加密，接收方需输入相同密码
  - 位置验证：基于地理位置验证，需在指定半径范围内才能下载
- **安全传输**: 支持加密文件的安全上传和下载

### 📍 位置验证特性
- 可设置允许半径（50-500米）
- 自动获取当前位置
- 实时计算与目标位置的距离
- 位置精度检测和提示
- 支持模糊定位和精确定位

### 🔒 安全特性
- 基于密码的密钥派生
- AES加密算法支持
- HMAC完整性验证
- 加密参数分离存储
- 文件15分钟自动过期

## 技术实现

### 后端技术栈

#### 核心框架
- **Node.js** (>= 16.0.0) - JavaScript运行时
- **Express.js** (v4.19.2) - Web应用框架
- **PM2** - 生产环境进程管理

#### 主要依赖
- **Multer** (v1.4.5-lts.1) - 文件上传中间件
- **UUID** (v9.0.1) - 唯一标识符生成
- **CORS** (v2.8.5) - 跨域资源共享
- **Joi** (v18.0.2) - 数据验证
- **Node-Cache** (v5.1.2) - 内存缓存
- **Express-Rate-Limit** (v8.2.1) - 请求频率限制

#### API接口

1. **初始化上传** - `POST /upload/init`
   - 功能：初始化文件上传流程，获取上传URL和文件ID
   - 参数：验证类型、盐值、密码验证器、位置信息等

2. **上传文件** - `POST /upload/file/:fileId`
   - 功能：上传加密后的图片文件
   - 参数：加密文件二进制流

3. **完成上传** - `POST /upload/complete`
   - 功能：完成文件上传，生成下载ID
   - 参数：文件ID、加密参数、验证信息等

4. **下载文件** - `POST /download`
   - 功能：获取文件下载链接和解密参数
   - 参数：下载ID、位置信息（如需）

5. **获取文件** - `GET /file/:fileId`
   - 功能：下载加密文件内容
   - 参数：文件唯一标识符

### 前端技术栈

#### 微信小程序框架
- **原生小程序开发** - 使用微信小程序原生API
- **页面路由** - upload和download两个主要页面
- **组件系统** - 使用小程序内置组件

#### 核心功能模块

1. **加密模块** (`utils/crypto.js`)
   - 自定义XOR变换（学习演示用途，不安全）
   - 密钥派生函数
   - Base64编码解码
   - 随机数生成

2. **API模块** (`utils/api.js`)
   - HTTP请求封装
   - 错误处理和重试机制
   - 网络状态检测

3. **上传页面** (`pages/upload/`)
   - 图片选择和预览
   - 加密方式选择
   - 位置信息获取
   - 文件加密和上传

4. **下载页面** (`pages/download/`)
   - 下载ID验证
   - 位置验证
   - 文件下载和解密
   - 图片预览

## 安全机制

### ⚠️ 重要安全提示

**本项目使用的加密算法仅为学习演示目的，不适用于生产环境。**

#### 当前实现的安全限制
1. 使用简单的XOR变换，不是真正的加密
2. 密钥派生算法过于简单，容易被破解
3. 缺乏真正的随机数生成
4. 没有完整的完整性验证
5. 位置验证依赖客户端数据，可能被伪造

#### 生产环境安全建议
1. 使用Web Crypto API实现真正的AES加密
2. 实现标准的PBKDF2或Argon2密钥派生
3. 使用加密安全的随机数生成器
4. 添加完整的HMAC完整性验证
5. 考虑使用成熟的加密库如libsodium

### 验证机制详解

#### 密码验证流程
1. 客户端生成随机盐值
2. 使用简单的密钥派生函数生成密钥
3. 使用密钥对图片进行XOR变换
4. 上传加密数据和验证参数
5. 接收方使用相同密码和盐值解密

#### 位置验证流程
1. 上传方获取当前位置并设置允许半径
2. 使用固定密钥对图片进行加密
3. 上传加密数据和位置信息
4. 下载方获取当前位置
5. 服务器计算两点间距离，验证是否在允许范围内
6. 验证通过后提供下载链接

#### 距离计算算法
使用Haversine公式计算地球表面两点间距离：
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

## 部署指南

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0
- PM2 (生产环境)
- Nginx (可选，用于反向代理)

### 后端部署

1. **安装依赖**
```bash
cd 后端
npm install
```

2. **环境配置**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

3. **启动服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

4. **使用PM2部署**
```bash
# 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 前端部署

1. **配置API地址**
编辑 `前端/app.config.js` 文件：
```javascript
const isDev = false; // 设置为false使用生产环境

const config = {
  dev: {
    apiBase: "http://localhost:3000",
    enableDebug: true
  },
  prod: {
    apiBase: "http://你的服务器地址:3000",
    enableDebug: false
  }
};
```

2. **导入项目**
- 打开微信开发者工具
- 选择"导入项目"
- 选择项目目录（前端文件夹）
- 输入小程序AppID

3. **提交审核**
- 完善小程序信息和页面
- 提交微信审核
- 审核通过后发布

### Nginx配置

创建反向代理配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 运维管理

### 服务监控

使用提供的监控脚本：
```bash
# 添加到crontab，每5分钟执行一次
*/5 * * * * /path/to/monitor.sh
```

监控功能：
- 检查服务状态，异常时自动重启
- 清理过期文件（超过24小时）
- 监控磁盘使用率，超过80%时告警

### 日志管理

PM2日志配置：
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

1. **内存管理**
   - 最大内存限制：1GB
   - 自动重启机制

2. **文件清理**
   - 定期清理过期文件
   - 避免磁盘空间不足

3. **并发控制**
   - 请求频率限制
   - 连接超时设置

## 使用说明

### 📤 上传加密图片

1. **选择加密方式**
   - 点击"密码"使用密码加密
   - 点击"位置"使用位置验证

2. **设置验证参数**
   - 密码模式：输入6-20位密码
   - 位置模式：设置允许半径（50-500米）

3. **选择图片**
   - 点击"选择图片"按钮
   - 从相册或拍照选择图片
   - 支持最大10MB的图片文件

4. **加密上传**
   - 点击"加密并上传"按钮
   - 等待加密和上传完成
   - 复制生成的8位下载Token

### 📥 下载解密图片

1. **选择验证方式**
   - 选择与上传时相同的验证方式

2. **输入下载信息**
   - 输入8位下载Token
   - 密码模式：输入解密密码
   - 位置模式：自动获取当前位置

3. **下载解密**
   - 点击"下载并解密"按钮
   - 等待下载和解密完成
   - 点击"预览图片"查看解密结果

## 错误处理

### 常见错误码

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 认证失败 |
| 403 | Forbidden | 权限不足或文件过期 |
| 404 | Not Found | 文件不存在 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器内部错误 |

### 前端常见问题

**Q: 位置获取失败怎么办？**
A: 检查位置权限设置，确保GPS或网络定位可用，到开阔地带重试。

**Q: 上传失败如何处理？**
A: 检查网络连接，确认后端服务正常运行，查看控制台错误信息。

**Q: 下载Token无效？**
A: 确认Token输入正确（8位字符），检查文件是否已过期。

## 开发指南

### 添加新功能
1. 在相应页面的 `.js` 文件中添加逻辑
2. 在 `.wxml` 文件中添加UI组件
3. 在 `.wxss` 文件中添加样式
4. 更新 `app.json` 配置（如需要）

### 调试技巧
1. 开启 `app.config.js` 中的调试模式
2. 使用微信开发者工具的控制台查看日志
3. 利用网络面板检查API请求
4. 使用真机调试测试位置功能

### 安全加固建议
1. 替换自定义加密为标准加密算法
2. 实现真正的密钥派生函数
3. 添加服务器端验证和完整性检查
4. 使用HTTPS传输
5. 实现访问日志和异常监控

## 版本历史

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
- 🔄 真正的加密算法实现

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: 17554332506@163.com
- 🐛 Issues: [GitHub Issues](https://github.com/0zbq/Encrypted-Transmission)
- 📖 文档: [项目 Wiki](https://github.com/0zbq/Encrypted-Transmission/wiki)

---

⚠️ **重要提醒**：本项目仅用于学习和演示目的，请勿用于传输敏感信息。如需在生产环境中使用，请务必实现真正的加密算法和安全机制。