import { reactive } from 'vue'

const state = reactive({ toasts: [] })
let nextId = 0

export function useToast() {
  function showToast(type, title, message = '') {
    const id = ++nextId
    state.toasts.push({ id, type, title, message })
    setTimeout(() => dismiss(id), 3500)
  }

  function dismiss(id) {
    const idx = state.toasts.findIndex(t => t.id === id)
    if (idx !== -1) state.toasts.splice(idx, 1)
  }

  return { toasts: state.toasts, showToast, dismiss }
}
