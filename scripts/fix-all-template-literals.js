const fs = require('fs');
const path = require('path');

// Função para encontrar todos os arquivos .ts na pasta src/app/api
function findApiFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findApiFiles(fullPath));
    } else if (item.endsWith('.ts') && item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

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

    // Padrão 4: Corrigir template literals que não estão funcionando
    const pattern4 = /query\s*\+\=\s*['"`]\s*ORDER\s+BY\s+[^'"`]*\s+ASC\s+LIMIT\s+\$\{parseInt\(limit\)\}\s+OFFSET\s+\$\{offset\}['"`]/g;
    if (pattern4.test(content)) {
      content = content.replace(pattern4, (match) => {
        const newMatch = match.replace(
          /['"`]\s*ORDER\s+BY\s+[^'"`]*\s+ASC\s+LIMIT\s+\$\{parseInt\(limit\)\}\s+OFFSET\s+\$\{offset\}['"`]/,
          '` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`'
        );
        modified = true;
        return newMatch;
      });
    }

    // Padrão 5: Corrigir casos específicos onde a interpolação não funciona
    const pattern5 = /query\s*\+\=\s*['"`]\s*ORDER\s+BY\s+[^'"`]*\s+ASC\s+LIMIT\s+\$\{parseInt\(limit\)\}\s+OFFSET\s+\$\{offset\}['"`]/g;
    if (pattern5.test(content)) {
      content = content.replace(pattern5, (match) => {
        const newMatch = match.replace(
          /['"`]\s*ORDER\s+BY\s+[^'"`]*\s+ASC\s+LIMIT\s+\$\{parseInt\(limit\)\}\s+OFFSET\s+\$\{offset\}['"`]/,
          '` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`'
        );
        modified = true;
        return newMatch;
      });
    }

    // Padrão 6: Corrigir casos onde está usando aspas simples em vez de backticks
    const pattern6 = /' ORDER BY [^']* LIMIT \$\{parseInt\(limit\)\} OFFSET \$\{offset\}'/g;
    if (pattern6.test(content)) {
      content = content.replace(pattern6, '` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`');
      modified = true;
    }

    // Padrão 7: Corrigir casos onde está usando aspas duplas em vez de backticks
    const pattern7 = /" ORDER BY [^"]* LIMIT \$\{parseInt\(limit\)\} OFFSET \$\{offset\}"/g;
    if (pattern7.test(content)) {
      content = content.replace(pattern7, '` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`');
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

// Encontrar todos os arquivos de API
const apiFiles = findApiFiles('src/app/api');

console.log('🔧 Iniciando correção de template literals em todos os arquivos de API...\n');
console.log(`📁 Encontrados ${apiFiles.length} arquivos de API\n`);

let fixedCount = 0;
let totalCount = apiFiles.length;

apiFiles.forEach(filePath => {
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
