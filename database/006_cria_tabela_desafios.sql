CREATE TABLE IF NOT EXISTS desafios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  pontos INTEGER NOT NULL,
  prazo_final TEXT, -- A data limite para completar o desafio
  criado_por_professor_id INTEGER,
  FOREIGN KEY (criado_por_professor_id) REFERENCES usuarios (id)
);