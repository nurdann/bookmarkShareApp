module.exports = {
  apps : [
      {
        name: "bookmarkshare",
        script: "./server.js",
        watch: true,
        env: {
          "NODE_ENV": "production",
          "API_PORT": 8080
        }
      }
  ]
}