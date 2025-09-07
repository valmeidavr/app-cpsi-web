-- Execute este script no seu cliente MySQL (phpMyAdmin, MySQL Workbench, etc.)

USE prevsaude;

-- Adicionar campo id na tabela usuarios (se não existir)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Adicionar campo id na tabela usuariogrupo (se não existir)  
ALTER TABLE usuariogrupo 
ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Verificar se os campos foram adicionados
SELECT 'Estrutura da tabela usuarios:' as info;
DESCRIBE usuarios;

SELECT 'Estrutura da tabela usuariogrupo:' as info;
DESCRIBE usuariogrupo;

-- Verificar dados da tabela usuariogrupo
SELECT 'Dados da tabela usuariogrupo:' as info;
SELECT * FROM usuariogrupo WHERE usuario_login = 'admin';
