// app.js
const config = require('./app.config.js');

App({
  globalData: {
    apiBase: config.apiBase,
    enableDebug: config.enableDebug
  },

  onLaunch() {
    console.log('应用启动')
    console.log('当前环境:', this.globalData.enableDebug ? '开发环境' : '生产环境')
    console.log('API地址:', this.globalData.apiBase)
    this.checkNetworkStatus()
  },

  onShow() {
    this.checkNetworkStatus()
  },

  onError(err) {
    console.error('应用错误:', err)
    this.showGlobalError('应用出现错误，请重试')
  },

  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType)
        if (res.networkType === 'none') {
          this.showGlobalError('网络连接不可用，请检查网络设置')
        }
      },
      fail: () => {
        console.warn('获取网络状态失败')
      }
    })
  },

  showGlobalError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  },

  showGlobalSuccess(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    })
  },

  showGlobalLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  hideGlobalLoading() {
    wx.hideLoading()
  }
})
