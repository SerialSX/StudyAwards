const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // Middleware para interpretar o corpo de requisições JSON

const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
    db.run('PRAGMA foreign_keys = ON;');
    setupDatabase();
  }
});

// ... (as funções setupDatabase e insertInitialData continuam exatamente as mesmas)
function setupDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha TEXT NOT NULL, tipo TEXT NOT NULL, pontuacao_total INTEGER DEFAULT 0)`, (err) => { if (err) console.error("Erro Tabela 'usuarios':", err.message); else console.log("Tabela 'usuarios' pronta."); });
    db.run(`CREATE TABLE IF NOT EXISTS recompensas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, descricao TEXT NOT NULL)`, (err) => { if (err) console.error("Erro Tabela 'recompensas':", err.message); else console.log("Tabela 'recompensas' pronta."); });
    db.run(`CREATE TABLE IF NOT EXISTS usuarios_recompensas (usuario_id INTEGER, recompensa_id INTEGER, data_conquista DATE DEFAULT (datetime('now','localtime')), PRIMARY KEY (usuario_id, recompensa_id), FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY (recompensa_id) REFERENCES recompensas(id) ON DELETE CASCADE)`, (err) => { if (err) console.error("Erro Tabela 'usuarios_recompensas':", err.message); else console.log("Tabela 'usuarios_recompensas' pronta."); });
    insertInitialData();
  });
}
function insertInitialData() {
  db.get(`SELECT COUNT(id) as count FROM usuarios`, (err, row) => {
    if (row.count === 0) {
      const sql = `INSERT INTO usuarios (id, nome, email, senha, tipo, pontuacao_total) VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(sql, [1, 'Aluno Teste', 'aluno@teste.com', '123', 'aluno', 150]);
    }
  });
  db.get(`SELECT COUNT(id) as count FROM recompensas`, (err, row) => {
    if (row.count === 0) {
      const sql = `INSERT INTO recompensas (id, nome, descricao) VALUES (?, ?, ?)`;
      db.run(sql, [1, 'Explorador Iniciante', 'Você alcançou 200 pontos!']);
    }
  });
}


// --- ROTAS DA API ---

app.get('/', (req, res) => { res.send('Servidor funcionando!'); });
app.get('/usuarios/:id/pontuacao', (req, res) => {
  const usuarioId = req.params.id;
  const sql = `SELECT pontuacao_total FROM usuarios WHERE id = ?`;
  db.get(sql, [usuarioId], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else if (row) res.json({ usuarioId: usuarioId, pontuacao: row.pontuacao_total });
    else res.status(404).json({ error: "Usuário não encontrado." });
  });
});

app.get('/ranking', (req, res) => {
  const sql = `SELECT nome, pontuacao_total FROM usuarios ORDER BY pontuacao_total DESC LIMIT 10`;
  db.all(sql, [], (err, rows) => { if (err) res.status(500).json({ error: err.message }); else res.json(rows); });
});

app.get('/usuarios/:id/recompensas', (req, res) => {
    const usuarioId = req.params.id;
    const sql = `SELECT r.nome, r.descricao FROM recompensas r JOIN usuarios_recompensas ur ON r.id = ur.recompensa_id WHERE ur.usuario_id = ? ORDER BY ur.data_conquista DESC`;
    db.all(sql, [usuarioId], (err, rows) => { if (err) res.status(500).json({ error: err.message }); else res.json(rows); });
});

// --- NOVA ROTA PARA ADICIONAR PONTOS E CONCEDER RECOMPENSAS ---
app.post('/usuarios/:id/adicionar-pontos', (req, res) => {
    const { id } = req.params;
    const { pontos } = req.body;

    const updateSql = `UPDATE usuarios SET pontuacao_total = pontuacao_total + ? WHERE id = ?`;
    db.run(updateSql, [pontos, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        db.get(`SELECT pontuacao_total FROM usuarios WHERE id = ?`, [id], (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            
            let novaRecompensa = null;
            // Lógica para conceder recompensa: Atingiu 200 pontos?
            if (user.pontuacao_total >= 200) {
                db.get(`SELECT * FROM recompensas WHERE id = 1`, [], (err, recompensa) => {
                    // Tenta inserir a recompensa para o usuário. Se já existir, dará um erro que ignoramos.
                    db.run(`INSERT INTO usuarios_recompensas (usuario_id, recompensa_id) VALUES (?, 1)`, [id], (err) => {
                        if (!err) { // 'err' será null se a inserção for bem-sucedida (recompensa nova)
                            novaRecompensa = recompensa;
                        }
                        res.json({ novaPontuacao: user.pontuacao_total, novaRecompensa: novaRecompensa });
                    });
                });
            } else {
                res.json({ novaPontuacao: user.pontuacao_total, novaRecompensa: null });
            }
        });
    });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});