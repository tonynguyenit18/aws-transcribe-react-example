const { createProxyMiddleware } = require("http-proxy-middleware")

const target = "http://[::1]:5000/"

module.exports = app => {
  app.use(
    "/aws",
    createProxyMiddleware({
      target,
      changeOrigin: true
    })
  )
}
