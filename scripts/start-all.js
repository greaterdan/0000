#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AIM Currency Server Infrastructure...');

// List of services to start (in dependency order)
const services = [
  { name: 'gateway', port: 3000, dir: 'gateway' },
  { name: 'ledgerd', port: 3001, dir: 'ledgerd' },
  { name: 'mintd', port: 3003, dir: 'mintd' },
  { name: 'treasury', port: 3004, dir: 'treasury' },
  { name: 'logd', port: 3002, dir: 'logd' },
  { name: 'agent-gateway', port: 3008, dir: 'agent-gateway' },
  { name: 'disputes', port: 3012, dir: 'disputes' },
  { name: 'metering', port: 3010, dir: 'metering' },
  { name: 'marketplace', port: 3009, dir: 'marketplace' },
  { name: 'onramp', port: 3013, dir: 'onramp' },
  { name: 'webhookd', port: 3011, dir: 'webhookd' },
  { name: 'verifier-advanced', port: 3014, dir: 'verifier-advanced' },
  { name: 'verifier-simple', port: 3006, dir: 'verifier-simple' },
  { name: 'pqsigner', port: 3000, dir: 'pqsigner' }
];

const processes = [];

// Start each service
services.forEach((service, index) => {
  setTimeout(() => {
    console.log(`📦 Starting ${service.name} on port ${service.port}...`);
    
    const servicePath = path.join(__dirname, '..', service.dir);
    const startCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    const proc = spawn(startCmd, ['run', 'start:prod'], {
      cwd: servicePath,
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: service.port
      }
    });

    proc.stdout.on('data', (data) => {
      console.log(`[${service.name}] ${data.toString().trim()}`);
    });

    proc.stderr.on('data', (data) => {
      console.error(`[${service.name}] ERROR: ${data.toString().trim()}`);
    });

    proc.on('close', (code) => {
      console.log(`[${service.name}] Process exited with code ${code}`);
    });

    processes.push(proc);
  }, index * 2000); // Stagger startup by 2 seconds
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(proc => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(proc => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('✅ All services starting...');
console.log('🌐 Gateway will be available at: http://localhost:3000');
console.log('📊 Health check: http://localhost:3000/health');

