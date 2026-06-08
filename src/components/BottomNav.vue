<script setup>
defineProps({
  activeTab: { type: String, required: true }
})
const emit = defineEmits(['navigate'])

const tabs = [
  { id: 'home', icon: 'ti-home', label: '홈' },
  { id: 'groups', icon: 'ti-users', label: '그룹' }
]
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="nav-btn"
      :class="{ active: activeTab === tab.id }"
      @click="emit('navigate', tab.id)"
    >
      <i :class="`ti ${tab.icon}`"></i>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  border-top: 1px solid var(--border-light);
  padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  background: var(--bg-primary);
  flex-shrink: 0;
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 4px 20px;
  border-radius: 12px;
  transition: color 0.2s;
}

.nav-btn i {
  font-size: 22px;
}

.nav-btn span {
  font-size: 10px;
  font-weight: 500;
}

.nav-btn.active {
  color: var(--accent);
}
</style>
