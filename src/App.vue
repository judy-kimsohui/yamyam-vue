<script setup>
import { ref, computed, provide, onMounted } from "vue"; // 💡 onMounted 추가
import HomeView from "./views/HomeView.vue";
import DashboardView from "./views/DashboardView.vue";
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
  // 💡 로컬 스토리지에 로그인 상태 저장
  localStorage.setItem("yamyam_user", JSON.stringify(userData));
};

// 💡 로그아웃 기능 (추후 대시보드 내부에서 쓸 수 있도록 provide에 포함)
const logout = () => {
  isLoggedIn.value = false;
  loginUser.value = null;
  localStorage.removeItem("yamyam_user");
  goTo("home");
};

provide("auth", { isLoggedIn, loginUser, loginSuccess, logout });
// loginUser 구조: { id: Long, nickName: String, userId: String }

// 앱 시작 시 로컬 스토리지에서 로그인 상태 복구
onMounted(() => {
  const savedUser = localStorage.getItem("yamyam_user");
  if (savedUser) {
    isLoggedIn.value = true;
    loginUser.value = JSON.parse(savedUser); // { id, nickName, userId }
    if (currentScreen.value === "home") {
      goTo("calendar");
    }
  }
});
</script>

<template>
  <div class="full-screen-app">
    <Transition name="fade" mode="out-in">
      <HomeView v-if="currentScreen === 'home'" key="home" />
      <DashboardView v-else-if="currentScreen === 'calendar'" key="calendar" />
      <GroupsView v-else-if="currentScreen === 'groups'" key="groups" />
      <GroupDetailView v-else-if="currentScreen === 'group-detail'" key="group-detail" />
      <ChatView v-else-if="currentScreen === 'chat'" key="chat" />
    </Transition>
  </div>
</template>

<style>
/* 기존 전역 스타일 그대로 유지 */
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
