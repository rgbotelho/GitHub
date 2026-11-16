import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const isAuto = atom({ plugin: 'prompt-master', key: 'isAuto' } as const, true)
const isBusy = atom({ plugin: 'prompt-master', key: 'isBusy' } as const, false)
const lastNote = atom({ plugin: 'prompt-master', key: 'lastNote' } as const, null)

const SYSTEM = `Você é o Prompt Master: reescreve pedidos feitos a um agente de programação (Claude Code) para que fiquem claros, específicos e executáveis.

Regras:
- Preserve 100% da intenção, dos fatos, nomes, caminhos, códigos e trechos citados. Nunca invente requisitos, tecnologias ou restrições.
- Mantenha o idioma original do pedido.
- Estruture quando ajudar: Objetivo, Contexto, Requisitos, Critérios de aceite. Para pedidos simples, uma ou duas frases melhores bastam.
- Deixe explícito o que estiver implícito e óbvio (ex.: "verifique que funciona"), sem exagerar.
- Se o pedido já estiver bom, devolva-o praticamente igual.
- Responda SOMENTE com o prompt reescrito, sem comentários, aspas ou prefixos.`

const MIN_CHARS = 12

async function rewrite($: EngineInterface, text: string): Promise<string | null> {
  const r = await $.model.complete({
    model: 'haiku',
    system: SYSTEM,
    prompt: `Pedido original:\n<<<\n${text}\n>>>`,
    maxTokens: 2048,
    effort: 'low',
    timeoutMs: 20000,
  })
  if (!r.isAnswered) return null
  const out = r.text.trim()
  return out.length > 0 ? out : null
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prompt-master',
      description: 'Liga/desliga a reescrita automática de prompts (on | off)',
    })
    return next(e)
  })

  on('command.run', { command: 'prompt-master' }, async $ => {
    const now = await update($, isAuto, v => !v)
    return { text: `Prompt Master automático: ${now ? 'LIGADO' : 'DESLIGADO'}` }
  })

  // Reescrita automática antes de enviar.
  on('prompt.submit', async ($, e, next) => {
    const typed = e.origin.kind === 'composer' || e.origin.kind === 'bridge'
    if (!typed || e.command || e.isMeta || e.text.trim().length < MIN_CHARS) return next(e)
    if (!(await read($, isAuto))) return next(e)
    // Prefixo "!" envia sem reescrever.
    if (e.text.startsWith('!')) return next({ ...e, text: e.text.slice(1).trimStart() })

    await update($, isBusy, () => true)
    $.ui.status('✨ Prompt Master reescrevendo…')
    try {
      const better = await rewrite($, e.text)
      if (!better) {
        $.ui.toast('Prompt Master: não consegui reescrever, enviei o original.')
        return next(e)
      }
      await update($, lastNote, () => `Reescrito (${e.text.length} → ${better.length} caracteres)`)
      return next({ ...e, text: better })
    } finally {
      await update($, isBusy, () => false)
      $.ui.status(undefined)
    }
  }).catch(($, e, next) => {
    // Qualquer falha: envia o prompt original, nunca bloqueia o envio.
    $.ui.status(undefined)
    return next(e)
  })

  // Botão "Prompt Master" na faixa logo acima do campo de prompt.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const auto = await read($, isAuto)
    const busy = await read($, isBusy)
    const note = await read($, lastNote)

    const polish = async () => {
      const box = await $.prompt.read()
      if (box.text.trim().length < MIN_CHARS) {
        $.ui.toast('Prompt Master: digite o prompt primeiro (ou deixe o modo automático ligado).')
        return
      }
      await update($, isBusy, () => true)
      try {
        const better = await rewrite($, box.text)
        if (!better) {
          $.ui.toast('Prompt Master: não consegui reescrever agora.')
          return
        }
        const filled = await $.prompt.fill({ text: better, mode: 'replace' })
        if (!filled.isFilled) $.ui.toast('Prompt Master: não consegui colocar o texto no campo.')
        else $.ui.toast('Prompt melhorado — revise e envie.')
      } finally {
        await update($, isBusy, () => false)
      }
    }

    return (
      <Box>
        <Button
          key="polish"
          label={busy ? '✨ Reescrevendo…' : '✨ Prompt Master'}
          onPress={() => {
            if (!busy) void polish()
          }}
        />
        <Text> </Text>
        <Button
          key="auto"
          label={auto ? 'Auto: ON' : 'Auto: OFF'}
          onPress={() => update($, isAuto, v => !v)}
        />
        {note ? <Text dimColor> {note}</Text> : null}
      </Box>
    )
  })
}
