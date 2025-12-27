import {
  base64Decode,
  decryptBuffer,
  deriveKeyFromPassword,
  importAesKey,
} from '../../utils/crypto'
import { downloadFileMeta } from '../../utils/api'

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
    passwordDownload: '',
    downloading: false,
    status: '',
    downloadToken: '',
    decryptedPath: '',
    verifyType: '',
    downloadProgress: '准备下载...',
    canDownload: false,
    currentLocation: null,
    locationAccuracy: null,
    targetLocation: null,
    distance: null,
  },

  setMode(e) {
    const mode = e.currentTarget.dataset.mode
    // 清除之前的选择和数据
    this.setData({ 
      mode, 
      passwordDownload: '',
      downloadToken: '',
      decryptedPath: '',
      status: '',
      verifyType: ''
    })
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value }, () => {
      this.checkCanDownload()
    })
  },

  checkCanDownload() {
    const { mode, downloadToken, passwordDownload, verifyType } = this.data
    let canDownload = false
    
    if (downloadToken && downloadToken.length === 8) {
      if (mode === 'password' || verifyType === 'password') {
        canDownload = passwordDownload.length > 0
      } else if (mode === 'location' || verifyType === 'location') {
        canDownload = true
      }
    }
    
    this.setData({ canDownload })
  },

  

  

  async downloadAndDecrypt() {
    const downloadId = (this.data.downloadToken || '').trim()
    if (!downloadId) {
      wx.showToast({ title: '请输入下载 ID', icon: 'none' })
      return
    }
    if (downloadId.length !== 8) {
      wx.showToast({ title: '下载 ID 应为 8 位', icon: 'none' })
      return
    }

    this.setData({ 
      downloading: true, 
      downloadProgress: '🔍 验证下载ID...',
      status: '正在验证下载ID...'
    })

    try {
      // 获取位置信息（如果需要）
      let location = null
      if (this.data.mode === 'location') {
        this.setData({ downloadProgress: '📍 获取位置信息...', status: '正在获取位置信息...' })
        location = await this.fetchLocation()
      }

      // 获取文件元数据
      this.setData({ downloadProgress: '📥 获取文件信息...', status: '正在获取文件信息...' })
      const meta = await downloadFileMeta({ token: downloadId, location })

      const verifyType = meta.verifyType || this.data.mode
      if (!this.data.mode) {
        this.setData({ mode: verifyType })
        this.checkCanDownload()
      }

      // 如果是位置验证，计算并显示距离
      if (verifyType === 'location' && location && meta.location) {
        const distance = this.calculateDistance(location, meta.location)
        this.setData({
          targetLocation: meta.location,
          distance: distance
        })
        
        // 显示距离信息
        if (distance <= (meta.radius || 100)) {
          this.setData({ status: `✅ 位置验证通过！距离目标 ${Math.round(distance)}米` })
        } else {
          const radius = meta.radius || 100
          this.setData({ status: `⚠️ 距离目标 ${Math.round(distance)}米，超出允许范围 ${radius}米` })
        }
      }

      // 下载加密文件
      this.setData({ downloadProgress: '⬇️ 下载文件中...', status: '正在下载加密文件...' })
      const cipher = await this.fetchArrayBuffer(meta.cipherUrl)
      
      // 解析加密参数
      this.setData({ downloadProgress: '🔑 解析加密参数...', status: '正在解析加密参数...' })
      const nonce = base64Decode(meta.nonceBase64 || meta.nonce)
      let keyObj

      // 根据验证类型获取密钥
      if (verifyType === 'password') {
        if (!this.data.passwordDownload) {
          throw new Error('请输入解密密码')
        }
        this.setData({ downloadProgress: '🔐 生成解密密钥...', status: '正在生成解密密钥...' })
        const salt = base64Decode(meta.pbkdf2Salt)
        keyObj = await deriveKeyFromPassword(this.data.passwordDownload, salt)
      } else if (verifyType === 'location') {
        this.setData({ downloadProgress: '📍 生成位置密钥...', status: '正在生成位置密钥...' })
        const raw = this.getLocationKeyBytes()
        keyObj = await importAesKey(raw)
      } else {
        throw new Error('不支持的验证类型')
      }

      // 解密文件
      this.setData({ downloadProgress: '🔓 解密文件中...', status: '正在解密文件...' })
      const plain = await decryptBuffer(cipher, keyObj, nonce, meta.hmacBase64)
      
      // 确保解密结果是正确的数据类型
      let plainData
      if (plain instanceof Uint8Array) {
        plainData = plain
      } else if (plain instanceof ArrayBuffer) {
        plainData = new Uint8Array(plain)
      } else {
        // 如果是其他类型，尝试转换
        plainData = new Uint8Array(plain)
      }
      
      // 保存解密文件
      this.setData({ downloadProgress: '💾 保存文件...', status: '正在保存解密文件...' })
      const plainPath = await this.writeTempFile(plainData, 'plain.jpg')
      
      // 完成解密
      this.setData({
        decryptedPath: plainPath,
        status: '🎉 解密成功！',
        verifyType,
        downloadProgress: '✅ 解密完成'
      })
      
      wx.showToast({ 
        title: '解密成功！', 
        icon: 'success',
        duration: 2000
      })
      
    } catch (err) {
      console.error('解密失败:', err)
      
      let errorMsg = '解密失败'
      if (err.message) {
        if (err.message.includes('网络') || err.message.includes('连接')) {
          errorMsg = '网络连接失败，请检查网络状态'
        } else if (err.message.includes('位置')) {
          errorMsg = '位置获取失败，请检查位置权限'
        } else if (err.message.includes('密码') || err.message.includes('密钥')) {
          errorMsg = '密码或密钥错误，请检查输入'
        } else if (err.message.includes('not found') || err.message.includes('expired')) {
          errorMsg = '文件不存在或已过期'
        } else {
          errorMsg = err.message
        }
      }
      
      wx.showToast({ 
        title: errorMsg, 
        icon: 'none',
        duration: 3000
      })
      
      this.setData({ 
        status: `❌ ${errorMsg}`,
        downloadProgress: '❌ 解密失败'
      })
    } finally {
      this.setData({ downloading: false })
    }
  },

  getLocationKeyBytes() {
    const s = 'location-fixed-shared-key-32'
    const src = encodeUtf8(s)
    const out = new Uint8Array(32)
    out.set(src.slice(0, 32))
    return out
  },

  calculateDistance(a, b) {
    if (!a || !b) return Infinity
    const rad = Math.PI / 180
    const dLat = (b.latitude - a.latitude) * rad
    const dLon = (b.longitude - a.longitude) * rad
    const lat1 = a.latitude * rad
    const lat2 = b.latitude * rad
    const sa = Math.sin(dLat / 2)
    const sb = Math.sin(dLon / 2)
    const c = 2 * Math.asin(Math.sqrt(sa * sa + Math.cos(lat1) * Math.cos(lat2) * sb * sb))
    return 6371000 * c // 返回距离（米）
  },

  previewDecrypted() {
    if (!this.data.decryptedPath) return
    wx.previewImage({ urls: [this.data.decryptedPath] })
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

  fetchArrayBuffer(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        success: res => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
          else reject(new Error('下载失败'))
        },
        fail: reject,
      })
    })
  },
})

