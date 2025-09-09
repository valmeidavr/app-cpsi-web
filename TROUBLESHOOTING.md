# Troubleshooting Guide - Sistema CPSI

## React Server Components Bundler Errors

### Problema
```
Error: Could not find the module "/path/to/module#ComponentName" in the React Client Manifest. This is probably a bug in the React Server Components bundler.
```

### Solução Implementada
1. **Downgrade para Next.js 14.2.15** - Versão estável sem bugs de bundler
2. **Configuração Estável** - Removidas features experimentais que causam conflitos
3. **Scripts de Limpeza** - Comandos para limpar cache quando necessário

### Scripts Disponíveis
```bash
npm run clean          # Remove .next, node_modules, package-lock.json
npm run fresh-install  # Limpa tudo e reinstala
npm run dev-clean      # Remove apenas .next e inicia dev server
```

### Quando Usar
- Se aparecer o erro de React Server Components
- Após atualizar dependências
- Se o servidor não inicializar corretamente
- Em caso de erros estranhos de bundler

## Erro "Field 'updatedAt' doesn't have a default value"

### Problema
Erro MySQL ao inserir registros sem definir campos de timestamp.

### Solução
Sempre incluir `createdAt` e `updatedAt` nos INSERTs e `updatedAt` nos UPDATEs:

```javascript
const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
// INSERT com timestamps
`INSERT INTO table (field1, field2, createdAt, updatedAt) VALUES (?, ?, ?, ?)`
// UPDATE com timestamp
`UPDATE table SET field1 = ?, updatedAt = ? WHERE id = ?`
```

## Erro "npm error Invalid Version"

### Problema
Erro durante `npm install` após mudanças de versão ou downgrade de dependências.

### Solução
1. **Limpeza Completa**:
```bash
rm -rf node_modules package-lock.json .next
npm cache clean --force
```

2. **Criar .npmrc** (se não existir):
```bash
echo "legacy-peer-deps=true
save-exact=true
package-lock=true" > .npmrc
```

3. **Reinstalar**:
```bash
npm install
```

### Quando Usar
- Após downgrade de versões (ex: Next.js 15 → 14)
- Erro "Invalid Version" no npm install
- Conflitos de dependências peer-to-peer

## Prevenção de Erros

### 1. Versões Estáveis
- Next.js: 14.2.15 (não usar 15.x até estabilizar)
- React: 18.3.1
- Node.js: 22.x

### 2. Desenvolvimento
- Sempre usar `npm run dev-clean` se houver erros estranhos
- Não usar features experimentais em produção
- Testar build antes de deploy: `npm run build`

### 3. Banco de Dados
- Sempre incluir timestamps em operações de banco
- Usar transações para operações críticas
- Validar dados antes de INSERT/UPDATE

## Comandos de Emergência

### Limpar Tudo e Recomeçar
```bash
npm run fresh-install
npm run dev
```

### Verificar se Build Funciona
```bash
npm run build
```

### Debug do Servidor
```bash
npm run dev-clean
```

## Estrutura de Arquivos Importantes

- `next.config.js` - Configuração do Next.js (não usar .ts em v14)
- `package.json` - Versões fixas das dependências
- `src/app/api/*/route.ts` - Rotas da API com timestamps corretos
- `.next/` - Cache do Next.js (deletar se houver problemas)

## Contato para Suporte
Em caso de problemas não cobertos neste guia, verificar:
1. Este arquivo primeiro
2. Logs do servidor (`npm run dev`)
3. Console do browser (F12)
4. Documentação do Next.js 14.x