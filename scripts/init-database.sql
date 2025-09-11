-- Script de inicialização do banco de dados prevsaude
-- Este script será executado automaticamente quando o container MySQL for criado

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS prevsaude;
USE prevsaude;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    senha VARCHAR(255),
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de sistemas
CREATE TABLE IF NOT EXISTS sistemas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de grupos
CREATE TABLE IF NOT EXISTS grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de relacionamento usuário-sistema
CREATE TABLE IF NOT EXISTS usuario_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sistema_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sistema_id) REFERENCES sistemas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_sistema (usuario_id, sistema_id)
);

-- Tabela de relacionamento usuário-grupo
CREATE TABLE IF NOT EXISTS usuario_grupo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    grupo_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_grupo (usuario_id, grupo_id)
);

-- Inserir dados iniciais
INSERT IGNORE INTO sistemas (nome, descricao) VALUES 
('prevSaúde', 'Sistema de Gestão da AAPVR'),
('ADMIN', 'Sistema Administrativo');

INSERT IGNORE INTO grupos (nome, descricao) VALUES 
('ADMIN', 'Administradores do sistema'),
('GESTOR', 'Gestores do sistema'),
('USUARIO', 'Usuários comuns');

-- Inserir usuário administrador padrão
INSERT IGNORE INTO usuarios (login, nome, email, senha, status) VALUES 
('admin', 'Administrador', 'admin@aapvr.org.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ativo');

-- Associar usuário admin ao sistema prevSaúde
INSERT IGNORE INTO usuario_sistema (usuario_id, sistema_id) 
SELECT u.id, s.id 
FROM usuarios u, sistemas s 
WHERE u.login = 'admin' AND s.nome = 'prevSaúde';

-- Associar usuário admin ao grupo ADMIN
INSERT IGNORE INTO usuario_grupo (usuario_id, grupo_id) 
SELECT u.id, g.id 
FROM usuarios u, grupos g 
WHERE u.login = 'admin' AND g.nome = 'ADMIN';

-- Criar tabelas básicas do sistema
CREATE TABLE IF NOT EXISTS caixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    tipo ENUM('CAIXA', 'BANCO') DEFAULT 'CAIXA',
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plano_contas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo ENUM('RECEITA', 'DESPESA') NOT NULL,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lancamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    valor DECIMAL(10,2) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    data_lancamento DATE NOT NULL,
    tipo ENUM('ENTRADA', 'SAIDA', 'ESTORNO', 'TRANSFERENCIA') NOT NULL,
    cliente_id INT NULL,
    plano_conta_id INT NOT NULL,
    caixa_id INT NOT NULL,
    lancamento_original_id INT NULL,
    id_transferencia INT NULL,
    motivo_estorno TEXT NULL,
    motivo_transferencia TEXT NULL,
    forma_pagamento ENUM('DINHEIRO', 'CARTAO', 'CHEQUE', 'BOLETO', 'PIX') NOT NULL,
    status_pagamento ENUM('PENDENTE', 'PAGO') NOT NULL,
    agenda_id INT NULL,
    usuario_id VARCHAR(50) NOT NULL,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plano_conta_id) REFERENCES plano_contas(id),
    FOREIGN KEY (caixa_id) REFERENCES caixas(id)
);

-- Inserir dados iniciais para caixas
INSERT IGNORE INTO caixas (nome, saldo, tipo) VALUES 
('Caixa Principal', 0.00, 'CAIXA'),
('Banco do Brasil', 0.00, 'BANCO');

-- Inserir dados iniciais para plano de contas
INSERT IGNORE INTO plano_contas (nome, descricao, tipo) VALUES 
('Receitas de Mensalidades', 'Receitas provenientes de mensalidades dos associados', 'RECEITA'),
('Receitas de Eventos', 'Receitas provenientes de eventos e atividades', 'RECEITA'),
('Despesas Administrativas', 'Despesas com administração e gestão', 'DESPESA'),
('Despesas de Eventos', 'Despesas com organização de eventos', 'DESPESA');

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_caixa ON lancamentos(caixa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_plano_conta ON lancamentos(plano_conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_usuario ON lancamentos(usuario_id);
