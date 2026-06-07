<template>
  <div class="setlog-layout">
    <!-- 1. 좌상단 로고: 군더더기 없는 슬림 텍스트 -->
    <header class="logo-header">
      <span class="logo-text">YamYam</span>
    </header>

    <!-- 2. 전면 스플릿 구조: 장식물 전부 철거 -->
    <div class="split-body">
      <!-- [좌측] 압도적인 타이포그래피와 여백 (SetLog의 정석) -->
      <div class="left-hero">
        <div class="hero-inner">
          <h1 class="brand-slogan">
            Eat,<br />
            Record,<br />
            and Share.
          </h1>
          <p class="brand-desc">The minimal fitness log for teams.</p>
        </div>
      </div>

      <!-- [우측] 경계선 조차 없앤 극도의 미니멀 입력창 -->
      <div class="right-auth">
        <div class="auth-inner">
          <!-- A. 로그인 모드 -->
          <div v-if="authMode === 'login'" class="form-unit">
            <h2 class="auth-title">Sign in</h2>

            <div class="setlog-form">
              <input
                v-model="loginForm.userId"
                type="text"
                placeholder="ID"
                autofocus
              />
              <input
                v-model="loginForm.password"
                type="password"
                placeholder="Password"
                @keyup.enter="handleLogin"
              />
            </div>

            <button @click="handleLogin" class="btn-continue">Continue</button>

            <p class="toggle-text">
              New to YamYam?
              <span @click="authMode = 'signup'">Create an account</span>
            </p>
          </div>

          <!-- B. 회원가입 모드 -->
          <div v-else-if="authMode === 'signup'" class="form-unit">
            <h2 class="auth-title">Create account</h2>

            <div class="setlog-form signup-scroll">
              <input v-model="signupForm.userId" type="text" placeholder="ID" />
              <input
                v-model="signupForm.password"
                type="password"
                placeholder="Password"
              />
              <input
                v-model="signupForm.nickName"
                type="text"
                placeholder="Nickname"
              />
              <input v-model="signupForm.age" type="number" placeholder="Age" />
              <select v-model="signupForm.gender" class="clean-select">
                <option value="NONE">Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              <input
                v-model="signupForm.height"
                type="number"
                step="0.1"
                placeholder="Height (cm)"
              />
              <input
                v-model="signupForm.weight"
                type="number"
                step="0.1"
                placeholder="Weight (kg)"
              />
              <input
                v-model="signupForm.goalWeight"
                type="number"
                step="0.1"
                placeholder="Goal Weight (kg)"
              />
            </div>

            <button @click="handleSignup" class="btn-continue">Register</button>

            <p class="toggle-text">
              Already have an account?
              <span @click="authMode = 'login'">Sign in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from "vue";
import axios from "axios";

const navigation = inject("navigation");
const auth = inject("auth");

const authMode = ref("login");

const loginForm = ref({ userId: "", password: "" });
const signupForm = ref({
  userId: "",
  password: "",
  nickName: "",
  age: 0,
  gender: "NONE",
  height: "",
  weight: "",
  goalWeight: "",
});

const handleLogin = async () => {
  try {
    const response = await axios.post("/api/users/login", loginForm.value);
    alert(response.data);
    auth.loginSuccess({ nickName: loginForm.value.userId });
    navigation.goTo("calendar");
  } catch (error) {
    alert(error.response?.data || "Login failed");
  }
};

const handleSignup = async () => {
  try {
    const formData = new FormData();
    Object.keys(signupForm.value).forEach((key) => {
      formData.append(key, signupForm.value[key]);
    });
    const response = await axios.post("/api/users/signup", formData);
    alert(response.data);
    authMode.value = "login";
  } catch (error) {
    alert(error.response?.data || "Signup failed");
  }
};
</script>

<style scoped>
/* ========================================================
   [SetLog Style] 극단적 절제와 여백 중심의 디자인 시스템
   ======================================================== */

.setlog-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff; /* 투명하리만치 깨끗한 백색 */
  box-sizing: border-box;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  letter-spacing: -0.02em; /* 힙한 해외 SaaS 특유의 자간 좁히기 */
}

/* 로고 레이어 */
.logo-header {
  position: absolute;
  top: 50px;
  left: 60px;
  z-index: 10;
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  cursor: pointer;
}

.split-body {
  flex: 1;
  display: flex;
  width: 100%;
  height: 100%;
}

/* 좌측: 타이포그래피 원툴 레이아웃 */
.left-hero {
  flex: 1.2; /* 좌측 공간을 더 넓게 써서 여백미 강조 */
  display: flex;
  align-items: center;
  padding-left: 100px;
}

.hero-inner {
  max-width: 400px;
}

.brand-slogan {
  font-size: 64px; /* 텍스트를 확 키워서 시각적 압도감 선사 */
  font-weight: 800;
  line-height: 1.05;
  color: #000000;
  margin: 0 0 20px 0;
  letter-spacing: -0.04em;
}

.brand-desc {
  font-size: 16px;
  color: #888888;
  font-weight: 400;
  margin: 0;
}

/* 우측: 장식을 다 뺀 콤팩트 패널 */
.right-auth {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 60px; /* 정중앙이 아니라 약간 좌측으로 쏠리게 배치하여 긴장감 조성 */
  background-color: #ffffff;
}

.auth-inner {
  width: 100%;
  max-width: 280px; /* 인풋창 너비를 극단적으로 컴팩트하게 조절 */
}

.auth-title {
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 40px;
  letter-spacing: -0.03em;
}

/* 인풋 테두리 상자를 없애고 밑줄로만 툭툭 던지는 레이아웃 */
.setlog-form {
  display: flex;
  flex-direction: column;
  gap: 0; /* 간격을 없애고 경계선만 이음 */
  margin-bottom: 30px;
}

.setlog-form input,
.clean-select {
  width: 100%;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid #e5e5e5; /* 아주 얇은 회색 밑줄 */
  font-size: 15px;
  outline: none;
  background: transparent;
  box-sizing: border-box;
  color: #000000;
  border-radius: 0;
  transition: border-color 0.2s ease;
}

/* 포커스 시 보더가 두꺼워지는 게 아니라 시크하게 블랙으로 변함 */
.setlog-form input:focus,
.clean-select:focus {
  border-bottom: 1px solid #000000;
}

.clean-select {
  color: #999999;
  cursor: pointer;
}

/* 가입 스크롤바마저 완전히 숨김 */
.signup-scroll {
  max-height: 300px;
  overflow-y: auto;
}
.signup-scroll::-webkit-scrollbar {
  display: none;
}

/* 둥글기 없이 직각에 가까운 슬림한 블랙 버튼 */
.btn-continue {
  width: 100%;
  padding: 14px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  border-radius: 4px; /* 최소한의 라운딩 */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-continue:hover {
  opacity: 0.85;
}

.toggle-text {
  margin-top: 24px;
  font-size: 13px;
  color: #888888;
  text-align: left;
}
.toggle-text span {
  color: #000000;
  font-weight: 500;
  cursor: pointer;
  margin-left: 4px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 모바일 분기 (디자인 무너지지 않게 가림) */
@media (max-width: 768px) {
  .left-hero {
    display: none;
  }
  .right-auth {
    padding: 40px;
    justify-content: center;
  }
  .logo-header {
    top: 40px;
    left: 40px;
  }
}
</style>
