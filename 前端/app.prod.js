// 生产环境配置
// 在微信开发者工具中切换到生产环境时使用

App({
  globalData: {
    // 生产环境API地址 - 替换为你的实际域名
    apiBase: "https://your-domain.com",
  },

  onLaunch() {
    console.log('应用启动 - 生产环境')
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