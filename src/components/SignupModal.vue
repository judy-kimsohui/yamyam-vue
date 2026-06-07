<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-window">
      <button class="close-btn" @click="$emit('close')">X</button>
      <div class="form-container">
        <h2>회원가입</h2>
        <div class="input-grid">
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
          <input v-model="signupForm.age" type="number" placeholder="나이" />

          <select v-model="signupForm.gender">
            <option value="NONE">성별 선택 (선택)</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
          </select>

          <input
            v-model="signupForm.height"
            type="number"
            step="0.1"
            placeholder="현재 키(cm)"
          />
          <input
            v-model="signupForm.weight"
            type="number"
            step="0.1"
            placeholder="현재 몸무게(kg)"
          />
          <input
            v-model="signupForm.goalWeight"
            type="number"
            step="0.1"
            placeholder="목표 몸무게(kg)"
          />

          <div class="file-input">
            <label for="profile-pic">프로필 이미지</label>
            <input
              id="profile-pic"
              type="file"
              @change="onFileChange"
              accept="image/*"
            />
            <span v-if="signupForm.profileImgFile" class="file-name">{{
              signupForm.profileImgFile.name
            }}</span>
          </div>
        </div>
        <button @click="handleSignup" class="submit-btn">가입 완료</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const emit = defineEmits(["close", "switchToLogin"]);

const signupForm = ref({
  userId: "",
  password: "",
  nickName: "",
  age: 0,
  gender: "NONE",
  height: "",
  weight: "",
  goalWeight: "",
  profileImgFile: null,
});

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) signupForm.value.profileImgFile = file;
};

const handleSignup = async () => {
  try {
    const formData = new FormData();
    Object.keys(signupForm.value).forEach((key) => {
      if (signupForm.value[key] !== null) {
        formData.append(key, signupForm.value[key]);
      }
    });

    const response = await axios.post("/api/users/signup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert(response.data);
    emit("switchToLogin"); // 가입 성공 시 로그인 창으로 바꾸라고 부모에게 알림
  } catch (error) {
    alert(error.response?.data || "회원가입에 실패했습니다.");
  }
};
</script>

<style scoped>
/* 로그인 모달과 동일한 오버레이 구조 스타일 적용 */
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
.input-grid input,
.input-grid select {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
.file-input {
  margin: 10px 0;
  font-size: 12px;
}
.file-input label {
  background: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.file-name {
  margin-left: 5px;
  color: #666;
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
