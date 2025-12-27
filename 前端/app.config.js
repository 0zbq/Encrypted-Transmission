// 小程序配置文件
// 根据环境自动切换API地址

const isDev = false; // 设置为false使用生产环境地址

const config = {
  // 开发环境配置
  dev: {
    apiBase: "http://localhost:3000",
    enableDebug: true
  },
  
  // 生产环境配置
  prod: {
    apiBase: "http://47.104.161.201:3000", // 部署服务器地址
    enableDebug: false
  }
};

// 导出当前环境配置
module.exports = isDev ? config.dev : config.prod;