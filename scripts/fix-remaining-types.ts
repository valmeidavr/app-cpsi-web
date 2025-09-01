import * as fs from 'fs';
import * as path from 'path';

const typeReplacements = [
  // Resultados de queries do banco
  { pattern: /\\(result as any\\)\\.insertId/g, replacement: '(result as { insertId: number }).insertId' },
  { pattern: /\\(rows as any\\[\\]\\)/g, replacement: '(rows as Array<unknown>)' },
  { pattern: /\\(countRows as any\\[\\]\\)/g, replacement: '(countRows as Array<{ total: number }>)' },
  { pattern: /\\(clienteRows as any\\[\\]\\)/g, replacement: '(clienteRows as Array<{ nome: string }>)' },
  { pattern: /\\(procedimentoRows as any\\[\\]\\)/g, replacement: '(procedimentoRows as Array<{ nome: string }>)' },
  { pattern: /\\(caixaRows as any\\[\\]\\)/g, replacement: '(caixaRows as Array<{ nome: string }>)' },
  { pattern: /\\(convenioRows as any\\[\\]\\)/g, replacement: '(convenioRows as Array<{ nome: string }>)' },
  { pattern: /\\(especialidadeRows as any\\[\\]\\)/g, replacement: '(especialidadeRows as Array<{ nome: string }>)' },
  { pattern: /\\(expedienteRows as any\\[\\]\\)/g, replacement: '(expedienteRows as Array<{ nome: string }>)' },
  { pattern: /\\(lancamentoRows as any\\[\\]\\)/g, replacement: '(lancamentoRows as Array<{ nome: string }>)' },
  { pattern: /\\(planoContaRows as any\\[\\]\\)/g, replacement: '(planoContaRows as Array<{ nome: string }>)' },
  { pattern: /\\(prestadorRows as any\\[\\]\\)/g, replacement: '(prestadorRows as Array<{ nome: string }>)' },
  { pattern: /\\(procedimentoRows as any\\[\\]\\)/g, replacement: '(procedimentoRows as Array<{ nome: string }>)' },
  { pattern: /\\(tabelaFaturamentoRows as any\\[\\]\\)/g, replacement: '(tabelaFaturamentoRows as Array<{ nome: string }>)' },
  { pattern: /\\(turmaRows as any\\[\\]\\)/g, replacement: '(turmaRows as Array<{ nome: string }>)' },
  { pattern: /\\(unidadeRows as any\\[\\]\\)/g, replacement: '(unidadeRows as Array<{ nome: string }>)' },
  { pattern: /\\(usuarioRows as any\\[\\]\\)/g, replacement: '(usuarioRows as Array<{ nome: string }>)' },
  { pattern: /\\(valorProcedimentoRows as any\\[\\]\\)/g, replacement: '(valorProcedimentoRows as Array<{ nome: string }>)' },
  
  // Tipos específicos para resultados de inserção
  { pattern: /\\(result as any\\)/g, replacement: '(result as { insertId: number })' },
  
  // Tipos para resultados de contagem
  { pattern: /\\(countRows as any\\[\\]\\)/g, replacement: '(countRows as Array<{ total: number }>)' },
  
  // Tipos para resultados de busca por ID
  { pattern: /\\(rows as any\\[\\]\\)/g, replacement: '(rows as Array<unknown>)' },
  
  // Tipos para resultados de busca por email/CPF
  { pattern: /\\(emailRows as any\\[\\]\\)/g, replacement: '(emailRows as Array<{ id: number; email: string }>)' },
  { pattern: /\\(cpfRows as any\\[\\]\\)/g, replacement: '(cpfRows as Array<{ id: number; cpf: string }>)' },
];

function fixFile(filePath: string) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const replacement of typeReplacements) {
      const newContent = content.replace(replacement.pattern, replacement.replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
  }
}

function findAndFixFiles(dir: string) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAndFixFiles(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixFile(filePath);
    }
  }
}

console.log('🔧 Starting automatic type fixes...');
findAndFixFiles('./src');
console.log('✅ Automatic type fixes completed!');
