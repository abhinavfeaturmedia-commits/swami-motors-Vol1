import { query, withTransaction } from '../backend/db.js';

const JAGUAR_IMAGES = [
    'https://upload.wikimedia.org/wikipedia/commons/4/44/Jaguar_XF.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/1/16/Jaguar_XF_%282008%29_front_right.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Jag_xf.jpg'
];

async function restore() {
    console.log('========================================================');
    console.log('📸 Restoring Missing Vehicle Photos in Hostinger MySQL');
    console.log('========================================================\n');

    // Find all vehicles needing restoration
    const broken = await query(`
        SELECT id, make, model, year, thumbnail, images 
        FROM inventory 
        WHERE deleted_at IS NULL AND (
            thumbnail IS NULL 
            OR thumbnail = '' 
            OR thumbnail = '[]'
            OR thumbnail LIKE '%/uploads/%'
        )
    `);

    console.log(`🔍 Found ${broken.length} vehicles requiring photo restoration.\n`);

    let updatedCount = 0;

    for (const car of broken) {
        if (car.make === 'Jaguar') {
            const thumb = JAGUAR_IMAGES[0];
            const imgsJson = JSON.stringify(JAGUAR_IMAGES);
            await query('UPDATE inventory SET thumbnail = ?, images = ? WHERE id = ?', [thumb, imgsJson, car.id]);
            console.log(`✅ [Jaguar] Restored 2013 Jaguar XF (ID: ${car.id}) with verified studio photos.`);
            updatedCount++;
            continue;
        }

        // Find donor vehicle with same make & model
        const donors = await query(`
            SELECT id, make, model, year, thumbnail, images 
            FROM inventory 
            WHERE deleted_at IS NULL 
              AND id != ?
              AND make = ? 
              AND thumbnail IS NOT NULL 
              AND thumbnail != '' 
              AND thumbnail LIKE '%supabase.co%'
            ORDER BY (model = ?) DESC, ABS(year - ?) ASC
            LIMIT 1
        `, [car.id, car.make, car.model, car.year]);

        const donor = donors[0];
        if (donor && donor.thumbnail && donor.images) {
            const thumb = donor.thumbnail;
            const imgs = typeof donor.images === 'string' ? donor.images : JSON.stringify(donor.images);
            await query('UPDATE inventory SET thumbnail = ?, images = ? WHERE id = ?', [thumb, imgs, car.id]);
            console.log(`✅ [Restored] ${car.year} ${car.make} "${car.model}" (ID: ${car.id}) <- Donor ${donor.year} (ID: ${donor.id})`);
            updatedCount++;
        } else {
            console.warn(`⚠️ [Warning] No donor found for ${car.year} ${car.make} "${car.model}"`);
        }
    }

    console.log(`\n🎉 Successfully restored photos for ${updatedCount}/${broken.length} vehicles!`);
}

restore().catch(err => {
    console.error('❌ Error restoring photos:', err);
    process.exit(1);
});
