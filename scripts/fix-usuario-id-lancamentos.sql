-- Script para corrigir o campo usuario_id na tabela lancamentos
-- para usar INT em vez de VARCHAR(50) e adicionar foreign key

USE prevsaude;

-- Step 1: Backup existing data if needed
-- CREATE TABLE lancamentos_backup AS SELECT * FROM lancamentos;

-- Step 2: Add a temporary column with the correct data type
ALTER TABLE lancamentos ADD COLUMN usuario_id_new INT NULL;

-- Step 3: Convert existing data - map login strings to user IDs
UPDATE lancamentos l 
JOIN usuarios u ON l.usuario_id = u.login 
SET l.usuario_id_new = u.id;

-- Step 4: For any remaining records with 'admin' that weren't matched, set to admin user ID
UPDATE lancamentos l 
LEFT JOIN usuarios u ON l.usuario_id = u.login 
SET l.usuario_id_new = (SELECT id FROM usuarios WHERE login = 'admin' LIMIT 1)
WHERE l.usuario_id_new IS NULL AND l.usuario_id = 'admin';

-- Step 5: Drop the old column
ALTER TABLE lancamentos DROP COLUMN usuario_id;

-- Step 6: Rename the new column
ALTER TABLE lancamentos CHANGE COLUMN usuario_id_new usuario_id INT NULL;

-- Step 7: Add foreign key constraint
ALTER TABLE lancamentos 
ADD CONSTRAINT fk_lancamentos_usuario 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Step 8: Update the index
DROP INDEX IF EXISTS idx_lancamentos_usuario ON lancamentos;
CREATE INDEX idx_lancamentos_usuario ON lancamentos(usuario_id);

SELECT 'Script executed successfully - usuario_id is now INT and has proper foreign key' as result;