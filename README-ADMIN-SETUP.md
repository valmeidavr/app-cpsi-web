# Configuração do Usuário Administrador

Este guia explica como configurar um usuário administrador no sistema CPSI.

## 📋 Pré-requisitos

1. **MySQL rodando** na sua máquina
2. **Banco de dados `cpsi_acesso`** criado
3. **Node.js** instalado
4. **Dependências** instaladas (`npm install` ou `yarn install`)

## 🔧 Configuração das Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes configurações:

```env
# Configurações do MySQL - Banco de Acesso
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_PORT=3306
MYSQL_ACCESS_DB=cpsi_acesso

# Configurações do MySQL - Banco Gestor
MYSQL_GESTOR_HOST=localhost
MYSQL_GESTOR_PASSWORD=root
MYSQL_GESTOR_DB=gestor

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Executando a Configuração

### Opção 1: Script Completo (Recomendado)
```bash
node setup-admin.js
```

### Opção 2: Scripts Individuais

1. **Criar usuário admin:**
```bash
node create-admin-user.js
```

2. **Testar configuração:**
```bash
node test-admin-user.js
```

## 📊 O que os Scripts Fazem

### `create-admin-user.js`
- ✅ Conecta ao banco de dados `cpsi_acesso`
- ✅ Cria as tabelas necessárias se não existirem:
  - `usuarios` - Tabela de usuários
  - `usuario_sistema` - Permissões de usuários
  - `sistemas` - Sistemas disponíveis
- ✅ Cria/atualiza usuário administrador
- ✅ Configura permissões de administrador
- ✅ Hash da senha com bcrypt

### `test-admin-user.js`
- ✅ Verifica se o usuário foi criado corretamente
- ✅ Testa a autenticação
- ✅ Lista todas as permissões
- ✅ Valida a estrutura do banco

### `setup-admin.js`
- ✅ Executa todos os scripts em sequência
- ✅ Verifica configurações
- ✅ Fornece relatório completo

## 👤 Usuário Administrador Criado

**Credenciais padrão:**
- **Login:** `admin`
- **Senha:** `admin123`
- **Nome:** `Administrador do Sistema`
- **Email:** `admin@cpsi.com`
- **Nível:** `Administrador`
- **Status:** `Ativo`

## 🔐 Estrutura do Banco de Dados

### Tabela `usuarios`
```sql
CREATE TABLE usuarios (
  login VARCHAR(255) PRIMARY KEY,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo'
);
```

### Tabela `usuario_sistema`
```sql
CREATE TABLE usuario_sistema (
  sistemas_id INT,
  usuarios_login VARCHAR(255),
  nivel VARCHAR(255),
  PRIMARY KEY (sistemas_id, usuarios_login)
);
```

### Tabela `sistemas`
```sql
CREATE TABLE sistemas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL
);
```

## 🧪 Testando o Login

Após executar os scripts, você pode testar o login:

1. **Inicie o servidor:**
```bash
npm run dev
# ou
yarn dev
```

2. **Acesse:** `http://localhost:3000`

3. **Faça login com:**
   - Usuário: `admin`
   - Senha: `admin123`

## ⚠️ Segurança

**IMPORTANTE:** Após o primeiro login, altere a senha padrão!

1. Acesse o painel administrativo
2. Vá para a seção de perfil
3. Altere a senha para uma mais segura

## 🔧 Solução de Problemas

### Erro de Conexão
```
❌ Erro ao conectar ao banco de dados
```
**Solução:** Verifique se o MySQL está rodando e as credenciais estão corretas.

### Tabela Não Encontrada
```
❌ Tabela usuarios não encontrada
```
**Solução:** O script criará automaticamente as tabelas necessárias.

### Usuário Já Existe
```
⚠️ Usuário admin já existe! Atualizando...
```
**Solução:** O script atualizará o usuário existente com as novas configurações.

### Permissão Negada
```
❌ Access denied for user 'root'@'localhost'
```
**Solução:** Verifique se o usuário MySQL tem permissões para criar/alterar tabelas.

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs de erro
2. Confirme se todas as dependências estão instaladas
3. Verifique se o banco de dados está acessível
4. Execute o script de teste para diagnóstico

## 🎯 Próximos Passos

Após configurar o usuário admin:

1. ✅ Faça login no sistema
2. ✅ Altere a senha padrão
3. ✅ Configure outros usuários se necessário
4. ✅ Explore o painel administrativo
5. ✅ Configure as permissões do sistema

