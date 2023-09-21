const Database = require('better-sqlite3');

const db = new Database('../database/bundeli/posts.db');
const dbimage = new Database('../database/bundeli/images.db');
const dbkissan = new Database('../database/bundeli/kissan.db');
const dbexpert = new Database('../database/bundeli/expert.db');
const dbadmin = new Database('../database/bundeli/admin.db');


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

dbexpert.exec(`
  CREATE TABLE IF NOT EXISTS experts (
    user TEXT,
    pass TEXT
    
  )
`);

dbadmin.exec(`
  CREATE TABLE IF NOT EXISTS adminposts (
    name TEXT,
    message TEXT,
    image BLOB,
    url TEXT
    
  )
`);

console.log('Connected to the database');

module.exports = {db , dbimage , dbkissan , dbexpert , dbadmin};
