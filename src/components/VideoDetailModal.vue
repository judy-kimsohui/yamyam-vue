<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  video: { type: Object, required: true },
  myUserId: { type: [Number, String], default: null }
})
const emit = defineEmits(['close', 'deleted', 'reupload'])

const detail = ref(null)
const loading = ref(true)
const deleting = ref(false)

const isMyVideo = computed(() => detail.value && Number(detail.value.userId) === Number(props.myUserId))
const hasAnalysis = computed(() => detail.value && detail.value.calories != null)

const mealLabel = computed(() => {
  const map = { BREAKFAST: '아침', LUNCH: '점심', DINNER: '저녁' }
  return map[detail.value?.mealType] || detail.value?.mealType
})

onMounted(async () => {
  try {
    const res = await axios.get(`/api/videos/${props.video.id}`)
    detail.value = res.data
  } catch {
    detail.value = { ...props.video }
  } finally {
    loading.value = false
  }
})

async function onDelete() {
  if (!confirm('정말 삭제하시겠어요?')) return
  deleting.value = true
  try {
    await axios.delete(`/api/videos/${props.video.id}`)
    emit('deleted', props.video.id)
    emit('close')
  } catch (e) {
    alert('삭제 실패: ' + (e.response?.data || e.message))
  } finally {
    deleting.value = false
  }
}

function onReupload() {
  emit('reupload', {
    videoId: props.video.id,
    teamId: props.video.teamId,
    mealType: props.video.mealType,
    mealDate: props.video.mealDate
  })
  emit('close')
}

function nutriPercent(val, max) {
  if (!val || !max) return 0
  return Math.min(100, Math.round((val / max) * 100))
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-sheet">
      <!-- 상단 핸들 + 닫기 -->
      <div class="sheet-handle-row">
        <div class="sheet-handle"></div>
        <button class="close-btn" @click="$emit('close')"><i class="ti ti-x"></i></button>
      </div>

      <div v-if="loading" class="loading-box">
        <i class="ti ti-loader-2 spin"></i>
      </div>

      <template v-else-if="detail">
        <!-- 비디오 플레이어 -->
        <div class="video-box">
          <video :src="detail.videoUrl" controls playsinline class="modal-video"></video>
        </div>

        <!-- 업로더 정보 -->
        <div class="info-row">
          <span class="meal-badge">{{ mealLabel }}</span>
          <span class="uploader">{{ detail.uploaderNickName }}</span>
          <span class="date">{{ detail.mealDate }}</span>
          <span v-if="isMyVideo" class="mine-tag">나</span>
        </div>

        <!-- 설명 -->
        <p v-if="detail.description" class="description">{{ detail.description }}</p>

        <!-- AI 영양 분석 -->
        <div class="analysis-box">
          <div class="analysis-title"><span class="ai-badge">AI</span> 식단 분석</div>
          <div v-if="!hasAnalysis" class="no-analysis">
            <i class="ti ti-brain"></i> 분석 정보 없음 (설명을 입력하면 AI가 분석합니다)
          </div>
          <template v-else>
            <div class="kcal-row">
              <span class="kcal-num">{{ Math.round(detail.calories) }}</span>
              <span class="kcal-unit">kcal</span>
            </div>
            <div class="nutrient-list">
              <div class="nutrient-item">
                <div class="nutrient-header">
                  <span class="n-label carb">탄수화물</span>
                  <span class="n-val">{{ detail.carbs }}g</span>
                </div>
                <div class="n-bar"><div class="n-fill carb" :style="{ width: nutriPercent(detail.carbs, 300) + '%' }"></div></div>
              </div>
              <div class="nutrient-item">
                <div class="nutrient-header">
                  <span class="n-label prot">단백질</span>
                  <span class="n-val">{{ detail.protein }}g</span>
                </div>
                <div class="n-bar"><div class="n-fill prot" :style="{ width: nutriPercent(detail.protein, 100) + '%' }"></div></div>
              </div>
              <div class="nutrient-item">
                <div class="nutrient-header">
                  <span class="n-label fat">지방</span>
                  <span class="n-val">{{ detail.fat }}g</span>
                </div>
                <div class="n-bar"><div class="n-fill fat" :style="{ width: nutriPercent(detail.fat, 80) + '%' }"></div></div>
              </div>
            </div>
            <div v-if="detail.aiComment" class="ai-comment">
              <i class="ti ti-sparkles"></i> {{ detail.aiComment }}
            </div>
          </template>
        </div>

        <!-- 내 영상 액션 -->
        <div v-if="isMyVideo" class="my-actions">
          <button class="reupload-btn" @click="onReupload">
            <i class="ti ti-refresh"></i> 재업로드
          </button>
          <button class="delete-btn" @click="onDelete" :disabled="deleting">
            <i class="ti ti-trash"></i> {{ deleting ? '삭제 중...' : '삭제' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 1000;
  display: flex; align-items: flex-end;
}
.modal-sheet {
  background: var(--bg-primary, #fff);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  padding: 0 0 32px;
  animation: slideUp 0.28s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.sheet-handle-row {
  display: flex; align-items: center; justify-content: center;
  padding: 12px 16px 4px;
  position: relative;
}
.sheet-handle {
  width: 36px; height: 4px;
  background: var(--border-light, #e0e0e0);
  border-radius: 2px;
}
.close-btn {
  position: absolute; right: 12px; top: 8px;
  background: none; border: none;
  font-size: 20px; color: var(--text-secondary, #888);
  cursor: pointer; padding: 4px;
}
.loading-box {
  display: flex; justify-content: center; align-items: center;
  height: 120px; color: var(--text-secondary, #888);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.video-box { padding: 0 16px 12px; }
.modal-video {
  width: 100%; border-radius: 12px;
  max-height: 52vw; object-fit: cover;
  background: #000;
}
.info-row {
  padding: 4px 16px 8px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.meal-badge {
  background: var(--accent-light, #fff3e0);
  color: var(--accent, #ff8c42);
  font-size: 12px; font-weight: 600;
  padding: 3px 10px; border-radius: 20px;
}
.uploader { font-weight: 600; font-size: 14px; color: var(--text-primary, #111); }
.date { font-size: 12px; color: var(--text-secondary, #888); }
.mine-tag {
  background: var(--accent, #ff8c42); color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 2px 7px; border-radius: 20px;
}
.description {
  margin: 0 16px 12px;
  font-size: 13px; color: var(--text-secondary, #555);
  line-height: 1.5;
}
.analysis-box {
  margin: 0 16px 16px;
  background: var(--bg-secondary, #f8f8f8);
  border-radius: 14px;
  padding: 14px 16px;
}
.analysis-title {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary, #111);
  margin-bottom: 12px;
  display: flex; align-items: center; gap: 6px;
}
.ai-badge {
  background: var(--accent, #ff8c42); color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 2px 7px; border-radius: 20px;
}
.no-analysis {
  font-size: 13px; color: var(--text-secondary, #888);
  display: flex; align-items: center; gap: 6px;
}
.kcal-row {
  display: flex; align-items: baseline; gap: 4px; margin-bottom: 12px;
}
.kcal-num { font-size: 28px; font-weight: 700; color: var(--accent, #ff8c42); }
.kcal-unit { font-size: 14px; color: var(--text-secondary, #888); }
.nutrient-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.nutrient-item {}
.nutrient-header {
  display: flex; justify-content: space-between;
  font-size: 12px; margin-bottom: 3px;
}
.n-label { font-weight: 600; }
.n-label.carb { color: #4a9eff; }
.n-label.prot { color: #ff6b6b; }
.n-label.fat  { color: #ffd43b; }
.n-val { color: var(--text-secondary, #888); }
.n-bar {
  height: 6px; background: var(--border-light, #e8e8e8);
  border-radius: 3px; overflow: hidden;
}
.n-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.n-fill.carb { background: #4a9eff; }
.n-fill.prot { background: #ff6b6b; }
.n-fill.fat  { background: #ffd43b; }
.ai-comment {
  font-size: 13px; color: var(--text-secondary, #555);
  background: var(--bg-primary, #fff);
  border-radius: 10px; padding: 10px 12px;
  display: flex; align-items: flex-start; gap: 6px;
  line-height: 1.5;
}
.my-actions {
  margin: 0 16px;
  display: flex; gap: 10px;
}
.reupload-btn, .delete-btn {
  flex: 1; padding: 13px;
  border-radius: 12px; border: none;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.reupload-btn {
  background: var(--accent-light, #fff3e0);
  color: var(--accent, #ff8c42);
}
.delete-btn {
  background: #fff0f0; color: #e05050;
}
.delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
