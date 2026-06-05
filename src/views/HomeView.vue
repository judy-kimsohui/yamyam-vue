<script setup>
import { computed, inject } from 'vue'
import BottomNav from '../components/BottomNav.vue'
import FeedCard from '../components/FeedCard.vue'
import { useStore } from '../composables/useStore.js'

const { goTo } = inject('navigation')
const { feedItems, totalProtein, totalCalories, proteinGoal } = useStore()

const today = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
})

const proteinPercent = computed(() =>
  Math.min((totalProtein.value / proteinGoal.value) * 100, 100)
)
</script>

<template>
  <div class="screen">
    <header class="header">
      <div class="header-top">
        <div>
          <div class="date-label">오늘의 식단</div>
          <div class="date-value">{{ today }}</div>
        </div>
        <div class="avatar">나</div>
      </div>
      <div class="protein-bar-wrap">
        <div class="protein-bar-label">
          <span>💪 단백질 목표</span>
          <span class="protein-value">{{ totalProtein }}g / {{ proteinGoal }}g</span>
        </div>
        <div class="protein-track">
          <div class="protein-fill" :style="{ width: proteinPercent + '%' }"></div>
        </div>
        <div class="calorie-summary">🔥 오늘 총 {{ totalCalories }}kcal 섭취</div>
      </div>
    </header>

    <main class="feed">
      <div class="section-label">기록된 식단</div>
      <div class="feed-list">
        <FeedCard v-for="item in feedItems" :key="item.id" :item="item" />
      </div>
    </main>

    <button class="fab" aria-label="식단 추가">
      <i class="ti ti-plus"></i>
    </button>

    <BottomNav active-tab="home" @navigate="goTo" />
  </div>
</template>

<style scoped>
.screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.header {
  padding: 16px 20px 14px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.date-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.date-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.protein-bar-wrap {
  background: var(--accent-light);
  border-radius: 14px;
  padding: 12px 14px;
}

.protein-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--accent);
  font-weight: 500;
  margin-bottom: 7px;
}

.protein-value {
  font-weight: 700;
}

.protein-track {
  height: 6px;
  background: var(--accent-border);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 7px;
}

.protein-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.calorie-summary {
  font-size: 11px;
  color: var(--accent);
  font-weight: 500;
}

.feed {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 12px;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 72px;
}

.fab {
  position: absolute;
  right: 20px;
  bottom: 72px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.45);
  z-index: 10;
  transition: transform 0.15s, box-shadow 0.15s;
}

.fab:active {
  transform: scale(0.93);
  box-shadow: 0 2px 10px rgba(255, 107, 107, 0.35);
}
</style>
