<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-window">
      <button class="close-btn" @click="$emit('close')">X</button>
      <div class="form-container">
        <h2>로그인</h2>
        <div class="input-group">
          <input v-model="loginForm.userId" type="text" placeholder="아이디" />
          <input
            v-model="loginForm.password"
            type="password"
            placeholder="비밀번호"
          />
        </div>
        <button @click="handleLogin" class="submit-btn">로그인하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from "vue";
import axios from "axios";

const emit = defineEmits(["close"]);
const auth = inject("auth"); // App.vue에서 제공한 로그인 상태 변경 함수 주입

const loginForm = ref({ userId: "", password: "" });
const handleLogin = async () => {
  try {
    // 헤더에 application/json을 명시해서 데이터 타입을 확실히 해줍니다.
    const response = await axios.post(
      "/api/users/login",
      {
        userId: loginForm.value.userId,
        password: loginForm.value.password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    alert(response.data);
    auth.loginSuccess({ nickName: loginForm.value.userId });
    emit("close");
  } catch (error) {
    // 💡 에러가 났을 때 어떤 메시지가 오는지 구체적으로 보기 위해 alert 보완
    console.error(error);
    alert(error.response?.data || "로그인 실패 (서버 연결 에러)");
  }
};
</script>

<style scoped>
/* 모달 전용 스타일 (상위 레이아웃에 영향 없음) */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-window {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 85%;
  max-width: 360px;
  position: relative;
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
}
.form-container h2 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
}
.input-group input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  padding: 10px;
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
