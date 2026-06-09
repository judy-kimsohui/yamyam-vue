<template>
  <aside class="profile-sidebar">
    <div v-if="isLoading" class="loading-box">
      프로필 정보를 불러오는 중입니다...
    </div>

    <template v-else>
      <div class="profile-header">
        <div class="avatar-wrapper">
          <img
            :src="
              profile?.profile_img ||
              profile?.profileImg ||
              '/default_avatar.svg'
            "
            alt="프로필 이미지"
            class="avatar-img"
            @error="(e) => (e.target.src = '/default_avatar.svg')"
          />
        </div>

        <div class="user-meta">
          <input
            v-if="isEditMode"
            v-model="editForm.nickName"
            type="text"
            class="inline-input nick-input"
            placeholder="닉네임"
          />
          <h3 v-else class="user-nickname">
            {{ profile?.nick_name || profile?.nickName || "사용자" }}
          </h3>

          <span class="user-badge">
            <template v-if="isEditMode">
              <select v-model="editForm.gender" class="inline-select">
                <option value="NONE">선택 안함</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
              ·
              <input
                v-model.number="editForm.age"
                type="number"
                class="inline-input age-input"
              />세
            </template>
            <template v-else>
              {{
                profile?.gender === "MALE"
                  ? "남성"
                  : profile?.gender === "FEMALE"
                    ? "여성"
                    : "선택 안함"
              }}
              · {{ profile?.age || 0 }}세
            </template>
          </span>
        </div>
      </div>

      <div class="goal-phrase-box">
        <p class="goal-title">나의 목표 한마디</p>
        <p class="goal-text">
          “
          {{
            profile?.user_goal && profile.user_goal.trim().length > 0
              ? profile.user_goal
              : "야무지게 먹고 건강하게 기록하자!"
          }}
          ”
        </p>
      </div>

      <hr class="divider" />

      <div class="profile-specs">
        <div class="spec-item">
          <span class="label">현재 신장</span>
          <div v-if="isEditMode" class="edit-input-wrapper">
            <input
              v-model.number="editForm.height"
              type="number"
              step="0.1"
              class="spec-input"
            />
            <small>cm</small>
          </div>
          <span v-else class="value"
            >{{ profile?.height || 0 }} <small>cm</small></span
          >
        </div>

        <div class="spec-item">
          <span class="label">현재 체중</span>
          <div v-if="isEditMode" class="edit-input-wrapper">
            <input
              v-model.number="editForm.weight"
              type="number"
              step="0.1"
              class="spec-input"
            />
            <small>kg</small>
          </div>
          <span v-else class="value"
            >{{ profile?.weight || 0 }} <small>kg</small></span
          >
        </div>

        <div class="spec-item">
          <span class="label">목표 체중</span>
          <div v-if="isEditMode" class="edit-input-wrapper">
            <input
              v-model.number="editForm.goalWeight"
              type="number"
              step="0.1"
              class="spec-input"
            />
            <small>kg</small>
          </div>
          <span v-else class="value target"
            >{{ profile?.goal_weight || profile?.goalWeight || 0 }}
            <small>kg</small></span
          >
        </div>

        <div class="achievement-progress">
          <div class="progress-info">
            <span>목표 달성도</span>
            <span class="progress-percentage">{{ achievementRate }}%</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-bar"
              :style="{ width: achievementRate + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="profile-action-box">
        <button v-if="!isEditMode" @click="startEdit" class="btn-profile-edit">
          프로필 수정
        </button>
        <div v-else class="edit-actions">
          <button @click="saveEdit" class="btn-profile-save">완료</button>
          <button @click="cancelEdit" class="btn-profile-cancel">취소</button>
        </div>
      </div>

      <hr class="divider" />

      <div class="weight-recorder">
        <p class="section-subtitle">오늘 체중 바로 기록하기</p>
        <form @submit.prevent="submitWeight" class="record-form">
          <div class="input-wrapper">
            <input
              v-model.number="todayWeight"
              type="number"
              step="0.1"
              placeholder="0.0"
              required
              class="weight-input"
            />
            <span class="unit">kg</span>
          </div>
          <button type="submit" class="btn-record">기록</button>
        </form>
      </div>
    </template>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios"; // 💡 직접 API 연동을 위해 추가

// 💡 단독 컴포넌트이므로 props와 emit은 과감히 삭제!
const profile = ref(null);
const isLoading = ref(true);
const isEditMode = ref(false);
const todayWeight = ref("");

// 💡 수정 입력 폼 데이터 보관소
const editForm = ref({
  nickName: "",
  age: 0,
  gender: "NONE",
  height: 0,
  weight: 0,
  goalWeight: 0,
});

// 1. 화면이 켜지면 백엔드 문지기 거쳐서 데이터 가져오기 (원래 UserController에 있던 프로필 조회 API)
const fetchProfileData = async () => {
  try {
    isLoading.value = true;
    const response = await axios.get("/api/users/profile");
    profile.value = response.data;
  } catch (error) {
    console.error("프로필 조회 실패:", error);
    alert("내 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchProfileData();
});

// 2. 수정 모드 진입 (기존 데이터 복사)
const startEdit = () => {
  editForm.value = {
    nickName: profile.value?.nick_name || profile.value?.nickName || "",
    age: profile.value?.age || 0,
    gender: profile.value?.gender || "NONE",
    height: profile.value?.height || 0,
    weight: profile.value?.weight || 0,
    goalWeight: profile.value?.goal_weight || profile.value?.goalWeight || 0,
  };
  isEditMode.value = true;
};

const cancelEdit = () => {
  isEditMode.value = false;
};

// 3. 💡 백엔드로 다이렉트 수정 요청 날리기 (JWT 인증)
const saveEdit = async () => {
  if (!editForm.value.nickName.trim()) {
    alert("닉네임을 입력해 주세요.");
    return;
  }

  try {
    // 우리가 백엔드에 새로 만든 PUT /api/users/profile 호출!
    await axios.put("/api/users/profile", editForm.value);

    alert("프로필이 성공적으로 수정되었습니다! ✨");
    isEditMode.value = false;

    // 화면 갱신을 위해 데이터를 다시 서버에서 깔끔하게 땡겨옴
    fetchProfileData();
  } catch (error) {
    alert("수정 실패: " + (error.response?.data || error.message));
  }
};

// 4. 단독 체중 기록 기능 추가 연동
const submitWeight = async () => {
  if (todayWeight.value <= 0) {
    alert("올바른 체중을 입력해 주세요.");
    return;
  }

  try {
    // 임시 수정을 위해 아까 만든 editForm 체계를 활용하거나 별도 전송 가능
    // 여기서는 화면 전체 수정을 호출하는 로직으로 편하게 처리
    const updatePayload = {
      nickName: profile.value?.nick_name || profile.value?.nickName,
      age: profile.value?.age,
      gender: profile.value?.gender,
      height: profile.value?.height,
      weight: todayWeight.value, // 입력한 오늘의 체중만 치환
      goalWeight: profile.value?.goal_weight || profile.value?.goalWeight,
    };

    await axios.put("/api/users/profile", updatePayload);
    alert("오늘의 체중이 등록되었습니다!");
    todayWeight.value = "";
    fetchProfileData(); // 최신 달성도 갱신을 위한 새로고침
  } catch (error) {
    alert("체중 기록 실패: " + (error.response?.data || error.message));
  }
};

// 달성률 계산 로직
const achievementRate = computed(() => {
  const current = profile.value?.weight || 0;
  const target = profile.value?.goal_weight || profile.value?.goalWeight || 0;

  if (!current || !target || current === target) return 100;

  if (current > target) {
    const gap = current - target;
    if (gap > 20) return 0;
    return Math.max(0, Math.min(100, Math.round(((20 - gap) / 20) * 100)));
  } else {
    const gap = target - current;
    if (gap > 20) return 0;
    return Math.max(0, Math.min(100, Math.round(((20 - gap) / 20) * 100)));
  }
});
</script>

<style scoped>
/* 기존의 미니멀 감성의 CSS 스타일에 로딩창과 인풋창 스타일 보완 */
.profile-sidebar {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
  box-sizing: border-box;
}
.loading-box {
  padding: 40px;
  text-align: center;
  color: #888;
  font-size: 14px;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.avatar-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #eeeeee;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.user-nickname {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #000000;
}
.user-badge {
  font-size: 12px;
  color: #888888;
  font-weight: 500;
}
.goal-phrase-box {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 8px;
}
.goal-title {
  margin: 0 0 6px 0;
  font-size: 11px;
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
}
.goal-text {
  margin: 0;
  font-size: 13px;
  color: #555555;
  line-height: 1.4;
  font-style: italic;
}
.divider {
  border: none;
  border-top: 1px solid #e5e5e5;
  margin: 20px 0;
}
.profile-specs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
}
.spec-item .label {
  font-size: 13px;
  color: #666666;
  font-weight: 500;
}
.spec-item .value {
  font-size: 15px;
  font-weight: 700;
  color: #000000;
}
.spec-item .value.target {
  color: #22c55e;
}
.spec-item .value small {
  font-size: 11px;
  color: #888888;
  font-weight: 400;
  margin-left: 1px;
}
.achievement-progress {
  margin-top: 10px;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 6px;
}
.progress-percentage {
  color: #22c55e;
}
.progress-track {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #000000;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.section-subtitle {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 700;
  color: #000000;
}
.record-form {
  display: flex;
  gap: 8px;
}
.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0 12px;
  background: #ffffff;
  transition: border-color 0.2s;
}
.input-wrapper:focus-within {
  border-color: #000000;
}
.weight-input {
  width: 100%;
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 14px;
  color: #000000;
}
.btn-record {
  padding: 0 16px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-record:hover {
  opacity: 0.85;
}

/* 수정 스타일 구역 */
.inline-input {
  border: none;
  border-bottom: 1px solid #ccc;
  font-size: 14px;
  outline: none;
  padding: 2px 4px;
}
.inline-input:focus {
  border-bottom: 1px solid #000;
}
.nick-input {
  font-size: 16px;
  font-weight: 700;
  width: 120px;
}
.age-input {
  width: 40px;
  text-align: center;
}
.inline-select {
  border: none;
  border-bottom: 1px solid #ccc;
  font-size: 12px;
  outline: none;
  color: #555;
}
.edit-input-wrapper {
  display: flex;
  align-items: center;
  gap: 2px;
}
.spec-input {
  width: 60px;
  text-align: right;
  border: none;
  border-bottom: 1px solid #ccc;
  font-size: 14px;
  font-weight: 700;
  outline: none;
}
.spec-input:focus {
  border-bottom: 1px solid #000;
}
.profile-action-box {
  margin-top: 16px;
}
.btn-profile-edit {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #555;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-profile-edit:hover {
  border-color: #000;
  color: #000;
}
.edit-actions {
  display: flex;
  gap: 6px;
}
.btn-profile-save {
  flex: 2;
  padding: 10px;
  background: #000000;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-profile-cancel {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
