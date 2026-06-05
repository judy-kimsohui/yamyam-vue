<script setup>
import { ref, computed, provide } from 'vue'
import HomeView from './views/HomeView.vue'
import CalendarView from './views/CalendarView.vue'
import GroupsView from './views/GroupsView.vue'
import ChatView from './views/ChatView.vue'

const history = ref(['home'])
const currentScreen = computed(() => history.value[history.value.length - 1])

function goTo(screen) {
  if (screen !== currentScreen.value) {
    history.value.push(screen)
  }
}

function goBack() {
  if (history.value.length > 1) {
    history.value.pop()
  }
}

provide('navigation', { currentScreen, goTo, goBack })
</script>

<template>
  <div class="app-wrapper">
    <div class="app-container">
      <Transition name="fade" mode="out-in">
        <HomeView v-if="currentScreen === 'home'" key="home" />
        <CalendarView v-else-if="currentScreen === 'calendar'" key="calendar" />
        <GroupsView v-else-if="currentScreen === 'groups'" key="groups" />
        <ChatView v-else-if="currentScreen === 'chat'" key="chat" />
      </Transition>
    </div>
  </div>
</template>

<style>
.app-wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  background: #e8e8e8;
}

.app-container {
  width: 100%;
  max-width: 480px;
  height: 100%;
  background: var(--bg-primary);
  position: relative;
}

@media (min-width: 480px) {
  .app-container {
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.06),
      0 8px 48px rgba(0,0,0,0.16);
  }
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
