-- Script para adicionar campos id nas tabelas usuarios e usuariogrupo

-- Adicionar campo id na tabela usuarios (se não existir)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Adicionar campo id na tabela usuariogrupo (se não existir)
ALTER TABLE usuariogrupo 
ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Verificar se os campos foram adicionados
DESCRIBE usuarios;
DESCRIBE usuariogrupo;
