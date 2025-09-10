-- Script para corrigir a estrutura da tabela usuariogrupo
-- Altera primary key de 'admin' para 'id' e corrige estrutura

-- 1. Verificar estrutura atual
DESCRIBE usuariogrupo;

-- 2. Fazer backup dos dados existentes
CREATE TABLE IF NOT EXISTS usuariogrupo_backup AS SELECT * FROM usuariogrupo;

-- 3. Remover primary key atual (se for 'admin')
ALTER TABLE usuariogrupo DROP PRIMARY KEY;

-- 4. Remover a coluna 'admin' se existir
ALTER TABLE usuariogrupo DROP COLUMN IF EXISTS admin;

-- 5. Adicionar coluna 'id' se não existir e tornar primary key
ALTER TABLE usuariogrupo 
ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 6. Garantir que usuario_login permite NULL temporariamente para correção
ALTER TABLE usuariogrupo MODIFY COLUMN usuario_login VARCHAR(255) NULL;

-- 7. Remover coluna usuario_id se existir (problemática)
ALTER TABLE usuariogrupo DROP COLUMN IF EXISTS usuario_id;

-- 8. Garantir estrutura correta das colunas
ALTER TABLE usuariogrupo MODIFY COLUMN usuario_login VARCHAR(255) NOT NULL;
ALTER TABLE usuariogrupo MODIFY COLUMN grupo_id INT NOT NULL;

-- 9. Adicionar colunas de timestamp se não existirem
ALTER TABLE usuariogrupo 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 10. Adicionar índices únicos e otimização
ALTER TABLE usuariogrupo DROP INDEX IF EXISTS unique_user_group;
ALTER TABLE usuariogrupo ADD UNIQUE KEY unique_user_group (usuario_login, grupo_id);

ALTER TABLE usuariogrupo DROP INDEX IF EXISTS idx_usuario_login;
ALTER TABLE usuariogrupo ADD INDEX idx_usuario_login (usuario_login);

ALTER TABLE usuariogrupo DROP INDEX IF EXISTS idx_grupo_id;
ALTER TABLE usuariogrupo ADD INDEX idx_grupo_id (grupo_id);

-- 11. Verificar estrutura final
DESCRIBE usuariogrupo;

-- 12. Mostrar alguns dados para verificação
SELECT COUNT(*) as total_records FROM usuariogrupo;
SELECT * FROM usuariogrupo LIMIT 5;