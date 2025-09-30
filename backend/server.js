// 1. Importar os pacotes
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // .verbose() nos dá mais informações no console

// 2. Criar a aplicação Express
const app = express();

// 3. Definir a porta
const PORT = 3000;

// --- NOVO CÓDIGO DO BANCO DE DADOS ---

// 4. Conectar ao banco de dados SQLite
// Se o arquivo 'banco.db' não existir, ele será criado.
const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    // Erro ao conectar
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    // Conexão bem-sucedida
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
    
    // 5. Criar a tabela de usuários (se ela não existir)
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

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});