<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-window">
      <div class="modal-header">
        <h3 class="modal-title">얌얌 로그 업로드</h3>
        <button class="modal-close" @click="handleClose">✕</button>
      </div>

      <form @submit.prevent="handleUpload">

        <!-- 팀 선택 -->
        <div class="form-group">
          <label>팀 선택 <span class="required">*</span> <span class="hint">복수 선택 가능</span></label>
          <div class="team-chips">
            <button v-for="team in teams" :key="team.id" type="button"
              class="chip" :class="{ selected: selectedTeamIds.includes(team.id) }"
              @click="toggleTeam(team.id)">
              <span v-if="selectedTeamIds.includes(team.id)" class="chip-check">✓</span>
              {{ team.name }}
            </button>
          </div>
        </div>

        <!-- 영상 선택 → 미리보기 + 인라인 메모 -->
        <div class="form-group">
          <!-- 파일 선택 전 -->
          <div v-if="!videoPreviewUrl" class="file-drop" @click="fileInput.click()">
            <i class="ti ti-video-plus" style="font-size:26px"></i>
            <span>클릭하여 영상 선택</span>
          </div>

          <!-- 미리보기 + 인라인 메모 -->
          <div v-else class="preview-wrap">
            <video :src="videoPreviewUrl" class="preview-video" autoplay loop muted playsinline></video>

            <!-- 영상 위에 바로 타이핑 -->
            <textarea
              ref="memoRef"
              v-model="description"
              class="memo-direct"
              placeholder="메모 입력..."
              maxlength="30"
              rows="2"
            ></textarea>
            <span class="memo-counter">{{ description.length }}/30</span>

            <!-- 파일 변경 버튼 -->
            <button type="button" class="btn-change-file" @click="fileInput.click()">
              <i class="ti ti-refresh"></i>
            </button>
          </div>

          <input ref="fileInput" type="file" accept="video/*" @change="onFileChange" style="display:none" />
        </div>

        <div class="modal-actions">
          <button type="button" @click="handleClose" class="btn-cancel">취소</button>
          <button type="submit" class="btn-submit" :disabled="!canSubmit">
            {{ selectedTeamIds.length > 1 ? `${selectedTeamIds.length}개 팀에 업로드` : '업로드' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({ teams: Array, defaultMealType: String })
const emit = defineEmits(['close', 'upload'])

const selectedTeamIds = ref([])
const mealType = ref(props.defaultMealType || '')
const description = ref('')
const videoFile = ref(null)
const videoPreviewUrl = ref(null)
const fileInput = ref(null)
const memoRef = ref(null)

function localDateStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const mealDate = ref(localDateStr())

const mealTypes = [
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH',     label: '점심' },
  { value: 'DINNER',    label: '저녁' },
]

const canSubmit = computed(() =>
  selectedTeamIds.value.length > 0 && videoFile.value
)

function toggleTeam(id) {
  const idx = selectedTeamIds.value.indexOf(id)
  if (idx === -1) selectedTeamIds.value.push(id)
  else selectedTeamIds.value.splice(idx, 1)
}

function onFileChange(e) {
  if (!e.target.files.length) return
  const file = e.target.files[0]
  videoFile.value = file
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
  videoPreviewUrl.value = URL.createObjectURL(file)
}

// 미리보기 나타나면 자동 포커스 → 커서 깜빡임
watch(videoPreviewUrl, async (url) => {
  if (url) {
    await nextTick()
    setTimeout(() => memoRef.value?.focus(), 80)
  }
})

function handleClose() {
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
  emit('close')
}

function handleUpload() {
  if (!canSubmit.value) return
  emit('upload', {
    teamIds: [...selectedTeamIds.value],
    mealType: mealType.value,
    mealDate: mealDate.value,
    description: description.value,
    file: videoFile.value,
  })
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
}

onUnmounted(() => {
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-window {
  background: #fff; padding: 20px;
  border-radius: 18px; width: 100%; max-width: 420px;
  max-height: 92vh; overflow-y: auto;
}
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-title { margin: 0; font-size: 17px; font-weight: 700; }
.modal-close { background: none; border: none; font-size: 16px; color: #888; cursor: pointer; }
.modal-close:hover { color: #000; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.form-group label { font-size: 12px; font-weight: 600; color: #555; display: flex; align-items: center; gap: 6px; }
.required { color: #e53e3e; }
.hint { font-size: 11px; color: #aaa; font-weight: 400; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.team-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.type-chips  { display: flex; gap: 8px; }
.chip {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 999px;
  border: 1.5px solid #e5e5e5;
  background: #fff; color: #555;
  font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  white-space: nowrap;
}
.chip:hover { border-color: #000; color: #000; }
.chip.selected { background: #000; color: #fff; border-color: #000; }
.chip.small { padding: 6px 12px; font-size: 12px; }
.chip-check { font-size: 11px; }

.form-input {
  width: 100%; padding: 10px 12px;
  border: 1px solid #ddd; border-radius: 8px;
  font-size: 14px; outline: none; box-sizing: border-box;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #000; }

/* 파일 선택 전 드롭존 */
.file-drop {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
  border: 1.5px dashed #ccc; border-radius: 14px; padding: 32px 14px;
  cursor: pointer; font-size: 13px; color: #888;
  transition: border-color 0.15s;
}
.file-drop:hover { border-color: #000; color: #333; }

/* 영상 미리보기 */
.preview-wrap {
  width: 100%;
  aspect-ratio: 9/16;
  max-height: 50vh;
  border-radius: 14px; overflow: hidden;
  position: relative; background: #000;
}
.preview-video { width: 100%; height: 100%; object-fit: cover; display: block; }

/* 영상 위 직접 타이핑 */
.memo-direct {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 32px);
  background: transparent;
  border: none; outline: none; resize: none;
  font-size: 22px; font-weight: 900;
  color: #fff;
  text-align: center; line-height: 1.5;
  font-family: inherit;
  caret-color: #fff;
  z-index: 2;
}
.memo-direct::placeholder { color: rgba(255,255,255,0.38); font-weight: 400; font-size: 16px; }

.memo-counter {
  position: absolute; bottom: 10px; right: 12px;
  font-size: 11px; color: rgba(255,255,255,0.5);
  z-index: 2; pointer-events: none;
}

/* 파일 변경 버튼 */
.btn-change-file {
  position: absolute; top: 10px; right: 10px;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.45); border: none;
  color: #fff; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 3;
}
.btn-change-file:hover { background: rgba(0,0,0,0.65); }

.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.btn-cancel { padding: 10px 18px; background: #f5f5f5; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-cancel:hover { background: #eee; }
.btn-submit {
  padding: 10px 18px; background: #000; color: #fff;
  border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.btn-submit:hover:not(:disabled) { opacity: 0.85; }
.btn-submit:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
