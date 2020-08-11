const Database = require('better-sqlite3');
const db = new Database('video.db', { verbose: console.log });

db.pragma('cache_size = 32000');

console.log(db.pragma('cache_size', { simple: true })); // => 32000

const stmt = db.prepare('INSERT INTO people VALUES ($firstName, $lastName, $age)');