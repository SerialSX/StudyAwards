const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
    
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      tipo TEXT NOT NULL,
      pontuacao_total INTEGER DEFAULT 0
    )`, (err) => {
      if (err) {
        console.error("Erro ao criar a tabela 'usuarios':", err.message);
      } else {
        console.log("Tabela 'usuarios' pronta para uso.");

        const sql_count = `SELECT COUNT(id) as count FROM usuarios`;
        db.get(sql_count, (err, row) => {
          if (row.count === 0) {
            console.log("Banco de dados de usuários vazio. Inserindo usuário padrão.");
            const sql_insert = `INSERT INTO usuarios (id, nome, email, senha, tipo, pontuacao_total) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sql_insert, [1, 'Aluno Teste', 'aluno@teste.com', '123', 'aluno', 150], (err) => {
              if (err) {
                console.error("Erro ao inserir usuário padrão:", err.message);
              } else {
                console.log("Usuário padrão (ID 1, Pontuação 150) inserido com sucesso.");
              }
            });
          }
        });
      }
    });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor funcionando e conectado ao banco de dados!');
});

app.get('/usuarios/:id/pontuacao', (req, res) => {
  const usuarioId = req.params.id;
  const sql = `SELECT pontuacao_total FROM usuarios WHERE id = ?`;

  db.get(sql, [usuarioId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.json({
        usuarioId: usuarioId,
        pontuacao: row.pontuacao_total 
      });
    } else {
      res.status(404).json({ error: "Usuário não encontrado." });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});