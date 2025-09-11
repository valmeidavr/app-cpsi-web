# Configuração do Arquivo .env

Para resolver o problema de conexão com o banco de dados, você precisa criar um arquivo `.env` na raiz do projeto com as seguintes configurações:

## Arquivo .env

Crie um arquivo chamado `.env` na raiz do projeto (mesmo nível do package.json) com o seguinte conteúdo:

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

# Configurações adicionais do pool MySQL
MYSQL_POOL_CONNECTION_LIMIT=3
MYSQL_POOL_QUEUE_LIMIT=5
MYSQL_POOL_WAIT_FOR_CONNECTIONS=true
MYSQL_QUERY_TIMEOUT=30000
MYSQL_CONNECTION_TIMEOUT=60000
MYSQL_MAX_RETRIES=3
MYSQL_RETRY_DELAY=1000
```

## Principais Mudanças Realizadas

1. **Banco único**: Agora o sistema usa apenas um banco de dados chamado `prevsaude` que contém todos os dados.

2. **Host alterado para IPv4**: Mudei de `localhost` para `127.0.0.1` para forçar o uso de IPv4 e evitar problemas com IPv6.

3. **Teste de conexão**: Adicionei uma função `testConnection()` que verifica se o banco está acessível antes de tentar autenticar.

4. **Logs de debug**: Adicionei logs para ajudar a identificar problemas de conexão.

5. **Tratamento de erros melhorado**: O sistema agora mostra mensagens mais claras quando há problemas de conexão.

6. **Simplificação da configuração**: Removidas as configurações separadas para banco de acesso e gestor.

## Verificações Necessárias

1. **MySQL está rodando**: Certifique-se de que o MySQL está rodando na porta 3306
2. **Credenciais corretas**: Verifique se o usuário `root` e senha `root` estão corretos
3. **Banco existe**: Confirme se o banco `prevsaude` existe
4. **Tabelas existem**: Verifique se as tabelas `usuarios`, `sistemas` e `usuario_sistema` existem no banco `prevsaude`

## Testando a Conexão

Após criar o arquivo `.env`, reinicie o servidor e tente fazer login. Você verá logs detalhados no console que ajudarão a identificar qualquer problema restante.
