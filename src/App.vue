<script setup>
import { ref, computed, provide } from "vue";
import axios from "axios";
import HomeView from "./views/HomeView.vue";
import CalendarView from "./views/CalendarView.vue";
import GroupsView from "./views/GroupsView.vue";
import ChatView from "./views/ChatView.vue";

import LoginModal from "./components/LoginModal.vue";
import SignupModal from "./components/SignupModal.vue";

// ==================== [기존 네비게이션 로직 유지] ====================
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

// ==================== [인증 전역 상태 관리 및 하위 공유] ====================
const isLoggedIn = ref(false);
const loginUser = ref(null);

const loginSuccess = (userData) => {
  isLoggedIn.value = true;
  loginUser.value = userData;
};
// 하위 컴포넌트들(Home, Calendar 등)이 로그인 정보가 필요할 때 꺼내 쓸 수 있도록 분양
provide("auth", { isLoggedIn, loginUser, loginSuccess });

// ==================== [모달 제어 스위치] ====================
const activeModal = ref(null); // null, 'login', 'signup' 으로 제어

const handleLogout = async () => {
  try {
    const response = await axios.post("/api/users/logout");
    alert(response.data);
    isLoggedIn.value = false;
    loginUser.value = null;
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div class="app-wrapper">
    <div class="app-container">
      <header class="header">
        <div class="logo" @click="goTo('home')">얌얌</div>
        <nav class="nav-menu">
          <div v-if="!isLoggedIn" class="auth-links">
            <span @click="activeModal = 'login'">로그인</span>
            <span class="divider">/</span>
            <span @click="activeModal = 'signup'">회원가입</span>
            <span class="divider">/</span>
          </div>
          <div v-else class="user-menu">
            <span class="user-info"
              ><strong>{{ loginUser.nickName }}</strong
              >님</span
            >
            <span @click="handleLogout" class="logout-btn">로그아웃</span>
          </div>
        </nav>
      </header>

      <div class="screen-content">
        <Transition name="fade" mode="out-in">
          <HomeView v-if="currentScreen === 'home'" key="home" />
          <CalendarView
            v-else-if="currentScreen === 'calendar'"
            key="calendar"
          />
          <GroupsView v-else-if="currentScreen === 'groups'" key="groups" />
          <ChatView v-else-if="currentScreen === 'chat'" key="chat" />
        </Transition>
      </div>

      <LoginModal v-if="activeModal === 'login'" @close="activeModal = null" />

      <SignupModal
        v-if="activeModal === 'signup'"
        @close="activeModal = null"
        @switchToLogin="activeModal = 'login'"
      />
    </div>
  </div>
</template>

<style>
/* 기존에 설정하신 뼈대 스타일에 최소한의 상단바 살만 붙였습니다 */
.app-wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  background: #e8e8e8;
  font-family: "Malgun Gothic", sans-serif;
}
.app-container {
  width: 100%;
  max-width: 480px;
  height: 100%;
  background: var(--bg-primary, #ffffff);
  position: relative;
  display: flex;
  flex-direction: column;
}
@media (min-width: 480px) {
  .app-container {
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.06),
      0 8px 48px rgba(0, 0, 0, 0.16);
  }
}

/* 상단 헤더 배치 CSS */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}
.auth-links span,
.logout-btn {
  cursor: pointer;
  font-size: 14px;
}
.divider {
  margin: 0 4px;
  color: #ccc;
}
.user-info {
  font-size: 14px;
  margin-right: 10px;
}
.screen-content {
  flex: 1;
  overflow-y: auto;
}

/* Transition 효과 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
