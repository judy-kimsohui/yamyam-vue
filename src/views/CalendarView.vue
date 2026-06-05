<script setup>
import { ref, computed, inject } from 'vue'
import BottomNav from '../components/BottomNav.vue'
import { emojis, calendarData } from '../data/mockData.js'

const { goTo } = inject('navigation')

const selectedDay = ref(new Date().getDate())
const daysInMonth = 30
const weekdays = ['월', '화', '수', '목', '금', '토', '일']

const currentMonth = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })

function getDayEmoji(day) {
  const mood = calendarData[day]
  return mood ? emojis[mood] : ''
}

const selectedMood = computed(() => calendarData[selectedDay.value])

const moodText = computed(() => {
  const mood = selectedMood.value
  if (!mood) return '이 날은 기록이 없어요.'
  if (mood === 'great' || mood === 'excited') return '컨디션이 최고였던 하루! 🎉 에너지가 넘쳤네요.'
  if (mood === 'good' || mood === 'happy') return '좋은 하루를 보냈어요. 😊 꾸준히 유지하세요!'
  if (mood === 'tired') return '피곤했지만 식단을 지켜냈어요. 💪 대단해요!'
  if (mood === 'stressed') return '스트레스받은 하루지만 건강하게 먹었어요.'
  if (mood === 'bad' || mood === 'terrible') return '힘든 하루였지만, 내일은 더 좋아질 거예요.'
  return '평범하게 지낸 하루였어요.'
})

const dayStats = computed(() => {
  const day = selectedDay.value
  const base = ((day * 31) % 400) + 1400
  return {
    calories: base,
    protein: Math.round(base * 0.08),
    carbs: Math.round(base * 0.085)
  }
})
</script>

<template>
  <div class="screen">
    <header class="header">
      <div>
        <div class="month-badge">AI 월간 분석</div>
        <div class="month-value">{{ currentMonth }}</div>
      </div>
      <button class="detail-btn">상세 보기 →</button>
    </header>

    <main class="content">
      <!-- Weekday labels -->
      <div class="weekdays">
        <span v-for="d in weekdays" :key="d">{{ d }}</span>
      </div>

      <!-- Calendar grid -->
      <div class="calendar-grid">
        <div v-for="i in 0" :key="`e${i}`"></div>
        <button
          v-for="day in daysInMonth"
          :key="day"
          class="cal-day"
          :class="{ active: selectedDay === day, today: day === new Date().getDate() }"
          @click="selectedDay = day"
        >
          <span class="day-emoji">{{ getDayEmoji(day) }}</span>
          <span class="day-num">{{ day }}</span>
        </button>
      </div>

      <!-- AI Day Analysis -->
      <div class="analysis-card">
        <div class="analysis-top">
          <span class="ai-badge">AI 분석</span>
          <span class="analysis-title">{{ selectedDay }}일 하루 리포트</span>
          <span class="day-emoji-large">{{ getDayEmoji(selectedDay) || '—' }}</span>
        </div>
        <p class="analysis-text">{{ moodText }}</p>
        <p class="analysis-sub">
          단백질 섭취가 목표의 87%를 달성했으며 칼로리 균형이 잘 맞춰졌어요.
          이 추세를 유지하면 이번 달 목표를 달성할 수 있어요!
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
    </main>

    <BottomNav active-tab="calendar" @navigate="goTo" />
  </div>
</template>

<style scoped>
.screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.month-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 2px;
}

.month-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.detail-btn {
  background: var(--accent-light);
  color: var(--accent);
  border: 1px solid var(--accent-border);
  padding: 7px 13px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.weekdays span {
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary);
  padding: 4px 0;
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 20px;
}

.cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
  padding: 0;
}

.cal-day:hover {
  background: var(--accent-light);
}

.cal-day.today {
  border: 1.5px solid var(--accent-border);
}

.cal-day.active {
  background: var(--accent);
}

.day-emoji {
  font-size: 15px;
  line-height: 1;
}

.day-num {
  font-size: 9px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.cal-day.active .day-num {
  color: #fff;
}

.analysis-card {
  background: var(--accent-light);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 16px;
}

.analysis-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-badge {
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.analysis-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.day-emoji-large {
  font-size: 28px;
}

.analysis-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.5;
}

.analysis-sub {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 14px;
}

.stats-row {
  display: flex;
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
}

.stat {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-right: 1px solid var(--border-light);
}

.stat:last-child {
  border-right: none;
}

.stat-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 2px;
}
</style>
