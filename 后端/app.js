/**
 * 简易示例后端：提供上传/完成/下载接口与本地文件存储
 * 启动：npm install express multer uuid
 *      node server/app.js
 */
const path = require('path')
const fs = require('fs')
const express = require('express')
const multer = require('multer')
const crypto = require('crypto')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = process.env.PORT || 3000
const SECRET = process.env.TOKEN_SECRET || 'replace-with-strong-secret'
const storageDir = path.join(__dirname, 'storage')
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })

// CORS 允许来自小程序的请求
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://servicewechat.com']

// 添加开发环境支持
if (process.env.NODE_ENV !== 'production') {
  // 微信开发者工具常用端口
  corsOrigins.push('http://localhost:61946')
  corsOriginsId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // 确保ID唯一
  if (Array.from(files.values()).some(item => item.downloadId === result)) {
    return generateShortId()
  }
  return result
}

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verifyToken(token) {
  const [data, sig] = token.split('.')
  if (!data || !sig) throw new Error('bad token')
  const expect = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  if (expect !== sig) throw new Error('bad signature')
  const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
  if (payload.exp && Date.now() > payload.exp) throw new Error('expired')
  return payload
}

app.post('/upload/init.push('http://127.0.0.1:61946')
  corsOrigins.push('http://localhost:5173') // Vite开发服务器
  corsOrigins.push('http://127.0.0.1:5173')
  corsOrigins.push('http://localhost:8080')
  corsOrigins.push('http://127.0.0.1:8080')
  corsOrigins.push('http://localhost:19006') // Expo开发服务器
  corsOrigins.push('http://127.0.0.1:19006')
  // 允许所有本地开发地址（开发环境）
  corsOrigins.push('http://localhost:*')
  corsOrigins.push('http://127.0.0.1:*')
}

console.log('CORS允许的源:', corsOrigins)

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
// JSON 解析
app.use(express.json())
// 静态访问存储目录（调试用，可按需注释）
app.use('/storage', express.static(storageDir))

const upload = multer({ dest: storageDir })

// 简单内存数据库
const files = new Map()

// 生成简短ID (8位随机字符)
function generateShort', (req, res) => {
  const { verifyType, pbkdf2Salt, passwordVerifier, radius, location } = req.body || {}
  const fileId = uuidv4()
  files.set(fileId, { verifyType, pbkdf2Salt, passwordVerifier, radius, location, nonceBase64: '' })
  const uploadUrl = `${req.protocol}://${req.get('host')}/upload/file/${fileId}`
  res.json({ uploadUrl, fileId })
})

app.post('/upload/file/:fileId', upload.single('file'), (req, res) => {
  const { fileId } = req.params
  if (!files.has(fileId)) return res.status(404).json({ message: 'fileId not found' })
  files.get(fileId).filepath = req.file.path
  res.json({ ok: true })
})

app.post('/upload/complete', (req, res) => {
  const { fileId, verifyType, nonceBase64, pbkdf2Salt, passwordVerifier, radius, location, hmacBase64 } = req.body || {}
  const item = files.get(fileId)
  if (!item || !item.filepath) return res.status(400).json({ message: 'file not uploaded' })
  
  // 生成简短的下载ID（8位随机字符）
  const downloadId = generateShortId()
  
  Object.assign(item, { 
    verifyType, 
    nonceBase64, 
    pbkdf2Salt, 
    passwordVerifier, 
    radius, 
    location, 
    hmacBase64,
    downloadId,
    exp: Date.now() + 15 * 60 * 1000 // 15分钟过期
  })
  
  res.json({ downloadId })
})

app.post('/download', (req, res) => {
  try {
    const { downloadId, location } = req.body || {}
    if (!downloadId) return res.status(400).json({ message: 'need downloadId' })
    
    // 通过downloadId查找文件
    const item = Array.from(files.entries()).find(([fileId, data]) => data.downloadId === downloadId)
    if (!item) return res.status(404).json({ message: 'not found' })
    
    const [fileId, fileData] = item
    
    // 检查是否过期
    if (fileData.exp && Date.now() > fileData.exp) {
      return res.status(403).json({ message: 'expired' })
    }

    if (fileData.verifyType === 'location') {
      if (!location) return res.status(400).json({ message: 'need location' })
      const ok = distance(location, fileData.location) <= (fileData.radius || 0)
      if (!ok) return res.status(403).json({ message: '位置不匹配' })
    }

    const cipherUrl = `${req.protocol}://${req.get('host')}/file/${fileId}`
    res.json({
      cipherUrl,
      nonceBase64: fileData.nonceBase64,
      pbkdf2Salt: fileData.pbkdf2Salt,
      verifyType: fileData.verifyType,
      hmacBase64: fileData.hmacBase64,
    })
  } catch (e) {
    res.status(401).json({ message: e.message || 'invalid downloadId' })
  }
})

app.get('/file/:fileId', (req, res) => {
  const item = files.get(req.params.fileId)
  if (!item || !item.filepath) return res.status(404).end()
  res.setHeader('Content-Type', 'application/octet-stream')
  fs.createReadStream(item.filepath).pipe(res)
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ message: '服务器内部错误' })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log('API endpoints:')
  console.log('  POST /upload/init - 初始化上传')
  console.log('  POST /upload/file/:fileId - 上传文件')
  console.log('  POST /upload/complete - 完成上传')
  console.log('  POST /download - 下载文件')
  console.log('  GET /file/:fileId - 获取文件')
})

function distance(a, b) {
  if (!a || !b) return Infinity
  const rad = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * rad
  const dLon = (b.longitude - a.longitude) * rad
  const lat1 = a.latitude * rad
  const lat2 = b.latitude * rad
  const sa = Math.sin(dLat / 2)
  const sb = Math.sin(dLon / 2)
  const c = 2 * Math.asin(Math.sqrt(sa * sa + Math.cos(lat1) * Math.cos(lat2) * sb * sb))
  return 6371000 * c
}

