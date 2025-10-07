-- Limpa a tabela para garantir que não haja dados duplicados
DELETE FROM usuarios;

-- Insere 3 usuários de teste com pontuações diferentes
INSERT INTO usuarios (nome, email, senha, tipo, pontuacao_total) VALUES 
('Ana', 'ana@email.com', 'senha123', 'aluno', 250),
('Beto', 'beto@email.com', 'senha123', 'aluno', 500),
('Carla', 'carla@email.com', 'senha123', 'aluno', 120);