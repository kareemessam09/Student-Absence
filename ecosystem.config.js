module.exports = {
  apps: [
    {
      name: 'student-absence-api',
      script: 'src/app.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode for load balancing
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // Error handling
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Memory management
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Environment-specific settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Advanced features
      time: true,
      source_map_support: false,
      
      // Monitoring
      instance_var: 'INSTANCE_ID',
    },
  ],
};
