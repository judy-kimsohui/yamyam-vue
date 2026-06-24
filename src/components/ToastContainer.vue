<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite">
      <TransitionGroup name="toast-slide">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="toast.type"
          @click="dismiss(toast.id)"
        >
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">✓</span>
            <span v-else-if="toast.type === 'error'">✕</span>
            <span v-else>!</span>
          </div>
          <div class="toast-body">
            <p class="toast-title">{{ toast.title }}</p>
            <p v-if="toast.message" class="toast-msg">{{ toast.message }}</p>
          </div>
          <button class="toast-close" @click.stop="dismiss(toast.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast.js'
const { toasts, dismiss } = useToast()
</script>

<style>
.toast-stack {
  position: fixed;
  bottom: 20px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 99999;
  pointer-events: none;
  max-width: 320px;
  width: calc(100vw - 32px);
}

@media (max-width: 480px) {
  .toast-stack {
    right: 0;
    left: 0;
    bottom: 16px;
    width: calc(100vw - 24px);
    max-width: none;
    margin: 0 auto;
  }
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px 14px 16px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.13);
  cursor: pointer;
  pointer-events: all;
  border-left: 4px solid transparent;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.toast-item.success { border-left-color: #e8909e; }
.toast-item.error   { border-left-color: #e53e3e; }
.toast-item.info    { border-left-color: #4a90e2; }

.toast-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
  margin-top: 1px;
}
.toast-item.success .toast-icon { background: #fff0f4; color: #e8909e; }
.toast-item.error   .toast-icon { background: #fff0f0; color: #e53e3e; }
.toast-item.info    .toast-icon { background: #eff6ff; color: #4a90e2; }

.toast-body { flex: 1; min-width: 0; }
.toast-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.02em;
  line-height: 1.3;
}
.toast-msg {
  margin: 3px 0 0;
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
  transition: color 0.15s;
}
.toast-close:hover { color: #888; }

/* 트랜지션 */
.toast-slide-enter-active { animation: toast-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-slide-leave-active  { animation: toast-in 0.18s ease reverse; }
.toast-slide-move          { transition: transform 0.25s ease; }
@keyframes toast-in {
  from { opacity: 0; transform: translateX(40px) scale(0.9); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}
</style>
