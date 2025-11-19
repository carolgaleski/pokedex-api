const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Banco SQLite
const db = new sqlite3.Database("./usuarios.db");

// Cria tabela + 3 usuários se não existirem
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            user TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `);

    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, user, password)
            VALUES ('João Silva', 'joao@email.com', 'joao', '123')`);
    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, user, password)
            VALUES ('Maria Oliveira', 'maria@email.com', 'maria', '123')`);
    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, user, password)
            VALUES ('Carlos Santos', 'carlos@email.com', 'carlos', '123')`);
});

// Endpoint de autenticação
app.post("/usuarios/auth", (req, res) => {
    const { user, password } = req.body;

    db.get(
        "SELECT id, nome, email FROM usuarios WHERE user = ? AND password = ?",
        [user, password],
        (err, row) => {
            if (err) return res.status(500).json({ erro: "Erro no servidor" });
            if (!row) return res.status(401).json({ erro: "Login ou senha incorretos" });
            return res.json(row);
        }
    );
});

// Porta obrigatória para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});

// Endpoint criar novo usuário
app.post("/usuarios/create", (req, res) => {
    const { nome, email, user, password } = req.body;

    if (!nome || !email || !user || !password) {
        return res.status(400).json({ erro: "Campos obrigatórios faltando" });
    }

    db.run(
        "INSERT INTO usuarios (nome, email, user, password) VALUES (?, ?, ?, ?)",
        [nome, email, user, password],
        function(err) {
            if (err) {
                return res.status(500).json({ erro: "Erro ao cadastrar usuário" });
            }
            return res.json({ id: this.lastID, nome, email, user });
        }
    );
});

