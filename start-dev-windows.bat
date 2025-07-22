@echo off
echo Iniciando PulseOn na porta 3000...
set PORT=3000
set NODE_ENV=development
set DATABASE_TYPE=sqlite
set DATABASE_URL=file:./pulseon.db

echo Configuracoes:
echo - Porta: %PORT%
echo - Ambiente: %NODE_ENV%
echo - Banco de dados: %DATABASE_TYPE%

npx tsx server/index.ts