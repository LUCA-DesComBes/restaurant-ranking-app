import Database from 'better-sqlite3';

const database = new Database('./db.sqlite');

export function getAll() {
    const sql = 'SELECT * FROM restaurants';
    const stmt = database.prepare(sql);
    return stmt.all();
}

export function getTags() {
    const sql = `SELECT * FROM tags WHERE kind = 'cuisine'`;
    const stmt = database.prepare(sql);
    return stmt.all();
}

export function getPhotosList() {
    const sql = `SELECT * FROM photos WHERE url LIKE '%01.jpg'`;
    const stmt = database.prepare(sql);
    return stmt.all();
}

export function getRestaurantList() {
    const sql = `SELECT * FROM restaurants`;
    const stmt = database.prepare(sql);
    return stmt.all();
}