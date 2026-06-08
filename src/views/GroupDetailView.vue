<script setup>
import { ref, computed, inject } from 'vue'
import {
  groupMembers, groupDayExpressions, groupDayRecords, aiMonthlyAnalysis
} from '../data/mockData.js'
import { useStore } from '../composables/useStore.js'

const { goTo, goBack } = inject('navigation')
const { selectedGroup } = useStore()

// ── 달력 토글 ──
const showCalendar = ref(false)

// ── 달력 상태 ──
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDay = ref(today.getDate())

const monthLabel = computed(() =>
  `${currentYear.value}년 ${currentMonth.value + 1}월`
)

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function firstDayOfWeek(y, m) { return new Date(y, m, 1).getDay() }

const calendarCells = computed(() => {
  const total = daysInMonth(currentYear.value, currentMonth.value)
  const offset = firstDayOfWeek(currentYear.value, currentMonth.value)
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
})

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

// ── 선택된 날 기록 ──
const dayRecord = computed(() =>
  groupDayRecords[selectedDay.value] ?? groupDayRecords.default
)

// ── 피드 ──
const mealTypes = [
  { key: 'breakfast', label: '아침' },
  { key: 'lunch',     label: '점심' },
  { key: 'dinner',    label: '저녁' }
]
</script>

<template>
  <div class="screen">
    <!-- 헤더 -->
    <header class="header">
      <button class="icon-btn" @click="showCalendar ? (showCalendar = false) : goBack()">
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="group-title">{{ showCalendar ? '달력' : (selectedGroup?.name ?? '그룹') }}</div>
      <div class="header-actions" v-if="!showCalendar">
        <button class="icon-btn" @click="showCalendar = true">
          <i class="ti ti-calendar"></i>
        </button>
        <button class="icon-btn" @click="goTo('chat')">
          <i class="ti ti-message-circle"></i>
        </button>
      </div>
      <div v-else class="header-spacer"></div>
    </header>

    <main class="scroll-body">

      <!-- ── 달력 패널 (버튼 클릭 시만) ── -->
      <section v-if="showCalendar" class="calendar-panel">

        <!-- 월 네비게이션 -->
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth">
            <i class="ti ti-chevron-left"></i>
          </button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth">
            <i class="ti ti-chevron-right"></i>
          </button>
        </div>

        <!-- 요일 헤더 -->
        <div class="cal-weekdays">
          <span v-for="d in ['일','월','화','수','목','금','토']" :key="d">{{ d }}</span>
        </div>

        <!-- 날짜 그리드 -->
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{
              empty: !cell,
              selected: cell === selectedDay,
              today: cell === today.getDate() && currentMonth === today.getMonth()
            }"
            @click="cell && (selectedDay = cell)"
          >
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span
                v-if="groupDayExpressions[cell]"
                class="cal-expr"
                :class="{ inverted: cell === selectedDay }"
              >{{ groupDayExpressions[cell] }}</span>
            </template>
          </div>
        </div>

        <!-- 선택된 날 기록 + 멤버 요약 -->
        <div class="day-record">
          <div class="day-record-title">
            {{ currentMonth + 1 }}월 {{ selectedDay }}일 기록
          </div>

          <!-- 그룹 전체 진행 바 -->
          <div class="day-bars">
            <div class="bar-row">
              <span class="bar-label">칼로리</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: Math.min(100, dayRecord.totalCalories / dayRecord.targetCalories * 100) + '%' }"
                ></div>
              </div>
              <span class="bar-val">{{ dayRecord.totalCalories }} / {{ dayRecord.targetCalories }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">단백질</span>
              <div class="bar-track">
                <div
                  class="bar-fill protein"
                  :style="{ width: Math.min(100, dayRecord.protein / dayRecord.targetProtein * 100) + '%' }"
                ></div>
              </div>
              <span class="bar-val">{{ dayRecord.protein }}g / {{ dayRecord.targetProtein }}g</span>
            </div>
          </div>

          <!-- AI 하루 코멘트 -->
          <div class="day-ai">
            <span class="ai-chip">AI</span>
            {{ dayRecord.aiComment }}
          </div>

          <!-- 멤버별 요약 -->
          <div class="member-summary-label">멤버별 식단</div>
          <div class="member-summary-list">
            <div v-for="member in groupMembers" :key="member.id" class="member-summary-row">
              <div class="ms-avatar" :class="{ mine: member.isMine }">{{ member.avatar }}</div>
              <div class="ms-name">{{ member.name }}</div>
              <div class="ms-meals">
                <span
                  v-for="mt in mealTypes"
                  :key="mt.key"
                  class="ms-pill"
                  :class="member.meals[mt.key].uploaded ? 'done' : 'miss'"
                >
                  {{ mt.label }}
                  <i :class="member.meals[mt.key].uploaded ? 'ti ti-check' : 'ti ti-x'"></i>
                </span>
              </div>
              <div class="ms-kcal">
                {{ [member.meals.breakfast, member.meals.lunch, member.meals.dinner]
                    .filter(m => m.uploaded).reduce((s, m) => s + m.calories, 0) }} kcal
              </div>
            </div>
          </div>
        </div>

        <!-- AI 월간 분석 -->
        <div class="monthly-ai">
          <div class="monthly-ai-header">
            <span class="ai-badge">AI 월간 분석</span>
            <span class="ai-period">{{ currentMonth + 1 }}월 리포트</span>
          </div>
          <p class="monthly-ai-summary">{{ aiMonthlyAnalysis.summary }}</p>
          <div class="ai-stats">
            <div v-for="stat in aiMonthlyAnalysis.stats" :key="stat.label" class="ai-stat">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-trend">{{ stat.trend }}</div>
            </div>
          </div>
          <div class="ai-tip">💡 {{ aiMonthlyAnalysis.tip }}</div>
        </div>
      </section>

      <!-- ── 피드 날짜 레이블 ── -->
      <div v-if="!showCalendar" class="feed-date-label">
        {{ currentMonth + 1 }}월 {{ selectedDay }}일 식단 기록
      </div>

      <!-- ── 세트로그 피드 ── -->
      <section v-if="!showCalendar" class="feed">
        <div v-for="member in groupMembers" :key="member.id" class="member-log">

          <!-- 멤버 헤더 -->
          <div class="member-row">
            <div class="member-avatar" :class="{ mine: member.isMine }">
              {{ member.avatar }}
            </div>
            <div class="member-name">{{ member.name }}</div>
            <div v-if="member.isMine" class="mine-badge">나</div>
          </div>

          <!-- 아침 / 점심 / 저녁 -->
          <div class="meal-slots">
            <div v-for="mt in mealTypes" :key="mt.key" class="meal-slot">
              <div class="meal-label">{{ mt.label }}</div>

              <!-- 업로드된 식단 → 루프 영상 -->
              <div v-if="member.meals[mt.key].uploaded" class="video-wrap">
                <video
                  class="meal-video"
                  :src="member.meals[mt.key].video"
                  autoplay
                  loop
                  muted
                  playsinline
                ></video>
                <span class="video-emoji-overlay">{{ member.meals[mt.key].emoji }}</span>
                <div class="video-duration">2s</div>
              </div>

              <!-- 미업로드 -->
              <div v-else class="video-thumb empty">
                <i class="ti ti-plus"></i>
              </div>

              <div class="meal-title-text">
                {{ member.meals[mt.key].uploaded ? member.meals[mt.key].title : '미기록' }}
              </div>
              <div v-if="member.meals[mt.key].uploaded" class="meal-kcal-text">
                {{ member.meals[mt.key].calories }} kcal
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary);
}

/* ── 헤더 ── */
.header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-primary);
  flex-shrink: 0;
}
.group-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
.header-actions { display: flex; gap: 4px; }
.icon-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.icon-btn:active { background: var(--bg-secondary); }
.icon-btn.active { color: var(--accent); background: var(--accent-light); }
.header-spacer { width: 36px; }

/* ── 스크롤 바디 ── */
.scroll-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 24px;
}

/* ── 달력 패널 ── */
.calendar-panel {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cal-month { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.cal-arrow {
  background: transparent; border: none;
  color: var(--text-secondary); font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.cal-weekdays span {
  text-align: center;
  font-size: 11px; font-weight: 600;
  color: var(--text-secondary);
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
  position: relative;
  gap: 1px;
  transition: background 0.15s;
  padding: 2px 0;
}
.cal-cell.empty { cursor: default; }
.cal-cell:not(.empty):active { background: var(--bg-secondary); }
.cal-cell.selected { background: var(--accent); }
.cal-cell.today:not(.selected) .cal-num { color: var(--accent); font-weight: 700; }

.cal-num {
  font-size: 11px;
  color: var(--text-primary);
  line-height: 1;
}
.cal-cell.selected .cal-num { color: #fff; }

.cal-expr {
  font-size: 14px;
  line-height: 1;
}
.cal-expr.inverted {
  filter: brightness(1.15);
}

/* ── 날 기록 ── */
.day-record {
  background: var(--bg-secondary);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.day-record-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.day-meals { display: flex; flex-direction: column; gap: 6px; }
.day-meal-row {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.45;
}
.day-meal-row.done { opacity: 1; }
.day-meal-type {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  width: 28px;
  flex-shrink: 0;
}
.day-meal-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}
.day-meal-kcal {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  flex-shrink: 0;
}

.day-bars { display: flex; flex-direction: column; gap: 6px; }
.bar-row { display: flex; align-items: center; gap: 8px; }
.bar-label { font-size: 11px; color: var(--text-secondary); width: 36px; flex-shrink: 0; }
.bar-track {
  flex: 1;
  height: 6px;
  background: var(--border-light);
  border-radius: 99px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.4s ease;
}
.bar-fill.protein { background: #34c759; }
.bar-val { font-size: 10px; color: var(--text-secondary); width: 80px; text-align: right; flex-shrink: 0; }

.day-ai {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.ai-chip {
  font-size: 10px;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  padding: 2px 6px;
  border-radius: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── 월간 AI ── */
.monthly-ai {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.monthly-ai-header { display: flex; align-items: center; gap: 8px; }
.ai-badge {
  background: var(--accent);
  color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
}
.ai-period { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
.monthly-ai-summary { font-size: 13px; color: var(--text-primary); line-height: 1.6; margin: 0; }
.ai-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.ai-stat {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
}
.stat-value { font-size: 14px; font-weight: 700; color: var(--accent); }
.stat-label { font-size: 10px; color: var(--text-secondary); margin: 2px 0; }
.stat-trend { font-size: 10px; color: var(--text-secondary); font-weight: 600; }
.ai-tip {
  font-size: 12px; color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 10px 12px;
  line-height: 1.5;
}

/* ── 피드 날짜 레이블 ── */
.feed-date-label {
  font-size: 12px; font-weight: 700;
  color: var(--text-secondary);
  padding: 4px 16px 0;
  letter-spacing: 0.3px;
}

/* ── 세트로그 피드 ── */
.feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 12px;
}

.member-log {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 14px;
  border: 1px solid var(--border-light);
}

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.member-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.member-avatar.mine { border: 2px solid var(--accent); }
.member-name { flex: 1; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.mine-badge {
  font-size: 10px; font-weight: 700;
  color: var(--accent);
  background: var(--accent-light);
  border: 1px solid var(--accent-border);
  padding: 2px 7px;
  border-radius: 20px;
}

/* ── 식사 슬롯 ── */
.meal-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.meal-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.meal-label {
  font-size: 10px; font-weight: 700;
  color: var(--text-secondary);
}

/* 영상 래퍼 */
.video-wrap {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.meal-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-emoji-overlay {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 30px;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  pointer-events: none;
}

.video-duration {
  position: absolute;
  bottom: 5px;
  right: 6px;
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  background: rgba(0,0,0,0.40);
  border-radius: 4px;
  padding: 1px 4px;
}

.video-thumb.empty {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  background: var(--bg-secondary);
  border: 1.5px dashed var(--border-medium);
  color: var(--border-medium);
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
}

/* 멤버 요약 (달력 패널 내) */
.member-summary-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.member-summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
}

.ms-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.ms-avatar.mine { border: 2px solid var(--accent); }

.ms-name {
  font-size: 12px; font-weight: 600;
  color: var(--text-primary);
  width: 40px; flex-shrink: 0;
}

.ms-meals {
  flex: 1;
  display: flex;
  gap: 4px;
}

.ms-pill {
  font-size: 10px; font-weight: 600;
  padding: 2px 6px;
  border-radius: 20px;
  display: flex; align-items: center; gap: 2px;
}
.ms-pill.done {
  background: #e8f5e9;
  color: #2e7d32;
}
.ms-pill.miss {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  opacity: 0.6;
}
.ms-pill i { font-size: 9px; }

.ms-kcal {
  font-size: 10px; font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
}

.meal-title-text {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.3;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meal-kcal-text {
  font-size: 9px;
  color: var(--accent);
  font-weight: 700;
}
</style>
