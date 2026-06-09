<template>
  <div class="screen">
    <!-- ── 헤더 ── -->
    <header class="header">
      <button class="icon-btn" @click="(!isWide && showCalendar) ? (showCalendar = false) : goBack()">
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="group-title-wrap">
        <img v-if="!(!isWide && showCalendar)" src="/default_group.svg" class="group-header-img" alt="group" />
        <span class="group-title">{{ (!isWide && showCalendar) ? 'AI 달력' : (selectedGroup?.name ?? '그룹') }}</span>
      </div>
      <!-- 모바일/아이패드: 달력 + 채팅 버튼 (와이드는 좌측 패널에 있음) -->
      <div class="header-actions" v-if="!isWide && !showCalendar">
        <button class="icon-btn" @click="showCalendar = true" title="AI 달력">
          <i class="ti ti-calendar"></i>
        </button>
        <button class="icon-btn" @click="goTo('chat')" title="채팅">
          <i class="ti ti-message-circle"></i>
        </button>
      </div>
      <div v-else style="width:36px"></div>
    </header>

    <!-- ══════════════ MOBILE (< 768px) ══════════════ -->
    <main v-if="isMobile" class="scroll-body">

      <!-- AI 달력 패널 -->
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
          <div v-for="(cell, i) in calendarCells" :key="i" class="cal-cell"
            :class="{ empty: !cell, selected: cell === selectedDay }"
            @click="cell && selectDay(cell)">
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="getDayEmoji(cell)" class="cal-expr" v-html="getDayEmoji(cell)"></span>
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
        <div class="member-summary-list">
          <div class="summary-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 · 참가자 식단</div>
          <div v-for="member in teamMembers" :key="member.id" class="summary-row">
            <img :src="member.profileImg || '/default_avatar.svg'" class="summary-avatar"
              @error="(e) => e.target.src = '/default_avatar.svg'" />
            <div class="summary-info">
              <div class="summary-name">{{ member.nickName }}<span v-if="isMe(member.id)" class="mine-badge">나</span></div>
              <div v-if="memberMeals(member.id).length > 0" class="summary-meals">
                <span v-for="mt in memberMeals(member.id)" :key="mt.key" class="summary-chip">
                  <span class="summary-meal-type">{{ mt.label }}</span>{{ mt.video.description || '기록됨' }}
                </span>
              </div>
              <div v-else class="summary-no-record">이 날 기록 없음</div>
            </div>
          </div>
          <div v-if="teamMembers.length === 0" class="summary-no-record" style="padding:12px 0">멤버 정보 없음</div>
        </div>
      </section>

      <!-- 피드 (모바일) -->
      <template v-else>
        <div class="feed-date-label">
          <button class="date-nav-btn" @click="prevDay"><i class="ti ti-chevron-left"></i></button>
          <span>{{ feedDate }} 식단 기록</span>
          <button class="date-nav-btn" @click="nextDay"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div v-if="loading" class="loading-msg">불러오는 중...</div>
        <template v-else>
          <div class="meal-tab-bar">
            <button v-for="(mt, i) in mealTypes" :key="mt.key"
              class="meal-tab" :class="{ active: activeMealIdx === i }"
              @click="activeMealIdx = i">{{ mt.label }}</button>
          </div>
          <section class="feed-mobile"
            @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd"
            @mousedown="onMouseDown" @mouseup="onMouseUp" @mouseleave="isDragging = false">
            <div v-for="member in teamMembers" :key="member.id" class="member-log-mobile">
              <div class="member-row">
                <div class="member-avatar" :class="{ mine: isMe(member.id) }">
                  <img :src="member.profileImg || '/default_avatar.svg'" :alt="member.nickName" class="avatar-img"
                    @error="(e) => e.target.src='/default_avatar.svg'" />
                </div>
                <div class="member-name">{{ member.nickName }}</div>
                <div v-if="isMe(member.id)" class="mine-badge">나</div>
              </div>
              <div v-if="getVideo(member.id, mealTypes[activeMealIdx].key)" class="video-wrap-full">
                <video class="meal-video-full"
                  :src="getVideo(member.id, mealTypes[activeMealIdx].key).videoUrl"
                  autoplay loop muted playsinline></video>
                <span v-if="getVideo(member.id, mealTypes[activeMealIdx].key).description" class="vid-center-desc">{{ getVideo(member.id, mealTypes[activeMealIdx].key).description }}</span>
                <div class="vid-bottom">
                  <span class="vid-tag">{{ mealTypes[activeMealIdx].label }} · {{ videoTime(getVideo(member.id, mealTypes[activeMealIdx].key)) }}</span>
                </div>
              </div>
              <div v-else-if="isMe(member.id)" class="video-wrap-full upload-full" @click="openUpload(mealTypes[activeMealIdx].key)">
                <i class="ti ti-upload"></i><span>{{ mealTypes[activeMealIdx].label }} 업로드</span>
              </div>
              <div v-else class="video-wrap-full empty-full">
                <i class="ti ti-minus"></i><span>미기록</span>
              </div>
            </div>
            <div v-if="teamMembers.length === 0" class="empty-feed">멤버 정보를 불러올 수 없습니다.</div>
          </section>
        </template>
      </template>
    </main>

    <!-- ══════════════ TABLET / iPad (768–1199px): 3열 그리드 ══════════════ -->
    <main v-else-if="!isWide" class="scroll-body">
      <!-- AI 달력 패널 -->
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
          <div v-for="(cell, i) in calendarCells" :key="i" class="cal-cell"
            :class="{ empty: !cell, selected: cell === selectedDay }"
            @click="cell && selectDay(cell)">
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="getDayEmoji(cell)" class="cal-expr" v-html="getDayEmoji(cell)"></span>
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
        <div class="member-summary-list">
          <div class="summary-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 · 참가자 식단</div>
          <div v-for="member in teamMembers" :key="member.id" class="summary-row">
            <img :src="member.profileImg || '/default_avatar.svg'" class="summary-avatar"
              @error="(e) => e.target.src = '/default_avatar.svg'" />
            <div class="summary-info">
              <div class="summary-name">{{ member.nickName }}<span v-if="isMe(member.id)" class="mine-badge">나</span></div>
              <div v-if="memberMeals(member.id).length > 0" class="summary-meals">
                <span v-for="mt in memberMeals(member.id)" :key="mt.key" class="summary-chip">
                  <span class="summary-meal-type">{{ mt.label }}</span>{{ mt.video.description || '기록됨' }}
                </span>
              </div>
              <div v-else class="summary-no-record">이 날 기록 없음</div>
            </div>
          </div>
          <div v-if="teamMembers.length === 0" class="summary-no-record" style="padding:12px 0">멤버 정보 없음</div>
        </div>
      </section>

      <!-- 피드 (아이패드: 3열 그리드) -->
      <template v-else>
        <div class="feed-date-label desk-date">
          <button class="date-nav-btn" @click="prevDay"><i class="ti ti-chevron-left"></i></button>
          <span>{{ feedDate }} 식단 기록</span>
          <button class="date-nav-btn" @click="nextDay"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div v-if="loading" class="loading-msg">불러오는 중...</div>
        <section v-else class="feed">
          <div v-for="member in teamMembers" :key="member.id" class="member-log">
            <div class="member-row">
              <div class="member-avatar" :class="{ mine: isMe(member.id) }">
                <img :src="member.profileImg || '/default_avatar.svg'" :alt="member.nickName" class="avatar-img"
                  @error="(e) => e.target.src='/default_avatar.svg'" />
              </div>
              <div class="member-name">{{ member.nickName }}</div>
              <div v-if="isMe(member.id)" class="mine-badge">나</div>
            </div>
            <div class="meal-slots">
              <div v-for="mt in mealTypes" :key="mt.key" class="meal-slot">
                <div v-if="getVideo(member.id, mt.key)" class="video-wrap">
                  <video class="meal-video" :src="getVideo(member.id, mt.key).videoUrl" autoplay loop muted playsinline></video>
                  <span v-if="getVideo(member.id, mt.key).description" class="vid-center-desc">{{ getVideo(member.id, mt.key).description }}</span>
                  <div class="vid-bottom">
                    <span class="vid-tag">{{ mt.label }} · {{ videoTime(getVideo(member.id, mt.key)) }}</span>
                  </div>
                </div>
                <div v-else-if="isMe(member.id)" class="video-thumb upload-slot" @click="openUpload(mt.key)">
                  <i class="ti ti-upload"></i><span>업로드</span>
                </div>
                <div v-else class="video-thumb empty"><i class="ti ti-minus"></i></div>
              </div>
            </div>
          </div>
          <div v-if="teamMembers.length === 0" class="empty-feed">멤버 정보를 불러올 수 없습니다.</div>
        </section>
      </template>
    </main>

    <!-- ══════════════ WIDE DESKTOP (≥1200px): 1/3 달력 + 2/3 피드 ══════════════ -->
    <div v-else class="desktop-split">

      <!-- 좌측 1/3: 달력 + 채팅 버튼 -->
      <aside class="left-panel">
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth"><i class="ti ti-chevron-left"></i></button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div class="cal-weekdays">
          <span v-for="d in ['일','월','화','수','목','금','토']" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <div v-for="(cell, i) in calendarCells" :key="i" class="cal-cell"
            :class="{ empty: !cell, selected: cell === selectedDay }"
            @click="cell && selectDay(cell)">
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="getDayEmoji(cell)" class="cal-expr" v-html="getDayEmoji(cell)"></span>
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
        <div class="member-summary-list">
          <div class="summary-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 · 참가자 식단</div>
          <div v-for="member in teamMembers" :key="member.id" class="summary-row">
            <img :src="member.profileImg || '/default_avatar.svg'" class="summary-avatar"
              @error="(e) => e.target.src = '/default_avatar.svg'" />
            <div class="summary-info">
              <div class="summary-name">{{ member.nickName }}<span v-if="isMe(member.id)" class="mine-badge">나</span></div>
              <div v-if="memberMeals(member.id).length > 0" class="summary-meals">
                <span v-for="mt in memberMeals(member.id)" :key="mt.key" class="summary-chip">
                  <span class="summary-meal-type">{{ mt.label }}</span>{{ mt.video.description || '기록됨' }}
                </span>
              </div>
              <div v-else class="summary-no-record">이 날 기록 없음</div>
            </div>
          </div>
          <div v-if="teamMembers.length === 0" class="summary-no-record" style="padding:12px 0">멤버 정보 없음</div>
        </div>
        <button class="chat-btn-desk" @click="goTo('chat')">
          <i class="ti ti-message-circle"></i> 그룹 채팅
        </button>
      </aside>

      <!-- 우측 2/3: 피드 -->
      <main class="right-panel">
        <div class="feed-date-label desk-date">
          <button class="date-nav-btn" @click="prevDay"><i class="ti ti-chevron-left"></i></button>
          <span>{{ feedDate }} 식단 기록</span>
          <button class="date-nav-btn" @click="nextDay"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div v-if="loading" class="loading-msg">불러오는 중...</div>
        <section v-else class="feed">
          <div v-for="member in teamMembers" :key="member.id" class="member-log">
            <div class="member-row">
              <div class="member-avatar" :class="{ mine: isMe(member.id) }">
                <img :src="member.profileImg || '/default_avatar.svg'" :alt="member.nickName" class="avatar-img"
                  @error="(e) => e.target.src='/default_avatar.svg'" />
              </div>
              <div class="member-name">{{ member.nickName }}</div>
              <div v-if="isMe(member.id)" class="mine-badge">나</div>
            </div>
            <div class="meal-slots">
              <div v-for="mt in mealTypes" :key="mt.key" class="meal-slot">
                <div v-if="getVideo(member.id, mt.key)" class="video-wrap">
                  <video class="meal-video" :src="getVideo(member.id, mt.key).videoUrl" autoplay loop muted playsinline></video>
                  <span v-if="getVideo(member.id, mt.key).description" class="vid-center-desc">{{ getVideo(member.id, mt.key).description }}</span>
                  <div class="vid-bottom">
                    <span class="vid-tag">{{ mt.label }} · {{ videoTime(getVideo(member.id, mt.key)) }}</span>
                  </div>
                </div>
                <div v-else-if="isMe(member.id)" class="video-thumb upload-slot" @click="openUpload(mt.key)">
                  <i class="ti ti-upload"></i><span>업로드</span>
                </div>
                <div v-else class="video-thumb empty"><i class="ti ti-minus"></i></div>
              </div>
            </div>
          </div>
          <div v-if="teamMembers.length === 0" class="empty-feed">멤버 정보를 불러올 수 없습니다.</div>
        </section>
      </main>
    </div>

    <!-- 업로드 모달 -->
    <div v-if="uploadModal.open" class="modal-overlay" @click.self="closeUpload">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">{{ mealTypes.find(m => m.key === uploadModal.mealType)?.label }} 업로드</h3>
          <button class="modal-close" @click="closeUpload">✕</button>
        </div>
        <form @submit.prevent="submitUpload">

          <!-- 영상 미리보기 (파일 선택 후) -->
          <div v-if="videoPreviewUrl" class="preview-wrap">
            <video :src="videoPreviewUrl" class="preview-video" autoplay loop muted playsinline></video>

            <!-- 영상 중앙에 바로 타이핑 -->
            <textarea
              ref="memoTextRef"
              v-model="uploadModal.description"
              class="memo-direct"
              placeholder="메모 입력..."
              maxlength="30"
              rows="2"
            ></textarea>
            <span class="memo-counter">{{ uploadModal.description.length }}/30</span>

            <button type="button" class="btn-change-file" @click="uploadFileInput.click()">
              <i class="ti ti-refresh"></i>
            </button>
          </div>

          <!-- 파일 선택 전: 드롭존 -->
          <div v-else class="file-drop" @click="uploadFileInput.click()">
            <i class="ti ti-video-plus" style="font-size:28px"></i>
            <span>클릭하여 영상 선택</span>
          </div>

          <input ref="uploadFileInput" type="file" accept="video/*" @change="onUploadFileChange" style="display:none" />

          <div class="modal-actions">
            <button type="button" @click="closeUpload" class="btn-cancel">취소</button>
            <button type="submit" class="btn-submit" :disabled="!uploadModal.file">업로드</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, onMounted, onUnmounted, nextTick } from 'vue'
import axios from 'axios'
import { calendarData, emojis, groupDayRecords, groupMembers } from '../data/mockData.js'
import { useStore } from '../composables/useStore.js'

const { goTo, goBack } = inject('navigation')
const auth = inject('auth')
const { selectedGroup } = useStore()

const teamMembers = ref([])
const videoMap = ref({})
const loading = ref(false)
const showCalendar = ref(false)

watch(showCalendar, (val) => { if (val || isWide.value) selectDay(selectedDay.value) })

const mealTypes = [
  { key: 'BREAKFAST', label: '아침' },
  { key: 'LUNCH',     label: '점심' },
  { key: 'DINNER',    label: '저녁' },
]

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const feedDateObj = ref(new Date())
const feedDate = computed(() => toDateStr(feedDateObj.value))

function syncCalendarFromFeed(d) {
  currentYear.value = d.getFullYear()
  currentMonth.value = d.getMonth()
  selectedDay.value = d.getDate()
}
function prevDay() {
  const d = new Date(feedDateObj.value); d.setDate(d.getDate() - 1)
  feedDateObj.value = d; syncCalendarFromFeed(d); loadVideos(); selectDay(d.getDate())
}
function nextDay() {
  const d = new Date(feedDateObj.value); d.setDate(d.getDate() + 1)
  feedDateObj.value = d; syncCalendarFromFeed(d); loadVideos(); selectDay(d.getDate())
}

function isMe(memberId) {
  return auth.loginUser.value?.id != null && auth.loginUser.value.id == memberId
}
function getVideo(userId, mealType) {
  return videoMap.value[`${userId}_${mealType}`] || null
}

const loadTeamDetail = async () => {
  if (!selectedGroup.value?.id) return
  try {
    const res = await axios.get(`/api/teams/${selectedGroup.value.id}`)
    teamMembers.value = res.data.members || []
  } catch (e) {
    teamMembers.value = groupMembers.map(m => ({ id: m.id, nickName: m.name, isMine: m.isMine }))
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
    const map = {}
    groupMembers.forEach(m => {
      Object.entries(m.meals).forEach(([mt, meal]) => {
        if (meal.uploaded) {
          map[`${m.id}_${mt.toUpperCase()}`] = {
            userId: m.id, mealType: mt.toUpperCase(),
            videoUrl: meal.video, description: meal.title
          }
        }
      })
    })
    videoMap.value = map
  }
}

onMounted(async () => {
  loading.value = true
  await loadTeamDetail()
  await loadVideos()
  loading.value = false
  selectDay(selectedDay.value)
})

const uploadModal = ref({ open: false, mealType: '', description: '', file: null })
const uploadFileInput = ref(null)
const videoPreviewUrl = ref(null)
const memoTextRef = ref(null)

watch(videoPreviewUrl, async (url) => {
  if (url) {
    await nextTick()
    setTimeout(() => memoTextRef.value?.focus(), 80)
  }
})

function openUpload(mealType) {
  uploadModal.value = { open: true, mealType, description: '', file: null }
  videoPreviewUrl.value = null
}
function closeUpload() {
  if (videoPreviewUrl.value) { URL.revokeObjectURL(videoPreviewUrl.value); videoPreviewUrl.value = null }
  uploadModal.value.open = false
}
function onUploadFileChange(e) {
  if (!e.target.files.length) return
  const file = e.target.files[0]
  uploadModal.value.file = file
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
  videoPreviewUrl.value = URL.createObjectURL(file)
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
    closeUpload()
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

function getDayEmoji(day) {
  if (currentYear.value > today.getFullYear()) return ''
  if (currentYear.value === today.getFullYear() && currentMonth.value > today.getMonth()) return ''
  if (currentYear.value === today.getFullYear() && currentMonth.value === today.getMonth() && day > today.getDate()) return ''
  const mood = calendarData[day]
  return mood ? emojis[mood] : ''
}
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

const calendarVideoMap = ref({})

function calDateStr(day) {
  const y = currentYear.value
  const m = String(currentMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function selectDay(d) {
  selectedDay.value = d
  // 피드 날짜도 달력 선택일로 동기화
  feedDateObj.value = new Date(currentYear.value, currentMonth.value, d)
  loadVideos()
  if (!selectedGroup.value?.id) return
  try {
    const res = await axios.get(`/api/videos/team/${selectedGroup.value.id}?date=${calDateStr(d)}`)
    const map = {}
    res.data.forEach(v => { map[`${v.userId}_${v.mealType}`] = v })
    calendarVideoMap.value = map
  } catch (e) { console.error('달력 영상 로드 실패:', e) }
}

function getCalVideo(userId, mealType) {
  return calendarVideoMap.value[`${userId}_${mealType}`] || null
}
function memberMeals(memberId) {
  return mealTypes.map(mt => ({ ...mt, video: getCalVideo(memberId, mt.key) })).filter(mt => mt.video)
}
function calPercent(val, total) { return Math.min(100, Math.round((val / total) * 100)) }

const MEAL_DEMO_TIMES = { BREAKFAST: '08:23', LUNCH: '12:45', DINNER: '19:12' }
function videoTime(video) {
  if (!video) return null
  const ts = video.uploadedAt || video.createdAt || video.recordedAt
  if (ts) {
    const d = new Date(ts)
    if (!isNaN(d)) return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  return MEAL_DEMO_TIMES[video.mealType] || null
}

const dayRecord = computed(() => groupDayRecords[selectedDay.value] ?? groupDayRecords.default)

// ── 반응형 (모바일 <768 / 아이패드 768-1199 / 와이드 ≥1200) ──
const isMobile = ref(window.innerWidth < 768)
const isWide = ref(window.innerWidth >= 1200)
const onResize = () => {
  isMobile.value = window.innerWidth < 768
  isWide.value = window.innerWidth >= 1200
}
window.addEventListener('resize', onResize)
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
})

// ── 모바일 스와이프 + 마우스 드래그 ──
const activeMealIdx = ref(0)
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return
  if (dx < 0 && activeMealIdx.value < mealTypes.length - 1) activeMealIdx.value++
  else if (dx > 0 && activeMealIdx.value > 0) activeMealIdx.value--
}

let mouseStartX = 0
const isDragging = ref(false)

function onMouseDown(e) {
  mouseStartX = e.clientX
  isDragging.value = true
}
function onMouseUp(e) {
  if (!isDragging.value) return
  isDragging.value = false
  const dx = e.clientX - mouseStartX
  if (Math.abs(dx) >= 40) {
    if (dx < 0 && activeMealIdx.value < mealTypes.length - 1) activeMealIdx.value++
    else if (dx > 0 && activeMealIdx.value > 0) activeMealIdx.value--
  } else {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    if (relX < rect.width / 2) { if (activeMealIdx.value > 0) activeMealIdx.value-- }
    else { if (activeMealIdx.value < mealTypes.length - 1) activeMealIdx.value++ }
  }
}
</script>

<style scoped>
.screen {
  height: 100vh; height: 100dvh;
  display: flex; flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary, #f7f7f7);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ── 헤더 ── */
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

/* ── MOBILE 스크롤 본문 ── */
.scroll-body {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px;
  padding-bottom: 24px;
}

/* ── DESKTOP 분할 레이아웃 ── */
.desktop-split {
  flex: 1; display: flex; overflow: hidden;
}
.left-panel {
  width: 33%; min-width: 260px; max-width: 380px;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #e5e5e5;
  display: flex; flex-direction: column; gap: 16px;
  padding: 16px 16px 24px;
}
.right-panel {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px;
  padding-bottom: 24px;
}

/* 채팅 버튼 (데스크탑 좌측 패널 하단) */
.chat-btn-desk {
  margin-top: auto;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px;
  background: #000; color: #fff;
  border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
}
.chat-btn-desk:hover { opacity: 0.85; }

/* ── 날짜 네비게이션 ── */
.feed-date-label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 14px; font-weight: 700; color: #555;
  padding: 10px 16px 0;
}
/* 데스크탑: 가운데 정렬 */
.feed-date-label.desk-date {
  justify-content: center;
  gap: 12px;
}
.date-nav-btn {
  background: none; border: none;
  color: #bbb; font-size: 16px; cursor: pointer;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; transition: background 0.15s, color 0.15s;
}
.date-nav-btn:hover { background: #f0f0f0; color: #000; }

.loading-msg { text-align: center; padding: 40px; color: #aaa; font-size: 14px; }
.empty-feed { text-align: center; padding: 40px; color: #aaa; font-size: 14px; }

/* ── 데스크탑 피드 ── */
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

.meal-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.meal-slot { display: flex; flex-direction: column; align-items: center; }

.video-wrap {
  width: 100%; aspect-ratio: 1;
  border-radius: 12px; overflow: hidden; position: relative;
}
.meal-video { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── 영상 내 오버레이 (공통) ── */
.vid-bottom {
  position: absolute; bottom: 8px; left: 8px; right: 8px;
  display: flex; align-items: center; gap: 6px;
}
.vid-tag {
  background: rgba(0,0,0,0.48);
  border-radius: 6px; padding: 4px 9px;
  font-size: 12px; font-weight: 700; color: #fff;
  flex-shrink: 0; white-space: nowrap;
}
.vid-desc {
  font-size: 12px; color: rgba(255,255,255,0.9);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  flex: 1; text-align: right;
}

.video-thumb {
  width: 100%; aspect-ratio: 1; border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; font-size: 18px;
}
.video-thumb.empty { background: #f5f5f5; border: 1.5px dashed #ddd; color: #ccc; }
.video-thumb.upload-slot {
  background: #f5f5f5; border: 1.5px dashed #000;
  color: #000; cursor: pointer; font-size: 16px; font-weight: 600;
  transition: background 0.15s;
}
.video-thumb.upload-slot span { font-size: 10px; font-weight: 600; }
.video-thumb.upload-slot:hover { background: #ebebeb; }

/* ── 모바일 탭 바 ── */
.meal-tab-bar { display: flex; padding: 8px 16px 0; gap: 6px; }
.meal-tab {
  flex: 1; padding: 7px 0;
  border-radius: 20px; background: #f0f0f0;
  border: none; font-size: 13px; font-weight: 600; color: #888;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.meal-tab.active { background: #000; color: #fff; }

/* ── 모바일 피드 ── */
.feed-mobile {
  display: flex; flex-direction: column; gap: 10px;
  padding: 8px 12px; user-select: none;
}
.member-log-mobile {
  background: #fff; border-radius: 16px; padding: 14px;
  border: 1px solid #e5e5e5;
}
.video-wrap-full {
  width: 100%; aspect-ratio: 16/9;
  border-radius: 12px; overflow: hidden; position: relative;
  margin-top: 4px;
}
.meal-video-full { width: 100%; height: 100%; object-fit: cover; display: block; }
.upload-full, .empty-full {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; font-size: 13px; font-weight: 600;
}
.upload-full { background: #f5f5f5; border: 1.5px dashed #000; color: #000; cursor: pointer; }
.upload-full i, .empty-full i { font-size: 22px; }
.empty-full { background: #f5f5f5; border: 1.5px dashed #ddd; color: #bbb; }

/* ── 달력 (공통) ── */
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
.cal-cell { min-height:44px; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:10px; cursor:pointer; gap:2px; transition:background 0.15s; }
.cal-cell.empty { cursor:default; }
.cal-cell:not(.empty):active { background:#f5f5f5; }
.cal-cell.selected { background:#000; }
.cal-cell.selected .cal-num { color:#fff; }
.cal-num { font-size:11px; color:#333; line-height:1; }
.cal-expr { width:18px; height:18px; display:flex; align-items:center; justify-content:center; }
.cal-expr :deep(svg) { width:18px; height:18px; display:block; }

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

.member-summary-list { display:flex; flex-direction:column; gap:10px; }
.summary-title { font-size:12px; font-weight:700; color:#888; padding:4px 0 2px; border-top:1px solid #e5e5e5; margin-top:4px; }
.summary-row { display:flex; align-items:flex-start; gap:10px; background:#fff; border-radius:12px; padding:10px 12px; }
.summary-avatar { width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.summary-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.summary-name { font-size:13px; font-weight:700; color:#000; display:flex; align-items:center; gap:5px; }
.summary-meals { display:flex; flex-direction:column; gap:3px; }
.summary-chip { font-size:12px; color:#444; line-height:1.4; display:flex; align-items:baseline; gap:5px; }
.summary-meal-type { font-size:10px; font-weight:700; background:#f0f0f0; color:#555; padding:1px 6px; border-radius:10px; flex-shrink:0; }
.summary-no-record { font-size:12px; color:#bbb; }

/* ── 영상 중앙 설명 텍스트 ── */
.vid-center-desc {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 24px);
  font-size: 16px; font-weight: 700;
  color: #fff;
  text-align: center;
  pointer-events: none;
  line-height: 1.4;
  word-break: keep-all;
}

/* ── 업로드 모달 ── */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal-box { background:#fff; padding:20px; border-radius:18px; width:100%; max-width:400px; }
.modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.modal-title { margin:0; font-size:16px; font-weight:700; }
.modal-close { background:none; border:none; font-size:16px; color:#888; cursor:pointer; }

/* 영상 미리보기 */
.preview-wrap {
  width: 100%; aspect-ratio: 9/16;
  max-height: 52vh;
  border-radius: 14px; overflow: hidden;
  position: relative; background: #000;
  margin-bottom: 14px;
}
.preview-video { width:100%; height:100%; object-fit:cover; display:block; }

/* 인스타 스타일 직접 타이핑 */
.memo-direct {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 32px);
  background: transparent;
  border: none; outline: none; resize: none;
  font-size: 18px; font-weight: 700; color: #fff;
  text-align: center; line-height: 1.5;
  font-family: inherit;
  caret-color: #fff;
  z-index: 2;
}
.memo-direct::placeholder { color: rgba(255,255,255,0.4); font-weight: 400; }
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
}

.file-drop {
  display:flex; flex-direction: column; align-items:center; justify-content: center;
  gap: 10px;
  border:1.5px dashed #ccc; border-radius:14px; padding:32px 14px;
  cursor:pointer; font-size:13px; color:#888; transition:border-color 0.15s;
  margin-bottom: 14px;
}
.file-drop:hover { border-color:#000; color:#333; }

.modal-actions { display:flex; justify-content:flex-end; gap:8px; }
.btn-cancel { padding:10px 18px; background:#f5f5f5; border:none; border-radius:10px; cursor:pointer; font-size:14px; }
.btn-submit { padding:10px 18px; background:#000; color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:700; }
.btn-submit:disabled { opacity:0.35; cursor:not-allowed; }
</style>
