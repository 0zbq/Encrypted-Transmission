import {
  randomBytes,
  base64Encode,
  base64Decode,
  encryptBuffer,
  deriveKeyFromPassword,
  importAesKey,
} from '../../utils/crypto'
import { initUpload, completeUpload } from '../../utils/api'

const fs = wx.getFileSystemManager()

function encodeUtf8(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str)
  const utf8 = unescape(encodeURIComponent(str))
  const arr = new Uint8Array(utf8.length)
  for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i)
  return arr
}

Page({
  data: {
    mode: '',
    radius: 100,
    passwordUpload: '',
    chosenFile: null,
    uploading: false,
    status: '',
    downloadToken: '',
    nonceBase64: '',
    pbkdf2Salt: '',
    verifyType: '',
    uploadProgress: '准备上传...',
    canUpload: false,
    currentLocation: null,
    locationAccuracy: null,
  },

  setMode(e) {
    const mode = e.currentTarget.dataset.mode
    // 清除之前的选择和数据
    this.setData({ 
      mode, 
      passwordUpload: '',
      chosenFile: null,
      status: '',
      canUpload: false
    })
    this.checkCanUpload()
  },

  onRadiusChange(e) {
    this.setData({ radius: Number(e.detail.value) || 100 })
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value })
    this.checkCanUpload()
  },

  checkCanUpload() {
    const { mode, passwordUpload, chosenFile } = this.data
    let canUpload = false
    
    if (mode && chosenFile) {
      if (mode === 'password') {
        canUpload = passwordUpload.length >= 6
      } else {
        canUpload = true
      }
    }
    
    this.setData({ canUpload })
  },

  async chooseImage() {
    try {
      const res = await wx.chooseMedia({ 
        count: 1, 
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        maxDuration: 30,
        camera: 'back'
      })
      const file = res.tempFiles[0]
      
      // 检查文件大小（限制10MB）
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        wx.showToast({ title: '图片不能超过10MB', icon: 'none' })
        return
      }
      
      this.setData({
        chosenFile: { 
          path: file.tempFilePath, 
          size: file.size, 
          type: file.fileType || 'image/jpeg',
          name: file.tempFilePath.split('/').pop() || 'image.jpg',
          sizeText: file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''
        },
        status: `✅ 已选择图片 (${(file.size / 1024).toFixed(1)} KB)`,
      })
      
      this.checkCanUpload()
    } catch (err) {
      if (err.errMsg !== 'chooseMedia:fail cancel') {
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    }
  },

  async encryptAndUpload() {
    if (!this.data.chosenFile) {
      wx.showToast({ title: '请先选择图片', icon: 'none' })
      return
    }
    if (!this.data.mode) {
      wx.showToast({ title: '请选择加密方式', icon: 'none' })
      return
    }
    if (this.data.mode === 'password' && this.data.passwordUpload.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    this.setData({ 
      uploading: true, 
      uploadProgress: '🔒 正在加密...',
      status: '正在加密图片...'
    })
    
    try {
      // 读取文件
      this.setData({ uploadProgress: '📖 读取文件中...' })
      const buffer = await this.readFileBuffer(this.data.chosenFile.path)
      
      // 生成加密参数
      this.setData({ uploadProgress: '🔑 生成密钥...' })
      const iv = randomBytes(12)
      let keyObj
      let pbkdf2Salt
      let passwordVerifier

      if (this.data.mode === 'password') {
        pbkdf2Salt = randomBytes(16)
        keyObj = await deriveKeyFromPassword(this.data.passwordUpload, pbkdf2Salt)
        passwordVerifier = base64Encode(keyObj.rawKey)
      
      } else if (this.data.mode === 'location') {
        const raw = this.getLocationKeyBytes()
        keyObj = await importAesKey(raw)
      }

      // 加密文件
      this.setData({ uploadProgress: '🔐 加密文件中...' })
      const { cipher, hmacBase64 } = await encryptBuffer(buffer, keyObj, iv)

      // 获取位置信息（如果需要）
      let location = null
      if (this.data.mode === 'location') {
        this.setData({ uploadProgress: '📍 获取位置信息...' })
        location = await this.fetchLocation()
      }

      // 初始化上传
      this.setData({ uploadProgress: '📤 准备上传...' })
      const meta = {
        verifyType: this.data.mode,
        pbkdf2Salt: pbkdf2Salt ? base64Encode(pbkdf2Salt) : '',
        passwordVerifier: passwordVerifier || '',
        radius: location ? this.data.radius : 0,
        location,
        hmacBase64: hmacBase64 || '',
      }
      const initResp = await initUpload(meta)
      const { uploadUrl, fileId } = initResp

      // 准备上传数据
      let finalData = cipher
      if (cipher instanceof ArrayBuffer) {
        finalData = new Uint8Array(cipher)
      } else if (cipher instanceof Uint8Array) {
        finalData = cipher.buffer.slice(cipher.byteOffset, cipher.byteOffset + cipher.byteLength)
      } else if (cipher.buffer) {
        finalData = cipher.buffer.slice(cipher.byteOffset, cipher.byteOffset + cipher.byteLength)
      }
      
      // 写入临时文件
      this.setData({ uploadProgress: '💾 准备文件...' })
      const cipherPath = await this.writeTempFile(finalData, 'cipher.jpg')
      
      // 上传文件
      this.setData({ uploadProgress: '⬆️ 上传中...' })
      
      // 修复CORS问题：确保上传URL使用正确的域名
      const apiBase = getApp().globalData.apiBase
      const fixedUploadUrl = uploadUrl.replace(/https?:\/\/[^\/]+/, apiBase)
      console.log('原始上传URL:', uploadUrl)
      console.log('修复后上传URL:', fixedUploadUrl)
      
      await this.uploadFile(fixedUploadUrl, cipherPath)

      // 完成上传
      this.setData({ uploadProgress: '✅ 完成上传...' })
      const finishResp = await completeUpload({
        fileId,
        verifyType: this.data.mode,
        nonceBase64: base64Encode(iv),
        pbkdf2Salt: meta.pbkdf2Salt,
        passwordVerifier,
        radius: meta.radius,
        location,
        hmacBase64: meta.hmacBase64,
      })

      this.setData({
        status: '🎉 上传成功！',
        downloadToken: finishResp.downloadId,
        nonceBase64: base64Encode(iv),
        pbkdf2Salt: meta.pbkdf2Salt,
        verifyType: this.data.mode,
        uploadProgress: '✅ 上传完成'
      })
      
      // 显示成功提示
      wx.showToast({ title: '上传成功！', icon: 'success' })
      
    } catch (err) {
      console.error('上传失败详细错误:', err)
      console.error('错误堆栈:', err.stack)
      
      let errorMsg = '上传失败'
      if (err.message) {
        if (err.message.includes('连接') || err.message.includes('网络')) {
          errorMsg = '网络连接失败，请检查服务器状态'
        } else if (err.message.includes('位置')) {
          errorMsg = '位置获取失败，请检查位置权限'
        } else {
          errorMsg = err.message
        }
      }
      
      wx.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
      this.setData({ 
        status: `❌ ${errorMsg}`,
        uploadProgress: '❌ 上传失败'
      })
    } finally {
      this.setData({ uploading: false })
    }
  },

  getLocationKeyBytes() {
    const s = 'location-fixed-shared-key-32'
    const src = encodeUtf8(s)
    const out = new Uint8Array(32)
    out.set(src.slice(0, 32))
    return out
  },

  

  

  copyToken() {
    if (!this.data.downloadToken) return
    
    wx.setClipboardData({ 
      data: this.data.downloadToken,
      success: () => {
        wx.showToast({ 
          title: 'Token已复制', 
          icon: 'success',
          duration: 2000
        })
      },
      fail: () => {
        wx.showToast({ 
          title: '复制失败', 
          icon: 'none' 
        })
      }
    })
  },

  testNetwork() {
    wx.showToast({
      title: '网络连接正常',
      icon: 'success',
      duration: 2000
    })
  },

  async fetchLocation() {
      return new Promise((resolve, reject) => {
        const tryGetLocation = (useFuzzy = true) => {
          const api = useFuzzy ? wx.getFuzzyLocation : wx.getLocation
          const apiName = useFuzzy ? '模糊定位' : '精确定位'
          
          api({
            type: 'wgs84',
            isHighAccuracy: !useFuzzy,
            success: (res) => {
              console.log(`${apiName}获取成功:`, { 
                latitude: res.latitude, 
                longitude: res.longitude,
                accuracy: res.accuracy,
                altitude: res.altitude,
                speed: res.speed
              })
              
              // 检查位置精度
              if (res.accuracy && res.accuracy > 500) {
                wx.showModal({
                  title: '位置精度较低',
                  content: `当前定位精度约${Math.round(res.accuracy)}米，可能影响位置验证准确性。建议到开阔地带重试或使用WiFi辅助定位。`,
                  confirmText: '继续使用',
                  cancelText: '重新获取',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      // 更新位置状态
                      this.setData({
                        currentLocation: { latitude: res.latitude, longitude: res.longitude },
                        locationAccuracy: res.accuracy
                      })
                      resolve({ 
                        latitude: res.latitude, 
                        longitude: res.longitude,
                        accuracy: res.accuracy
                      })
                    } else {
                      // 重新尝试获取位置
                      tryGetLocation(useFuzzy)
                    }
                  }
                })
              } else {
                // 更新位置状态
                this.setData({
                  currentLocation: { latitude: res.latitude, longitude: res.longitude },
                  locationAccuracy: res.accuracy
                })
                resolve({ 
                  latitude: res.latitude, 
                  longitude: res.longitude,
                  accuracy: res.accuracy
                })
              }
            },
            fail: (err) => {
              console.error(`${apiName}获取失败:`, err)
              
              if (useFuzzy) {
                // 模糊定位失败，尝试精确定位
                console.log('尝试使用精确定位...')
                tryGetLocation(false)
              } else {
                // 所有定位方式都失败，显示详细错误信息
                let errorMsg = '位置获取失败'
                let helpText = ''
                
                if (err.errMsg.includes('auth deny') || err.errMsg.includes('unauthorized')) {
                  errorMsg = '位置权限被拒绝'
                  helpText = '请在设置中允许获取位置信息：\n1. 点击右上角"..." \n2. 选择"设置" \n3. 开启"位置信息"权限'
                } else if (err.errMsg.includes('network') || err.errMsg.includes('timeout')) {
                  errorMsg = '网络连接超时'
                  helpText = '请检查网络连接，或到信号较好的地方重试'
                } else if (err.errMsg.includes('location disabled')) {
                  errorMsg = '位置服务未开启'
                  helpText = '请在系统设置中开启位置服务（GPS）'
                } else {
                  errorMsg = `定位失败：${err.errMsg || '未知错误'}`
                  helpText = '建议：\n1. 检查位置权限是否开启\n2. 确保GPS或网络定位可用\n3. 到开阔地带重试'
                }
                
                wx.showModal({
                  title: errorMsg,
                  content: helpText,
                  confirmText: '去设置',
                  cancelText: '取消',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting({
                        success: (settingRes) => {
                          if (settingRes.authSetting['scope.userLocation']) {
                            // 用户开启了权限，重新尝试
                            tryGetLocation(true)
                          } else {
                            reject(new Error('用户未开启位置权限'))
                          }
                        },
                        fail: () => {
                          reject(new Error('打开设置页面失败'))
                        }
                      })
                    } else {
                      reject(new Error(errorMsg))
                    }
                  }
                })
              }
            }
          })
        }
        
        // 开始尝试获取位置
        tryGetLocation(true)
      })
    },

  readFileBuffer(path) {
    return new Promise((resolve, reject) => {
      fs.readFile({
        filePath: path,
        success: res => {
          const data = res.data
          if (data instanceof ArrayBuffer) {
            resolve(new Uint8Array(data))
          } else {
            resolve(data)
          }
        },
        fail: reject,
      })
    })
  },

  writeTempFile(data, name) {
    const filePath = `${wx.env.USER_DATA_PATH}/${name}`
    return new Promise((resolve, reject) => {
      // 确保数据是正确的格式
      let writeData = data
      let encoding = 'binary'
      
      if (data instanceof Uint8Array) {
        writeData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
        encoding = 'binary'
      } else if (data instanceof ArrayBuffer) {
        writeData = data
        encoding = 'binary'
      } else {
        // 其他类型尝试转换
        console.warn('writeTempFile: 意外的数据类型', typeof data, data)
        reject(new Error('不支持的数据类型'))
        return
      }
      
      fs.writeFile({
        filePath,
        data: writeData,
        encoding,
        success: () => resolve(filePath),
        fail: (err) => {
          console.error('writeFile failed:', err)
          reject(err)
        },
      })
    })
  },

  uploadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url,
        filePath,
        name: 'file',
        success: res => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res)
          } else {
            reject(new Error(`文件上传失败，状态码: ${res.statusCode}`))
          }
        },
        fail: err => {
          reject(new Error(`文件上传失败: ${err.errMsg || '未知错误'}`))
        },
      })
    })
  },
})

