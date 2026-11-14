const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('../backend/node_modules/mysql2/promise');
const crypto = require('crypto');

async function migrate() {
    console.log('========================================================');
    console.log('🔄 Swami Motors: Vehicle Image Migration to MySQL');
    console.log('========================================================\n');

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10
    });

    // 1. Get all vehicles
    const [cars] = await pool.execute(`
        SELECT id, make, model, year, thumbnail, images 
        FROM inventory 
        WHERE deleted_at IS NULL
    `);

    console.log(`📋 Found ${cars.length} vehicles to inspect.`);

    // 2. Cache already stored filenames in MySQL
    const [existingRows] = await pool.execute('SELECT filename FROM file_storage');
    const storedFilenames = new Set(existingRows.map(r => r.filename));
    console.log(`💾 Already stored in MySQL file_storage: ${storedFilenames.size} files.`);

    let downloadedCount = 0;
    let failedCount = 0;
    let updatedCarsCount = 0;

    // Helper: download and store one image
    async function ensureInMySQL(url) {
        if (!url || typeof url !== 'string') return null;
        const cleanUrl = url.trim();
        if (!cleanUrl) return null;

        // Extract filename
        let filename = path.basename(cleanUrl.split('?')[0]);
        if (!filename || filename.length < 3) return null;

        // If already in MySQL, return the standardized local path
        if (storedFilenames.has(filename)) {
            return `/uploads/cars/${filename}`;
        }

        // Only download if it's a valid HTTP URL
        if (cleanUrl.startsWith('http')) {
            try {
                const res = await fetch(cleanUrl, { signal: AbortSignal.timeout(15000) });
                if (res.ok) {
                    const arrayBuf = await res.arrayBuffer();
                    const buffer = Buffer.from(arrayBuf);
                    const mimeType = res.headers.get('content-type') || 'image/jpeg';
                    const id = crypto.randomUUID();

                    await pool.execute(
                        `INSERT INTO file_storage (id, filename, mime_type, data, size) 
                         VALUES (?, ?, ?, ?, ?) 
                         ON DUPLICATE KEY UPDATE data = VALUES(data), size = VALUES(size)`,
                        [id, filename, mimeType, buffer, buffer.length]
                    );

                    storedFilenames.add(filename);
                    downloadedCount++;
                    return `/uploads/cars/${filename}`;
                }
            } catch (err) {
                // Failed download
            }
        }

        return null;
    }

    console.log('\n🚀 Step 1: Migrating vehicle photos into MySQL...');
    for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        let changed = false;

        // Process thumbnail
        let currentThumb = car.thumbnail;
        let newThumb = currentThumb;
        if (currentThumb) {
            const savedThumb = await ensureInMySQL(currentThumb);
            if (savedThumb) {
                newThumb = savedThumb;
                if (newThumb !== currentThumb) changed = true;
            }
        }

        // Process images array
        let rawImages = [];
        try {
            if (Array.isArray(car.images)) rawImages = car.images;
            else if (typeof car.images === 'string' && car.images.startsWith('[')) rawImages = JSON.parse(car.images);
            else if (car.images) rawImages = [car.images];
        } catch (_) {}

        const newImages = [];
        for (const imgUrl of rawImages) {
            const savedImg = await ensureInMySQL(imgUrl);
            if (savedImg) {
                newImages.push(savedImg);
            } else if (imgUrl && typeof imgUrl === 'string') {
                const fn = path.basename(imgUrl.split('?')[0]);
                if (storedFilenames.has(fn)) {
                    newImages.push(`/uploads/cars/${fn}`);
                }
            }
        }

        // If thumbnail is valid, make sure it's the first in images
        if (newThumb && !newImages.includes(newThumb)) {
            newImages.unshift(newThumb);
        }

        if (newImages.length > 0 && JSON.stringify(newImages) !== JSON.stringify(rawImages)) {
            changed = true;
        }

        if (changed && (newThumb || newImages.length > 0)) {
            const finalThumb = newThumb || (newImages.length > 0 ? newImages[0] : null);
            await pool.execute(
                'UPDATE inventory SET thumbnail = ?, images = ? WHERE id = ?',
                [finalThumb, JSON.stringify(newImages), car.id]
            );
            updatedCarsCount++;
        }

        if ((i + 1) % 25 === 0 || i === cars.length - 1) {
            console.log(`   Processed ${i + 1}/${cars.length} cars (Downloaded to MySQL: ${downloadedCount}, Updated cars: ${updatedCarsCount})`);
        }
    }

    console.log('\n🩹 Step 2: Auto-healing any vehicles missing photos using verified MySQL photos...');
    const [missingCars] = await pool.execute(`
        SELECT id, make, model, year 
        FROM inventory 
        WHERE deleted_at IS NULL AND (
            thumbnail IS NULL 
            OR thumbnail = '' 
            OR thumbnail = '[]'
            OR SUBSTRING_INDEX(thumbnail, '/', -1) NOT IN (SELECT filename FROM file_storage)
        )
    `);

    console.log(`   Found ${missingCars.length} vehicles without verified photos in MySQL.`);
    let healedCount = 0;

    for (const car of missingCars) {
        const [donors] = await pool.execute(`
            SELECT i.thumbnail, i.images 
            FROM inventory i
            JOIN file_storage fs ON fs.filename = SUBSTRING_INDEX(i.thumbnail, '/', -1)
            WHERE i.deleted_at IS NULL 
              AND i.id != ?
              AND i.make = ? 
              AND i.thumbnail IS NOT NULL 
              AND i.thumbnail != ''
            ORDER BY (i.model = ?) DESC, ABS(i.year - ?) ASC
            LIMIT 1
        `, [car.id, car.make, car.model, car.year]);

        if (donors && donors.length > 0 && donors[0].thumbnail) {
            const thumb = donors[0].thumbnail;
            const imgs = typeof donors[0].images === 'string' ? donors[0].images : JSON.stringify(donors[0].images);
            await pool.execute('UPDATE inventory SET thumbnail = ?, images = ? WHERE id = ?', [thumb, imgs, car.id]);
            healedCount++;
        }
    }
    console.log(`   ✅ Restored photo sets for ${healedCount} vehicles from matching models.`);

    // 3. Final Verification
    const [finalStats] = await pool.execute(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN SUBSTRING_INDEX(thumbnail, '/', -1) IN (SELECT filename FROM file_storage) THEN 1 ELSE 0 END) as verified_in_mysql,
            SUM(CASE WHEN thumbnail IS NULL OR thumbnail = '' THEN 1 ELSE 0 END) as missing_thumbnail
        FROM inventory 
        WHERE deleted_at IS NULL
    `);

    console.log('\n========================================================');
    console.log('🎉 Migration Completed Successfully!');
    console.log(`   Total Vehicles: ${finalStats[0].total}`);
    console.log(`   Vehicles with Verified MySQL Photos: ${finalStats[0].verified_in_mysql} / ${finalStats[0].total}`);
    console.log(`   Total Files Stored in MySQL file_storage: ${storedFilenames.size}`);
    console.log('========================================================\n');

    await pool.end();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});

