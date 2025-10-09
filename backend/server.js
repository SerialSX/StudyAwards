// Importar os pacotes
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

// Criar a aplicação Express
const app = express();

// --- ADIÇÃO 1: Habilitar o Servidor para Receber JSON ---
app.use(express.json());

// Definir a porta
const PORT = 3000;

// --- MODIFICAÇÃO 2: A estrutura inteira foi movida para DENTRO da conexão ---
const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
    
    // --- ADIÇÃO 4: Garantir que TODAS as tabelas existam em ordem ---
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha TEXT NOT NULL, tipo TEXT NOT NULL, pontuacao_total INTEGER DEFAULT 0)`);
      db.run(`CREATE TABLE IF NOT EXISTS penalidades (id INTEGER PRIMARY KEY AUTOINCREMENT, aluno_id INTEGER NOT NULL, motivo TEXT NOT NULL, pontos_deduzidos INTEGER DEFAULT 0, data TEXT NOT NULL, FOREIGN KEY (aluno_id) REFERENCES usuarios (id))`);
      db.run(`CREATE TABLE IF NOT EXISTS frequencia (id INTEGER PRIMARY KEY AUTOINCREMENT, aluno_id INTEGER NOT NULL, data_falta TEXT NOT NULL, registrado_por_professor_id INTEGER, FOREIGN KEY (aluno_id) REFERENCES usuarios (id))`);
    });

    // --- ROTAS ---

    // Rota de teste
    app.get('/', (req, res) => {
      res.send('Servidor funcionando e conectado ao banco de dados!');
    });

    // Rota para buscar a pontuação real de um usuário no banco
    app.get('/usuarios/:id/pontuacao', (req, res) => {
      const usuarioId = req.params.id;
      db.get(`SELECT nome, pontuacao_total FROM usuarios WHERE id = ?`, [usuarioId], (err, row) => {
        if (err) { res.status(500).json({ erro: "Erro interno do servidor." }); }
        else if (!row) { res.status(404).json({ erro: "Usuário não encontrado." }); }
        else { res.json({ id: usuarioId, nome: row.nome, pontuacao_total: row.pontuacao_total }); }
      });
    });

    // --- MODIFICAÇÃO 3: A rota duplicada foi removida, mantendo apenas esta ---
    app.get('/ranking', (req, res) => {
      const sql = `SELECT id, nome, pontuacao_total FROM usuarios ORDER BY pontuacao_total DESC`;
      db.all(sql, [], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ ranking: rows });
      });
    });
    
    // Rota para adicionar (ou atualizar) a pontuação de um usuário
    app.post('/usuarios/:id/pontuacao', (req, res) => {
        const usuarioId = req.params.id;
        const { pontos } = req.body;
        if (typeof pontos !== 'number') {
            return res.status(400).json({ erro: "Campo 'pontos' deve ser um número." });
        }
        const query = `UPDATE usuarios SET pontuacao_total = pontuacao_total + ? WHERE id = ?`;
        db.run(query, [pontos, usuarioId], function (err) {
            if (err) { res.status(500).json({ erro: "Erro interno do servidor." }); }
            else if (this.changes === 0) { res.status(404).json({ erro: "Usuário não encontrado." }); }
            else { res.json({ mensagem: "Pontuação atualizada com sucesso!" }); }
        });
    });

    // Rota para um aluno específico visualizar seu histórico de penalidades
    app.get('/alunos/:id/penalidades', (req, res) => {
      const alunoId = req.params.id;
      const sql = "SELECT motivo, pontos_deduzidos, data FROM penalidades WHERE aluno_id = ?";
      db.all(sql, [alunoId], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ historico: rows });
      });
    });

    // --- ADIÇÃO 5: A nova rota para registrar a falta ---
    app.post('/registrar-falta', (req, res) => {
        const { alunoId, dataFalta, professorId, pontosDeduzidos, motivo } = req.body;
        const dataAtual = new Date().toISOString();
        const sqlFrequencia = `INSERT INTO frequencia (aluno_id, data_falta, registrado_por_professor_id) VALUES (?, ?, ?)`;
        db.run(sqlFrequencia, [alunoId, dataFalta, professorId], function (err) {
            if (err) { return res.status(500).json({ error: `Erro ao registrar falta: ${err.message}` }); }
            const sqlPenalidade = `INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`;
            db.run(sqlPenalidade, [alunoId, motivo, pontosDeduzidos, dataAtual], function (err) {
                if (err) { return res.status(500).json({ error: `Erro ao criar penalidade: ${err.message}` }); }
                const sqlPontuacao = `UPDATE usuarios SET pontuacao_total = pontuacao_total - ? WHERE id = ?`;
                db.run(sqlPontuacao, [pontosDeduzidos, alunoId], function(err) {
                    if (err) { return res.status(500).json({ error: `Erro ao atualizar pontuação: ${err.message}`}); }
                    res.status(201).json({ message: "Falta e penalidade registradas com sucesso!" });
                });
            });
        });
    });

// Rota para verificar e aplicar penalidades por tarefas atrasadas
app.get('/verificar-atrasos', (req, res) => {
    const sqlBuscaAtrasos = `
        SELECT 
            ad.id as aluno_desafio_id,
            ad.aluno_id,
            d.titulo as desafio_titulo
        FROM aluno_desafios ad
        JOIN desafios d ON ad.desafio_id = d.id
        WHERE ad.status = 'pendente' AND d.prazo_final < DATE('now')
    `;

    db.all(sqlBuscaAtrasos, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: `Erro ao buscar tarefas atrasadas: ${err.message}` });
        }
        if (rows.length === 0) {
            return res.json({ message: "Nenhuma tarefa atrasada encontrada." });
        }

        let penalidadesAplicadas = 0;
        rows.forEach(tarefa => {
            const pontosDeduzidos = 20; // Penalidade fixa por atraso
            // --- ESTA É A LINHA DA CORREÇÃO PRINCIPAL ---
            const motivo = `Atraso na entrega do desafio: ${tarefa.desafio_titulo}`;
            const dataAtual = new Date().toISOString();

            db.serialize(() => {
                const sqlPenalidade = `INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`;
                db.run(sqlPenalidade, [tarefa.aluno_id, motivo, pontosDeduzidos, dataAtual]);

                const sqlPontuacao = `UPDATE usuarios SET pontuacao_total = pontuacao_total - ? WHERE id = ?`;
                db.run(sqlPontuacao, [pontosDeduzidos, tarefa.aluno_id]);

                const sqlStatusDesafio = `UPDATE aluno_desafios SET status = 'atrasado' WHERE id = ?`;
                db.run(sqlStatusDesafio, [tarefa.aluno_desafio_id]);
                
                penalidadesAplicadas++;
            });
        });

        res.json({ message: `Verificação concluída. ${penalidadesAplicadas} penalidade(s) aplicada(s).` });
    });
});

    // --- INICIAR SERVIDOR ---
    // MODIFICAÇÃO 2 (continuação): O servidor só liga aqui no final, garantindo que tudo está pronto.
    app.listen(PORT, () => {
      console.log(`Servidor iniciado e rodando na porta ${PORT}. O terminal deve travar aqui.`);
    });
  }
});