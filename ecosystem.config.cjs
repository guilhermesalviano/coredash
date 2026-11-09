module.exports = {
  apps: [
    {
      name: "coredash",
      script: "scripts/start-standalone.mjs",
      // The server runs a prebuilt bundle, so a file change cannot take effect
      // without `npm run build`. Watching only restarted the process and threw
      // away its in-memory caches. Deploy with: npm run build && pm2 restart coredash
      watch: false,
    },
  ],
};
