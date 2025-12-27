function getBase() {
  const app = getApp && getApp()
  return (app && app.globalData && app.globalData.apiBase) || ''
}

function ensureBase() {
  const base = getBase()
  if (!base || base.includes('example.com')) {
    throw new Error('请先在 app.js 填写后端 apiBase')
  }
}

function request(url, method, data, retryCount = 0) {
  ensureBase()
  const fullUrl = `${getBase()}${url}`
  
  return new Promise((resolve, reject) => {
    const maxRetries = 2
    const timeout = 10000
    
    const doRequest = () => {
      wx.request({
        url: fullUrl,
        method,
        data,
        header: { 'content-type': 'application/json' },
        timeout,
        success: res => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            const errorMsg = res.data?.message || `服务器错误 (${res.statusCode})`
            reject(new Error(errorMsg))
          }
        },
        fail: err => {
          console.warn(`请求失败: ${fullUrl}`, err)
          
          // 连接拒绝错误，尝试重试
          if (err.errMsg && err.errMsg.includes('CONNECTION_REFUSED') && retryCount < maxRetries) {
            console.log(`连接失败，第${retryCount + 1}次重试...`)
            setTimeout(() => {
              request(url, method, data, retryCount + 1).then(resolve).catch(reject)
            }, 1000 * (retryCount + 1))
            return
          }
          
          let errorMsg = '网络连接失败'
          if (err.errMsg) {
            if (err.errMsg.includes('timeout')) {
              errorMsg = '请求超时，请检查网络连接'
            } else if (err.errMsg.includes('CONNECTION_REFUSED')) {
              errorMsg = '无法连接到服务器，请确保后端服务已启动'
            } else {
              errorMsg = `网络错误: ${err.errMsg}`
            }
          }
          reject(new Error(errorMsg))
        },
      })
    }
    
    doRequest()
  })
}

export function initUpload(meta) {
  return request('/upload/init', 'POST', meta)
}

export function completeUpload(data) {
  return request('/upload/complete', 'POST', data)
}

export function downloadFileMeta(data) {
  return request('/download', 'POST', { downloadId: data.token, location: data.location })
}

