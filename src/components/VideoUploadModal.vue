<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-window">
      <div class="modal-header">
        <h3 class="modal-title">얌얌 로그 업로드</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleUpload">

        <!-- 팀 선택 (다중, 동글이 토글) -->
        <div class="form-group">
          <label>팀 선택 <span class="required">*</span> <span class="hint">복수 선택 가능</span></label>
          <div class="team-chips">
            <button
              v-for="team in teams"
              :key="team.id"
              type="button"
              class="chip"
              :class="{ selected: selectedTeamIds.includes(team.id) }"
              @click="toggleTeam(team.id)"
            >
              <span class="chip-check" v-if="selectedTeamIds.includes(team.id)">✓</span>
              {{ team.name }}
            </button>
          </div>
        </div>

        <!-- 식사 타입 + 날짜 -->
        <div class="form-row">
          <div class="form-group">
            <label>식사 타입 <span class="required">*</span></label>
            <div class="type-chips">
              <button
                v-for="mt in mealTypes"
                :key="mt.value"
                type="button"
                class="chip small"
                :class="{ selected: mealType === mt.value }"
                @click="mealType = mt.value"
              >{{ mt.label }}</button>
            </div>
          </div>
          <div class="form-group">
            <label>날짜 <span class="required">*</span></label>
            <input type="date" v-model="mealDate" required class="form-input" />
          </div>
        </div>

        <!-- 동영상 파일 -->
        <div class="form-group">
          <label>동영상 파일 <span class="required">*</span></label>
          <div class="file-drop" @click="fileInput.click()" :class="{ has: videoFile }">
            <template v-if="videoFile">
              <span>🎥 {{ videoFile.name }}</span>
            </template>
            <template v-else>
              <span>📁 클릭하여 영상 선택</span>
            </template>
          </div>
          <input ref="fileInput" type="file" accept="video/*" @change="onFileChange" style="display:none" />
        </div>

        <!-- 메모 -->
        <div class="form-group">
          <label>메모 (선택)</label>
          <input v-model="description" type="text" placeholder="오늘 식단 한마디" class="form-input" />
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-cancel">취소</button>
          <button type="submit" class="btn-submit" :disabled="!canSubmit">
            {{ selectedTeamIds.length > 1 ? `${selectedTeamIds.length}개 팀에 업로드` : '업로드' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ teams: Array })
const emit = defineEmits(['close', 'upload'])

const selectedTeamIds = ref([])
const mealType = ref('')
const mealDate = ref(new Date().toISOString().slice(0, 10))
const description = ref('')
const videoFile = ref(null)
const fileInput = ref(null)

const mealTypes = [
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH',     label: '점심' },
  { value: 'DINNER',    label: '저녁' },
]

const canSubmit = computed(() =>
  selectedTeamIds.value.length > 0 && mealType.value && mealDate.value && videoFile.value
)

function toggleTeam(id) {
  const idx = selectedTeamIds.value.indexOf(id)
  if (idx === -1) selectedTeamIds.value.push(id)
  else selectedTeamIds.value.splice(idx, 1)
}

const onFileChange = (e) => {
  if (e.target.files.length > 0) videoFile.value = e.target.files[0]
}

const handleUpload = () => {
  if (!canSubmit.value) return
  emit('upload', {
    teamIds: [...selectedTeamIds.value],
    mealType: mealType.value,
    mealDate: mealDate.value,
    description: description.value,
    file: videoFile.value,
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-window {
  background: #fff; padding: 24px;
  border-radius: 16px; width: 100%; max-width: 420px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  max-height: 90vh; overflow-y: auto;
}
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.modal-title { margin: 0; font-size: 18px; font-weight: 700; }
.modal-close { background: none; border: none; font-size: 16px; color: #888; cursor: pointer; }
.modal-close:hover { color: #000; }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.form-group label { font-size: 12px; font-weight: 600; color: #555; display: flex; align-items: center; gap: 6px; }
.required { color: #e53e3e; }
.hint { font-size: 11px; color: #aaa; font-weight: 400; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* 팀 동글이 칩 */
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

.file-drop {
  display: flex; align-items: center; gap: 8px;
  border: 1.5px dashed #ccc; border-radius: 10px;
  padding: 14px 16px; cursor: pointer;
  font-size: 13px; color: #888;
  transition: border-color 0.15s, background 0.15s;
}
.file-drop:hover, .file-drop.has { border-color: #000; color: #333; background: #fafafa; }

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
