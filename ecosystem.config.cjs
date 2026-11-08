module.exports = {
  apps: [
    {
      name: "coredash",
      script: "scripts/start-standalone.mjs",
      watch: true,
      ignore_watch: [
        "node_modules",
        ".next",
        ".git",
        "android",
        "database.db",
        "database.db-journal",
        "database.db-wal",
        "database.db-shm",
        "*.log",
      ],
      watch_options: {
        followSymlinks: false,
      },
    },
  ],
};
