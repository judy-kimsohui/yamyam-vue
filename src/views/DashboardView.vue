<template>
  <div class="dashboard">
    <!-- ── 헤더 ── -->
    <header class="dash-header">
      <div class="dash-logo-area">
        <button
          v-if="subView !== 'groups'"
          class="logo-back"
          @click="subView = 'groups'"
        >
          <i class="ti ti-arrow-left"></i>
        </button>
        <span
          v-if="subView === 'groups'"
          class="dash-logo clickable"
          @click="goTo('home')"
          >YamYam</span
        >
      </div>
      <nav v-if="subView === 'groups'" class="dash-nav">
        <button class="nav-pill" @click="subView = 'mylog'">마이로그</button>
        <button class="nav-pill" @click="subView = 'mypage'">마이페이지</button>
      </nav>
    </header>

    <!-- ══════════════ 그룹 메인 뷰 ══════════════ -->
    <main v-if="subView === 'groups'" class="dash-body form-fade">
      <!-- 광고 배너 -->
      <div class="ad-banner">
        <span class="ad-label">AD</span>
        <span class="ad-text">건강한 식단 관리, 오늘부터 시작하세요</span>
      </div>
      <!-- 오늘 식단 업로드 슬롯 -->
      <div class="section-row" style="margin-bottom: 12px">
        <span class="section-title">오늘 기록 · {{ todayMealLabel }}</span>
      </div>
      <div class="today-meals-section">
        <div class="today-meal-slots">
          <div
            v-for="mt in [
              { key: 'BREAKFAST', label: '아침' },
              { key: 'LUNCH', label: '점심' },
              { key: 'DINNER', label: '저녁' },
            ]"
            :key="mt.key"
            class="meal-upload-slot"
            @click="openUploadForMeal(mt.key)"
          >
            <div class="meal-slot-placeholder">
              <i class="ti ti-upload"></i>
              <span class="meal-slot-lbl">{{ mt.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="section-row">
        <span class="section-title">참여 중인 그룹</span>
        <div class="section-actions">
          <button
            type="button"
            class="join-btn"
            @click="openJoinInvitePrompt"
            title="초대 링크로 참여"
          >
            초대 링크로 참여
          </button>
          <button
            type="button"
            class="icon-btn-round"
            @click="isCreateModalOpen = true"
            title="그룹 만들기"
          >
            <i class="ti ti-plus"></i>
          </button>
        </div>
      </div>
      <div v-if="groups.length === 0" class="empty-groups">
        <p>아직 참여 중인 그룹이 없습니다.</p>
        <button class="btn-outline" @click="isCreateModalOpen = true">
          그룹 만들기
        </button>
      </div>
      <div class="group-list">
        <div
          v-for="group in groups"
          :key="group.id"
          class="group-card"
          @click="openGroup(group)"
        >
          <img src="/default_group.svg" class="group-icon-img" alt="group" />
          <div class="group-info">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-members">{{ group.members }}명 참여중</div>
          </div>
          <button class="share-btn" @click.stop="copyInviteCode(group)">
            초대 코드 복사
          </button>
        </div>
      </div>
    </main>

    <!-- ══════════════ 마이페이지 ══════════════ -->
    <main
      v-else-if="subView === 'mypage'"
      class="dash-body form-fade mypage-body"
    >
      <h2 class="sub-title">내 프로필</h2>
      <DashboardUserProfile
        :profile="userProfileData"
        @update-weight="handleWeightUpdateBackend"
      />
      <button class="mypage-logout" @click="auth.logout()">로그아웃</button>
    </main>

    <!-- ══════════════ 마이로그 ══════════════ -->
    <template v-else-if="subView === 'mylog'">
      <!-- MOBILE (< 768px): 세로 스택 -->
      <main v-if="isMobile" class="scroll-body form-fade">
        <!-- 달력 -->
        <div class="mylog-cal-wrap">
          <div class="cal-nav">
            <button class="cal-arrow" @click="prevMonth">
              <i class="ti ti-chevron-left"></i>
            </button>
            <span class="cal-month">{{ monthLabel }}</span>
            <button class="cal-arrow" @click="nextMonth">
              <i class="ti ti-chevron-right"></i>
            </button>
          </div>
          <div class="cal-weekdays">
            <span
              v-for="d in ['일', '월', '화', '수', '목', '금', '토']"
              :key="d"
              >{{ d }}</span
            >
          </div>
          <div class="cal-grid">
            <div
              v-for="(cell, i) in calendarCells"
              :key="i"
              class="cal-cell"
              :class="{
                empty: !cell,
                selected: cell === selectedDay,
                today:
                  cell === todayDate &&
                  currentMonth === todayMonth &&
                  currentYear === todayYear,
              }"
              @click="cell && selectDay(cell)"
            >
              <template v-if="cell">
                <span class="cal-num">{{ cell }}</span>
                <span
                  v-if="getDayEmoji(cell)"
                  class="cal-emoji"
                  v-html="getDayEmoji(cell)"
                ></span>
              </template>
            </div>
          </div>
        </div>

        <!-- 선택일 영상 -->
        <div class="mylog-day-header">
          <span class="mylog-day-title"
            >{{ currentMonth + 1 }}월 {{ selectedDay }}일 기록</span
          >
        </div>
        <div v-if="loadingDayVideos" class="mylog-empty">불러오는 중...</div>
        <div v-else-if="dayVideos.length === 0" class="mylog-empty">
          <i class="ti ti-video-off" style="font-size: 28px; color: #ccc"></i>
          <p>이 날 기록이 없어요</p>
        </div>
        <div v-else class="mylog-list-mobile">
          <div v-for="v in dayVideos" :key="v.id" class="mylog-card">
            <video
              :src="v.videoUrl"
              autoplay
              loop
              muted
              playsinline
              class="mylog-video"
            ></video>
            <span v-if="v.description" class="mylog-center-desc">{{
              v.description
            }}</span>
            <div class="mylog-vid-bottom">
              <span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span>
            </div>
          </div>
        </div>
      </main>

      <!-- TABLET (768–1199px): 좌 달력 + 우 영상 그리드 -->
      <div v-else-if="!isWide" class="tablet-split form-fade">
        <aside class="tablet-cal-panel">
          <div class="cal-nav">
            <button class="cal-arrow" @click="prevMonth">
              <i class="ti ti-chevron-left"></i>
            </button>
            <span class="cal-month">{{ monthLabel }}</span>
            <button class="cal-arrow" @click="nextMonth">
              <i class="ti ti-chevron-right"></i>
            </button>
          </div>
          <div class="cal-weekdays">
            <span
              v-for="d in ['일', '월', '화', '수', '목', '금', '토']"
              :key="d"
              >{{ d }}</span
            >
          </div>
          <div class="cal-grid">
            <div
              v-for="(cell, i) in calendarCells"
              :key="i"
              class="cal-cell"
              :class="{
                empty: !cell,
                selected: cell === selectedDay,
                today:
                  cell === todayDate &&
                  currentMonth === todayMonth &&
                  currentYear === todayYear,
              }"
              @click="cell && selectDay(cell)"
            >
              <template v-if="cell">
                <span class="cal-num">{{ cell }}</span>
                <span
                  v-if="getDayEmoji(cell)"
                  class="cal-emoji"
                  v-html="getDayEmoji(cell)"
                ></span>
              </template>
            </div>
          </div>
        </aside>
        <main class="tablet-video-panel">
          <div class="mylog-day-header">
            <span class="mylog-day-title"
              >{{ currentMonth + 1 }}월 {{ selectedDay }}일 기록</span
            >
            <div class="mylog-filter-bar">
              <button
                v-for="f in mealFilters"
                :key="f.key"
                class="mylog-filter-btn"
                :class="{ active: activeFilter === f.key }"
                @click="activeFilter = f.key"
              >
                {{ f.label }}
              </button>
            </div>
          </div>
          <div v-if="loadingDayVideos" class="mylog-empty">불러오는 중...</div>
          <div v-else-if="filteredDayVideos.length === 0" class="mylog-empty">
            <i class="ti ti-video-off" style="font-size: 32px; color: #ccc"></i>
            <p>이 날 기록이 없어요</p>
          </div>
          <div v-else class="mylog-grid-2">
            <div v-for="v in filteredDayVideos" :key="v.id" class="mylog-card">
              <video
                :src="v.videoUrl"
                autoplay
                loop
                muted
                playsinline
                class="mylog-video"
              ></video>
              <span v-if="v.description" class="mylog-center-desc">{{
                v.description
              }}</span>
              <div class="mylog-vid-bottom">
                <span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- WIDE DESKTOP (≥1200px): 1/3 달력 + 2/3 영상 그리드 -->
      <div v-else class="wide-split form-fade">
        <aside class="wide-cal-panel">
          <div class="cal-nav">
            <button class="cal-arrow" @click="prevMonth">
              <i class="ti ti-chevron-left"></i>
            </button>
            <span class="cal-month">{{ monthLabel }}</span>
            <button class="cal-arrow" @click="nextMonth">
              <i class="ti ti-chevron-right"></i>
            </button>
          </div>
          <div class="cal-weekdays">
            <span
              v-for="d in ['일', '월', '화', '수', '목', '금', '토']"
              :key="d"
              >{{ d }}</span
            >
          </div>
          <div class="cal-grid">
            <div
              v-for="(cell, i) in calendarCells"
              :key="i"
              class="cal-cell"
              :class="{
                empty: !cell,
                selected: cell === selectedDay,
                today:
                  cell === todayDate &&
                  currentMonth === todayMonth &&
                  currentYear === todayYear,
              }"
              @click="cell && selectDay(cell)"
            >
              <template v-if="cell">
                <span class="cal-num">{{ cell }}</span>
                <span
                  v-if="getDayEmoji(cell)"
                  class="cal-emoji"
                  v-html="getDayEmoji(cell)"
                ></span>
              </template>
            </div>
          </div>
          <!-- 월간 통계 -->
          <div class="month-stats">
            <div class="month-stats-title">이번 달 기록</div>
            <div class="month-stats-grid">
              <div class="mstat">
                <div class="mstat-val">{{ allMyVideos.length }}</div>
                <div class="mstat-lbl">총 영상</div>
              </div>
              <div class="mstat">
                <div class="mstat-val">{{ countByMeal("BREAKFAST") }}</div>
                <div class="mstat-lbl">아침</div>
              </div>
              <div class="mstat">
                <div class="mstat-val">{{ countByMeal("LUNCH") }}</div>
                <div class="mstat-lbl">점심</div>
              </div>
              <div class="mstat">
                <div class="mstat-val">{{ countByMeal("DINNER") }}</div>
                <div class="mstat-lbl">저녁</div>
              </div>
            </div>
          </div>
        </aside>
        <main class="wide-video-panel">
          <div class="mylog-day-header">
            <span class="mylog-day-title"
              >{{ currentMonth + 1 }}월 {{ selectedDay }}일 기록</span
            >
            <div class="mylog-filter-bar">
              <button
                v-for="f in mealFilters"
                :key="f.key"
                class="mylog-filter-btn"
                :class="{ active: activeFilter === f.key }"
                @click="activeFilter = f.key"
              >
                {{ f.label }}
              </button>
            </div>
          </div>
          <div v-if="loadingDayVideos" class="mylog-empty">불러오는 중...</div>
          <div v-else-if="filteredDayVideos.length === 0" class="mylog-empty">
            <i class="ti ti-video-off" style="font-size: 36px; color: #ccc"></i>
            <p>이 날 기록이 없어요</p>
          </div>
          <div v-else class="mylog-grid-3">
            <div v-for="v in filteredDayVideos" :key="v.id" class="mylog-card">
              <video
                :src="v.videoUrl"
                autoplay
                loop
                muted
                playsinline
                class="mylog-video"
              ></video>
              <span v-if="v.description" class="mylog-center-desc">{{
                v.description
              }}</span>
              <div class="mylog-vid-bottom">
                <span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- 동영상 업로드 모달 -->
    <VideoUploadModal
      v-if="isUploadModalOpen"
      :teams="groups"
      :default-meal-type="uploadMealType"
      @close="isUploadModalOpen = false"
      @upload="onVideoUploadSubmit"
    />
    <!-- 토스트 -->
    <Transition name="toast-fade">
      <div v-if="toastVisible" class="toast-popup">{{ toastMessage }}</div>
    </Transition>

    <!-- 그룹 생성 모달 -->
    <div
      v-if="isCreateModalOpen"
      class="modal-overlay"
      @click.self="isCreateModalOpen = false"
    >
      <div class="modal-box">
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

    <div
      v-if="isJoinModalOpen"
      class="modal-overlay"
      @click.self="isJoinModalOpen = false"
    >
      <div class="modal-box">
        <h3 class="modal-title">초대 링크로 참여</h3>
        <div class="form-group">
          <label>초대 링크 또는 코드</label>
          <input
            v-model="joinInviteInput"
            placeholder="yamyam://invite/XXXXXXXXXX"
            class="form-input"
          />
        </div>
        <div class="modal-actions">
          <button
            type="button"
            @click="isJoinModalOpen = false"
            class="btn-cancel"
          >
            취소
          </button>
          <button
            type="button"
            @click="handleJoinInviteSubmit"
            class="btn-submit"
          >
            참여하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { emojis, calendarData } from "../data/mockData.js";
import { useStore } from "../composables/useStore.js";
import DashboardUserProfile from "@/components/DashboardUserProfile.vue";
import VideoUploadModal from "@/components/VideoUploadModal.vue";

const { goTo } = inject("navigation");
const auth = inject("auth");
const { groups, selectedGroup } = useStore();

const subView = ref("groups");
const isUploadModalOpen = ref(false);
const isCreateModalOpen = ref(false);
const isJoinModalOpen = ref(false);
const newGroupName = ref("");
const newMemberCount = ref("");
const joinInviteInput = ref("");
const uploadMealType = ref("");

const toastVisible = ref(false);
const toastMessage = ref("");
const inviteLinkHandled = ref(false);
let toastTimer = null;
function showToast(msg) {
  toastMessage.value = msg;
  toastVisible.value = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

const _today = new Date();
const todayMealLabel = `${_today.getMonth() + 1}월 ${_today.getDate()}일`;

function openUploadForMeal(mealType) {
  uploadMealType.value = mealType;
  isUploadModalOpen.value = true;
}

// ── 반응형 ──
const isMobile = ref(window.innerWidth < 768);
const isWide = ref(window.innerWidth >= 1200);
const onResize = () => {
  isMobile.value = window.innerWidth < 768;
  isWide.value = window.innerWidth >= 1200;
};
window.addEventListener("resize", onResize);
onUnmounted(() => window.removeEventListener("resize", onResize));

// ── 마이로그 ──
const mealFilters = [
  { key: "all", label: "전체" },
  { key: "BREAKFAST", label: "아침" },
  { key: "LUNCH", label: "점심" },
  { key: "DINNER", label: "저녁" },
];
const activeFilter = ref("all");
const dayVideos = ref([]); // 선택된 날짜의 영상
const allMyVideos = ref([]); // 이번 달 전체 (통계용)
const loadingDayVideos = ref(false);

function toDateStr(d, y, m) {
  const yy = y ?? d.getFullYear();
  const mm = String((m ?? d.getMonth()) + 1).padStart(2, "0");
  const dd = String(d instanceof Date ? d.getDate() : d).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

async function selectDay(d) {
  selectedDay.value = d;
  loadingDayVideos.value = true;
  const dateStr = toDateStr(d, currentYear.value, currentMonth.value);
  try {
    const res = await axios.get(`/api/videos/my?date=${dateStr}`);
    dayVideos.value = res.data;
  } catch {
    dayVideos.value = [];
  } finally {
    loadingDayVideos.value = false;
  }
}

const filteredDayVideos = computed(() =>
  activeFilter.value === "all"
    ? dayVideos.value
    : dayVideos.value.filter((v) => v.mealType === activeFilter.value),
);

function mealLabel(key) {
  return { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" }[key] ?? key;
}
function countByMeal(key) {
  return allMyVideos.value.filter((v) => v.mealType === key).length;
}

// ── 달력 ──
const today = new Date();
const todayDate = today.getDate();
const todayMonth = today.getMonth();
const todayYear = today.getFullYear();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const selectedDay = ref(today.getDate());
const monthLabel = computed(
  () => `${currentYear.value}년 ${currentMonth.value + 1}월`,
);

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOfWeek(y, m) {
  return new Date(y, m, 1).getDay();
}

const calendarCells = computed(() => {
  const total = daysInMonth(currentYear.value, currentMonth.value);
  const offset = firstDayOfWeek(currentYear.value, currentMonth.value);
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
});

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else currentMonth.value--;
}
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else currentMonth.value++;
}

function getDayEmoji(day) {
  if (currentYear.value > todayYear) return "";
  if (currentYear.value === todayYear && currentMonth.value > todayMonth)
    return "";
  if (
    currentYear.value === todayYear &&
    currentMonth.value === todayMonth &&
    day > todayDate
  )
    return "";
  const mood = calendarData[day];
  return mood ? emojis[mood] : "";
}

// ── 마이페이지 ──
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

const fetchUserProfile = async () => {
  try {
    const res = await axios.get("/api/users/profile");
    if (res.data) userProfileData.value = res.data;
  } catch (e) {
    console.error("프로필 로드 실패:", e);
  }
};
const fetchMyTeams = async () => {
  try {
    const res = await axios.get("/api/teams/my");
    groups.value = res.data;
  } catch (e) {
    console.error("그룹 목록 로드 실패:", e);
  }
};

function parseInviteCode(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  const deepLinkMatch = trimmed.match(/yamyam:\/\/invite\/([^\/?#]+)/i);
  if (deepLinkMatch) return decodeURIComponent(deepLinkMatch[1]);

  const urlPathMatch = trimmed.match(/\/invite\/([^\/?#]+)/i);
  if (urlPathMatch) return decodeURIComponent(urlPathMatch[1]);

  try {
    const parsedUrl = new URL(trimmed);
    const queryCode =
      parsedUrl.searchParams.get("invite") ||
      parsedUrl.searchParams.get("inviteCode");
    if (queryCode) return queryCode.trim();
  } catch {
    // URL 형식이 아니면 코드 입력으로 처리
  }

  return trimmed;
}

function extractInviteCodeFromCurrentUrl() {
  const href = window.location.href;

  try {
    const current = new URL(href);
    const queryCode =
      current.searchParams.get("invite") ||
      current.searchParams.get("inviteCode");
    if (queryCode) return queryCode.trim();

    const pathMatch = current.pathname.match(/\/invite\/([^\/?#]+)/i);
    if (pathMatch) return decodeURIComponent(pathMatch[1]);

    const hashMatch = (current.hash || "").match(/invite[=/]([^\/?#&]+)/i);
    if (hashMatch) return decodeURIComponent(hashMatch[1]);
  } catch {
    // 파싱 실패 시 원본 문자열에서 딥링크 패턴만 확인
  }

  const deepLinkMatch = href.match(/yamyam:\/\/invite\/([^\/?#]+)/i);
  if (deepLinkMatch) return decodeURIComponent(deepLinkMatch[1]);

  return "";
}

function clearInviteQueryFromUrl() {
  try {
    const current = new URL(window.location.href);
    if (
      !current.searchParams.has("invite") &&
      !current.searchParams.has("inviteCode")
    ) {
      return;
    }

    current.searchParams.delete("invite");
    current.searchParams.delete("inviteCode");
    const nextUrl = `${current.pathname}${current.search}${current.hash}`;
    window.history.replaceState({}, "", nextUrl);
  } catch {
    // URL을 변경하지 못해도 기능 자체는 유지
  }
}

async function joinTeamByInviteCode(rawInput) {
  const inviteCode = parseInviteCode(rawInput);
  if (!inviteCode) {
    showToast("초대 링크 또는 코드를 입력해 주세요.");
    return false;
  }

  try {
    await axios.post("/api/teams/join", { inviteCode });
    await fetchMyTeams();
    showToast("그룹 참여 완료!");
    return true;
  } catch (e) {
    showToast("참여 실패: " + (e.response?.data || "서버 오류"));
    return false;
  }
}

async function openJoinInvitePrompt() {
  joinInviteInput.value = "";
  isJoinModalOpen.value = true;
}

async function handleJoinInviteSubmit() {
  const joined = await joinTeamByInviteCode(joinInviteInput.value);
  if (joined) {
    isJoinModalOpen.value = false;
    joinInviteInput.value = "";
  }
}
const handleWeightUpdateBackend = async (newWeight) => {
  try {
    await axios.post("/api/users/weight-history", { weight: newWeight });
    userProfileData.value.weight = newWeight;
    alert(`오늘의 몸무게(${newWeight}kg)가 기록되었습니다.`);
  } catch (e) {
    alert("체중 기록 실패: " + (e.response?.data || "서버 오류"));
  }
};
const handleCreateGroup = async () => {
  const name = newGroupName.value.trim();
  if (!name) return;
  try {
    await axios.post("/api/teams", {
      teamName: name,
      capacity: parseInt(newMemberCount.value) || 10,
    });
    await fetchMyTeams();
    isCreateModalOpen.value = false;
    newGroupName.value = "";
    newMemberCount.value = "";
  } catch (e) {
    alert("그룹 생성 오류: " + (e.response?.data || "서버 오류"));
  }
};
const onVideoUploadSubmit = async ({
  teamIds,
  mealType,
  mealDate,
  description,
  file,
}) => {
  try {
    await Promise.all(
      teamIds.map((teamId) => {
        const formData = new FormData();
        formData.append("teamId", teamId);
        formData.append("mealType", mealType);
        formData.append("mealDate", mealDate);
        if (description) formData.append("description", description);
        formData.append("videoFile", file);
        return axios.post("/api/videos/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }),
    );
    isUploadModalOpen.value = false;
    alert("얌얌 로그가 업로드되었습니다!");
  } catch (e) {
    alert("업로드 실패: " + (e.response?.data || "서버 오류"));
  }
};
function copyInviteCode(group) {
  const inviteCode = group?.inviteCode;
  if (!inviteCode) {
    showToast("초대코드를 찾을 수 없습니다.");
    return;
  }

  const code = `yamyam://invite/${inviteCode}`;
  navigator.clipboard?.writeText(code).catch(() => {});
  showToast("링크 복사 완료!");
}
function openGroup(group) {
  selectedGroup.value = group;
  goTo("group-detail");
}

onMounted(async () => {
  fetchUserProfile();
  await fetchMyTeams();

  if (!inviteLinkHandled.value) {
    const inviteCodeFromUrl = extractInviteCodeFromCurrentUrl();
    if (inviteCodeFromUrl) {
      inviteLinkHandled.value = true;
      await joinTeamByInviteCode(inviteCodeFromUrl);
      clearInviteQueryFromUrl();
    }
  }

  // 이번 달 전체 영상 (통계용)
  try {
    const res = await axios.get("/api/videos/my");
    allMyVideos.value = res.data;
  } catch {
    allMyVideos.value = [];
  }
  // 오늘 영상 로드
  await selectDay(today.getDate());
});
</script>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #fff;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.02em;
  overflow: hidden;
}

/* ── 헤더 ── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
  background: #fff;
}
.dash-logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-back {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  font-size: 18px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.logo-back:hover {
  background: #f0f0f0;
}
.dash-logo {
  font-size: 20px;
  font-weight: 800;
  color: #000;
  letter-spacing: -0.04em;
}
.dash-logo.clickable {
  cursor: pointer;
}
.dash-logo.clickable:hover {
  opacity: 0.7;
}
.dash-nav {
  display: flex;
  gap: 8px;
  align-items: center;
}
.nav-pill {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid #e5e5e5;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}
.nav-pill:hover {
  border-color: #e8909e;
  color: #e8909e;
}
.nav-pill.active {
  background: #e8909e;
  color: #fff;
  border-color: #e8909e;
}
/* ── 공통 바디 ── */
.dash-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px 40px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
.mypage-body {
  display: flex;
  flex-direction: column;
}
.mypage-logout {
  margin-top: 32px;
  align-self: flex-start;
  background: none;
  border: none;
  color: #999;
  font-size: 13px;
  font-weight: 500;
  padding: 0;
  cursor: pointer;
  transition: color 0.15s;
}
.mypage-logout:hover {
  color: #e53e3e;
}
.scroll-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 32px;
}

/* ── 광고 배너 ── */
.ad-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #edf7f1;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
  border: 1px solid #c8e6d4;
}
.ad-label {
  font-size: 10px;
  font-weight: 700;
  color: #7ec8a0;
  padding: 1px 5px;
  border: 1px solid #a8d8bc;
  border-radius: 3px;
  flex-shrink: 0;
}
.ad-text {
  font-size: 13px;
  color: #7aaa8e;
}

/* ── 오늘 식단 업로드 슬롯 ── */
.today-meals-section {
  margin-bottom: 24px;
}
.today-meal-slots {
  display: flex;
  gap: 10px;
  width: 100%;
}
.meal-upload-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.meal-slot-placeholder {
  width: 100%;
  aspect-ratio: 1;
  border: 1.5px dashed #ddd;
  border-radius: 12px;
  background: #f8f8f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #ccc;
  font-size: 20px;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}
.meal-upload-slot:hover .meal-slot-placeholder {
  border-color: #bbb;
  background: #f0f0f0;
  color: #999;
}
.meal-slot-lbl {
  font-size: 11px;
  font-weight: 600;
  color: #ccc;
}

/* ── 토스트 ── */
.toast-popup {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  z-index: 9999;
  pointer-events: none;
}
.toast-fade-enter-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.toast-fade-leave-active {
  transition: opacity 0.3s;
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
.toast-fade-leave-to {
  opacity: 0;
}

/* ── 섹션 헤더 ── */
.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.join-btn {
  border: 1px solid #f0c3c9;
  background: #fff2f4;
  color: #be5f70;
  border-radius: 999px;
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.join-btn:hover {
  background: #ffe7eb;
}
.icon-btn-round {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e8909e;
  color: #fff;
  border: none;
  padding: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.group-card {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.group-card:hover {
  background: #fafafa;
}
.group-icon-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.group-info {
  flex: 1;
}
.group-name {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}
.group-members {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
.share-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
}
.share-btn:hover {
  background: #ebebeb;
}
.empty-groups {
  text-align: center;
  padding: 40px 0;
  color: #888;
}
.btn-outline {
  margin-top: 12px;
  padding: 10px 20px;
  border: 1px solid #e8909e;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #e8909e;
  cursor: pointer;
}
.sub-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #000;
}

/* ══════════════════════════════
   달력 (공통)
══════════════════════════════ */
.mylog-cal-wrap {
  padding: 16px;
  background: #fff;
}
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cal-month {
  font-size: 15px;
  font-weight: 700;
  color: #000;
}
.cal-arrow {
  background: none;
  border: none;
  color: #888;
  font-size: 18px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.cal-arrow:hover {
  color: #000;
}
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.cal-weekdays span {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  gap: 1px;
  transition: background 0.15s;
}
.cal-cell.empty {
  cursor: default;
}
.cal-cell:not(.empty):hover {
  background: #f5f5f5;
}
.cal-cell.selected {
  background: #e8909e;
}
.cal-cell.selected .cal-num {
  color: #fff;
}
.cal-cell.today:not(.selected) .cal-num {
  font-weight: 800;
  color: #e8909e;
}
.cal-emoji {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-emoji :deep(svg) {
  width: 18px;
  height: 18px;
  display: block;
}
.cal-num {
  font-size: 10px;
  color: #555;
  line-height: 1;
}

/* ══════════════════════════════
   마이로그 공통
══════════════════════════════ */
.mylog-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px 8px;
}
.mylog-day-title {
  font-size: 14px;
  font-weight: 700;
  color: #000;
}

.mylog-filter-bar {
  display: flex;
  gap: 6px;
}
.mylog-filter-btn {
  padding: 5px 12px;
  border-radius: 20px;
  background: #f0f0f0;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.mylog-filter-btn.active {
  background: #e8909e;
  color: #fff;
}

.mylog-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #aaa;
  font-size: 14px;
  min-height: 200px;
}

/* ── 영상 카드 공통 ── */
.mylog-card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}
.mylog-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mylog-center-desc {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 20px);
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  pointer-events: none;
  line-height: 1.4;
  word-break: keep-all;
}
.mylog-vid-bottom {
  position: absolute;
  bottom: 8px;
  left: 8px;
}
.mylog-vid-tag {
  background: rgba(0, 0, 0, 0.48);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

/* ── 모바일 리스트 ── */
.mylog-list-mobile {
  display: flex;
  flex-direction: column;
}
.mylog-list-mobile .mylog-card {
  aspect-ratio: 16/9;
  border-radius: 0;
}
.mylog-list-mobile .mylog-center-desc {
  font-size: 16px;
}

/* ── 태블릿 분할 ── */
.tablet-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.tablet-cal-panel {
  width: 280px;
  min-width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #e5e5e5;
  padding: 16px;
}
.tablet-video-panel {
  flex: 1;
  overflow-y: auto;
  background: #f7f7f7;
  padding: 0 0 24px;
}
.mylog-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 16px;
}
.mylog-grid-2 .mylog-card {
  aspect-ratio: 1;
}

/* ── 와이드 데스크탑 분할 ── */
.wide-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.wide-cal-panel {
  width: 33%;
  max-width: 360px;
  min-width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #e5e5e5;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.wide-video-panel {
  flex: 1;
  overflow-y: auto;
  background: #f7f7f7;
  padding: 0 0 24px;
}
.mylog-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px;
}
.mylog-grid-3 .mylog-card {
  aspect-ratio: 1;
}

/* 월간 통계 */
.month-stats {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 14px;
}
.month-stats-title {
  font-size: 11px;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}
.month-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.mstat {
  background: #fff;
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
}
.mstat-val {
  font-size: 20px;
  font-weight: 800;
  color: #000;
}
.mstat-lbl {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

/* ── 모달 ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 360px;
}
.modal-title {
  margin: 0 0 20px 0;
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
  color: #666;
  font-weight: 600;
}
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: #000;
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
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.btn-submit {
  padding: 8px 14px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.form-fade {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
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
