# 🗄️ Configuração do Banco de Dados

## ❌ Problema Identificado

O sistema está apresentando erro de conexão com o banco de dados:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Isso indica que o MySQL não está rodando na porta 3306.

## ✅ Soluções Disponíveis

### Opção 1: Usar Docker (Recomendado)

1. **Instalar Docker Desktop**
   - Baixe em: https://www.docker.com/products/docker-desktop
   - Instale e reinicie o computador

2. **Iniciar o banco de dados**
   ```bash
   # No Windows (PowerShell)
   .\start-database.ps1
   
   # No Windows (CMD)
   start-database.bat
   
   # No Linux/Mac
   docker-compose up -d
   ```

3. **Verificar se está funcionando**
   ```bash
   docker-compose ps
   ```

### Opção 2: Instalar MySQL Localmente

1. **Baixar MySQL**
   - Baixe o MySQL Community Server: https://dev.mysql.com/downloads/mysql/
   - Instale com as configurações padrão

2. **Configurar MySQL**
   - Usuário: `root`
   - Senha: `root`
   - Porta: `3306`
   - Criar banco: `prevsaude`

3. **Executar script de inicialização**
   ```bash
   mysql -u root -p < scripts/init-database.sql
   ```

### Opção 3: Usar XAMPP/WAMP

1. **Instalar XAMPP**
   - Baixe em: https://www.apachefriends.org/
   - Instale e inicie o MySQL

2. **Configurar**
   - Acesse: http://localhost/phpmyadmin
   - Criar banco: `prevsaude`
   - Executar o script: `scripts/init-database.sql`

## 🔧 Configuração do Arquivo .env

Após configurar o banco, crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do MySQL - Banco Único
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_PORT=3306
MYSQL_DATABASE=prevsaude

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3001
```

## 🧪 Testando a Conexão

Execute o script de teste:
```bash
node test-db-connection.js
```

## 📋 Estrutura do Banco

O banco `prevsaude` será criado com as seguintes tabelas:

- `usuarios` - Usuários do sistema
- `sistemas` - Sistemas disponíveis
- `grupos` - Grupos de usuários
- `usuario_sistema` - Relacionamento usuário-sistema
- `usuario_grupo` - Relacionamento usuário-grupo
- `caixas` - Caixas financeiros
- `plano_contas` - Plano de contas
- `lancamentos` - Lançamentos financeiros

## 🚀 Próximos Passos

1. Configure o banco de dados usando uma das opções acima
2. Crie o arquivo `.env` com as configurações corretas
3. Reinicie o servidor Next.js
4. Teste o login com:
   - Usuário: `admin`
   - Senha: `password`

## 🆘 Suporte

Se ainda houver problemas:

1. Verifique se a porta 3306 está livre:
   ```bash
   netstat -an | findstr :3306
   ```

2. Verifique os logs do MySQL:
   ```bash
   docker-compose logs mysql
   ```

3. Teste a conexão manualmente:
   ```bash
   mysql -h 127.0.0.1 -u root -p
   ```
