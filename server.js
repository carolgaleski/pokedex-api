const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = new sqlite3.Database("./usuarios.db");

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

    const usuariosIniciais = [
        { nome: 'Carol Galeski', email: 'carol@email.com', user: 'carol', password: '123' },
        { nome: 'Maria da Silva', email: 'maria@email.com', user: 'maria', password: '123' },
        { nome: 'Carlos Santos', email: 'carlos@email.com', user: 'carlos', password: '123' }
    ];

    usuariosIniciais.forEach(u => {
        db.run(
            "INSERT OR IGNORE INTO usuarios (nome, email, user, password) VALUES (?, ?, ?, ?)",
            [u.nome, u.email, u.user, u.password]
        );
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS pokemon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL,
            habilidades TEXT NOT NULL,
            usuario TEXT NOT NULL,
            UNIQUE(nome, usuario)
        )
    `);

    const pokemonsIniciais = [
        { nome: 'Pikachu', tipo: 'Elétrico', habilidades: 'Choque,Trovão,Velocidade' },
        { nome: 'Charmander', tipo: 'Fogo', habilidades: 'Brasa,Lança Chamas,Escudo de Fogo' },
        { nome: 'Squirtle', tipo: 'Água', habilidades: 'Jato de Água,Bolha,Mergulho' },
        { nome: 'Bulbasaur', tipo: 'Planta', habilidades: 'Folha Navalha,Semente,Raio Solar' },
        { nome: 'Jigglypuff', tipo: 'Normal', habilidades: 'Canto,Sonífero,Dormir' },
        { nome: 'Gengar', tipo: 'Fantasma', habilidades: 'Sombra,Venenoso,Teletransporte' },
        { nome: 'Onix', tipo: 'Pedra', habilidades: 'Rochadura,Impacto,Fortaleza' },
        { nome: 'Alakazam', tipo: 'Psíquico', habilidades: 'Telecinese,Confusão,Previsão' },
        { nome: 'Snorlax', tipo: 'Normal', habilidades: 'Descanso,Comer,Soneca' },
        { nome: 'Vulpix', tipo: 'Fogo', habilidades: 'Chama,Nevada,Ilusão' }
    ];

    usuariosIniciais.forEach(u => {
        pokemonsIniciais.forEach(p => {
            db.run(
                "INSERT OR IGNORE INTO pokemon (nome, tipo, habilidades, usuario) VALUES (?, ?, ?, ?)",
                [p.nome, p.tipo, p.habilidades, u.user]
            );
        });
    });
});


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

            const pokemonsIniciais = [
                { nome: 'Pikachu', tipo: 'Elétrico', habilidades: 'Choque,Trovão,Velocidade' },
                { nome: 'Charmander', tipo: 'Fogo', habilidades: 'Brasa,Lança Chamas,Escudo de Fogo' },
                { nome: 'Squirtle', tipo: 'Água', habilidades: 'Jato de Água,Bolha,Mergulho' },
                { nome: 'Bulbasaur', tipo: 'Planta', habilidades: 'Folha Navalha,Semente,Raio Solar' },
                { nome: 'Jigglypuff', tipo: 'Normal', habilidades: 'Canto,Sonífero,Dormir' },
                { nome: 'Gengar', tipo: 'Fantasma', habilidades: 'Sombra,Venenoso,Teletransporte' },
                { nome: 'Onix', tipo: 'Pedra', habilidades: 'Rochadura,Impacto,Fortaleza' },
                { nome: 'Alakazam', tipo: 'Psíquico', habilidades: 'Telecinese,Confusão,Previsão' },
                { nome: 'Snorlax', tipo: 'Normal', habilidades: 'Descanso,Comer,Soneca' },
                { nome: 'Vulpix', tipo: 'Fogo', habilidades: 'Chama,Nevada,Ilusão' }
            ];

            pokemonsIniciais.forEach(p => {
                db.run(
                    "INSERT OR IGNORE INTO pokemon (nome, tipo, habilidades, usuario) VALUES (?, ?, ?, ?)",
                    [p.nome, p.tipo, p.habilidades, user]
                );
            });

            return res.json({ id: this.lastID, nome, email, user });
        }
    );
});

app.post("/pokemon/create", (req, res) => {
    const { nome, tipo, habilidades, usuario } = req.body;

    if (!nome || !tipo || !habilidades || !usuario) {
        return res.status(400).json({ erro: "Campos obrigatórios faltando" });
    }

    // verificar duplicidade para o mesmo usuário
    db.get(
        "SELECT * FROM pokemon WHERE nome = ? AND usuario = ?",
        [nome, usuario],
        (err, row) => {
            if (err) return res.status(500).json({ erro: "Erro no servidor" });
            if (row) return res.status(409).json({ erro: "Já existe um Pokémon cadastrado com esse nome para este usuário" });

            const habilidadesStr = Array.isArray(habilidades) ? habilidades.join(",") : habilidades;

            db.run(
                "INSERT INTO pokemon (nome, tipo, habilidades, usuario) VALUES (?, ?, ?, ?)",
                [nome, tipo, habilidadesStr, usuario],
                function(err) {
                    if (err) return res.status(500).json({ erro: "Erro ao cadastrar Pokémon" });

                    return res.json({
                        sucesso: true,
                        id: this.lastID,
                        mensagem: "Pokémon cadastrado com sucesso"
                    });
                }
            );
        }
    );
});

app.get("/pokemon/listar", (req, res) => {
    const { usuario } = req.query;
    if (!usuario) return res.status(400).json({ erro: "Parâmetro 'usuario' é obrigatório" });

    const sql = "SELECT id, nome, tipo, habilidades, usuario FROM pokemon WHERE usuario = ?";

    db.all(sql, [usuario], (err, rows) => {
        if (err) return res.status(500).json({ erro: "Erro no servidor" });

        const lista = rows.map(p => ({ ...p, habilidades: p.habilidades.split(",") }));
        return res.json(lista);
    });
});

app.get("/pokemon/pesquisarHabilidade", (req, res) => {
    const { usuario, habilidade } = req.query;
    if (!usuario || !habilidade) return res.status(400).json({ erro: "Parâmetros 'usuario' e 'habilidade' são obrigatórios" });

    const sql = `
        SELECT id, nome, tipo, habilidades, usuario
        FROM pokemon
        WHERE usuario = ? AND habilidades LIKE ?
    `;
    const habLike = `%${habilidade}%`;

    db.all(sql, [usuario, habLike], (err, rows) => {
        if (err) return res.status(500).json({ erro: "Erro no servidor" });

        const lista = rows.map(p => ({ ...p, habilidades: p.habilidades.split(",") }));
        return res.json(lista);
    });
});

app.get("/pokemon/pesquisarTipo", (req, res) => {
    const { usuario, tipo } = req.query;
    if (!usuario || !tipo) return res.status(400).json({ erro: "Parâmetros 'usuario' e 'tipo' são obrigatórios" });

    const sql = `
        SELECT id, nome, tipo, habilidades, usuario
        FROM pokemon
        WHERE usuario = ? AND tipo LIKE ?
    `;
    const tipoLike = `%${tipo}%`;

    db.all(sql, [usuario, tipoLike], (err, rows) => {
        if (err) return res.status(500).json({ erro: "Erro no servidor" });

        const lista = rows.map(p => ({ ...p, habilidades: p.habilidades.split(",") }));
        return res.json(lista);
    });
});

app.put("/pokemon/editar", (req, res) => {
    const { id, nome, tipo, habilidades, usuario } = req.body;

    if (!id || !nome || !tipo || !habilidades || !usuario) {
        return res.status(400).json({ erro: "Campos obrigatórios faltando" });
    }

    const habilidadesStr = Array.isArray(habilidades) ? habilidades.join(",") : habilidades;

    db.run(
        "UPDATE pokemon SET nome = ?, tipo = ?, habilidades = ? WHERE id = ? AND usuario = ?",
        [nome, tipo, habilidadesStr, id, usuario],
        function(err) {
            if (err) return res.status(500).json({ erro: "Erro ao atualizar Pokémon" });
            if (this.changes === 0) return res.status(404).json({ erro: "Pokémon não encontrado para este usuário" });
            return res.json({ sucesso: true, mensagem: "Pokémon atualizado com sucesso" });
        }
    );
});


app.delete("/pokemon/excluir", (req, res) => {
    const { id, usuario } = req.query;
    if (!id || !usuario) return res.status(400).json({ erro: "Parâmetros 'id' e 'usuario' são obrigatórios" });

    db.run("DELETE FROM pokemon WHERE id = ? AND usuario = ?", [id, usuario], function(err) {
        if (err) return res.status(500).json({ erro: "Erro ao excluir Pokémon" });
        if (this.changes === 0) return res.status(404).json({ erro: "Pokémon não encontrado para este usuário" });
        return res.json({ sucesso: true, mensagem: "Pokémon excluído com sucesso" });
    });
});

// porta do render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
