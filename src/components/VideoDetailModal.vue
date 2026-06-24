<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const props = defineProps({
  video: { type: Object, required: true },
  myUserId: { type: [Number, String], default: null },
});

const emit = defineEmits(["close", "deleted", "reupload"]);

const detail = ref(null);
const loading = ref(true);
const deleting = ref(false);
const analysisStatus = ref(props.video.status || null);
const retrying = ref(false);
const retryMessage = ref(null);

// 🌟 상태 통합 관리 자원 배치
const foodList = ref([]);
const newFoodName = ref("");

const isPending = computed(() => String(analysisStatus.value || '').toUpperCase() === 'PENDING');
const isFailed = computed(() => String(analysisStatus.value || '').toUpperCase() === 'FAILED');
const hasAnalysis = computed(() => foodList.value.length > 0);

const isMyVideo = computed(
  () => detail.value && Number(detail.value.userId) === Number(props.myUserId),
);

const mealLabel = computed(() => {
  const map = { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" };
  return map[detail.value?.mealType] || detail.value?.mealType;
});

// 🌟 슬라이더 움직임 및 실시간 수동 변경 사항을 상단 영양 태그에 실시간 연산 반영
const totalNutrients = computed(() => {
  const total = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  foodList.value.forEach((food) => {
    const q = food.quantity || 1;
    total.calories += (food.calories || 0) * q;
    total.carbs += (food.carbs || 0) * q;
    total.protein += (food.protein || 0) * q;
    total.fat += (food.fat || 0) * q;
  });
  return total;
});

// 🌟 데이터 동기화 파이프라인 개편
const loadNutritionDetails = async () => {
  try {
    const res = await axios.get(`/api/videos/${props.video.id}`);
    detail.value = res.data;
    analysisStatus.value = detail.value.status || null;

    // 1. 먼저 정식으로 쪼개진 자식 테이블 전용 API(/nutrition) 조회를 시도합니다.
    try {
      const nutriRes = await axios.get(`/api/videos/${props.video.id}/nutrition`);
      if (nutriRes.data && nutriRes.data.foods && nutriRes.data.foods.length > 0) {
        foodList.value = nutriRes.data.foods.map(food => ({
          ...food,
          quantity: food.quantity || 1
        }));
        return; // 자식 테이블에 데이터가 있으면 여기서 바인딩 종료
      }
    } catch (ne) {
      console.warn("자식 영양소 테이블 조회 실패 또는 데이터 없음, 원본 파싱으로 폴백:", ne);
    }

    // 2. [폴백 가드] 만약 수동 편집 이력이 없어 자식 테이블이 비어있다면, 기존 AI 원본 문자열을 파싱합니다.
    if (detail.value && detail.value.aiComment) {
      try {
        const parsed = JSON.parse(detail.value.aiComment);
        foodList.value = (parsed.foods || []).map((food) => ({
          ...food,
          quantity: food.quantity || 1,
        }));
      } catch (e) {
        console.error("AI 코멘트 JSON 파싱 오류:", e);
        foodList.value = [];
      }
    }
  } catch (e) {
    console.error("비디오 로드 실패:", e);
    detail.value = { ...props.video };
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadNutritionDetails();
});

// 🌟 [1. 음식 직접 추가 기능 - POST]
async function onAddManualFood() {
  if (!newFoodName.value.trim()) return;
  try {
    await axios.post(`/api/videos/${props.video.id}/nutrition/items`, {
      foodName: newFoodName.value.trim()
    });
    newFoodName.value = "";
    alert("음식이 목록에 추가되었습니다. 🍳");
    await loadNutritionDetails(); // 데이터 동기화 리프레시
  } catch (e) {
    alert("추가 실패: " + (e.response?.data || e.message));
  }
}

// 🌟 [2. 음식 정보 및 영양 성분 수정 보정 - PUT]
async function onEditFoodNutrients(food) {
  // DB id가 없는 상태(최초 AI 날것 상태)라면 먼저 업데이트를 눌러 자식 레코드를 영속화해야 수정할 수 있습니다.
  if (!food.id) {
    alert("최초 1회 '업데이트 하기' 버튼을 눌러 저장한 후에 개별 음식명 수정이 가능합니다.");
    return;
  }

  const newName = prompt("음식 이름을 수정하시겠습니까?", food.foodName);
  if (newName === null) return;
  
  const newCal = prompt("1인분 기준 칼로리(kcal)를 수정하시겠습니까?", food.calories);
  if (newCal === null) return;

  try {
    await axios.put(`/api/videos/${props.video.id}/nutrition/items`, {
      id: food.id,
      foodName: newName.trim() || food.foodName,
      calories: parseFloat(newCal) || 0,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat
    });
    alert("영양 성분이 정상 보정되었습니다. ✨");
    await loadNutritionDetails();
  } catch (e) {
    alert("수정 실패: " + (e.response?.data || e.message));
  }
}

// 🌟 [3. 개별 항목 삭제 기능 - DELETE]
async function onDeleteFoodItem(food, index) {
  if (!confirm(`[${food.foodName}] 요리를 식단 목록에서 제외하시겠어요?`)) return;
  
  // Case A: 데이터베이스 자식 레코드(id)가 존재하는 경우 백엔드 API 연동 삭제
  if (food.id) {
    try {
      await axios.delete(`/api/videos/${props.video.id}/nutrition/items/${food.id}`);
      alert("음식이 삭제되었습니다. 🛑");
      await loadNutritionDetails();
    } catch (e) {
      alert("삭제 실패: " + (e.response?.data || e.message));
    }
  } 
  // Case B: 아직 DB에 인서트되지 않은 최초 AI 파싱 상태인 경우 프론트 배열에서 즉시 제거
  else {
    foodList.value.splice(index, 1);
    alert("목록에서 임시 제외되었습니다. 하단 업데이트 버튼을 누르면 최종 반영됩니다.");
  }
}

// 🌟 무한 증식 버그를 해결한 단일 벌크 업데이트 파이프라인
async function onSaveQuantities() {
  if (foodList.value.length === 0) return;
  
  try {
    // 7번 나눠 보내던 데이터 패킷을 하나의 단일 배열 요청으로 묶어서 전송합니다.
    await axios.put(`/api/videos/${props.video.id}/nutrition/items/batch`, foodList.value);

    alert("조절된 식단 정보와 인분 수량이 대시보드에 정확하게 반영되었습니다! 💪");
    await loadNutritionDetails(); // 단 1회의 깔끔한 재동기화 리프레시
  } catch (e) {
    alert("업데이트 실패: " + (e.response?.data || e.message));
  }
}
async function onDelete() {
  if (!confirm("정말 이 영상을 삭제하시겠어요?")) return;
  deleting.value = true;
  try {
    await axios.delete(`/api/videos/${props.video.id}`);
    emit("deleted", props.video.id);
    emit("close");
  } catch (e) {
    alert("삭제 실패: " + (e.response?.data || e.message));
  } finally {
    deleting.value = false;
  }
}

async function onLike() {
  try {
    const res = await axios.post(`/api/videos/${props.video.id}/like`);
    detail.value.liked = res.data.liked;
    detail.value.likeCount = res.data.count;
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
      retryMessage.value = 'AI 분석이 재요청되었습니다.';
    }
  } catch (e) {
    retryMessage.value = '분석 요청 중 오류가 발생했습니다.';
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
        
        <div class="info">
          <span class="name">{{ detail.uploaderNickName }}</span>
          <span v-if="isMyVideo" class="mine">나</span>
          <button class="like-btn" :class="{ liked: detail.liked }" @click="onLike">
            <span class="heart-icon">♥</span>
          </button>
          <p v-if="detail.description" class="desc">{{ detail.description }}</p>
          <div class="nutri-tags">
            <span class="ntag carb">탄 {{ hasAnalysis ? Math.round(totalNutrients.carbs) + "g" : "--" }}</span>
            <span class="ntag prot">단 {{ hasAnalysis ? Math.round(totalNutrients.protein) + "g" : "--" }}</span>
            <span class="ntag fat">지 {{ hasAnalysis ? Math.round(totalNutrients.fat) + "g" : "--" }}</span>
            <span class="ntag kal">Kal {{ hasAnalysis ? Math.round(totalNutrients.calories) : "--" }}</span>
          </div>
        </div>
        
        <div class="ai-card">
          <div class="ai-card-header">
            <span class="ai-tag">AI / 수동</span>
            <span class="ai-title">인식된 음식 (조절 및 편집)</span>
          </div>
          
          <div v-if="isPending" class="ai-pending">
            <i class="ti ti-loader-2 spin"></i>
            <span>AI 분석 연산 진행 중...</span>
          </div>
          
          <div v-else-if="hasAnalysis" class="food-slider-list">
            <div v-for="(food, index) in foodList" :key="food.id || index" class="food-item">
              <div class="food-info-row">
                <span class="food-name" @click="isMyVideo && onEditFoodNutrients(food)" :style="{ cursor: isMyVideo ? 'pointer' : 'default' }">
                  🍽️ {{ food.foodName }} <i v-if="isMyVideo" class="ti ti-edit" style="font-size:10px; color:#aaa;"></i>
                </span>
                
                <div class="food-right-area">
                  <span class="food-qty">{{ food.quantity }}인분</span>
                  <button v-if="isMyVideo" class="food-del-inline-btn" @click="onDeleteFoodItem(food, index)">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </div>

              <input type="range" min="0" max="3" step="0.1" v-model.number="food.quantity" class="qty-slider" :disabled="!isMyVideo" />
              
              <div class="food-mini-spec">
                (1인분: {{ food.calories }}kcal | 탄 {{ food.carbs }}g)
              </div>
            </div>

            <div v-if="isMyVideo" class="inline-add-container">
              <input v-model="newFoodName" class="inline-add-input" placeholder="AI가 놓친 음식을 수동 추가..." @keyup.enter="onAddManualFood" />
              <button class="inline-add-btn" @click="onAddManualFood">추가</button>
            </div>

            <button v-if="isMyVideo" class="save-nutri-btn" @click="onSaveQuantities">
              조절한 식단 및 수량 일괄 업데이트 하기
            </button>
          </div>
          
          <p v-else class="ai-hint">
            {{ isFailed ? 'AI 분석에 실패했습니다.' : '기록된 분석 정보가 없습니다.' }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 모달폭이나 영상 레이아웃 비율을 절대로 건드리지 않는 컴팩트 추가 스타일 */
.food-right-area { display: flex; align-items: center; gap: 8px; }
.food-del-inline-btn { background: none; border: none; color: #e05050; cursor: pointer; padding: 2px; font-size: 14px; display: flex; align-items: center; }
.inline-add-container { display: flex; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(0,0,0,0.06); }
.inline-add-input { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; padding: 5px 8px; font-size: 12px; background: var(--bg-primary); color: var(--text-primary); }
.inline-add-input:focus { outline: none; border-color: var(--accent); }
.inline-add-btn { background: #444; color: #fff; border: none; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; }

/* --- 이하 오리지널 레이아웃 및 CSS 속성 100% 동일 원본 복구 보존 --- */
.overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.sheet { width: 100%; max-width: 360px; max-height: 85vh; background: var(--bg-primary); border-radius: 22px; overflow-y: auto; padding-bottom: 20px; animation: popIn 0.22s cubic-bezier(0.32, 1, 0.4, 1); }
@keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.handle { display: none; }
.loading-box { display: flex; justify-content: center; align-items: center; height: 180px; font-size: 24px; color: var(--text-secondary); }
.spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.video-wrap { position: relative; width: 100%; aspect-ratio: 4/3; background: #000; overflow: hidden; }
.video { width: 100%; height: 100%; object-fit: cover; display: block; background: #000; }
.close-btn { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; background: rgba(0, 0, 0, 0.4); color: #fff; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: pointer; }
.video-actions { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; }
.vbtn { background: rgba(255, 255, 255, 0.22); backdrop-filter: blur(6px); color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 4px 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; }
.vbtn:disabled { opacity: 0.4; cursor: not-allowed; }
.video-footer { position: absolute; bottom: 10px; left: 12px; display: flex; align-items: center; gap: 6px; }
.meal-pill { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.35); }
.meal-date { color: rgba(255, 255, 255, 0.75); font-size: 11px; }
.info { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 12px 16px 6px; }
.name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.mine { background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.like-btn { margin-left: auto; background: none; border: none; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: transform 0.15s; }
.like-btn:active { transform: scale(1.25); }
.heart-icon { color: rgba(0, 0, 0, 0.15); -webkit-text-stroke: 1.8px #ccc; transition: color 0.15s, -webkit-text-stroke 0.15s; line-height: 1; }
.like-btn.liked .heart-icon { color: #ff2d55; -webkit-text-stroke: 1.8px #ff2d55; }
.desc { width: 100%; margin: 2px 0 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.nutri-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; width: 100%; }
.ntag { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
.ntag.carb { background: #e8f4ff; color: #3a8fe8; }
.ntag.prot { background: #fff0f0; color: #e05050; }
.ntag.fat { background: #fffde7; color: #c0860a; }
.ntag.kal { background: var(--accent-light); color: var(--accent); }
.ai-card { margin: 4px 14px 12px; background: var(--bg-secondary); border-radius: 14px; padding: 12px 14px; }
.ai-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.ai-tag { background: var(--accent); color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 20px; }
.ai-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ai-hint { font-size: 12px; color: #bbb; margin: 0; }
.food-slider-list { display: flex; flex-direction: column; gap: 14px; margin-top: 8px; }
.food-item { background: var(--bg-primary); padding: 10px; border-radius: 10px; border: 1px solid rgba(0, 0, 0, 0.04); }
.food-info-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.food-name { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.food-qty { font-size: 13px; font-weight: 700; color: var(--accent); }
.qty-slider { width: 100%; accent-color: var(--accent); cursor: pointer; }
.food-mini-spec { font-size: 11px; color: #999; text-align: right; }
.save-nutri-btn { width: 100%; background: var(--accent); color: #fff; border: none; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: background 0.2s; }
.save-nutri-btn:hover { background: var(--accent-dark); }
.ai-pending { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-size: 13px; color: var(--text-secondary); }
.retry-area { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.retry-btn { display: flex; align-items: center; gap: 6px; background: var(--bg-primary); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; color: var(--text-primary); cursor: pointer; transition: background 0.15s; }
.retry-btn:hover:not(:disabled) { background: var(--accent-light); color: var(--accent); }
.retry-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.retry-msg { font-size: 12px; color: var(--text-secondary); margin: 0; }
</style>