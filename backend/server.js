// 1. Importar o pacote Express
const express = require('express');

// 2. Criar uma instância do Express que vamos chamar de "app"
const app = express();

// 3. Definir a porta em que o servidor vai rodar
// Usar 3000 é um padrão para desenvolvimento local
const PORT = 3000;

// 4. Criar uma rota de teste
// Quando alguém acessar o endereço principal do nosso site (http://localhost:3000/)
// o servidor vai responder com a mensagem "Servidor funcionando!".
app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

// 5. Iniciar o servidor e fazê-lo "escutar" na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});