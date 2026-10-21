const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const JSZip = require('jszip');

console.log('========================================================');
console.log('🚀 Swami Motors: Hostinger Deployment ZIP Generator');
console.log('🌐 Target Domain: https://autokundali.com');
console.log('========================================================\n');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const distDir = path.join(rootDir, 'dist');
const backendPublic = path.join(backendDir, 'public');
const zipFile = path.join(rootDir, 'shravya-deploy.zip');

// 1. Build Vite Frontend
console.log('📦 [1/4] Building latest React/Vite production bundle...');
try {
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
    console.log('   ✅ Frontend build succeeded.\n');
} catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
}

// 2. Clean and Stage dist into backend/public
console.log('📂 [2/4] Staging production build into backend/public/...');
if (fs.existsSync(backendPublic)) {
    fs.rmSync(backendPublic, { recursive: true, force: true });
}
fs.mkdirSync(backendPublic, { recursive: true });

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
copyDirSync(distDir, backendPublic);
console.log('   ✅ Frontend assets staged in backend/public.\n');

// 3. Prepare ZIP Archive
console.log('🗜️  [3/4] Assembling monolithic package into shravya-deploy.zip...');
if (fs.existsSync(zipFile)) {
    fs.rmSync(zipFile, { force: true });
}

const zip = new JSZip();

function addDirectoryToZip(zipInstance, dirPath, rootPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (
            entry.name === 'node_modules' ||
            entry.name.endsWith('.zip') ||
            entry.name === '.git' ||
            entry.name === 'uploads' ||
            entry.name.endsWith('.log')
        ) {
            continue;
        }
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.relative(rootPath, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            addDirectoryToZip(zipInstance, fullPath, rootPath);
        } else {
            const content = fs.readFileSync(fullPath);
            zipInstance.file(relPath, content);
        }
    }
}

addDirectoryToZip(zip, backendDir, backendDir);

// 4. Write ZIP and verify
console.log('💾 [4/4] Writing compressed archive and verifying structure...');
zip.generateNodeStream({
    type: 'nodebuffer',
    streamFiles: true,
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
})
.pipe(fs.createWriteStream(zipFile))
.on('finish', () => {
    const stats = fs.statSync(zipFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 Success! Deployment ZIP generated:`);
    console.log(`   File: ${zipFile}`);
    console.log(`   Size: ${sizeMB} MB (${stats.size} bytes)\n`);

    // Verification check
    const rootFiles = fs.readdirSync(backendDir).filter(f => 
        !['node_modules', 'uploads', '.git'].includes(f) && !f.endsWith('.zip')
    );
    console.log('📋 Verified Root Package Manifest:');
    rootFiles.forEach(f => console.log(`   - ${f}`));
    console.log('\n🚀 Ready to upload to Hostinger!');
})
.on('error', (err) => {
    console.error('❌ Error generating zip:', err);
    process.exit(1);
});
