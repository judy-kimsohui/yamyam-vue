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

async function onLike() {
  try {
    const res = await axios.post(`/api/videos/${props.video.id}/like`)
    detail.value.liked = res.data.liked
    detail.value.likeCount = res.data.count
    // 부모에게도 알림
    props.video.liked = res.data.liked
    props.video.likeCount = res.data.count
  } catch {}
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
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="sheet">
      <div class="handle"></div>

      <div v-if="loading" class="loading-box">
        <i class="ti ti-loader-2 spin"></i>
      </div>

      <template v-else-if="detail">
        <!-- 비디오 -->
        <div class="video-wrap">
          <video :src="detail.videoUrl" autoplay loop muted playsinline class="video"></video>
          <button class="close-btn" @click="$emit('close')"><i class="ti ti-x"></i></button>
          <div v-if="isMyVideo" class="video-actions">
            <button class="vbtn" @click="onReupload"><i class="ti ti-refresh"></i></button>
            <button class="vbtn" @click="onDelete" :disabled="deleting"><i class="ti ti-trash"></i></button>
          </div>
          <div class="video-footer">
            <span class="meal-pill">{{ mealLabel }}</span>
            <span class="meal-date">{{ detail.mealDate }}</span>
          </div>
        </div>

        <!-- 업로더 + 설명 + 영양 태그 -->
        <div class="info">
          <span class="name">{{ detail.uploaderNickName }}</span>
          <span v-if="isMyVideo" class="mine">나</span>
          <button class="like-btn" :class="{ liked: detail.liked }" @click="onLike">
            <span class="heart-icon">♥</span>
          </button>
          <p v-if="detail.description" class="desc">{{ detail.description }}</p>
          <div class="nutri-tags">
            <span class="ntag carb">탄 {{ hasAnalysis ? detail.carbs + 'g' : '--' }}</span>
            <span class="ntag prot">단 {{ hasAnalysis ? detail.protein + 'g' : '--' }}</span>
            <span class="ntag fat">지 {{ hasAnalysis ? detail.fat + 'g' : '--' }}</span>
            <span class="ntag kal">Kal {{ hasAnalysis ? Math.round(detail.calories) : '--' }}</span>
          </div>
        </div>

        <!-- AI 코멘트 -->
        <div class="ai-card">
          <div class="ai-card-header">
            <span class="ai-tag">AI</span>
            <span class="ai-title">식단 분석</span>
          </div>
          <div v-if="hasAnalysis && detail.aiComment" class="ai-comment">
            <i class="ti ti-sparkles"></i> {{ detail.aiComment }}
          </div>
          <p v-else class="ai-hint">설명을 입력하면 AI가 분석해줘요 ✨</p>
        </div>

      </template>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.sheet {
  width: 100%;
  max-width: 360px;
  max-height: 85vh;
  background: var(--bg-primary);
  border-radius: 22px;
  overflow-y: auto;
  padding-bottom: 20px;
  animation: popIn .22s cubic-bezier(.32,1,.4,1);
}
@keyframes popIn {
  from { transform: scale(0.92); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
.handle { display: none; }
.loading-box {
  display: flex; justify-content: center; align-items: center;
  height: 180px; font-size: 24px; color: var(--text-secondary);
}
.spin { animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 비디오 */
.video-wrap {
  position: relative;
  width: 100%; aspect-ratio: 4/3;
  background: #000; overflow: hidden;
}
.video { width: 100%; height: 100%; object-fit: cover; display: block; }
.close-btn {
  position: absolute; top: 10px; right: 10px;
  width: 28px; height: 28px;
  background: rgba(0,0,0,0.4); color: #fff;
  border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; cursor: pointer;
}
.video-actions {
  position: absolute; top: 10px; left: 10px;
  display: flex; gap: 6px;
}
.vbtn {
  background: rgba(255,255,255,0.22);
  backdrop-filter: blur(6px);
  color: rgba(255,255,255,0.9);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 13px; cursor: pointer;
  display: flex; align-items: center;
}
.vbtn:disabled { opacity: 0.4; cursor: not-allowed; }
.video-footer {
  position: absolute; bottom: 10px; left: 12px;
  display: flex; align-items: center; gap: 6px;
}
.meal-pill {
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.35);
}
.meal-date { color: rgba(255,255,255,0.75); font-size: 11px; }

/* 업로더 */
.info {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 12px 16px 6px;
}
.name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.mine {
  background: var(--accent); color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
}
.like-btn {
  margin-left: auto;
  background: none; border: none;
  padding: 6px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  transition: transform 0.15s;
}
.like-btn:active { transform: scale(1.25); }
.heart-icon {
  color: rgba(0,0,0,0.15);
  -webkit-text-stroke: 1.8px #ccc;
  transition: color 0.15s, -webkit-text-stroke 0.15s;
  line-height: 1;
}
.like-btn.liked .heart-icon {
  color: #ff2d55;
  -webkit-text-stroke: 1.8px #ff2d55;
}
.desc {
  width: 100%; margin: 2px 0 0;
  font-size: 13px; color: var(--text-secondary); line-height: 1.5;
}

/* 영양 태그 */
.nutri-tags {
  display: flex; gap: 5px; flex-wrap: wrap;
  margin-top: 7px; width: 100%;
}
.ntag {
  font-size: 11px; font-weight: 700;
  padding: 3px 9px; border-radius: 20px;
}
.ntag.carb { background: #e8f4ff; color: #3a8fe8; }
.ntag.prot { background: #fff0f0; color: #e05050; }
.ntag.fat  { background: #fffde7; color: #c0860a; }
.ntag.kal  { background: var(--accent-light); color: var(--accent); }

/* AI 카드 */
.ai-card {
  margin: 4px 14px 12px;
  background: var(--bg-secondary);
  border-radius: 14px;
  padding: 12px 14px;
}
.ai-card-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
}
.ai-tag {
  background: var(--accent); color: #fff;
  font-size: 11px; font-weight: 800;
  padding: 2px 8px; border-radius: 20px;
}
.ai-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ai-comment {
  font-size: 12px; color: var(--text-secondary);
  display: flex; gap: 5px; align-items: flex-start; line-height: 1.6;
}
.ai-hint { font-size: 12px; color: #bbb; margin: 0; }

</style>
