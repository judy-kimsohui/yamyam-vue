<template>
  <section class="team-section">
    <div class="section-header">
      <h3 class="section-title">소속 팀 목록</h3>
      <span class="team-count" v-if="teams.length > 0">{{ teams.length }}</span>
    </div>

    <div v-if="teams.length === 0" class="no-team-box">
      <div class="empty-icon">👥</div>
      <p class="empty-text">아직 소속된 커뮤니티 팀이 없습니다.</p>
    </div>

    <div v-else class="team-grid">
      <div v-for="team in teams" :key="team.id" class="team-modern-card">
        <div class="card-pattern"></div>
        <div class="card-content">
          <div class="team-avatar-tag">
            <i class="ti ti-users"></i>
          </div>
          <h4 class="team-name">{{ team.name }}</h4>
          <p class="team-desc">
            {{ team.description || "팀 한마디 소개가 없습니다." }}
          </p>

          <div class="team-card-footer">
            <span class="active-badge">참여 중</span>
            <i class="ti ti-arrow-right arrow-icon"></i>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  teams: { type: Array, default: () => [] },
});
</script>

<style scoped>
.team-section {
  margin-bottom: 32px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}
.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}
.team-count {
  background: #f1f3f5;
  color: #495057;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.team-modern-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.team-modern-card:hover {
  transform: translateY(-4px);
  border-color: #dee2e6;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
}

.team-modern-card:hover .arrow-icon {
  transform: translateX(3px);
  color: #e8909e;
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.team-avatar-tag {
  width: 36px;
  height: 36px;
  background: #fff5f7;
  color: #e8909e;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 14px;
}

.team-name {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 700;
  color: #212529;
}

.team-desc {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: #868e96;
  line-height: 1.4;
  height: 38px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.team-card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.active-badge {
  font-size: 11px;
  font-weight: 600;
  color: #2b8a3e;
  background: #ebfbee;
  padding: 2px 8px;
  border-radius: 6px;
}

.arrow-icon {
  color: #adb5bd;
  font-size: 14px;
  transition: all 0.2s;
}

/* 엠프티 박스 */
.no-team-box {
  background: #ffffff;
  border: 1.5px dashed #dee2e6;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
}
.empty-icon {
  font-size: 28px;
  margin-bottom: 10px;
}
.empty-text {
  font-size: 14px;
  color: #868e96;
  margin: 0;
  font-weight: 500;
}
</style>
