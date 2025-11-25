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

// Criação das tabelas e dados iniciais
db.serialize(() => {

    //tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            user TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `);

    //inserção de usuários padrão
    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, user, password)
            VALUES ('Carol Galeski', 'carol@email.com', 'carol', '123')`);
    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, user, password)
            VALUES ('Maria da Silva', 'maria@email.com', 'maria', '123')`);
    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, user, password)
            VALUES ('Carlos Santos', 'carlos@email.com', 'carlos', '123')`);


    //tabela de pokemon
    db.run(`
            CREATE TABLE IF NOT EXISTS pokemon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL,
            habilidades TEXT NOT NULL,
            usuario TEXT NOT NULL
            )
         `);
});

// endpoint de autenticação usuário
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


// endpoint de criação de novo usuário
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

// endpoint para cadastro de pokemon
app.post("/pokemon/create", (req, res) => {
    const { nome, tipo, habilidades, usuario } = req.body;

    if (!nome || !tipo || !habilidades || !usuario) {
        return res.status(400).json({ erro: "Campos obrigatórios faltando" });
    }

    //verificar duplicidade
    db.get(
        "SELECT * FROM pokemon WHERE nome = ?",
        [nome],
        (err, row) => {
            if (err) return res.status(500).json({ erro: "Erro no servidor"});

            if(row) {
                return res.status(409).json({
                    erro: "Já existe um Pokemon cadastrado com esse nome"
                });
            }

            //converte array em string, se for array
            const habilidadesStr = Array.isArray(habilidades)
                ? habilidades.join(",")
                : habilidades;

            //inserir um pokemon
            db.run(
                "INSERT INTO pokemon (nome, tipo, habilidades, usuario) VALUES (?, ?, ?, ?)",
                [nome, tipo, habilidadesStr, usuario],
                function(err) {
                    if (err) {
                        return res.status(500).json({ erro: "Erro ao cadastrar pokemon"});
                    }

                    return res.json({
                        sucesso: true,
                        id: this.lastID,
                        mensagem: "Pokemon cadastrado com sucesso."
                    });
                }
            );    
        }
    );
});

// edpoint para listar pokemon 
app.get("/pokemon/listar", (req, res) => {
    const { usuario } = req.query;

    if (!usuario) {
        return res.status(400).json({ erro: "Usuário não informado" });
    }

    db.all(
        "SELECT id, nome, tipo, habilidades FROM pokemon WHERE usuario = ?",
        [usuario],
        (err, rows) => {
            if (err) return res.status(500).json({ erro: "Erro no servidor" });

            // transforma habilidades "a,b,c" em array
            const lista = rows.map(p => ({
                ...p,
                habilidades: p.habilidades.split(",")
            }));

            return res.json(lista);
        }
    );
});


    // Porta obrigatória para o Render
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`API rodando na porta ${PORT}`);
    });

