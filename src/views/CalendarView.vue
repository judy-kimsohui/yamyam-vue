<template>
  <div class="dashboard-wrapper">
    <aside class="sidebar-zone">
      <div class="sidebar-logo" @click="goTo('home')">YamYam</div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: currentSubView === 'calendar' }"
          @click="currentSubView = 'calendar'"
        >
          📅 AI 분석 캘린더
        </button>
        <button
          class="nav-item"
          :class="{ active: currentSubView === 'mypage' }"
          @click="currentSubView = 'mypage'"
        >
          👤 나의 마이페이지
        </button>
      </nav>

      <hr class="sidebar-divider" />

      <button @click="isUploadModalOpen = true" class="btn-upload-trigger">
        🎥 팀 동영상 업로드
      </button>
    </aside>

    <main class="main-content-zone">
      <div
        v-if="currentSubView === 'calendar'"
        class="sub-view-layout form-fade"
      >
        <section class="dashboard-card calendar-section">
          <header class="header">
            <div>
              <div class="month-badge">AI 월간 분석</div>
              <div class="month-value">{{ currentMonth }}</div>
            </div>
            <button class="detail-btn">상세 보기 →</button>
          </header>

          <div class="calendar-content-inner">
            <div class="weekdays">
              <span v-for="d in weekdays" :key="d">{{ d }}</span>
            </div>

            <div class="calendar-grid">
              <button
                v-for="day in daysInMonth"
                :key="day"
                class="cal-day"
                :class="{
                  active: selectedDay === day,
                  today: day === new Date().getDate(),
                }"
                @click="selectedDay = day"
              >
                <span class="day-emoji">{{ getDayEmoji(day) }}</span>
                <span class="day-num">{{ day }}</span>
              </button>
            </div>

            <div class="analysis-card">
              <div class="analysis-top">
                <span class="ai-badge">AI 분석</span>
                <span class="analysis-title"
                  >{{ selectedDay }}일 하루 리포트</span
                >
                <span class="day-emoji-large">{{
                  getDayEmoji(selectedDay) || "—"
                }}</span>
              </div>
              <p class="analysis-text">{{ moodText }}</p>
              <p class="analysis-sub">
                단백질 섭취가 목표의 87%를 달성했으며 칼로리 균형이 잘
                맞춰졌어요. 이 추세를 유지하면 이번 달 목표를 달성할 수 있어요!
              </p>
              <div class="stats-row">
                <div class="stat">
                  <div class="stat-value">{{ dayStats.calories }}</div>
                  <div class="stat-label">칼로리</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{{ dayStats.protein }}g</div>
                  <div class="stat-label">단백질</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{{ dayStats.carbs }}g</div>
                  <div class="stat-label">탄수화물</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="dashboard-card team-section">
          <header class="team-header">
            <div class="section-label">참여 중인 그룹</div>
            <button
              class="add-btn"
              @click="isCreateModalOpen = true"
              aria-label="그룹 만들기"
            >
              ➕
            </button>
          </header>

          <div class="group-list">
            <div
              v-for="group in groups"
              :key="group.id"
              class="group-card"
              @click="openGroup(group)"
            >
              <div class="group-icon">👥</div>
              <div class="group-info">
                <div class="group-name">{{ group.name }}</div>
                <div class="group-members">{{ group.members }}명 참여중</div>
              </div>
              <button class="share-btn" @click.stop>공유하기</button>
            </div>
          </div>
        </section>
      </div>

      <div
        v-else-if="currentSubView === 'mypage'"
        class="sub-view-layout form-fade"
      >
        <h2 class="view-main-title">내 계정 관리</h2>

        <DashboardUserProfile
          :profile="userProfileData"
          @update-weight="handleWeightUpdateBackend"
        />
      </div>
    </main>

    <VideoUploadModal
      v-if="isUploadModalOpen"
      :teams="groups"
      @close="isUploadModalOpen = false"
      @upload="onVideoUploadSubmit"
    />

    <div
      v-if="isCreateModalOpen"
      class="modal-overlay"
      @click.self="isCreateModalOpen = false"
    >
      <div class="modal-window">
        <h3 class="modal-title">새로운 그룹 만들기</h3>
        <div class="form-group">
          <label>그룹 이름</label>
          <input
            v-model="newGroupName"
            placeholder="예: 다이어트 챌린지"
            class="form-input"
            maxlength="20"
          />
        </div>
        <div class="form-group">
          <label>최대 인원</label>
          <select v-model="newMemberCount" class="form-input">
            <option value="">인원수 선택</option>
            <option
              v-for="n in [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20]"
              :key="n"
              :value="String(n)"
            >
              {{ n }}명
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="isCreateModalOpen = false" class="btn-cancel">
            취소
          </button>
          <button @click="handleCreateGroup" class="btn-submit">
            생성하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue";
import axios from "axios";
import { emojis, calendarData } from "../data/mockData.js";
import { useStore } from "../composables/useStore.js";

// 리뉴얼된 독립형 외부 컴포넌트 등록
import DashboardUserProfile from "@/components/DashboardUserProfile.vue";
import VideoUploadModal from "@/components/VideoUploadModal.vue";

const { goTo } = inject("navigation");
const { groups, selectedGroup } = useStore();

// 대시보드 내 서브 토글 뷰 상태 변수 ('calendar' | 'mypage')
const currentSubView = ref("calendar");

const isUploadModalOpen = ref(false);
const isCreateModalOpen = ref(false);
const newGroupName = ref("");
const newMemberCount = ref("");

// 🌐 1. 백엔드 관통 연동용 프로필 데이터 상태 초기화 (낙타 표기/스네이크 이중 방어 필드 탑재)
const userProfileData = ref({
  id: null,
  user_id: "",
  nickName: "",
  nick_name: "",
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
});

// ========================================================
// 📡 백엔드 비동기 통신 액션 로직
// ========================================================

// 1. 실제 로그인 유저 프로필 서버 데이터 로드
const fetchUserProfile = async () => {
  try {
    const response = await axios.get("/api/users/profile");
    console.log("백엔드 프로필 수신 성공:", response.data);
    if (response.data) {
      userProfileData.value = response.data;
    }
  } catch (error) {
    console.error("유저 프로필 데이터 로드 실패:", error);
    const status = error.response?.status;
    if (status === 410 || status === 403) {
      alert("세션 인증이 만료되었습니다. 다시 로그인해 주세요.");
    }
  }
};

// 2. 가입된 그룹 목록 실시간 동기화
const fetchMyTeams = async () => {
  try {
    const response = await axios.get("/api/teams/my");
    groups.value = response.data;
  } catch (error) {
    console.error("그룹 목록 수신 실패:", error);
  }
};

// 3. 오늘 자 체중 입력 기록 핸들러 (weight_history 스냅샷 연동)
const handleWeightUpdateBackend = async (newWeight) => {
  try {
    await axios.post("/api/users/weight-history", { weight: newWeight });
    // 서버 적재 후 프론트엔드 리액티브 인스턴스 전역 업데이트 동기화
    userProfileData.value.weight = newWeight;
    if (userProfileData.value.hasOwnProperty("weight_history_weight")) {
      userProfileData.value.weight_history_weight = newWeight;
    }
    alert(`오늘의 몸무게(${newWeight}kg)가 기록 저장되었습니다.`);
  } catch (error) {
    alert("체중 이력 적재 실패: " + (error.response?.data || "네트워크 에러"));
  }
};

// 4. 신규 팀 개설 트랜잭션 요청
const handleCreateGroup = async () => {
  const name = newGroupName.value.trim();
  if (!name) return;
  try {
    await axios.post("/api/teams", {
      teamName: name,
      capacity: parseInt(newMemberCount.value) || 10,
    });
    alert("새로운 팀이 성공적으로 개설되었습니다.");
    fetchMyTeams();
    isCreateModalOpen.value = false;
    newGroupName.value = "";
    newMemberCount.value = "";
  } catch (error) {
    alert("그룹 생성 오류: " + (error.response?.data || "서버 응답 에러"));
  }
};

// 5. 팀 타겟형 멀티파트 동영상 업로드
const onVideoUploadSubmit = async ({ teamId, file }) => {
  try {
    const formData = new FormData();
    formData.append("teamId", teamId);
    formData.append("videoFile", file);

    await axios.post("/api/videos/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    alert(`동영상이 지정된 팀에 성공적으로 공유되었습니다.`);
    isUploadModalOpen.value = false;
  } catch (error) {
    alert("비디오 전송 실패: " + (error.response?.data || "서버 오류"));
  }
};

// ⏱️ 컴포넌트 초기 진입 스케줄러 훅팅
onMounted(() => {
  fetchUserProfile();
  fetchMyTeams();
});

// ========================================================
// 📆 기존 오리지널 캘린더 수학적 연산 및 비즈니스 로직
// ========================================================
const selectedDay = ref(new Date().getDate());
const daysInMonth = 30;
const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const currentMonth = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
});

function getDayEmoji(day) {
  const mood = calendarData[day];
  return mood ? emojis[mood] : "";
}

const selectedMood = computed(() => calendarData[selectedDay.value]);

const moodText = computed(() => {
  const mood = selectedMood.value;
  if (!mood) return "이 날은 기록이 없어요.";
  if (mood === "great" || mood === "excited")
    return "컨디션이 최고였던 하루! 🎉 에너지가 넘쳤네요.";
  if (mood === "good" || mood === "happy")
    return "좋은 하루를 보냈어요. 😊 꾸준히 유지하세요!";
  if (mood === "tired") return "피곤했지만 식단을 지켜냈어요. 💪 대단해요!";
  if (mood === "stressed") return "스트레스받은 하루지만 건강하게 먹었어요.";
  if (mood === "bad" || mood === "terrible")
    return "힘든 하루였지만, 내일은 더 좋아질 거예요.";
  return "평범하게 지낸 하루였어요.";
});

const dayStats = computed(() => {
  const day = selectedDay.value;
  const base = ((day * 31) % 400) + 1400;
  return {
    calories: base,
    protein: Math.round(base * 0.08),
    carbs: Math.round(base * 0.085),
  };
});

function openGroup(group) {
  selectedGroup.value = group;
  goTo("group-detail");
}
</script>

<style scoped>
/* 🖥️ PC 전용 미니멀리즘 플렉서블 스플릿 대시보드 레이아웃 구조 정의 */
.dashboard-wrapper {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.02em;
}

/* 좌측 슬림 내비게이션 바 존 */
.sidebar-zone {
  width: 250px;
  border-right: 1px solid var(--border-light, #e5e5e5);
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  font-size: 22px;
  font-weight: 800;
  color: #000000;
  margin-bottom: 40px;
  cursor: pointer;
  letter-spacing: -0.04em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: auto;
}

.nav-item {
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-item:hover {
  background-color: #f5f5f5;
  color: #000000;
}
.nav-item.active {
  background-color: #000000;
  color: #ffffff;
  font-weight: 600;
}

.sidebar-divider {
  border: none;
  border-top: 1px solid #e5e5e5;
  margin: 20px 0;
}

.btn-upload-trigger {
  width: 100%;
  padding: 14px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-upload-trigger:hover {
  opacity: 0.85;
}

/* 우측 가변 컨텐츠 메인 패널 */
.main-content-zone {
  flex: 1;
  padding: 40px 60px;
  overflow-y: auto;
  background: #ffffff;
}

.sub-view-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 760px; /* 라인 브레이킹 제어 가독성 벨트 */
}

.view-main-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.03em;
}

/* 🧱 대시보드 모듈러 카드 규격 공통 스타일 */
.dashboard-card {
  background: #ffffff;
  border: 1px solid var(--border-light, #e5e5e5);
  border-radius: 12px;
  padding: 24px;
}

/* 캘린더 헤더 및 내부 세부요소 정렬 마이그레이션 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.month-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent, #000000);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.month-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #000000);
}
.detail-btn {
  background: var(--accent-light, #f5f5f5);
  color: var(--accent, #000000);
  border: 1px solid var(--accent-border, #e5e5e5);
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
}
.weekdays span {
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary, #666666);
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 20px;
}
.cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  margin: 0 auto;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
}
.cal-day:hover {
  background: #f5f5f5;
}
.cal-day.today {
  border: 1.5px solid var(--accent-border, #000000);
}
.cal-day.active {
  background: var(--accent, #000000);
}
.cal-day.active .day-num {
  color: #ffffff;
}

.day-emoji {
  font-size: 16px;
  line-height: 1;
}
.day-num {
  font-size: 10px;
  color: var(--text-secondary, #666666);
  margin-top: 2px;
}

/* AI 분석 패널 디자인 레이어 */
.analysis-card {
  background: var(--accent-light, #fafafa);
  border-radius: 14px;
  padding: 18px;
}
.analysis-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.ai-badge {
  background: var(--accent, #000000);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
}
.analysis-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #000000);
  flex: 1;
}
.day-emoji-large {
  font-size: 26px;
}
.analysis-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 6px;
}
.analysis-sub {
  font-size: 12px;
  color: var(--text-secondary, #666666);
  line-height: 1.5;
  margin-bottom: 14px;
}

.stats-row {
  display: flex;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}
.stat {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border-right: 1px solid #e5e5e5;
}
.stat:last-child {
  border-right: none;
}
.stat-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent, #000000);
}
.stat-label {
  font-size: 10px;
  color: var(--text-secondary, #666666);
  margin-top: 2px;
}

/* 참여 그룹 보드 스타일 격자 레이아웃 */
.team-section {
  display: flex;
  flex-direction: column;
}
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #000000;
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.group-card {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.group-card:hover {
  background: #fafafa;
}
.group-icon {
  font-size: 20px;
  margin-right: 14px;
}
.group-info {
  flex: 1;
}
.group-name {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
}
.group-members {
  font-size: 12px;
  color: #666666;
  margin-top: 2px;
}
.share-btn {
  background: #fafafa;
  color: #000000;
  border: 1px solid #e5e5e5;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* 팝업 모달 통합 프레임 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-window {
  background: #ffffff;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 360px;
}
.modal-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 700;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.form-group label {
  font-size: 12px;
  color: #666666;
  font-weight: 600;
}
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}
.form-input:focus {
  border-color: #000000;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
.btn-cancel {
  padding: 8px 14px;
  background: #eee;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.btn-submit {
  padding: 8px 14px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

/* 무브먼트 부드러운 페이드인 트랜지션 */
.form-fade {
  animation: setlogFade 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes setlogFade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
