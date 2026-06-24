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

const editMode = ref(false);

function addFood() {
  foodList.value.push({
    foodName: '',
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    quantity: 1
  });
}

function removeFood(index) {
  foodList.value.splice(index, 1);
}



onMounted(async () => {
  try {
    const res = await axios.get(`/api/videos/${props.video.id}`);
    detail.value = res.data;
    analysisStatus.value = detail.value.status || null;

    if (analysisStatus.value === 'DONE') {
      const nutriRes = await axios.get(`/api/videos/${props.video.id}/nutrition`);
      // 서버에서 받은 데이터(foods 배열)를 로그로 찍어서 quantity가 진짜 들어있는지 마지막으로 확인
      console.log("받아온 음식 목록:", nutriRes.data.foods);

      if (nutriRes.data && nutriRes.data.foods) {
        // 기존 데이터를 비우고 서버에서 온 새 객체들로 확실히 교체
        foodList.value = nutriRes.data.foods.map((food) => ({
          id: food.id,
          foodName: food.foodName,
          calories: food.calories,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
          // DB에서 읽어온 1.7 등의 값을 그대로 할당합니다.
          quantity: Number(food.quantity) 
        }));
      }
    }
  } catch (e) {
    console.error("데이터 로드 실패:", e);
    detail.value = { ...props.video };
  } finally {
    loading.value = false;
  }
});

async function onSaveNutritions() {
  const payload = foodList.value.map(food => {
    return {
      foodName: food.foodName || '이름 없음',
      calories: Number(food.calories || 0), // 수량 곱하지 않음
      carbs: Number(food.carbs || 0),
      protein: Number(food.protein || 0),
      fat: Number(food.fat || 0),
      quantity: Number(food.quantity || 1) // 조절한 수량(인분) 값 전송
    };
  });

  try {
    await axios.put(`/api/videos/${props.video.id}/nutrition`, payload);
    showToast("success", "식단 정보가 저장되었습니다!");
    editMode.value = false;
  } catch (e) {
    showToast("error", "저장 실패", e.response?.data || e.message);
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
          <div v-else-if="hasAnalysis || editMode" class="food-slider-list">
  <div v-for="(food, index) in foodList" :key="index" class="food-item">
    <template v-if="!editMode">
      <div class="food-info-row">
        <span class="food-name">🍕 {{ food.foodName }}</span>
        <span class="food-qty">{{ food.quantity }}인분</span>
      </div>
      <input type="range" min="0" max="3" step="0.1" v-model.number="food.quantity" class="qty-slider" />
      <div class="food-mini-spec">
        (1인분 기준: {{ Math.round(food.calories) }}kcal | 탄 {{ Math.round(food.carbs) }}g)
      </div>
    </template>

    <template v-else>
      <div class="food-info-row">
        <input type="text" v-model="food.foodName" class="edit-input name-input" placeholder="음식명 입력" />
        <button class="del-btn" @click="removeFood(index)">
          <i class="ti ti-trash"></i> 삭제
        </button>
      </div>
      <div class="food-edit-specs">
        <label>칼로리 <input type="number" v-model.number="food.calories"></label>
        <label>탄수화물 <input type="number" v-model.number="food.carbs"></label>
        <label>단백질 <input type="number" v-model.number="food.protein"></label>
        <label>지방 <input type="number" v-model.number="food.fat"></label>
      </div>
    </template>
  </div>

  <div v-if="isMyVideo" class="action-buttons">
    <template v-if="!editMode">
      <button class="save-nutri-btn edit-toggle-btn" @click="editMode = true">음식 직접 추가 / 수정하기</button>
      <button class="save-nutri-btn" @click="onSaveNutritions">조절한 양으로 최종 저장하기</button>
    </template>
    <template v-else>
      <button class="save-nutri-btn add-btn" @click="addFood">+ 새로운 음식 항목 추가</button>
      <div class="edit-actions">
        <button class="cancel-btn" @click="editMode = false">취소</button>
        <button class="save-nutri-btn confirm-btn" @click="onSaveNutritions">수정 완료</button>
      </div>
    </template>
  </div>
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

.edit-input {
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  width: 65%;
}
.del-btn {
  background: #ffe3e3;
  color: #e05050;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.food-edit-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}
.food-edit-specs label {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,0,0,0.02);
  padding: 6px 8px;
  border-radius: 6px;
}
.food-edit-specs input {
  width: 45px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 4px;
  text-align: right;
  padding: 2px 4px;
  font-size: 12px;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.edit-toggle-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid rgba(0,0,0,0.1);
}
.add-btn {
  background: #e8f4ff;
  color: #3a8fe8;
}
.edit-actions {
  display: flex;
  gap: 8px;
}
.cancel-btn {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
}
.confirm-btn {
  flex: 2;
  margin-top: 0;
}
</style>
