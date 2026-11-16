# Instala o mod Prompt Master no Claude Code (Windows / PowerShell)
# Uso: cole no PowerShell ou rode `powershell -ExecutionPolicy Bypass -File .\install-windows.ps1`

$ErrorActionPreference = 'Stop'
$Marketplace = 'rgbotelho/GitHub'
$Plugin      = 'prompt-master@rgbotelho-mods'

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "ERRO: $msg" -ForegroundColor Red; exit 1 }

# 1. Claude Code instalado?
Step 'Verificando o Claude Code'
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host 'Claude Code nao encontrado. Instalando...'
    Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
        Fail 'Claude Code instalado, mas o comando "claude" nao esta no PATH. Feche e reabra o PowerShell e rode este script de novo.'
    }
}
claude --version

# 2. Git (necessario para ler o repositorio privado)
Step 'Verificando o Git'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail 'Git nao encontrado. Instale com: winget install --id Git.Git -e   (depois reabra o PowerShell)'
}
git ls-remote "https://github.com/$Marketplace.git" HEAD *> $null
if ($LASTEXITCODE -ne 0) {
    Fail "Sem acesso ao repositorio privado $Marketplace. Faca login no GitHub pelo Git (ex.: 'gh auth login' ou o Git Credential Manager) e rode de novo."
}

# 3. Marketplace
Step "Adicionando o marketplace $Marketplace"
claude plugin marketplace add $Marketplace
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Marketplace pode ja existir; atualizando...'
    claude plugin marketplace update rgbotelho-mods
    if ($LASTEXITCODE -ne 0) { Fail 'Nao consegui adicionar nem atualizar o marketplace.' }
}

# 4. Plugin (escopo de usuario: vale em todos os projetos)
Step "Instalando $Plugin"
claude plugin install $Plugin --scope user
if ($LASTEXITCODE -ne 0) { Fail 'A instalacao do plugin falhou (veja a mensagem acima).' }

# 5. Verificacao
Step 'Verificando a instalacao'
$list = claude plugin list 2>&1 | Out-String
if ($list -match 'prompt-master') {
    Write-Host $list
    Write-Host 'OK: Prompt Master instalado. Abra um projeto com "claude" e use /prompt-master para ligar/desligar.' -ForegroundColor Green
} else {
    Write-Host $list
    Fail 'prompt-master nao aparece em "claude plugin list".'
}
