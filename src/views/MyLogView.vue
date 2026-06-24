<template>
  <div class="mylog-container">
    <main v-if="isMobile" class="scroll-body form-fade">
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
          <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{
              empty: !cell,
              selected: cell === selectedDay,
              today: cell === todayDate && currentMonth === todayMonth && currentYear === todayYear,
            }"
            @click="cell && selectDay(cell)"
          >
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="getDayEmoji(cell)" class="cal-emoji" v-html="getDayEmoji(cell)"></span>
            </template>
          </div>
        </div>
      </div>

      <div class="mylog-day-header">
        <span class="mylog-day-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 기록</span>
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
            v-lazy-video
            loop
            muted
            playsinline
            preload="metadata"
            class="mylog-video"
          ></video>
          <span v-if="v.description" class="mylog-center-desc">{{ v.description }}</span>
          <div class="mylog-vid-bottom">
            <span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span>
          </div>
        </div>
      </div>
    </main>

    <div v-else-if="!isWide" class="tablet-split form-fade">
      <aside class="tablet-cal-panel">
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth"><i class="ti ti-chevron-left"></i></button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div class="cal-weekdays">
          <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <div v-for="(cell, i) in calendarCells" :key="i" class="cal-cell"
               :class="{ empty: !cell, selected: cell === selectedDay, today: cell === todayDate && currentMonth === todayMonth && currentYear === todayYear }"
               @click="cell && selectDay(cell)">
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="getDayEmoji(cell)" class="cal-emoji" v-html="getDayEmoji(cell)"></span>
            </template>
          </div>
        </div>
      </aside>
      <main class="tablet-video-panel">
        <div class="mylog-day-header">
          <span class="mylog-day-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 기록</span>
          <div class="mylog-filter-bar">
            <button v-for="f in mealFilters" :key="f.key" class="mylog-filter-btn" :class="{ active: activeFilter === f.key }" @click="activeFilter = f.key">
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
            <video :src="v.videoUrl" v-lazy-video loop muted playsinline preload="metadata" class="mylog-video"></video>
            <span v-if="v.description" class="mylog-center-desc">{{ v.description }}</span>
            <div class="mylog-vid-bottom"><span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span></div>
          </div>
        </div>
      </main>
    </div>

    <div v-else class="wide-split form-fade">
      <aside class="wide-cal-panel">
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth"><i class="ti ti-chevron-left"></i></button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div class="cal-weekdays">
          <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <div v-for="(cell, i) in calendarCells" :key="i" class="cal-cell"
               :class="{ empty: !cell, selected: cell === selectedDay, today: cell === todayDate && currentMonth === todayMonth && currentYear === todayYear }"
               @click="cell && selectDay(cell)">
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="getDayEmoji(cell)" class="cal-emoji" v-html="getDayEmoji(cell)"></span>
            </template>
          </div>
        </div>
        <div class="month-stats">
          <div class="month-stats-title">이번 달 기록</div>
          <div class="month-stats-grid">
            <div class="mstat"><div class="mstat-val">{{ dayVideos.length }}</div><div class="mstat-lbl">총 영상</div></div>
            <div class="mstat"><div class="mstat-val">{{ countByMeal("BREAKFAST") }}</div><div class="mstat-lbl">아침</div></div>
            <div class="mstat"><div class="mstat-val">{{ countByMeal("LUNCH") }}</div><div class="mstat-lbl">점심</div></div>
            <div class="mstat"><div class="mstat-val">{{ countByMeal("DINNER") }}</div><div class="mstat-lbl">저녁</div></div>
          </div>
        </div>
      </aside>
      <main class="wide-video-panel">
        <div class="mylog-day-header">
          <span class="mylog-day-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 기록</span>
          <div class="mylog-filter-bar">
            <button v-for="f in mealFilters" :key="f.key" class="mylog-filter-btn" :class="{ active: activeFilter === f.key }" @click="activeFilter = f.key">
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
            <video :src="v.videoUrl" v-lazy-video loop muted playsinline preload="metadata" class="mylog-video"></video>
            <span v-if="v.description" class="mylog-center-desc">{{ v.description }}</span>
            <div class="mylog-vid-bottom"><span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span></div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from "vue";
import axios from "axios";
import { emojis, calendarData } from "../data/mockData.js";
import { useStore } from "../composables/useStore.js";

const auth = inject("auth");
const { groups } = useStore();

const isMobile = ref(window.innerWidth < 768);
const isWide = ref(window.innerWidth >= 1200);
const onResize = () => { isMobile.value = window.innerWidth < 768; isWide.value = window.innerWidth >= 1200; };
window.addEventListener("resize", onResize);
onUnmounted(() => window.removeEventListener("resize", onResize));

const mealFilters = [{ key: "all", label: "전체" }, { key: "BREAKFAST", label: "아침" }, { key: "LUNCH", label: "점심" }, { key: "DINNER", label: "저녁" }];
const activeFilter = ref("all");
const dayVideos = ref([]);
const loadingDayVideos = ref(false);

const today = new Date();
const todayDate = today.getDate();
const todayMonth = today.getMonth();
const todayYear = today.getFullYear();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const selectedDay = ref(today.getDate());
const monthLabel = computed(() => `${currentYear.value}년 ${currentMonth.value + 1}월`);

function toDateStr(d, y, m) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

async function selectDay(d) {
  selectedDay.value = d;
  loadingDayVideos.value = true;
  const dateStr = toDateStr(d, currentYear.value, currentMonth.value);
  try {
    const res = await axios.post('/graphql', {
      query: `query GetMyVideos($userId: ID, $date: String!) {
        videos(userId: $userId, date: $date) {
          id userId uploaderNickName teamId mealType mealDate videoUrl
          description calories carbs protein fat aiComment likeCount liked createdAt
        }
      }`,
      variables: { userId: String(auth.loginUser.value?.id), date: dateStr }
    });
    dayVideos.value = res.data?.data?.videos ?? [];
  } catch { dayVideos.value = []; } finally { loadingDayVideos.value = false; }
}

const filteredDayVideos = computed(() => activeFilter.value === "all" ? dayVideos.value : dayVideos.value.filter((v) => v.mealType === activeFilter.value));
function mealLabel(key) { return { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" }[key] ?? key; }
function countByMeal(key) { return dayVideos.value.filter((v) => v.mealType === key).length; }

const calendarCells = computed(() => {
  const total = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  const offset = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return [...Array(offset).fill(null), ...Array.from({length: total}, (_, i) => i + 1)];
});

function prevMonth() { if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; } else currentMonth.value--; }
function nextMonth() { if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; } else currentMonth.value++; }
function getDayEmoji(day) {
  if (currentYear.value > todayYear || (currentYear.value === todayYear && currentMonth.value > todayMonth) || (currentYear.value === todayYear && currentMonth.value === todayMonth && day > todayDate)) return "";
  const mood = calendarData[day];
  return mood ? emojis[mood] : "";
}





onMounted(() => selectDay(today.getDate()));
</script>

<style scoped>
/* DashboardView에서 복사한 마이로그 스타일 전체 */
.mylog-cal-wrap { padding: 16px; background: #fff; }
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.cal-month { font-size: 15px; font-weight: 700; color: #000; }
.cal-arrow { background: none; border: none; color: #888; font-size: 18px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
.cal-weekdays span { text-align: center; font-size: 11px; font-weight: 600; color: #aaa; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px; cursor: pointer; gap: 1px; transition: background 0.15s; }
.cal-cell.selected { background: #e8909e; }
.cal-cell.selected .cal-num { color: #fff; }
.cal-num { font-size: 10px; color: #555; line-height: 1; }
.mylog-day-header { display: flex; align-items: center; padding: 12px 16px 8px; justify-content: space-between; }
.mylog-day-title { font-size: 14px; font-weight: 700; color: #000; }
.mylog-list-mobile { display: flex; flex-direction: column; }
.mylog-card { position: relative; overflow: hidden; border-radius: 12px; aspect-ratio: 16/9; }
.mylog-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.mylog-center-desc { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: calc(100% - 20px); font-size: 16px; font-weight: 700; color: #fff; text-align: center; pointer-events: none; }
.mylog-vid-bottom { position: absolute; bottom: 8px; left: 8px; }
.mylog-vid-tag { background: rgba(0, 0, 0, 0.48); border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 700; color: #fff; }
.mylog-filter-bar { display: flex; gap: 6px; }
.mylog-filter-btn { padding: 5px 12px; border-radius: 20px; background: #f0f0f0; border: none; font-size: 12px; font-weight: 600; color: #888; cursor: pointer; }
.mylog-filter-btn.active { background: #e8909e; color: #fff; }
.mylog-empty { text-align: center; padding: 40px; color: #aaa; font-size: 14px; }
.tablet-split, .wide-split { flex: 1; display: flex; overflow: hidden; }
.tablet-cal-panel, .wide-cal-panel { width: 33%; max-width: 360px; padding: 16px; background: #fff; }
.tablet-video-panel, .wide-video-panel { flex: 1; overflow-y: auto; background: #f7f7f7; padding-bottom: 24px; }
.mylog-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 0 16px; }
.mylog-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0 16px; }
.month-stats { background: #f7f7f7; border-radius: 12px; padding: 14px; margin-top: 16px; }
.month-stats-title { font-size: 11px; font-weight: 700; color: #aaa; margin-bottom: 10px; }
.month-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mstat { background: #fff; border-radius: 10px; padding: 10px 8px; text-align: center; }
.mstat-val { font-size: 20px; font-weight: 800; }
.mstat-lbl { font-size: 10px; color: #888; }
</style>