# 🔧 Correção da Tabela usuariogrupo

## Problema Identificado
A tabela `usuariogrupo` tem estrutura incorreta:
- Primary key atual: `admin` (incorreta)
- Campo `usuario_id` sem valor padrão causando erro
- Estrutura não condiz com o que o código espera

## Estrutura Esperada vs. Atual
### ❌ Estrutura Problemática (Atual):
```sql
-- Primary key: admin
-- Campo: usuario_id (sem default)
-- Pode ter outras inconsistências
```

### ✅ Estrutura Correta (Desejada):
```sql
CREATE TABLE usuariogrupo (
  id INT AUTO_INCREMENT PRIMARY KEY,        -- Primary key correta
  usuario_login VARCHAR(255) NOT NULL,      -- Login do usuário
  grupo_id INT NOT NULL,                     -- ID do grupo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_group (usuario_login, grupo_id),
  INDEX idx_usuario_login (usuario_login),
  INDEX idx_grupo_id (grupo_id)
);
```

## Como Executar a Correção

### Opção 1: Interface Web (Mais Fácil) ⭐
1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acesse a página de correção:**
   ```
   http://localhost:3000/fix-database
   ```

3. **Clique no botão "Executar Correção do Database"**

### Opção 2: API Direta
```bash
# Com o servidor rodando, faça uma requisição POST:
curl -X POST http://localhost:3000/api/fix-database
```

### Opção 3: Script SQL Manual (Se necessário)
```bash
# Conecte ao MySQL e execute:
mysql -u [usuario] -p [senha] [database] < scripts/fix-usuariogrupo-table.sql
```

## ⚠️ Importante: Backup Automático
O script automaticamente:
1. 💾 Cria backup dos dados: `usuariogrupo_backup`
2. 🔧 Corrige a estrutura da tabela
3. 📊 Preserva todos os dados existentes
4. ✅ Valida a estrutura final

## Verificações Pós-Execução
Após executar o script, verifique:

1. **Estrutura correta:**
   ```sql
   DESCRIBE usuariogrupo;
   ```

2. **Dados preservados:**
   ```sql
   SELECT COUNT(*) FROM usuariogrupo;
   SELECT COUNT(*) FROM usuariogrupo_backup; -- Devem ser iguais
   ```

3. **Primary key correta:**
   ```sql
   SHOW INDEX FROM usuariogrupo WHERE Key_name = 'PRIMARY';
   ```

## Logs de Execução
O script fornece logs detalhados:
- ✅ Operações bem-sucedidas
- ⚠️ Avisos e situações esperadas
- ❌ Erros que precisam atenção
- 📊 Estatísticas dos dados

## Solução de Problemas

### Se der erro de conexão:
1. Verifique o arquivo `.env.local`
2. Confirme credenciais do banco
3. Teste conexão manual

### Se der erro de permissões:
```sql
GRANT ALL PRIVILEGES ON [database].* TO '[usuario]'@'localhost';
FLUSH PRIVILEGES;
```

### Para reverter (se necessário):
```sql
-- 1. Remover tabela atual
DROP TABLE usuariogrupo;

-- 2. Restaurar do backup
CREATE TABLE usuariogrupo AS SELECT * FROM usuariogrupo_backup;

-- 3. Recriar índices se necessário
```

## Status das Correções
- [x] Script de correção criado
- [x] Backup automático implementado
- [x] Estrutura de tabela definida
- [x] Logs detalhados adicionados
- [x] API atualizada para nova estrutura
- [ ] **Script executado** ⬅️ **EXECUTE ESTE PASSO**
- [ ] Testes de funcionalidade

## Próximos Passos
1. **Execute o script:** `node scripts/fix-usuariogrupo-table.js`
2. **Teste a edição de usuários** na interface
3. **Verifique os grupos de acesso** funcionando
4. **Remova arquivos de backup** após confirmação

---

**⚡ Execute agora:** 
1. `npm run dev`
2. Acesse: `http://localhost:3000/fix-database`
3. Clique em "Executar Correção do Database"