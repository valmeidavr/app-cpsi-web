const fs = require('fs');
const path = require('path');

// Lista de arquivos para corrigir
const filesToFix = [
  'src/app/api/agendas/route.ts',
  'src/app/api/alocacoes/route.ts',
  'src/app/api/caixa/route.ts',
  'src/app/api/alunos_turmas/route.ts',
  'src/app/api/lancamentos/route.ts',
  'src/app/api/prestadores/route.ts',
  'src/app/api/plano_contas/route.ts',
  'src/app/api/especialidades/route.ts',
  'src/app/api/turmas/route.ts',
  'src/app/api/unidades/route.ts',
  'src/app/api/expediente/route.ts',
  'src/app/api/valor-procedimento/route.ts',
  'src/app/api/clientes/route.ts',
  'src/app/api/tabela_faturamentos/route.ts',
  'src/app/api/convenios/route.ts',
  'src/app/api/usuarios/route.ts'
];

function fixTemplateLiterals(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Padrão 1: Template literals mal formados com aspas simples
    const pattern1 = /query\s*\+\=\s*['"`]\s*ORDER\s+BY\s+[^'"`]*\s+ASC\s+LIMIT\s+\$\{parseInt\(limit\)\}\s+OFFSET\s+\$\{offset\}['"`]/g;
    if (pattern1.test(content)) {
      content = content.replace(pattern1, (match) => {
        const newMatch = match.replace(
          /['"`]\s*ORDER\s+BY\s+[^'"`]*\s+ASC\s+LIMIT\s+\$\{parseInt\(limit\)\}\s+OFFSET\s+\$\{offset\}['"`]/,
          '` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`'
        );
        modified = true;
        return newMatch;
      });
    }

    // Padrão 2: Template literals mal formados simples
    const pattern2 = /LIMIT\s+\$\{parseInt\(limit\)\}\s+OFFSET\s+\$\{offset\}/g;
    if (pattern2.test(content)) {
      content = content.replace(pattern2, 'LIMIT ${parseInt(limit)} OFFSET ${offset}');
      modified = true;
    }

    // Padrão 3: Aspas simples em vez de backticks
    const pattern3 = /' ORDER BY [^']* LIMIT \$\{parseInt\(limit\)\} OFFSET \$\{offset\}'/g;
    if (pattern3.test(content)) {
      content = content.replace(pattern3, '` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ Nenhuma correção necessária: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Executar correções
console.log('🔧 Iniciando correção de template literals...\n');

let fixedCount = 0;
let totalCount = filesToFix.length;

filesToFix.forEach(filePath => {
  if (fixTemplateLiterals(filePath)) {
    fixedCount++;
  }
});

console.log(`\n📊 Relatório:`);
console.log(`✅ Arquivos corrigidos: ${fixedCount}`);
console.log(`📁 Total de arquivos: ${totalCount}`);
console.log(`📈 Taxa de sucesso: ${((fixedCount / totalCount) * 100).toFixed(1)}%`);

if (fixedCount === totalCount) {
  console.log('🎉 Todas as correções foram aplicadas com sucesso!');
} else {
  console.log('⚠️ Algumas correções podem ter falhado. Verifique os logs acima.');
}
