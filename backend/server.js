// Importar os pacotes
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

// Criar a aplicação Express
const app = express();

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Definir a porta
const PORT = 3000;

// ------------------------------------------
// Conectar ao banco de dados SQLite
// ------------------------------------------
const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");

    // Executar as criações em sequência
    db.serialize(() => {

      // Criar tabela de usuários
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL
      )`, (err) => {
        if (err) console.error("Erro ao criar a tabela 'usuarios':", err.message);
        else console.log("Tabela 'usuarios' pronta para uso.");
      });

      // Criar tabela de atividades
      db.run(`CREATE TABLE IF NOT EXISTS atividades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        pontos INTEGER DEFAULT 0,
        professor_id INTEGER,
        FOREIGN KEY (professor_id) REFERENCES usuarios(id)
      )`, (err) => {
        if (err) console.error("Erro ao criar a tabela 'atividades':", err.message);
        else console.log("Tabela 'atividades' pronta para uso.");
      });

      // Criar tabela de pontuações
      db.run(`CREATE TABLE IF NOT EXISTS pontuacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aluno_id INTEGER NOT NULL,
        atividade_id INTEGER,
        pontos INTEGER NOT NULL,
        data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
        FOREIGN KEY (atividade_id) REFERENCES atividades(id)
      )`, (err) => {
        if (err) console.error("Erro ao criar a tabela 'pontuacoes':", err.message);
        else console.log("Tabela 'pontuacoes' pronta para uso.");
      });

      // Criar tabela de presenças
      db.run(`CREATE TABLE IF NOT EXISTS presencas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aluno_id INTEGER NOT NULL,
        data_aula DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK(status IN ('presente','ausente')) NOT NULL,
        pontos_alterados INTEGER DEFAULT 0,
        FOREIGN KEY (aluno_id) REFERENCES usuarios(id)
      )`, (err) => {
        if (err) console.error("Erro ao criar a tabela 'presencas':", err.message);
        else console.log("Tabela 'presencas' pronta para uso.");
      });

      console.log("Banco configurado com sucesso.");
    });
  }
});

// ------------------------------------------
// ROTAS
// ------------------------------------------

// Rota inicial de teste
app.get('/', (req, res) => {
  res.send('Servidor funcionando e conectado ao banco de dados!');
});

// ------------------ USUÁRIOS ------------------

// Listar todos os usuários
app.get('/usuarios', (req, res) => {
  db.all('SELECT * FROM usuarios', [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

// Cadastrar novo usuário
app.post('/usuarios', (req, res) => {
  const { nome, email, senha, tipo } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  const sql = 'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)';
  db.run(sql, [nome, email, senha, tipo], function (err) {
    if (err) return res.status(500).json({ erro: err.message });

    res.status(201).json({
      id: this.lastID,
      nome,
      email,
      tipo
    });
  });
});

// ------------------ ATIVIDADES ------------------

// Listar todas as atividades
app.get('/atividades', (req, res) => {
  db.all('SELECT * FROM atividades', [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

// Cadastrar nova atividade
app.post('/atividades', (req, res) => {
  const { titulo, descricao, pontos, professor_id } = req.body;

  if (!titulo || !pontos || !professor_id) {
    return res.status(400).json({ erro: 'Título, pontos e professor_id são obrigatórios.' });
  }

  const sql = 'INSERT INTO atividades (titulo, descricao, pontos, professor_id) VALUES (?, ?, ?, ?)';
  db.run(sql, [titulo, descricao, pontos, professor_id], function (err) {
    if (err) return res.status(500).json({ erro: err.message });

    res.status(201).json({
      id: this.lastID,
      titulo,
      descricao,
      pontos,
      professor_id
    });
  });
});

// ------------------ PONTUAÇÕES ------------------

// Listar pontuação total apenas de alunos
app.get('/pontuacoes', (req, res) => {
  const sql = `
    SELECT 
      u.id AS aluno_id,
      u.nome AS aluno_nome,
      SUM(p.pontos) AS pontuacao_total
    FROM usuarios u
    LEFT JOIN pontuacoes p ON u.id = p.aluno_id
    WHERE u.tipo = 'aluno'
    GROUP BY u.id
    ORDER BY pontuacao_total DESC;
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

// Registrar pontuação de aluno em uma atividade
app.post('/pontuacoes', (req, res) => {
  const { aluno_id, atividade_id, pontos } = req.body;

  if (!aluno_id || !atividade_id || !pontos) {
    return res.status(400).json({ erro: 'aluno_id, atividade_id e pontos são obrigatórios.' });
  }

  // Verificar se o usuário é aluno antes de inserir
  db.get('SELECT tipo FROM usuarios WHERE id = ?', [aluno_id], (err, usuario) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    if (usuario.tipo === 'professor') {
      return res.status(400).json({ erro: 'Professores não devem ter pontuação.' });
    }

    const sql = 'INSERT INTO pontuacoes (aluno_id, atividade_id, pontos) VALUES (?, ?, ?)';
    db.run(sql, [aluno_id, atividade_id, pontos], function (err) {
      if (err) return res.status(500).json({ erro: err.message });

      res.status(201).json({
        id: this.lastID,
        aluno_id,
        atividade_id,
        pontos
      });
    });
  });
});

// ------------------ PRESENÇAS ------------------

// Registrar presença ou falta
app.post('/presencas', (req, res) => {
  const { aluno_id, status } = req.body;

  if (!aluno_id || !status) {
    return res.status(400).json({ erro: 'aluno_id e status são obrigatórios.' });
  }

  // Verificar se o usuário é aluno
  db.get('SELECT tipo FROM usuarios WHERE id = ?', [aluno_id], (err, usuario) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    if (usuario.tipo === 'professor') {
      return res.status(400).json({ erro: 'Somente alunos podem ter presença registrada.' });
    }

    const pontos_alterados = status === 'presente' ? 10 : -5;

    db.run(
      'INSERT INTO presencas (aluno_id, status, pontos_alterados) VALUES (?, ?, ?)',
      [aluno_id, status, pontos_alterados],
      function (err) {
        if (err) return res.status(500).json({ erro: err.message });

        db.run('INSERT INTO pontuacoes (aluno_id, atividade_id, pontos) VALUES (?, NULL, ?)', [aluno_id, pontos_alterados]);

        res.status(201).json({
          id: this.lastID,
          aluno_id,
          status,
          pontos_alterados,
          mensagem: `Presença registrada e ${pontos_alterados > 0 ? 'pontos adicionados' : 'pontos reduzidos'}.`
        });
      }
    );
  });
});

// Listar todas as presenças
app.get('/presencas', (req, res) => {
  const sql = `
    SELECT 
      p.id,
      u.nome AS aluno_nome,
      p.data_aula,
      p.status,
      p.pontos_alterados
    FROM presencas p
    JOIN usuarios u ON p.aluno_id = u.id
    ORDER BY p.data_aula DESC;
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

// ------------------ RANKING ------------------

// Exibir ranking atualizado com soma total
app.get('/ranking', (req, res) => {
  const sql = `
    SELECT 
      u.id AS aluno_id,
      u.nome AS aluno_nome,
      COALESCE(SUM(p.pontos), 0) AS pontuacao_total
    FROM usuarios u
    LEFT JOIN pontuacoes p ON u.id = p.aluno_id
    WHERE u.tipo = 'aluno'
    GROUP BY u.id
    ORDER BY pontuacao_total DESC, u.nome ASC;
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({
      total_alunos: rows.length,
      ranking: rows
    });
  });
});

// ------------------------------------------
// INICIAR SERVIDOR
// ------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});