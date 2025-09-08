@echo off
echo 🚀 Iniciando banco de dados MySQL para o projeto CPSI...
echo.

REM Verificar se o Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está instalado ou não está no PATH
    echo 💡 Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker encontrado
echo.

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Iniciar o banco de dados
echo 🚀 Iniciando banco de dados MySQL...
docker-compose up -d

REM Aguardar o banco estar pronto
echo ⏳ Aguardando o banco de dados estar pronto...
timeout /t 10 /nobreak >nul

REM Verificar se o container está rodando
echo 🔍 Verificando status do container...
docker-compose ps

echo.
echo ✅ Banco de dados iniciado com sucesso!
echo 📋 Configurações:
echo    - Host: localhost
echo    - Porta: 3306
echo    - Usuário: root
echo    - Senha: root
echo    - Banco: prevsaude
echo.
echo 💡 Para parar o banco, execute: docker-compose down
echo 💡 Para ver os logs, execute: docker-compose logs -f mysql
echo.
pause
