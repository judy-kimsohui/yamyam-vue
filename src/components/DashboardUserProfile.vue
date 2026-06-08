<template>
  <aside class="profile-sidebar">
    <div class="profile-header">
      <div class="avatar-wrapper">
        <img
          :src="profile?.profileImg || profile?.profile_img || '/default_avatar.svg'"
          alt="프로필 이미지"
          class="avatar-img"
          @error="(e) => e.target.src = '/default_avatar.svg'"
        />
      </div>

      <div class="user-meta">
        <h3 class="user-nickname">
          {{ profile?.nickName || profile?.nick_name || "사용자" }}
        </h3>
        <span class="user-badge">
          {{
            profile?.gender === "MALE"
              ? "남성"
              : profile?.gender === "FEMALE"
                ? "여성"
                : "선택 안함"
          }}
          · {{ profile?.age || 0 }}세
        </span>
      </div>
    </div>

    <div class="goal-phrase-box">
      <p class="goal-title">🎯 나의 목표 한마디</p>
      <p class="goal-text">
        “
        {{
          profile?.userGoal ||
          profile?.user_goal ||
          "설정된 목표 한마디가 없습니다."
        }}
        ”
      </p>
    </div>

    <hr class="divider" />

    <div class="profile-specs">
      <div class="spec-item">
        <span class="label">현재 신장</span>
        <span class="value">{{ profile?.height || 0 }} <small>cm</small></span>
      </div>
      <div class="spec-item">
        <span class="label">현재 체중</span>
        <span class="value">{{ profile?.weight || 0 }} <small>kg</small></span>
      </div>
      <div class="spec-item">
        <span class="label">목표 체중</span>
        <span class="value target"
          >{{ profile?.goalWeight || profile?.goal_weight || 0 }}
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

    <hr class="divider" />

    <div class="weight-recorder">
      <p class="section-subtitle">📉 오늘 체중 기록하기</p>
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
  </aside>
</template>

<script setup>
import { ref, computed } from "vue";

// 부모 컴포넌트(Dashboard)로부터 유저 데이터 관통 수신
const props = defineProps({
  profile: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      user_id: "",
      nickName: "사용자",
      nick_name: "사용자",
      profileImg: "",
      profile_img: "",
      age: 0,
      gender: "NONE",
      height: 0,
      weight: 0,
      goalWeight: 0,
      goal_weight: 0,
      userGoal: "",
      user_goal: "",
    }),
  },
});

const emit = defineEmits(["update-weight"]);
const todayWeight = ref("");

// 감량 혹은 증량 시나리오를 모두 고려한 유연한 목표 달성률 계산 로직
const achievementRate = computed(() => {
  // 💡 props.profile 내부의 카멜/스네이크 데이터 안전 추출
  const current = props.profile?.weight || 0;
  const target = props.profile?.goalWeight || props.profile?.goal_weight || 0;

  if (!current || !target || current === target) return 100;

  if (current > target) {
    // 감량 모드: 체중이 줄어들수록 100%에 근접
    const gap = current - target;
    if (gap > 20) return 0;
    return Math.max(0, Math.min(100, Math.round(((20 - gap) / 20) * 100)));
  } else {
    // 증량(벌크업) 모드: 체중이 늘어날수록 100%에 근접
    const gap = target - current;
    if (gap > 20) return 0;
    return Math.max(0, Math.min(100, Math.round(((20 - gap) / 20) * 100)));
  }
});

// 체중 기록 제출 핸들러 (부모에게 이벤트를 올려서 Axios 통신 처리 유도)
const submitWeight = () => {
  if (todayWeight.value <= 0) {
    alert("올바른 체중을 입력해 주세요.");
    return;
  }
  emit("update-weight", todayWeight.value);
  todayWeight.value = ""; // 인풋 초기화
};
</script>

<style scoped>
/* 기존에 제공해주신 미니멀 감성의 CSS 스타일 가이드는 100% 그대로 유지됩니다. */
.profile-sidebar {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
  box-sizing: border-box;
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
.weight-input::-webkit-outer-spin-button,
.weight-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.unit {
  font-size: 13px;
  color: #888888;
  font-weight: 500;
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
</style>
