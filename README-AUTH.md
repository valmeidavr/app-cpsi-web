# Configuração de Autenticação com MySQL e NextAuth

Este projeto utiliza NextAuth.js com MySQL para autenticação de usuários.

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

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
NEXTAUTH_SECRET=sua_chave_secreta_aqui
NEXTAUTH_URL=http://localhost:3000
```

### 2. Estrutura do Banco de Dados

O sistema espera as seguintes tabelas no banco `cpsi_acesso`:

#### Tabela `usuarios`
```sql
CREATE TABLE usuarios (
  login VARCHAR(255) PRIMARY KEY,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo'
);
```

#### Tabela `usuario_sistema`
```sql
CREATE TABLE usuario_sistema (
  sistemas_id INT,
  usuarios_login VARCHAR(255),
  nivel VARCHAR(255),
  PRIMARY KEY (sistemas_id, usuarios_login)
);
```

### 3. Como Usar

#### Hook de Autenticação
```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { session, isAuthenticated, isAdmin, login, logout } = useAuth()
  
  // Verificar se está autenticado
  if (!isAuthenticated) {
    return <div>Faça login para continuar</div>
  }
  
  return (
    <div>
      <p>Bem-vindo, {session?.user?.name}</p>
      {isAdmin && <p>Você é administrador</p>}
      <button onClick={logout}>Sair</button>
    </div>
  )
}
```

#### Proteção de Rotas
O middleware já está configurado para proteger as rotas:
- `/painel/*` - Área administrativa
- `/api/protected/*` - APIs protegidas

#### Login Programático
```typescript
const { login } = useAuth()

const handleLogin = async () => {
  try {
    await login('usuario', 'senha')
    // Redirecionamento automático após login
  } catch (error) {
    console.error('Erro no login:', error)
  }
}
```

#### Autenticação no Servidor
```typescript
import { requireAuth, requireAdmin, getCurrentUser } from '@/lib/auth-utils'

// Página que requer autenticação
export default async function ProtectedPage() {
  const session = await requireAuth() // Redireciona se não autenticado
  return <div>Bem-vindo, {session.user.name}</div>
}

// Página que requer admin
export default async function AdminPage() {
  const session = await requireAdmin() // Redireciona se não for admin
  return <div>Área administrativa</div>
}

// Obter usuário atual sem redirecionamento
export default async function UserPage() {
  const user = await getCurrentUser()
  return <div>{user ? `Olá, ${user.name}` : 'Usuário não logado'}</div>
}
```

### 4. Funcionalidades

- ✅ Autenticação com MySQL
- ✅ Compatibilidade com hash bcrypt do Laravel
- ✅ Verificação de status do usuário
- ✅ Controle de administradores
- ✅ Proteção de rotas
- ✅ Sessões JWT
- ✅ Hook personalizado para autenticação

### 5. Estrutura de Arquivos

```
src/
├── lib/
│   ├── mysql.ts              # Configuração do MySQL
│   ├── auth-mysql.ts         # Lógica de autenticação
│   ├── auth.ts               # Configuração do NextAuth
│   └── auth-utils.ts         # Utilitários de autenticação no servidor
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts  # API route do NextAuth
│   ├── login/
│   │   └── page.tsx          # Página de login
│   └── painel/
│       ├── protected-example/
│       │   └── page.tsx      # Exemplo de página protegida (cliente)
│       └── server-example/
│           └── page.tsx      # Exemplo de página protegida (servidor)
├── components/
│   └── providers/
│       └── AuthProvider.tsx  # Provider do NextAuth
├── hooks/
│   └── useAuth.ts            # Hook personalizado
├── types/
│   └── next-auth.d.ts        # Tipos personalizados
└── middleware.ts             # Middleware de proteção
```

### 6. Próximos Passos

1. Configure as variáveis de ambiente
2. Certifique-se de que o MySQL está rodando
3. Crie as tabelas necessárias
4. Teste o login em `/login`
5. Implemente as funcionalidades específicas do seu sistema 