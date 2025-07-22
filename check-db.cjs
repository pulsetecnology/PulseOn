const Database = require('better-sqlite3');
const db = new Database('pulseon.db');

console.log('Current users table structure:');
const result = db.prepare('PRAGMA table_info(users)').all();
result.forEach(col => {
  console.log(`${col.name}: ${col.type}`);
});

console.log('\nPhone column exists:', result.some(col => col.name === 'phone'));
db.close();