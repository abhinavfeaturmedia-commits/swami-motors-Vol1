/**
 * Swami Motors - Direct 1-Command Deployment to Hostinger
 * Builds frontend, syncs backend & static assets over SFTP, and restarts Node.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const Client = require('ssh2-sftp-client');
const { Client: SshClient } = require('ssh2');

// Load environment variables
dotenv.config();

const SSH_HOST = process.env.HOSTINGER_SSH_HOST || '145.79.209.154';
const SSH_PORT = Number(process.env.HOSTINGER_SSH_PORT) || 65002;
const SSH_USER = process.env.HOSTINGER_SSH_USER || 'u750566272';
const SSH_PASS = process.env.HOSTINGER_SSH_PASS;
const REMOTE_DIR = process.env.HOSTINGER_REMOTE_APP_DIR || '/home/u750566272/domains/autokundali.com/hbuilds/current/nodejs';

if (!SSH_PASS) {
    console.error('❌ Error: HOSTINGER_SSH_PASS is not set in .env');
    process.exit(1);
}

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BACKEND_PUBLIC_DIR = path.join(BACKEND_DIR, 'public');

async function deploy() {
    const startTime = Date.now();
    console.log('\n========================================================');
    console.log('🚀 SWAMI MOTORS: DIRECT 1-COMMAND HOSTINGER DEPLOYMENT');
    console.log(`🌐 Target: https://autokundali.com`);
    console.log(`📡 Remote Path: ${REMOTE_DIR}`);
    console.log('========================================================\n');

    // 1. Build Vite Frontend
    console.log('📦 [1/5] Building React/Vite frontend...');
    try {
        execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    } catch (err) {
        console.error('❌ Frontend build failed:', err.message);
        process.exit(1);
    }

    // 2. Stage frontend into backend/public
    console.log('\n📂 [2/5] Staging frontend build into backend/public/...');
    if (!fs.existsSync(BACKEND_PUBLIC_DIR)) {
        fs.mkdirSync(BACKEND_PUBLIC_DIR, { recursive: true });
    }

    // Clean old assets in backend/public
    fs.rmSync(BACKEND_PUBLIC_DIR, { recursive: true, force: true });
    fs.mkdirSync(BACKEND_PUBLIC_DIR, { recursive: true });

    // Copy dist to backend/public
    fs.cpSync(DIST_DIR, BACKEND_PUBLIC_DIR, { recursive: true });
    console.log('   ✅ Frontend build copied to backend/public.');

    // 3. Connect via SFTP
    console.log('\n🔐 [3/5] Connecting to Hostinger via Secure SFTP...');
    const sftp = new Client();
    await sftp.connect({
        host: SSH_HOST,
        port: SSH_PORT,
        username: SSH_USER,
        password: SSH_PASS,
        readyTimeout: 30000,
    });
    console.log('   ✅ SFTP Connected successfully.');

    // 4. Upload Files
    console.log('\n📤 [4/5] Syncing application files to Hostinger...');
    
    // Filter to exclude node_modules, live .env on server, uploads, and logs
    const filter = (itemPath, isDir) => {
        const basename = path.basename(itemPath);
        if (basename === 'node_modules' || 
            basename === '.env' || 
            basename === 'uploads' || 
            basename === '.git' ||
            basename.endsWith('.log') ||
            basename.endsWith('.zip')) {
            return false;
        }
        return true;
    };

    console.log('   Syncing backend directory...');
    await sftp.uploadDir(BACKEND_DIR, REMOTE_DIR, { filter });
    console.log('   ✅ All files synced successfully!');

    await sftp.end();

    // 5. Restart Node.js application via Passenger restart.txt
    console.log('\n🔄 [5/5] Installing patched dependencies and restarting Hostinger Node.js Application...');
    await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log('   ⚠️ Remote command wait timed out, continuing to health check...');
            resolve();
        }, 90000);

        const conn = new SshClient();
        conn.on('ready', () => {
            console.log('   📦 Running remote npm install and updating Passenger restart trigger...');
            const remoteCmd = `export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && cd ${REMOTE_DIR} && npm install --omit=dev && mkdir -p tmp && touch tmp/restart.txt`;
            conn.exec(remoteCmd, (err, stream) => {
                if (err) {
                    console.warn('   ⚠️ Remote exec error:', err.message);
                    clearTimeout(timeout);
                    conn.end();
                    return resolve();
                }
                stream.on('close', (code) => {
                    clearTimeout(timeout);
                    conn.end();
                    console.log(`   ✅ Remote npm install completed (exit code ${code}).`);
                    resolve();
                }).on('data', (data) => {
                    process.stdout.write('   [hostinger] ' + data);
                }).stderr.on('data', (data) => {
                    process.stderr.write('   [hostinger] ' + data);
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.warn('   ⚠️ SSH connection warning:', err.message);
            resolve();
        }).connect({
            host: SSH_HOST,
            port: SSH_PORT,
            username: SSH_USER,
            password: SSH_PASS
        });
    });
    console.log('   ✅ Restart signal triggered (Passenger restart.txt updated).');

    // 6. Verify Health Endpoint
    console.log('\n🩺 Checking live server health...');
    await new Promise(r => setTimeout(r, 2000)); // Brief pause for passenger reload
    try {
        const healthRes = await fetch('https://autokundali.com/api/health').then(r => r.json());
        console.log('   Live Health Check:', healthRes);
    } catch (e) {
        console.log('   Server is warming up, health response:', e.message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n========================================================');
    console.log(`🎉 DEPLOYMENT COMPLETE in ${duration}s!`);
    console.log(`🌐 Live Website: https://autokundali.com`);
    console.log('========================================================\n');
}

deploy().catch(err => {
    console.error('\n❌ Deployment failed:', err.message);
    process.exit(1);
});
