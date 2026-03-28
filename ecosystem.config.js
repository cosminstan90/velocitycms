module.exports = {
  apps: [{
    name: 'velocitycms',
    script: 'node_modules/.bin/next',
    args: 'start -p 3002',
    cwd: '/home/velocitycms/htdocs/app',
    instances: 1,          // single instance — saves RAM, no cluster needed for low traffic
    exec_mode: 'fork',     // fork, not cluster — avoids shared memory issues
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
    },
    max_memory_restart: '600M',
    error_file: '/home/velocitycms/logs/error.log',
    out_file: '/home/velocitycms/logs/out.log',
    time: true,
    kill_timeout: 5000,
    autorestart: true,
    watch: false,
  }]
};
