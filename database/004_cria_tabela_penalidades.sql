-- Cria a tabela 'penalidades' apenas se ela ainda não existir
CREATE TABLE IF NOT EXISTS penalidades (
  
  -- Um número de identificação único e automático para cada penalidade registrada
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- O ID do aluno que recebeu a penalidade (para conectar com a tabela 'usuarios')
  aluno_id INTEGER NOT NULL,
  
  -- O motivo, uma descrição do porquê a penalidade aconteceu (ex: "Falta na aula de 08/10/2025")
  motivo TEXT NOT NULL,
  
  -- O número de pontos que foram deduzidos por causa desta penalidade
  pontos_deduzidos INTEGER DEFAULT 0,

  -- A data e hora em que a penalidade foi registrada no sistema
  data TEXT NOT NULL,
  
  -- Uma regra que garante que o 'aluno_id' aqui sempre vai ser um 'id' válido da tabela 'usuarios'
  FOREIGN KEY (aluno_id) REFERENCES usuarios (id)
);