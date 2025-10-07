// Importar os pacotes
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // .verbose() nos dá mais informações no console

// Criar a aplicação Express
const app = express();

// Definir a porta
const PORT = 3000;

// --- NOVO CÓDIGO DO BANCO DE DADOS ---

// Conectar ao banco de dados SQLite
// Se o arquivo 'banco.db' não existir, ele será criado.
const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    // Erro ao conectar
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    // Conexão bem-sucedida
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
    
    // Criar a tabela de usuários (se ela não existir)
    // Usamos 'db.run' para executar comandos SQL que não retornam dados
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      tipo TEXT NOT NULL
    )`, (err) => {
      if (err) {
        // Erro ao criar a tabela
        console.error("Erro ao criar a tabela 'usuarios':", err.message);
      } else {
        // Tabela criada ou já existente
        console.log("Tabela 'usuarios' pronta para uso.");
      }
    });
  }
});

// --- FIM DO NOVO CÓDIGO ---


// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor funcionando e conectado ao banco de dados!');
});

// --- NOVA ROTA ADICIONADA AQUI ---
// Rota para buscar a pontuação de um usuário (exemplo)
// No navegador, acesse: http://localhost:3000/usuarios/1/pontuacao
app.get('/usuarios/:id/pontuacao', (req, res) => {
  const usuarioId = req.params.id;

  // POR ENQUANTO: Retornamos um valor fixo (mockado)
  // NO FUTURO: Aqui buscaremos no banco de dados de verdade usando o usuarioId
  const pontuacaoMockada = 150;

  // Enviamos a resposta em formato JSON
  res.json({
    usuarioId: usuarioId,
    pontuacao: pontuacaoMockada
  });
});
// --- FIM DA NOVA ROTA ---


// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});