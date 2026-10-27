module.exports = {
  apps: [
    {
      name: 'notes-backend',
      script: 'src/server.js',
      cwd: 'D:\\PROJECT\\notes\\notes-backend',
      node_args: '--env-file=.env',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },
    {
      name: 'notes-frontend',
      script: 'serve',
      args: '-s dist -l 5173',
      cwd: 'D:\\PROJECT\\notes\\notes-frontend',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true
    }
  ]
};
