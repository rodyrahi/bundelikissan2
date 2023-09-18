const Database = require('better-sqlite3');

const db = new Database('../database/bundeli/posts.db');
const dbimage = new Database('../database/bundeli/images.db');
const dbkissan = new Database('../database/bundeli/kissan.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat TEXT,
    name TEXT,
    number TEXT,
    images BLOB,
    status TEXT DEFAULT "unsolved",
    reply TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

dbkissan.exec(`
  CREATE TABLE IF NOT EXISTS kissan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    number TEXT,
    fathername TEXT,
    gender TEXT,
    dob TEXT,
    pincode INTEGER,
    address TEXT
  )
`);


dbimage.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER ,
    number TEXT,
    images BLOB
    
  )
`);

console.log('Connected to the database');

module.exports = {db , dbimage , dbkissan};
