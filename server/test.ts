import 'dotenv/config';
import { db } from './src/db/index.js';
import { vendor } from './src/db/schema.js';

async function test() {
  console.log('Testing vendor insert...');
  try {
    const query = db.insert(vendor).values([
      { nama: 'PT Gedung Megah', kontak: '021-5551234', kategori: 'Properti' },
    ]);
    console.log('Query:', query.toSQL());
    const res = await query.returning();
    console.log('Success:', res);
  } catch (err) {
    console.error('Crash test:', err);
  }
  process.exit(0);
}

test();
