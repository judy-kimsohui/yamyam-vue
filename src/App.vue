<script setup>
import { ref, computed, provide } from "vue";
import HomeView from "./views/HomeView.vue";
import CalendarView from "./views/CalendarView.vue";
import GroupsView from "./views/GroupsView.vue";
import GroupDetailView from "./views/GroupDetailView.vue";
import ChatView from "./views/ChatView.vue";

// ==================== [네비게이션 로직] ====================
const history = ref(["home"]);
const currentScreen = computed(() => history.value[history.value.length - 1]);

function goTo(screen) {
  if (screen !== currentScreen.value) {
    history.value.push(screen);
  }
}
function goBack() {
  if (history.value.length > 1) {
    history.value.pop();
  }
}
provide("navigation", { currentScreen, goTo, goBack });

// ==================== [인증 전역 상태] ====================
const isLoggedIn = ref(false);
const loginUser = ref(null);

const loginSuccess = (userData) => {
  isLoggedIn.value = true;
  loginUser.value = userData;
};
provide("auth", { isLoggedIn, loginUser, loginSuccess });
</script>

<template>
  <div class="full-screen-app">
    <Transition name="fade" mode="out-in">
      <HomeView v-if="currentScreen === 'home'" key="home" />
      <CalendarView v-else-if="currentScreen === 'calendar'" key="calendar" />
      <GroupsView v-else-if="currentScreen === 'groups'" key="groups" />
      <GroupDetailView v-else-if="currentScreen === 'group-detail'" key="group-detail" />
      <ChatView v-else-if="currentScreen === 'chat'" key="chat" />
    </Transition>
  </div>
</template>

<style>
/* 전역 스케일 초기화: 여백을 완전히 없애고 시원하게 씁니다. */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.full-screen-app {
  width: 100%;
  height: 100%;
}

/* 부드러운 화면 전환 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
