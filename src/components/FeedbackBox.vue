<template>
  <div class="feedback-container">
    <div class="feedback-card live-card">
      <div class="card-header-row">
        <div class="badge-title">
          <span class="pulse-dot"></span>
          <i class="ti ti-bolt"></i> 실시간 밸런스 가이드
        </div>
      </div>
      <p class="feedback-text">
        {{
          ruleMessage ||
          "오늘 식단을 기록하면 실시간 피드백이 실시간으로 구성됩니다."
        }}
      </p>
    </div>

    <div class="feedback-card ai-report-card">
      <div class="ai-gradient-line"></div>
      <div class="card-header-row">
        <div class="ai-badge-title">
          <span class="ai-chip">AI Intelligence</span>
          <span class="title-text">어제 하루 정기 총평</span>
        </div>
      </div>
      <p class="feedback-text ai-special-text">
        {{
          aiMessage ||
          "어제의 영양 기록을 기반으로 분석한 인공지능 종합 피드백 리포팅을 준비 중입니다."
        }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  ruleMessage: { type: String, default: "" },
  aiMessage: { type: String, default: "" },
});
</script>

<style scoped>
.feedback-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.feedback-card {
  background: #ffffff;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  position: relative;
  box-sizing: border-box;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.badge-title {
  font-size: 11px;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.badge-title i {
  color: #f03e3e;
  font-size: 13px;
}

/* 라이브 펄스 효과 */
.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: #f03e3e;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(240, 62, 62, 0.4);
  animation: pulse 1.6s infinite;
}
@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(240, 62, 62, 0.5);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(240, 62, 62, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(240, 62, 62, 0);
  }
}

/* AI 리포트 전용 고급화 카드 */
.ai-report-card {
  background: linear-gradient(145deg, #fdfbfb 0%, #f7fbf8 100%);
  border-color: #d3ecd9;
  overflow: hidden;
}
.ai-gradient-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #7ec8a0, #a0c4ff);
}

.ai-badge-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ai-chip {
  font-size: 9px;
  font-weight: 800;
  background: #121212;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.title-text {
  font-size: 11px;
  font-weight: 700;
  color: #2b8a3e;
  letter-spacing: 0.5px;
}

.feedback-text {
  font-size: 13.5px;
  color: #343a40;
  line-height: 1.6;
  margin: 0;
  word-break: keep-all;
  font-weight: 500;
}
.ai-special-text {
  color: #2b4c37;
  font-weight: 550;
}
</style>
