const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

// Caminho absoluto para o banco de dados
const dbPath = path.resolve(__dirname, config.DATABASE_PATH);

// Criar conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        createTables();
    }
});

// Criar tabelas se não existirem
function createTables() {
    db.serialize(() => {
        // Tabela de usuários
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabela de novels
        db.run(`CREATE TABLE IF NOT EXISTS novels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            cover_url TEXT,
            author_id INTEGER,
            views INTEGER DEFAULT 0,
            rating REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )`);

        // Tabela de capítulos
        db.run(`CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            novel_id INTEGER,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            number INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (novel_id) REFERENCES novels(id)
        )`);

        // Tabela de comentários
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            novel_id INTEGER,
            user_id INTEGER,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (novel_id) REFERENCES novels(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Tabela de favoritos
        db.run(`CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER,
            novel_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, novel_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (novel_id) REFERENCES novels(id)
        )`);
    });
}

module.exports = db; 