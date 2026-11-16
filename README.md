# Mods do Claude Code

## Prompt Master

Reescreve e melhora seus prompts antes de enviar, com um botão **✨ Prompt Master** e um seletor **Auto: ON/OFF** na faixa acima do campo de prompt. Detalhes em [`prompt-master/README.md`](prompt-master/README.md).

### Instalação

No prompt de uma sessão do Claude Code no terminal:

```
/plugin marketplace add rgbotelho/GitHub
/plugin install prompt-master@rgbotelho-mods
```

Escolha o escopo (usuário ou projeto) quando for perguntado. Funciona no Claude Code do terminal; o app web/celular não tem o comando `/plugin`.

### Instalação no Windows (PowerShell, sem abrir o Claude Code)

Baixe `install-windows.ps1` deste repositório e rode:

```
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
```

O script instala o Claude Code se faltar, adiciona o marketplace, instala o plugin no escopo de usuário e confere em `claude plugin list`.
