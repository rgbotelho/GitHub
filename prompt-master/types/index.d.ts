declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { isAuto: boolean; isBusy: boolean; lastNote: string | null }
  }
}
