<template>
  <div class="feedback-container">
    <div class="feedback-box live-box">
      <div class="box-title">
        <i class="ti ti-bolt"></i> 실시간 밸런스 가이드
      </div>
      <p class="text">{{ ruleMessage || '오늘 식단을 기록하면 실시간 피드백이 조립됩니다.' }}</p>
    </div>

    <div class="feedback-box ai-box">
      <div class="box-title">
        <span class="ai-badge">AI</span> 어제 하루 정기 총평
      </div>
      <p class="text ai-text">{{ aiMessage }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  ruleMessage: { type: String, default: '' },
  aiMessage: { type: String, default: '' }
})
</script>

<style scoped>
.feedback-container { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.feedback-box { background: #fff; padding: 16px; border-radius: 14px; border: 1px solid #e5e5e5; }
.box-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
.box-title i { color: #ff2d55; }
.ai-box { background: #edf7f1; border-color: #c8e6d4; }
.ai-badge { font-size: 9px; font-weight: 800; background: #000; color: #fff; padding: 1px 5px; border-radius: 3px; }
.text { font-size: 13px; color: #333; line-height: 1.5; margin: 0; word-break: keep-all; }
.ai-text { color: #4e6e5a; font-weight: 500; }
</style>