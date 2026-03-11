module.exports = {
  apps: [
    {
      name: "mca_sheriff_backend",
      script: "dist/app.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "staging",
      },
    },
  ],
};
