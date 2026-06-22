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

        <!-- 영상 선택 -> 미리보기 + 인라인 메모 -->
        <div class="form-group">
          <!-- 파일 선택 전 -->
          <div v-if="!videoPreviewUrl" class="file-drop-area">
            <button type="button" class="drop-btn" @click="fileInput.click()">
              <i class="ti ti-folder-open" style="font-size:24px"></i>
              <span>파일 선택</span>
            </button>
            <span class="drop-or">또는</span>
            <button type="button" class="drop-btn camera-btn" @click="openCamera">
              <i class="ti ti-camera" style="font-size:24px"></i>
              <span>카메라 촬영</span>
            </button>
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

            <!-- 파일 변경 / 카메라 재촬영 -->
            <div class="change-btns">
              <button type="button" class="btn-change-file" @click="fileInput.click()" title="파일 선택">
                <i class="ti ti-folder-open"></i>
              </button>
              <button type="button" class="btn-change-file" @click="openCamera" title="카메라 재촬영">
                <i class="ti ti-camera"></i>
              </button>
            </div>
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

  <!-- 카메라 촬영 오버레이 -->
  <Teleport to="body">
    <div v-if="showCamera" class="camera-overlay">
      <video ref="cameraVideoEl" class="camera-feed" autoplay playsinline muted></video>
      <div class="camera-ui">
        <button v-if="!isRecording" type="button" class="btn-close-camera" @click="stopCamera">✕</button>
        <div class="camera-tip" v-if="!isRecording">음식을 화면에 맞추고 촬영 버튼을 누르세요</div>
        <div class="camera-bottom">
          <div v-if="isRecording" class="record-progress-wrap">
            <div class="record-label">
              <span class="rec-dot"></span> 촬영 중...
            </div>
            <div class="record-progress-bar">
              <div class="record-fill" :style="{ width: recordProgress + '%' }"></div>
            </div>
          </div>
          <button v-if="!isRecording" type="button" class="btn-shutter" @click="startRecording">
            <span class="shutter-inner"></span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
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

// 카메라 관련 state
const showCamera = ref(false)
const cameraVideoEl = ref(null)
const cameraStream = ref(null)
const isRecording = ref(false)
const recordProgress = ref(0)
let mediaRecorder = null
let recordedChunks = []
let progressTimer = null

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

watch(videoPreviewUrl, async (url) => {
  if (url) {
    await nextTick()
    setTimeout(() => memoRef.value?.focus(), 80)
  }
})

async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    cameraStream.value = stream
    showCamera.value = true
    await nextTick()
    if (cameraVideoEl.value) cameraVideoEl.value.srcObject = stream
  } catch {
    alert('카메라를 열 수 없습니다. 카메라 권한을 허용해 주세요.')
  }
}

function startRecording() {
  if (!cameraStream.value || isRecording.value) return
  recordedChunks = []
  recordProgress.value = 0
  isRecording.value = true

  const mimeType = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm']
    .find(t => MediaRecorder.isTypeSupported(t)) || ''
  mediaRecorder = new MediaRecorder(cameraStream.value, mimeType ? { mimeType } : {})

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data)
  }
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: mimeType || 'video/webm' })
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([blob], `meal_${Date.now()}.${ext}`, { type: blob.type })
    videoFile.value = file
    if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
    videoPreviewUrl.value = URL.createObjectURL(blob)
    stopCamera()
  }

  mediaRecorder.start()
  const startTime = Date.now()
  progressTimer = setInterval(() => {
    recordProgress.value = Math.min(100, ((Date.now() - startTime) / 2000) * 100)
  }, 30)

  setTimeout(() => {
    clearInterval(progressTimer)
    recordProgress.value = 100
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
    isRecording.value = false
  }, 2000)
}

function stopCamera() {
  clearInterval(progressTimer)
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(t => t.stop())
    cameraStream.value = null
  }
  showCamera.value = false
  isRecording.value = false
}

function handleClose() {
  stopCamera()
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
  stopCamera()
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

.team-chips { display: flex; flex-wrap: wrap; gap: 8px; }
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
.chip-check { font-size: 11px; }

/* 파일 선택 전 영역 */
.file-drop-area {
  display: flex; align-items: center; justify-content: center;
  gap: 10px;
  border: 1.5px dashed #ccc; border-radius: 14px; padding: 20px 14px;
}
.drop-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 18px 0;
  background: #f7f7f7; border: none; border-radius: 12px;
  font-size: 12px; color: #555; cursor: pointer; transition: background 0.15s;
  flex: 1;
}
.drop-btn:hover { background: #eee; color: #000; }
.camera-btn { background: #fff5f7; color: #e8909e; }
.camera-btn:hover { background: #ffe0e8; color: #c0607a; }
.drop-or { font-size: 12px; color: #ccc; white-space: nowrap; }

/* 영상 미리보기 */
.preview-wrap {
  width: 100%;
  aspect-ratio: 9/16;
  max-height: 50vh;
  border-radius: 14px; overflow: hidden;
  position: relative; background: #000;
}
.preview-video { width: 100%; height: 100%; object-fit: cover; display: block; }

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

.change-btns {
  position: absolute; top: 10px; right: 10px;
  display: flex; gap: 6px; z-index: 3;
}
.btn-change-file {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.45); border: none;
  color: #fff; font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
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

/* 카메라 오버레이 */
.camera-overlay {
  position: fixed; inset: 0;
  background: #000; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.camera-feed {
  width: 100%; height: 100%; object-fit: cover;
}
.camera-ui {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  justify-content: space-between;
  padding: 20px 20px 40px;
}
.btn-close-camera {
  align-self: flex-end;
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(0,0,0,0.55); border: none; color: #fff;
  font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.camera-tip {
  text-align: center; color: rgba(255,255,255,0.75);
  font-size: 13px; font-weight: 500;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  margin-top: 8px;
}
.camera-bottom {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.record-progress-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;
}
.record-label {
  color: #fff; font-size: 14px; font-weight: 600;
  display: flex; align-items: center; gap: 6px;
}
.rec-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #ff3030;
  animation: blink 0.6s step-end infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.record-progress-bar {
  width: 70%; height: 5px;
  background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden;
}
.record-fill {
  height: 100%; background: #ff3030; border-radius: 3px;
  transition: width 0.03s linear;
}
.btn-shutter {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(255,255,255,0.2); border: 3px solid #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform 0.1s;
}
.btn-shutter:active { transform: scale(0.92); }
.shutter-inner {
  width: 54px; height: 54px; border-radius: 50%; background: #fff;
}
</style>
