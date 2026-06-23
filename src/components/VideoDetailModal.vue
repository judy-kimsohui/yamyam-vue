<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useToast } from "../composables/useToast.js";
const { showToast } = useToast();

const props = defineProps({
  video: { type: Object, required: true },
  myUserId: { type: [Number, String], default: null },
});
const emit = defineEmits(["close", "deleted", "reupload"]);

const detail = ref(null);
const loading = ref(true);
const deleting = ref(false);
const confirmingDelete = ref(false);

const analysisStatus = ref(props.video.status || null);
const retrying = ref(false);
const retryMessage = ref(null);

const isPending = computed(() => String(analysisStatus.value || '').toUpperCase() === 'PENDING');
const isFailed = computed(() => String(analysisStatus.value || '').toUpperCase() === 'FAILED');

//ai 코멘트 작성 칸
const foodList = ref([]);

const isMyVideo = computed(
  () => detail.value && Number(detail.value.userId) === Number(props.myUserId),
);

//ai 분석 결과를 보유중인가?
const hasAnalysis = computed(() => foodList.value.length > 0);

const mealLabel = computed(() => {
  const map = { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" };
  return map[detail.value?.mealType] || detail.value?.mealType;
});

const totalNutrients = computed(() => {
  const total = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  foodList.value.forEach((food) => {
    const q = food.quantity || 1; // 사용자가 조절한 인분 (기본값 1)
    total.calories += food.calories * q;
    total.carbs += food.carbs * q;
    total.protein += food.protein * q;
    total.fat += food.fat * q;
  });
  return total;
});

onMounted(async () => {
  try {
    const res = await axios.get(`/api/videos/${props.video.id}`);
    detail.value = res.data;
    analysisStatus.value = detail.value.status || null;

    if (detail.value && detail.value.aiComment) {
      try {
        const parsed = JSON.parse(detail.value.aiComment);
        foodList.value = (parsed.foods || []).map((food) => ({
          ...food,
          quantity: food.quantity || 1,
        }));
      } catch (e) {
        console.error("AI 코멘트 JSON 파싱 실패:", e);
        foodList.value = [];
      }
    }
  } catch {
    detail.value = { ...props.video };
  } finally {
    loading.value = false;
  }
});

async function onSaveQuantities() {
  try {
    // 백엔드로 보낼 때는 다시 원본 구조 형태로 가공하거나, 수량 배열만 따로 전송
    // 여기서는 AI 코멘트 구조 그대로 인분만 업데이트해서 백엔드로 전송하는 예시입니다.
    const updatedAiComment = JSON.stringify({ foods: foodList.value });

    // 백엔드에 업데이트 요청 (엔드포인트는 다음 주에 팀원들과 맞추기 위해 임시 작성)
    await axios.patch(`/api/videos/${props.video.id}/ingredients`, {
      aiComment: updatedAiComment,
      calories: totalNutrients.value.calories,
      carbs: totalNutrients.value.carbs,
      protein: totalNutrients.value.protein,
      fat: totalNutrients.value.fat,
    });
    showToast("success", "식단 정보가 저장되었습니다!");
  } catch (e) {
    showToast("error", "저장 실패", e.message);
  }
}

async function onDelete() {
  confirmingDelete.value = true;
}

async function confirmDelete() {
  confirmingDelete.value = false;
  deleting.value = true;
  try {
    await axios.delete(`/api/videos/${props.video.id}`);
    emit("deleted", props.video.id);
    emit("close");
  } catch (e) {
    showToast("error", "삭제 실패", e.response?.data || e.message);
  } finally {
    deleting.value = false;
  }
}

async function onLike() {
  try {
    const res = await axios.post(`/api/videos/${props.video.id}/like`);
    detail.value.liked = res.data.liked;
    detail.value.likeCount = res.data.count;
    // 부모에게도 알림
    props.video.liked = res.data.liked;
    props.video.likeCount = res.data.count;
  } catch {}
}

function onReupload() {
  emit("reupload", {
    videoId: props.video.id,
    teamId: props.video.teamId,
    mealType: props.video.mealType,
    mealDate: props.video.mealDate,
  });
  emit("close");
}

async function onRetryAnalysis() {
  retrying.value = true;
  retryMessage.value = null;
  try {
    const res = await axios.post(`/api/videos/${props.video.id}/analyze`);
    if (res.status === 202) {
      analysisStatus.value = 'PENDING';
      retryMessage.value = '분석 요청됨. 잠시 후 새로고침해주세요.';
    } else {
      retryMessage.value = '이미 완료된 분석이에요.';
    }
  } catch (e) {
    if (e.response?.status === 429) {
      retryMessage.value = '최대 재시도 횟수(3회)를 초과했어요.';
    } else {
      retryMessage.value = '요청 실패. 잠시 후 다시 시도해주세요.';
    }
  } finally {
    retrying.value = false;
  }
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
          <video
            :src="detail.videoUrl"
            autoplay
            loop
            muted
            playsinline
            class="video"
          ></video>
          <button class="close-btn" @click="$emit('close')">
            <i class="ti ti-x"></i>
          </button>
          <div v-if="isMyVideo" class="video-actions">
            <button class="vbtn" @click="onReupload">
              <i class="ti ti-refresh"></i>
            </button>
            <button class="vbtn" @click="onDelete" :disabled="deleting">
              <i class="ti ti-trash"></i>
            </button>
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
          <button
            class="like-btn"
            :class="{ liked: detail.liked }"
            @click="onLike"
          >
            <span class="heart-icon">♥</span>
          </button>
          <p v-if="detail.description" class="desc">{{ detail.description }}</p>

          <div class="nutri-tags">
            <span class="ntag carb"
              >탄
              {{
                hasAnalysis ? Math.round(totalNutrients.carbs) + "g" : "--"
              }}</span
            >
            <span class="ntag prot"
              >단
              {{
                hasAnalysis ? Math.round(totalNutrients.protein) + "g" : "--"
              }}</span
            >
            <span class="ntag fat"
              >지
              {{
                hasAnalysis ? Math.round(totalNutrients.fat) + "g" : "--"
              }}</span
            >
            <span class="ntag kal"
              >Kal
              {{
                hasAnalysis ? Math.round(totalNutrients.calories) : "--"
              }}</span
            >
          </div>
        </div>

        <div class="ai-card">
          <div class="ai-card-header">
            <span class="ai-tag">AI</span>
            <span class="ai-title">인식된 식단 목록 (양 조절)</span>
          </div>

          <!-- AI 분석 중 -->
          <div v-if="isPending" class="ai-pending">
            <i class="ti ti-loader-2 spin"></i>
            <span>AI 분석 중... 서버에서 처리하고 있어요</span>
          </div>

          <!-- 분석 완료: 음식 목록 -->
          <div v-else-if="hasAnalysis" class="food-slider-list">
            <div
              v-for="(food, index) in foodList"
              :key="index"
              class="food-item"
            >
              <div class="food-info-row">
                <span class="food-name">🍕 {{ food.foodName }}</span>
                <span class="food-qty">{{ food.quantity }}인분</span>
              </div>

              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                v-model.number="food.quantity"
                class="qty-slider"
              />

              <div class="food-mini-spec">
                (1인분 기준: {{ food.calories }}kcal | 탄 {{ food.carbs }}g)
              </div>
            </div>

            <button
              v-if="isMyVideo"
              class="save-nutri-btn"
              @click="onSaveQuantities"
            >
              조절한 양으로 최종 저장하기
            </button>
          </div>

          <!-- 미분석 / 실패 -->
          <p v-else class="ai-hint">
            {{ isFailed ? 'AI 분석에 실패했어요 😢' : '설명을 입력하면 AI가 분석해줘요 ✨' }}
          </p>

          <!-- 재분석 버튼 (완료가 아닐 때) -->
          <div v-if="!hasAnalysis" class="retry-area">
            <button
              class="retry-btn"
              :disabled="retrying"
              @click="onRetryAnalysis"
            >
              <i :class="retrying ? 'ti ti-loader-2 spin' : 'ti ti-refresh'"></i>
              {{ retrying ? '요청 중...' : 'AI 재분석 요청' }}
            </button>
            <p v-if="retryMessage" class="retry-msg">{{ retryMessage }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- 삭제 확인 다이얼로그 -->
  <Transition name="modal-pop">
    <div v-if="confirmingDelete" class="confirm-overlay" @click.self="confirmingDelete = false">
      <div class="confirm-card">
        <div class="confirm-icon">🗑️</div>
        <p class="confirm-title">정말 삭제하시겠어요?</p>
        <p class="confirm-desc">삭제된 로그는 복구할 수 없어요.</p>
        <div class="confirm-actions">
          <button class="confirm-cancel" @click="confirmingDelete = false">취소</button>
          <button class="confirm-ok" @click="confirmDelete">삭제</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
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
  animation: popIn 0.22s cubic-bezier(0.32, 1, 0.4, 1);
}
@keyframes popIn {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.handle {
  display: none;
}
.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 180px;
  font-size: 24px;
  color: var(--text-secondary);
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 비디오 */
.video-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  overflow: hidden;
}
.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #000;
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
}
.video-actions {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}
.vbtn {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(6px);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.vbtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.video-footer {
  position: absolute;
  bottom: 10px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.meal-pill {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.meal-date {
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
}

/* 업로더 */
.info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 12px 16px 6px;
}
.name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.mine {
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.like-btn {
  margin-left: auto;
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.15s;
}
.like-btn:active {
  transform: scale(1.25);
}
.heart-icon {
  color: rgba(0, 0, 0, 0.15);
  -webkit-text-stroke: 1.8px #ccc;
  transition:
    color 0.15s,
    -webkit-text-stroke 0.15s;
  line-height: 1;
}
.like-btn.liked .heart-icon {
  color: #ff2d55;
  -webkit-text-stroke: 1.8px #ff2d55;
}
.desc {
  width: 100%;
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 영양 태그 */
.nutri-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 7px;
  width: 100%;
}
.ntag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
}
.ntag.carb {
  background: #e8f4ff;
  color: #3a8fe8;
}
.ntag.prot {
  background: #fff0f0;
  color: #e05050;
}
.ntag.fat {
  background: #fffde7;
  color: #c0860a;
}
.ntag.kal {
  background: var(--accent-light);
  color: var(--accent);
}

/* AI 카드 */
.ai-card {
  margin: 4px 14px 12px;
  background: var(--bg-secondary);
  border-radius: 14px;
  padding: 12px 14px;
}
.ai-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.ai-tag {
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 20px;
}
.ai-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.ai-comment {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  gap: 5px;
  align-items: flex-start;
  line-height: 1.6;
}
.ai-hint {
  font-size: 12px;
  color: #bbb;
  margin: 0;
}

/* ai 코멘트 스타일*/
.food-slider-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}
.food-item {
  background: var(--bg-primary);
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.food-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.food-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.food-qty {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
}

.qty-slider {
  width: 100%;
  accent-color: var(--accent); /* 슬라이더 바 색상을 포인트 컬러로 변경 */
  margin: 6px 0;
  cursor: pointer;
}
.food-mini-spec {
  font-size: 11px;
  color: #999;
  text-align: right;
}

/* 저장 버튼 */
.save-nutri-btn {
  width: 100%;
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}
.save-nutri-btn:hover {
  background: var(--accent-dark);
}

/* AI 분석 중 */
.ai-pending {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 재분석 버튼 영역 */
.retry-area {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.retry-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-primary);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;
}
.retry-btn:hover:not(:disabled) {
  background: var(--accent-light);
  color: var(--accent);
}
.retry-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.retry-msg {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

/* 삭제 확인 다이얼로그 */
.confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.confirm-card {
  background: #fff; border-radius: 20px;
  padding: 32px 28px 24px;
  width: 280px; text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.18);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.confirm-icon { font-size: 32px; margin-bottom: 4px; }
.confirm-title { margin: 0; font-size: 16px; font-weight: 700; color: #111; }
.confirm-desc { margin: 0; font-size: 13px; color: #999; }
.confirm-actions { display: flex; gap: 8px; margin-top: 16px; width: 100%; }
.confirm-cancel {
  flex: 1; padding: 11px; border: 1.5px solid #e5e5e5; background: #fff;
  border-radius: 10px; font-size: 14px; font-weight: 600; color: #666; cursor: pointer;
  transition: all 0.15s;
}
.confirm-cancel:hover { border-color: #ccc; color: #333; }
.confirm-ok {
  flex: 1; padding: 11px; border: none; background: #e53e3e;
  border-radius: 10px; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer;
  transition: background 0.15s;
}
.confirm-ok:hover { background: #c53030; }

.modal-pop-enter-active { animation: modal-in 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.modal-pop-leave-active { animation: modal-in 0.15s ease reverse; }
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
