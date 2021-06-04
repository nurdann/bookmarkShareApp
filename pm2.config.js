module.exports = {
  apps : [
      {
        name: "BookmarkShareApp",
        script: "./server.js",
        watch: true,
        env: {
          "NODE_ENV": "production",
          "API_PORT": 8080
        }
      }
  ]
}