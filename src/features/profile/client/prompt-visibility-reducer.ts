export type PromptMode = 'welcome' | 'reminder'
export type WizardStep = 'welcome' | 'identity' | 'extra'

// mode dibawa di tiap varian (bukan cuma di 'open') karena efek mount bisa
// nyetel mode='welcome' tanpa langsung buka dialog (autoOpen=false) — nilai
// itu harus tetap kesimpen buat dipakai pas user buka manual lewat trigger.
export type PromptVisibility =
  | { tag: 'hidden'; mode: PromptMode }
  | { tag: 'dismissed'; mode: PromptMode }
  | { tag: 'open'; mode: PromptMode; step: WizardStep }

export const initialPromptVisibility: PromptVisibility = { tag: 'hidden', mode: 'reminder' }

export type PromptVisibilityAction =
  | { type: 'mode_set_welcome' }
  | { type: 'auto_opened' }
  | { type: 'dismissed_restored' }
  | { type: 'opened' }
  | { type: 'closed' }
  | { type: 'completed' }
  | { type: 'step_changed'; step: WizardStep }

export function promptVisibilityReducer(
  state: PromptVisibility,
  action: PromptVisibilityAction
): PromptVisibility {
  switch (action.type) {
    case 'mode_set_welcome':
      return state.tag === 'open'
        ? { tag: 'open', mode: 'welcome', step: state.step }
        : { tag: state.tag, mode: 'welcome' }

    case 'auto_opened':
      return { tag: 'open', mode: state.mode, step: 'welcome' }

    case 'dismissed_restored':
      return { tag: 'dismissed', mode: state.mode }

    case 'opened':
      return { tag: 'open', mode: state.mode, step: 'welcome' }

    case 'closed':
      return { tag: 'dismissed', mode: state.mode }

    case 'completed':
      return { tag: 'hidden', mode: state.mode }

    case 'step_changed':
      return state.tag === 'open' ? { tag: 'open', mode: state.mode, step: action.step } : state

    default: {
      const unhandled: never = action
      throw new Error(`Unhandled prompt visibility action: ${JSON.stringify(unhandled)}`)
    }
  }
}
