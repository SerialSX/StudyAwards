// Importar os pacotes
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // .verbose() nos dá mais informações no console

// Criar a aplicação Express
const app = express();

// Definir a porta
const PORT = 3000;

// --- CONEXÃO COM O BANCO DE DADOS ---

const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
    
    // Cria a tabela 'usuarios' se não existir
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
      }
    });
  }
});

// --- ROTAS ---

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor funcionando e conectado ao banco de dados!');
});

// Rota para buscar a pontuação real de um usuário no banco
app.get('/usuarios/:id/pontuacao', (req, res) => {
  const usuarioId = req.params.id;

  db.get(
    `SELECT nome, pontuacao_total FROM usuarios WHERE id = ?`,
    [usuarioId],
    (err, row) => {
      if (err) {
        console.error("Erro ao buscar pontuação:", err.message);
        res.status(500).json({ erro: "Erro interno do servidor." });
      } else if (!row) {
        res.status(404).json({ erro: "Usuário não encontrado." });
      } else {
        res.json({
          id: usuarioId,
          nome: row.nome,
          pontuacao_total: row.pontuacao_total
        });
      }
    }
  );
});

// Rota para buscar o ranking completo de pontuação
app.get('/ranking', (req, res) => {
  const query = `
    SELECT nome, pontuacao_total
    FROM usuarios
    ORDER BY pontuacao_total DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar ranking:", err.message);
      res.status(500).json({ erro: "Erro interno do servidor." });
    } else if (rows.length === 0) {
      res.status(404).json({ mensagem: "Nenhum usuário encontrado." });
    } else {
      // Adiciona a posição (1º, 2º, 3º...) para cada usuário
      const ranking = rows.map((usuario, index) => ({
        posicao: index + 1,
        nome: usuario.nome,
        pontuacao_total: usuario.pontuacao_total
      }));

      res.json(ranking);
    }
  });
});

// Rota para adicionar (ou atualizar) a pontuação de um usuário
app.post('/usuarios/:id/pontuacao', express.json(), (req, res) => {
  const usuarioId = req.params.id;
  const { pontos } = req.body; // Exemplo: { "pontos": 50 }

  if (typeof pontos !== 'number') {
    return res.status(400).json({ erro: "Campo 'pontos' deve ser um número." });
  }

  // Atualiza a pontuação total
  const query = `
    UPDATE usuarios
    SET pontuacao_total = pontuacao_total + ?
    WHERE id = ?
  `;

  db.run(query, [pontos, usuarioId], function (err) {
    if (err) {
      console.error("Erro ao atualizar pontuação:", err.message);
      res.status(500).json({ erro: "Erro interno do servidor." });
    } else if (this.changes === 0) {
      res.status(404).json({ erro: "Usuário não encontrado." });
    } else {
      // Busca a nova pontuação atualizada
      db.get(
        `SELECT nome, pontuacao_total FROM usuarios WHERE id = ?`,
        [usuarioId],
        (err, row) => {
          if (err) {
            console.error("Erro ao buscar pontuação atualizada:", err.message);
            res.status(500).json({ erro: "Erro ao buscar dados atualizados." });
          } else {
            res.json({
              mensagem: "Pontuação atualizada com sucesso!",
              id: usuarioId,
              nome: row.nome,
              pontuacao_total: row.pontuacao_total
            });
          }
        }
      );
    }
  });
});



// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
