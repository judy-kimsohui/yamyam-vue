<script setup>
defineProps({
  item: { type: Object, required: true }
})
</script>

<template>
  <div class="card">
    <div class="card-img">{{ item.img }}</div>
    <div class="card-body">
      <div class="card-header">
        <div class="card-title">{{ item.title }}</div>
        <div class="card-time">{{ item.time }}</div>
      </div>
      <div class="card-meta">
        <span>🔥 {{ item.calories }}kcal</span>
        <span>💪 {{ item.protein }}g</span>
        <span>🌾 {{ item.carbs }}g</span>
        <span>🥑 {{ item.fat }}g</span>
      </div>
      <div class="ai-tag">{{ item.aiTag }}</div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.card:active {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.card-img {
  background: var(--bg-secondary);
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.card-body {
  padding: 12px 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 7px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-time {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-left: 8px;
}

.card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.card-meta span {
  font-size: 12px;
  color: var(--text-secondary);
}

.ai-tag {
  font-size: 12px;
  color: var(--accent);
  font-weight: 500;
  background: var(--accent-light);
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
}
</style>
