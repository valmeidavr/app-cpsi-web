const fs = require('fs');
const path = require('path');

function cleanComments(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove single line comments that are not at the end of code lines
    content = content.replace(/^\s*\/\/.*$/gm, '');
    
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove empty lines that might be left behind
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Remove lines that only contain whitespace
    content = content.replace(/^\s*$/gm, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`Cleaned comments: ${filePath}`);
  } catch (error) {
    console.error(`Error cleaning comments in ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      cleanComments(filePath);
    }
  });
}

// Start cleaning from src directory
walkDir('./src');
console.log('Comment cleanup completed!');
