# Script PowerShell para iniciar o banco de dados MySQL
Write-Host "🚀 Iniciando banco de dados MySQL para o projeto prevSaúde..." -ForegroundColor Green
Write-Host ""

# Verificar se o Docker está instalado
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker não encontrado"
    }
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "💡 Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

# Iniciar o banco de dados
Write-Host "🚀 Iniciando banco de dados MySQL..." -ForegroundColor Green
docker-compose up -d

# Aguardar o banco estar pronto
Write-Host "⏳ Aguardando o banco de dados estar pronto..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar se o container está rodando
Write-Host "🔍 Verificando status do container..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ Banco de dados iniciado com sucesso!" -ForegroundColor Green
Write-Host "📋 Configurações:" -ForegroundColor Cyan
Write-Host "   - Host: localhost" -ForegroundColor White
Write-Host "   - Porta: 3306" -ForegroundColor White
Write-Host "   - Usuário: root" -ForegroundColor White
Write-Host "   - Senha: root" -ForegroundColor White
Write-Host "   - Banco: prevsaude" -ForegroundColor White
Write-Host ""
Write-Host "💡 Para parar o banco, execute: docker-compose down" -ForegroundColor Yellow
Write-Host "💡 Para ver os logs, execute: docker-compose logs -f mysql" -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione Enter para continuar"
