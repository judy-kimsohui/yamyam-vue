<template>
  <div class="setlog-layout">
    <!-- 1. 좌상단 로고 -->
    <header class="logo-header">
      <span class="logo-text" @click="authMode = 'login'">YamYam</span>
    </header>

    <!-- 2. 메인 스플릿 구조 -->
    <div class="split-body">
      <!-- [좌측] 굵직한 타이포그래피와 시원한 여백 -->
      <div class="left-hero">
        <div class="hero-inner">
          <h1 class="brand-slogan">
            Eat,<br />
            Record,<br />
            and Share.
          </h1>
          <p class="brand-desc">맛있는 로그를 함께 공유하세요!</p>
        </div>
      </div>

      <!-- [우측] 입력 폼 유닛 (사라졌던 필수 정보들 완벽 복구) -->
      <div class="right-auth">
        <div class="auth-inner">
          <!-- 상태 2: 이미 로그인 상태일 때 (꼬임 방지 뷰) -->
          <div v-if="auth.isLoggedIn.value" class="form-unit">
            <h2 class="auth-title">Welcome Back</h2>
            <p class="status-msg">현재 로그인 상태입니다.</p>
            <button @click="navigation.goTo('calendar')" class="btn-continue">
              Go to Dashboard
            </button>
            <button @click="auth.logout()" class="btn-dev-logout">
              Sign out
            </button>
          </div>

          <!-- 상태 1: 비로그인 상태 (실제 입력 폼 구역) -->
          <div v-else>
            <!-- A. 로그인 모드 -->
            <div v-if="authMode === 'login'" class="form-unit">
              <h2 class="auth-title">Sign in</h2>

              <div class="setlog-form">
                <input
                  v-model="loginForm.userId"
                  type="text"
                  placeholder="ID"
                />
                <input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="Password"
                  @keyup.enter="handleLogin"
                />
              </div>

              <button @click="handleLogin" class="btn-continue">
                Continue
              </button>

              <!-- ⚡ 개발용 하이패스 원클릭 버튼 -->
              <button @click="handleDevLogin" class="btn-dev-bypass">
                ⚡ Dev Login (test/test)
              </button>

              <p class="toggle-text">
                New to YamYam?
                <span @click="authMode = 'signup'">Create an account</span>
              </p>
            </div>

            <!-- B. 회원가입 모드 (사라졌던 오리지널 인풋창 전체 복구) -->
            <div v-else-if="authMode === 'signup'" class="form-unit">
              <h2 class="auth-title">Create account</h2>

              <!-- 💡 스크롤 구역 내부에 복구된 오리지널 데이터 입력 필드들 -->
              <div class="setlog-form signup-scroll">
                <input
                  v-model="signupForm.userId"
                  type="text"
                  placeholder="아이디 (필수)"
                />
                <input
                  v-model="signupForm.password"
                  type="password"
                  placeholder="비밀번호 (필수)"
                />
                <input
                  v-model="signupForm.nickName"
                  type="text"
                  placeholder="닉네임 (필수)"
                />
                <input
                  v-model="signupForm.age"
                  type="number"
                  placeholder="나이"
                />

                <!-- 성별 셀렉트 박스 복구 -->
                <select v-model="signupForm.gender" class="clean-select">
                  <option value="NONE">성별 (선택)</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>

                <!-- 신체 정보(Double 타입 매칭) 복구 -->
                <input
                  v-model="signupForm.height"
                  type="number"
                  step="0.1"
                  placeholder="키 (cm)"
                />
                <input
                  v-model="signupForm.weight"
                  type="number"
                  step="0.1"
                  placeholder="현재 체중 (kg)"
                />
                <input
                  v-model="signupForm.goalWeight"
                  type="number"
                  step="0.1"
                  placeholder="목표 체중 (kg)"
                />
              </div>

              <button @click="handleSignup" class="btn-continue">
                Register
              </button>

              <p class="toggle-text">
                Already have an account?
                <span @click="authMode = 'login'">Sign in</span>
              </p>
            </div>
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

// 일반 로그인 로직
const handleLogin = async () => {
  try {
    // 1. 로그인 요청을 보내 토큰을 받아옴
    const loginRes = await axios.post("/api/users/login", loginForm.value);
    const { token } = loginRes.data; // 백엔드가 뱉어준 token 꺼내기

    // 2. 프로필을 조회하기 전, 방금 받은 토큰을 임시 헤더에 셋팅 (문지기 통과용)
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    // 3. 토큰을 실어서 프로필 상세 정보를 가져옴
    const profileRes = await axios.get("/api/users/profile", config);
    const p = profileRes.data;

    // 4. 전역 auth 상태에 유저 정보와 토큰을 같이 넘겨서 저장
    auth.loginSuccess(
      {
        id: p.id,
        nickName: p.nick_name || p.nickName || loginForm.value.userId,
        userId: loginForm.value.userId,
      },
      token,
    );

    navigation.goTo("calendar");
  } catch (error) {
    alert(error.response?.data || "Login failed");
  }
};

// 개발자 하이패스 로그인 로직
const handleDevLogin = async () => {
  try {
    const devAccount = { userId: "test", password: "test" };
    const loginRes = await axios.post("/api/users/login", devAccount);
    const { token } = loginRes.data;

    // 프로필 요청용 임시 헤더 설정
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const profileRes = await axios.get("/api/users/profile", config);
    const p = profileRes.data;

    auth.loginSuccess(
      {
        id: p.id,
        nickName: p.nick_name || p.nickName || "개발자테스트",
        userId: "test",
      },
      token,
    );
  } catch (error) {
    console.warn("백엔드 통신 패스, 가짜 토큰 발급");
    // 백엔드가 꺼져있을 때를 대비한 안전장치
    auth.loginSuccess(
      { id: 1, nickName: "DevUser", userId: "test" },
      "dummy_token",
    );
  }
  navigation.goTo("calendar");
};

// 💡 FormData 멀티파트 포맷을 이용한 오리지널 회원가입 절차 완전 정상화
const handleSignup = async () => {
  try {
    const formData = new FormData();
    Object.keys(signupForm.value).forEach((key) => {
      formData.append(key, signupForm.value[key]);
    });

    const response = await axios.post("/api/users/signup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    alert(response.data);
    authMode.value = "login"; // 가입 성공하면 로그인 폼으로 귀환
  } catch (error) {
    alert(error.response?.data || "Signup failed");
  }
};

</script>

<style scoped>
/* ========================================================
   오리지널 절차를 담아내는 완벽한 SetLog 레이아웃 CSS
   ======================================================== */

.setlog-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  box-sizing: border-box;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.02em;
}

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

.left-hero {
  flex: 1.2;
  display: flex;
  align-items: center;
  padding-left: 100px;
}
.hero-inner {
  max-width: 400px;
}
.brand-slogan {
  font-size: 64px;
  font-weight: 800;
  line-height: 1.05;
  color: #000000;
  margin: 0 0 20px 0;
  letter-spacing: -0.04em;

  /* 파스텔 그라데이션 */
  background: linear-gradient(
    135deg,
    #ffb6c1 0%,   /* 파스텔 핑크 */
    #ffd6a5 30%,  /* 파스텔 오렌지 */
    #caffbf 60%,  /* 파스텔 민트 */
    #a0c4ff 100%  /* 파스텔 블루 */
  );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.brand-desc {
  font-size: 16px;
  color: #888888;
  margin: 0;
}

.right-auth {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 60px;
  background-color: #ffffff;
}
.auth-inner {
  width: 100%;
  max-width: 280px;
}
.auth-title {
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 40px;
  letter-spacing: -0.03em;
}

.setlog-form {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
}
.setlog-form input,
.clean-select {
  width: 100%;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid #e5e5e5;
  font-size: 15px;
  outline: none;
  background: transparent;
  box-sizing: border-box;
  color: #000000;
  border-radius: 0;
  transition: border-color 0.2s ease;
}
.setlog-form input:focus,
.clean-select:focus {
  border-bottom: 1px solid #000000;
}
.clean-select {
  color: #999999;
  cursor: pointer;
}

/* 💡 회원가입 입력 항목이 많아졌으므로 우측 폼 내부에서 부드럽게 세로 스크롤 작동 */
.signup-scroll {
  max-height: 290px;
  overflow-y: auto;
  padding-right: 5px;
}
/* 깔끔함을 유지하기 위해 스크롤바 바 자체는 SetLog 감성으로 숨김 */
.signup-scroll::-webkit-scrollbar {
  display: none;
}

.btn-continue {
  width: 100%;
  padding: 14px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-continue:hover {
  opacity: 0.85;
}

/* ⚡ 개발용 하이패스 점선 버튼 스타일 */
.btn-dev-bypass {
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  background-color: transparent;
  color: #22c55e;
  border: 1px dashed #22c55e;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-dev-bypass:hover {
  background-color: #f0fdf4;
}

/* 로그인 상태 유저 보조 스타일 */
.status-msg {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
  text-align: left;
}
.btn-dev-logout {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background-color: transparent;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  color: #666;
  font-size: 13px;
  cursor: pointer;
}
.btn-dev-logout:hover {
  border-color: #000;
  color: #000;
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

@media (max-width: 768px) {
  .left-hero {
    display: none;
  }
  .right-auth {
    padding: 40px;
    justify-content: center;
  }
}

.form-fade {
  animation: setlogFade 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes setlogFade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
