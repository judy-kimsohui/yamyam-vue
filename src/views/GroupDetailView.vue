<template>
  <div class="screen">
    <!-- 헤더 -->
    <header class="header">
      <button class="icon-btn" @click="showCalendar ? (showCalendar = false) : goBack()">
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="group-title-wrap">
        <img v-if="!showCalendar" src="/default_group.svg" class="group-header-img" alt="group" />
        <span class="group-title">{{ showCalendar ? 'AI 달력' : (selectedGroup?.name ?? '그룹') }}</span>
      </div>
      <div class="header-actions" v-if="!showCalendar">
        <button class="icon-btn" @click="showCalendar = true" title="AI 달력">
          <i class="ti ti-calendar"></i>
        </button>
        <button class="icon-btn" @click="goTo('chat')" title="채팅">
          <i class="ti ti-message-circle"></i>
        </button>
      </div>
      <div v-else style="width:36px"></div>
    </header>

    <main class="scroll-body">

      <!-- ── AI 달력 패널 ── -->
      <section v-if="showCalendar" class="calendar-panel">
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth"><i class="ti ti-chevron-left"></i></button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div class="cal-weekdays">
          <span v-for="d in ['일','월','화','수','목','금','토']" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{ empty: !cell, selected: cell === selectedDay }"
            @click="cell && selectDay(cell)"
          >
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="groupDayExpressions[cell]" class="cal-expr">{{ groupDayExpressions[cell] }}</span>
            </template>
          </div>
        </div>

        <div class="day-record">
          <div class="day-record-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 기록</div>
          <div class="day-bars">
            <div class="bar-row">
              <span class="bar-label">칼로리</span>
              <div class="bar-track"><div class="bar-fill" :style="{ width: calPercent(dayRecord.totalCalories, dayRecord.targetCalories) + '%' }"></div></div>
              <span class="bar-val">{{ dayRecord.totalCalories }} / {{ dayRecord.targetCalories }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">단백질</span>
              <div class="bar-track"><div class="bar-fill protein" :style="{ width: calPercent(dayRecord.protein, dayRecord.targetProtein) + '%' }"></div></div>
              <span class="bar-val">{{ dayRecord.protein }}g / {{ dayRecord.targetProtein }}g</span>
            </div>
          </div>
          <div class="day-ai"><span class="ai-chip">AI</span>{{ dayRecord.aiComment }}</div>
        </div>
      </section>

      <!-- ── 피드 ── -->
      <template v-if="!showCalendar">
        <div class="feed-date-label">
          {{ feedDate }} 식단 기록
          <button class="date-nav-btn" @click="prevDay">◀</button>
          <button class="date-nav-btn" @click="nextDay">▶</button>
        </div>

        <div v-if="loading" class="loading-msg">불러오는 중...</div>

        <section v-else class="feed">
          <div v-for="member in teamMembers" :key="member.id" class="member-log">
            <div class="member-row">
              <!-- 프로필 아바타 (기본 이미지: 이니셜 원형) -->
              <div class="member-avatar" :class="{ mine: isMe(member.id) }">
                <img
                  :src="member.profileImg || '/default_avatar.svg'"
                  :alt="member.nickName"
                  class="avatar-img"
                  @error="(e) => e.target.src = '/default_avatar.svg'"
                />
              </div>
              <div class="member-name">{{ member.nickName }}</div>
              <div v-if="isMe(member.id)" class="mine-badge">나</div>
            </div>

            <div class="meal-slots">
              <div v-for="mt in mealTypes" :key="mt.key" class="meal-slot">
                <div class="meal-label">{{ mt.label }}</div>

                <!-- 영상 있음 -->
                <div v-if="getVideo(member.id, mt.key)" class="video-wrap">
                  <video
                    class="meal-video"
                    :src="getVideo(member.id, mt.key).videoUrl"
                    autoplay loop muted playsinline
                  ></video>
                  <div class="video-duration">{{ mt.label }}</div>
                </div>

                <!-- 내 슬롯 - 빈 경우 업로드 버튼 -->
                <div
                  v-else-if="isMe(member.id)"
                  class="video-thumb upload-slot"
                  @click="openUpload(mt.key)"
                  title="클릭하여 업로드"
                >
                  <i class="ti ti-upload"></i>
                  <span>업로드</span>
                </div>

                <!-- 다른 멤버 - 빈 경우 -->
                <div v-else class="video-thumb empty">
                  <i class="ti ti-minus"></i>
                </div>

                <div class="meal-title-text">
                  {{ getVideo(member.id, mt.key)?.description || (isMe(member.id) ? '클릭하여 업로드' : '미기록') }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="teamMembers.length === 0" class="empty-feed">
            멤버 정보를 불러올 수 없습니다.
          </div>
        </section>
      </template>
    </main>

    <!-- 업로드 모달 -->
    <div v-if="uploadModal.open" class="modal-overlay" @click.self="uploadModal.open = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">{{ mealTypes.find(m => m.key === uploadModal.mealType)?.label }} 업로드</h3>
          <button class="modal-close" @click="uploadModal.open = false">✕</button>
        </div>
        <form @submit.prevent="submitUpload">
          <div class="form-group">
            <label>동영상 파일</label>
            <div class="file-drop" @click="uploadFileInput.click()" :class="{ has: uploadModal.file }">
              <template v-if="uploadModal.file">
                <span>🎥 {{ uploadModal.file.name }}</span>
              </template>
              <template v-else>
                <span>📁 클릭하여 영상 선택</span>
              </template>
            </div>
            <input ref="uploadFileInput" type="file" accept="video/*" @change="onUploadFileChange" style="display:none" />
          </div>
          <div class="form-group">
            <label>메모 (선택)</label>
            <input v-model="uploadModal.description" type="text" placeholder="한마디 기록" class="form-input" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="uploadModal.open = false" class="btn-cancel">취소</button>
            <button type="submit" class="btn-submit" :disabled="!uploadModal.file">업로드</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import axios from 'axios'
import { groupDayExpressions, groupDayRecords } from '../data/mockData.js'
import { useStore } from '../composables/useStore.js'

const { goTo, goBack } = inject('navigation')
const auth = inject('auth')
const { selectedGroup } = useStore()

// ── 상태 ──
const teamMembers = ref([])
const videoMap = ref({})  // key: `${userId}_${mealType}`
const loading = ref(false)
const showCalendar = ref(false)

const mealTypes = [
  { key: 'BREAKFAST', label: '아침' },
  { key: 'LUNCH',     label: '점심' },
  { key: 'DINNER',    label: '저녁' },
]

// ── 날짜 관리 ──
function toDateStr(d) {
  return d.toISOString().slice(0, 10)
}
const feedDateObj = ref(new Date())
const feedDate = computed(() => toDateStr(feedDateObj.value))

function prevDay() { const d = new Date(feedDateObj.value); d.setDate(d.getDate() - 1); feedDateObj.value = d; loadVideos() }
function nextDay() { const d = new Date(feedDateObj.value); d.setDate(d.getDate() + 1); feedDateObj.value = d; loadVideos() }

// ── 내 ID ──
function isMe(memberId) {
  return auth.loginUser.value?.id != null && auth.loginUser.value.id == memberId
}

// ── 비디오 조회 ──
function getVideo(userId, mealType) {
  return videoMap.value[`${userId}_${mealType}`] || null
}

// ── API ──
const loadTeamDetail = async () => {
  if (!selectedGroup.value?.id) return
  try {
    const res = await axios.get(`/api/teams/${selectedGroup.value.id}`)
    teamMembers.value = res.data.members || []
  } catch (e) {
    console.error('팀 상세 로드 실패:', e)
  }
}

const loadVideos = async () => {
  if (!selectedGroup.value?.id) return
  try {
    const res = await axios.get(`/api/videos/team/${selectedGroup.value.id}?date=${feedDate.value}`)
    const map = {}
    res.data.forEach(v => { map[`${v.userId}_${v.mealType}`] = v })
    videoMap.value = map
  } catch (e) {
    console.error('비디오 로드 실패:', e)
  }
}

onMounted(async () => {
  loading.value = true
  await loadTeamDetail()
  await loadVideos()
  loading.value = false
})

// ── 업로드 모달 ──
const uploadModal = ref({ open: false, mealType: '', description: '', file: null })
const uploadFileInput = ref(null)

function openUpload(mealType) {
  uploadModal.value = { open: true, mealType, description: '', file: null }
}
function onUploadFileChange(e) {
  if (e.target.files.length > 0) uploadModal.value.file = e.target.files[0]
}

const submitUpload = async () => {
  if (!uploadModal.value.file) return
  const formData = new FormData()
  formData.append('teamId', selectedGroup.value.id)
  formData.append('mealType', uploadModal.value.mealType)
  formData.append('mealDate', feedDate.value)
  if (uploadModal.value.description) formData.append('description', uploadModal.value.description)
  formData.append('videoFile', uploadModal.value.file)
  try {
    await axios.post('/api/videos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    uploadModal.value.open = false
    await loadVideos()
  } catch (e) {
    alert('업로드 실패: ' + (e.response?.data || '서버 오류'))
  }
}

// ── 달력 ──
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDay = ref(today.getDate())

const monthLabel = computed(() => `${currentYear.value}년 ${currentMonth.value + 1}월`)

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function firstDayOfWeek(y, m) { return new Date(y, m, 1).getDay() }

const calendarCells = computed(() => {
  const total = daysInMonth(currentYear.value, currentMonth.value)
  const offset = firstDayOfWeek(currentYear.value, currentMonth.value)
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
})

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}
function selectDay(d) { selectedDay.value = d }
function calPercent(val, total) { return Math.min(100, Math.round((val / total) * 100)) }

const dayRecord = computed(() => groupDayRecords[selectedDay.value] ?? groupDayRecords.default)
</script>

<style scoped>
.screen {
  height: 100vh; height: 100dvh;
  display: flex; flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary, #f7f7f7);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #e5e5e5);
  display: flex; align-items: center; gap: 8px;
  background: #fff; flex-shrink: 0;
}
.group-title-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
.group-header-img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.group-title { font-size: 16px; font-weight: 700; color: #000; }
.header-actions { display: flex; gap: 4px; }
.icon-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: transparent; border: none;
  color: #333; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; cursor: pointer;
  transition: background 0.15s;
}
.icon-btn:active { background: #f5f5f5; }

.scroll-body {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px;
  padding-bottom: 24px;
}

/* 날짜 네비게이션 */
.feed-date-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; color: #888;
  padding: 8px 16px 0;
}
.date-nav-btn {
  background: none; border: none;
  color: #aaa; font-size: 12px; cursor: pointer; padding: 2px 6px;
}
.date-nav-btn:hover { color: #000; }

.loading-msg { text-align: center; padding: 40px; color: #aaa; font-size: 14px; }
.empty-feed { text-align: center; padding: 40px; color: #aaa; font-size: 14px; }

/* 피드 */
.feed { display: flex; flex-direction: column; gap: 10px; padding: 0 12px; }

.member-log {
  background: #fff; border-radius: 16px; padding: 14px;
  border: 1px solid #e5e5e5;
}
.member-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }

.member-avatar {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
  flex-shrink: 0; background: #F0F4FF;
}
.member-avatar.mine { box-shadow: 0 0 0 2px #000; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.member-name { flex: 1; font-size: 14px; font-weight: 600; color: #000; }
.mine-badge {
  font-size: 10px; font-weight: 700;
  color: #000; background: #f5f5f5;
  border: 1px solid #e5e5e5;
  padding: 2px 7px; border-radius: 20px;
}

.meal-slots {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.meal-slot { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.meal-label { font-size: 10px; font-weight: 700; color: #aaa; }

.video-wrap {
  width: 100%; aspect-ratio: 1;
  border-radius: 12px; overflow: hidden; position: relative;
}
.meal-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.video-duration {
  position: absolute; bottom: 5px; right: 6px;
  font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.35); border-radius: 4px; padding: 1px 4px;
}

.video-thumb {
  width: 100%; aspect-ratio: 1; border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; font-size: 18px;
}
.video-thumb.empty {
  background: #f5f5f5;
  border: 1.5px dashed #ddd;
  color: #ccc;
}
.video-thumb.upload-slot {
  background: #f5f5f5;
  border: 1.5px dashed #000;
  color: #000; cursor: pointer;
  font-size: 16px; font-weight: 600;
  transition: background 0.15s;
}
.video-thumb.upload-slot span { font-size: 10px; font-weight: 600; }
.video-thumb.upload-slot:hover { background: #ebebeb; }

.meal-title-text {
  font-size: 10px; color: #888; text-align: center;
  line-height: 1.3; width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* 달력 */
.calendar-panel {
  background: #fff; border-bottom: 1px solid #e5e5e5;
  padding: 16px; display: flex; flex-direction: column; gap: 16px;
}
.cal-nav { display: flex; align-items: center; justify-content: space-between; }
.cal-month { font-size: 15px; font-weight: 700; }
.cal-arrow { background: none; border: none; color: #888; font-size: 18px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7,1fr); }
.cal-weekdays span { text-align: center; font-size: 11px; font-weight: 600; color: #aaa; }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; }
.cal-cell { aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:10px; cursor:pointer; gap:1px; transition:background 0.15s; }
.cal-cell.empty { cursor:default; }
.cal-cell:not(.empty):active { background:#f5f5f5; }
.cal-cell.selected { background:#000; }
.cal-cell.selected .cal-num { color:#fff; }
.cal-num { font-size:11px; color:#333; line-height:1; }
.cal-expr { font-size:14px; line-height:1; }

.day-record { background:#f7f7f7; border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:12px; }
.day-record-title { font-size:13px; font-weight:700; color:#000; }
.day-bars { display:flex; flex-direction:column; gap:6px; }
.bar-row { display:flex; align-items:center; gap:8px; }
.bar-label { font-size:11px; color:#888; width:36px; flex-shrink:0; }
.bar-track { flex:1; height:6px; background:#e5e5e5; border-radius:99px; overflow:hidden; }
.bar-fill { height:100%; background:#000; border-radius:99px; transition:width 0.4s; }
.bar-fill.protein { background:#34c759; }
.bar-val { font-size:10px; color:#888; width:80px; text-align:right; flex-shrink:0; }
.day-ai { font-size:12px; color:#666; line-height:1.6; display:flex; align-items:flex-start; gap:6px; }
.ai-chip { font-size:10px; font-weight:700; background:#000; color:#fff; padding:2px 6px; border-radius:20px; flex-shrink:0; margin-top:1px; }

/* 업로드 모달 */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal-box { background:#fff; padding:24px; border-radius:14px; width:100%; max-width:380px; }
.modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.modal-title { margin:0; font-size:16px; font-weight:700; }
.modal-close { background:none; border:none; font-size:16px; color:#888; cursor:pointer; }
.form-group { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.form-group label { font-size:12px; font-weight:600; color:#555; }
.form-input { width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; }
.form-input:focus { border-color:#000; }
.file-drop { display:flex; align-items:center; gap:8px; border:1.5px dashed #ccc; border-radius:8px; padding:14px; cursor:pointer; font-size:13px; color:#888; transition:border-color 0.15s; }
.file-drop:hover, .file-drop.has { border-color:#000; color:#333; }
.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:20px; }
.btn-cancel { padding:9px 16px; background:#f5f5f5; border:none; border-radius:8px; cursor:pointer; font-size:13px; }
.btn-submit { padding:9px 16px; background:#000; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; }
.btn-submit:disabled { opacity:0.35; cursor:not-allowed; }
</style>
