const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 5173,
    open: true,
    open: {
      app: {
        name: 'chrome',
      }
    },
    proxy: {
      // 用户相关接口
      '/user': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/user': '/user' },
        logLevel: 'debug'
      },
      // 图书相关接口
      '/book': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/book': '/book' },
        logLevel: 'debug'
      },
      // 借阅相关接口
      '/borrow': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/borrow': '/borrow' },
        logLevel: 'debug'
      }
    }
  }
})