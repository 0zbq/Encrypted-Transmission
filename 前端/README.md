# 加密图片传输微信小程序

一个支持端到端加密的安全图片传输微信小程序，提供两种验证模式：密码验证和地理位置验证。

## 功能特性

### 🔐 核心功能
- **端到端加密**：图片在客户端加密后上传，服务器无法解密
- **双重验证模式**：
  - 密码验证：使用密码加密，接收方需输入相同密码
  - 位置验证：基于地理位置验证，需在指定半径范围内才能下载
- **安全传输**：支持加密文件的安全上传和下载

### 📍 位置验证特性
- 可设置允许半径（50-500米）
- 自动获取当前位置
- 实时计算与目标位置的距离
- 位置精度检测和提示
- 支持模糊定位和精确定位

### 🔒 安全特性
- 基于密码的密钥派生（PBKDF2）
- AES加密算法
- HMAC完整性验证
- 加密参数分离存储

## 项目结构

```
前端/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序配置
├── app.wxss              # 全局样式
├── app.config.js         # 环境配置（开发/生产）
├── project.config.json   # 项目配置
├── sitemap.json          # 站点地图
├── pages/                # 页面目录
│   ├── upload/           # 上传页面
│   │   ├── index.js
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.json
│   └── download/         # 下载页面
│       ├── index.js
│       ├── index.wxml
│       ├── index.wxss
│       └── index.json
└── utils/                # 工具模块
    ├── api.js            # API接口
    ├── crypto.js         # 加密功能
    └── util.js           # 通用工具
```

## 技术栈

- **前端框架**：微信小程序原生开发
- **加密算法**：自定义XOR加密（仅用于学习演示，**不安全**）
- **位置服务**：微信小程序位置API
- **网络请求**：微信小程序wx.request

## 快速开始

### 环境要求
- 微信开发者工具
- Node.js（用于后端服务）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone [项目地址]
   cd 微信小项目/前端
   ```

2. **配置API地址**
   编辑 `app.config.js` 文件：
   ```javascript
   const isDev = false; // 设置为true使用开发环境
   
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

3. **导入项目**
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择项目目录（前端文件夹）
   - 输入小程序AppID（已在project.config.json中配置）

4. **启动后端服务**
   ```bash
   # 进入后端目录
   cd ../后端
   npm install
   npm start
   ```

5. **运行小程序**
   - 在微信开发者工具中点击"编译"
   - 小程序将自动在模拟器中运行

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

## API接口

### 初始化上传
```
POST /upload/init
Content-Type: application/json

{
  "verifyType": "password|location",
  "pbkdf2Salt": "base64编码的盐值",
  "passwordVerifier": "base64编码的密码验证器",
  "radius": 100,
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074,
    "accuracy": 10
  },
  "hmacBase64": "base64编码的HMAC"
}
```

### 完成上传
```
POST /upload/complete
Content-Type: application/json

{
  "fileId": "文件ID",
  "verifyType": "password|location",
  "nonceBase64": "base64编码的随机数",
  "pbkdf2Salt": "base64编码的盐值",
  "passwordVerifier": "密码验证器",
  "radius": 100,
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "hmacBase64": "HMAC值"
}
```

### 下载文件元数据
```
POST /download
Content-Type: application/json

{
  "downloadId": "8位下载ID",
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074,
    "accuracy": 10
  }
}
```

## 安全说明

⚠️ **重要提示**：本项目使用的加密算法仅为学习演示目的，**不适用于生产环境**。

### 当前实现的限制
1. 使用简单的XOR变换，不是真正的加密
2. 密钥派生算法过于简单
3. 缺乏真正的随机数生成
4. 没有完整性验证

### 生产环境建议
1. 使用Web Crypto API实现真正的AES加密
2. 实现标准的PBKDF2密钥派生
3. 使用加密安全的随机数生成器
4. 添加HMAC完整性验证
5. 考虑使用成熟的加密库

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

### 常见问题

**Q: 位置获取失败怎么办？**
A: 检查位置权限设置，确保GPS或网络定位可用，到开阔地带重试。

**Q: 上传失败如何处理？**
A: 检查网络连接，确认后端服务正常运行，查看控制台错误信息。

**Q: 下载Token无效？**
A: 确认Token输入正确（8位字符），检查文件是否已过期。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情。

---

**注意**：本项目仅用于学习和演示目的，请勿用于传输敏感信息。