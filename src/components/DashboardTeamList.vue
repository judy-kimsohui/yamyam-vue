<template>
  <section class="team-section">
    <h3 class="section-title">소속 팀 목록</h3>
    <div v-if="teams.length === 0" class="no-team">소속된 팀이 없습니다.</div>
    <div v-else class="team-grid">
      <div v-for="team in teams" :key="team.id" class="team-card">
        <h4>{{ team.name }}</h4>
        <p>{{ team.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  teams: Array,
});
</script>

<style scoped>
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 16px;
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.team-card {
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fafafa;
}
.team-card h4 {
  margin: 0 0 8px 0;
  font-size: 15px;
}
.team-card p {
  margin: 0;
  font-size: 13px;
  color: #666;
}
</style>
