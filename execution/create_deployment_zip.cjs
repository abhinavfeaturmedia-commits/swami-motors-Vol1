const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

console.log('🚀 Preparing Hostinger Deployment Package with JSZip...\n');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const distDir = path.join(rootDir, 'dist');
const backendPublic = path.join(backendDir, 'public');
const zipFile = path.join(rootDir, 'shravya-deploy.zip');

// Clean old zip
if (fs.existsSync(zipFile)) fs.rmSync(zipFile, { force: true });

// Clean old backend/public
if (fs.existsSync(backendPublic)) {
    fs.rmSync(backendPublic, { recursive: true, force: true });
}
fs.mkdirSync(backendPublic, { recursive: true });

// Ensure uploads/cars folder exists
const uploadsDir = path.join(backendDir, 'uploads', 'cars');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '');

// Copy dist to backend/public
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

console.log('📂 Copying fresh compiled frontend into backend/public...');
copyDirSync(distDir, backendPublic);

// Add files to JSZip recursively
function addDirectoryToZip(zip, dirPath, rootPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.endsWith('.zip')) continue;
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.relative(rootPath, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            addDirectoryToZip(zip, fullPath, rootPath);
        } else {
            const content = fs.readFileSync(fullPath);
            zip.file(relPath, content);
        }
    }
}

console.log('🗜️  Compressing files into shravya-deploy.zip...');
const zip = new JSZip();
addDirectoryToZip(zip, backendDir, backendDir);

zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE', compressionOptions: { level: 9 } })
    .pipe(fs.createWriteStream(zipFile))
    .on('finish', () => {
        const stats = fs.statSync(zipFile);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`\n🎉 Success! Deployment ZIP created: ${zipFile} (${sizeMB} MB)\n`);
    })
    .on('error', (err) => {
        console.error('Error generating zip:', err);
    });
