import * as fs from 'fs';
import * as path from 'path';

// Padrões comuns de tipos any que podem ser substituídos
const typeReplacements = [
  // Resultados de queries do banco
  {
    pattern: /\(result as any\)\.insertId/g,
    replacement: '(result as { insertId: number }).insertId'
  },
  {
    pattern: /\(rows as any\[\]\)/g,
    replacement: '(rows as Array<unknown>)'
  },
  {
    pattern: /\(countRows as any\[\]\)/g,
    replacement: '(countRows as Array<{ total: number }>)'
  },
  {
    pattern: /\(clienteRows as any\[\]\)/g,
    replacement: '(clienteRows as Array<{ nome: string }>)'
  },
  {
    pattern: /\(procedimentoRows as any\[\]\)/g,
    replacement: '(procedimentoRows as Array<{ nome: string }>)'
  },
  {
    pattern: /\(caixaRows as any\[\]\)/g,
    replacement: '(caixaRows as Array<{ id: number }>)'
  },
  {
    pattern: /\(planoContaRows as any\[\]\)/g,
    replacement: '(planoContaRows as Array<{ id: number }>)'
  },
  {
    pattern: /\(usuarioRows as any\[\]\)/g,
    replacement: '(usuarioRows as Array<{ login: string }>)'
  },
  // Parâmetros de função
  {
    pattern: /params: any\[\]/g,
    replacement: 'params: unknown[]'
  },
  // Variáveis de erro
  {
    pattern: /catch \(error: any\)/g,
    replacement: 'catch (error)'
  },
  {
    pattern: /let lastError: any/g,
    replacement: 'let lastError: Error'
  }
];

// Função para processar um arquivo
function processFile(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Aplicar todas as substituições
    for (const replacement of typeReplacements) {
      if (replacement.pattern.test(content)) {
        content = content.replace(replacement.pattern, replacement.replacement);
        modified = true;
      }
    }

    // Se o arquivo foi modificado, salvar
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error);
  }
}

// Função para processar um diretório recursivamente
function processDirectory(dirPath: string): void {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

// Diretórios para processar
const directories = [
  'src/app/api',
  'src/app/painel',
  'src/components',
  'src/lib'
];

console.log('🔧 Iniciando correção automática de tipos...');

// Processar cada diretório
for (const dir of directories) {
  if (fs.existsSync(dir)) {
    console.log(`\n📁 Processando: ${dir}`);
    processDirectory(dir);
  }
}

console.log('\n✨ Correção automática concluída!');
console.log('📝 Execute "npm run lint" para verificar os problemas restantes.');
