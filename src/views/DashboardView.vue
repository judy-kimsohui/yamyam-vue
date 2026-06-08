<template>
  <div class="dashboard">
    <!-- ── 헤더 ── -->
    <header class="dash-header">
      <span class="dash-logo">YamYam</span>
      <nav class="dash-nav">
        <button
          class="nav-pill"
          :class="{ active: subView === 'ai-calendar' }"
          @click="subView = 'ai-calendar'"
        >AI 분석</button>
        <button
          class="nav-pill"
          :class="{ active: subView === 'mypage' }"
          @click="subView = 'mypage'"
        >마이페이지</button>
        <button class="nav-pill logout" @click="auth.logout()">로그아웃</button>
      </nav>
    </header>

    <!-- ── 그룹 메인 뷰 ── -->
    <main v-if="subView === 'groups'" class="dash-body form-fade">
      <!-- 얌얌 로그 업로드 배너 버튼 -->
      <button class="upload-banner" @click="isUploadModalOpen = true">
        <span class="upload-icon">🎥</span>
        <div class="upload-text">
          <strong>얌얌 로그 업로드</strong>
          <span>오늘 식단을 촬영해서 공유하세요</span>
        </div>
        <span class="upload-arrow">→</span>
      </button>

      <!-- 그룹 목록 -->
      <div class="section-row">
        <span class="section-title">참여 중인 그룹</span>
        <button class="icon-btn-round" @click="isCreateModalOpen = true" title="그룹 만들기">+</button>
      </div>

      <div v-if="groups.length === 0" class="empty-groups">
        <p>아직 참여 중인 그룹이 없습니다.</p>
        <button class="btn-outline" @click="isCreateModalOpen = true">그룹 만들기</button>
      </div>

      <div class="group-list">
        <div
          v-for="group in groups"
          :key="group.id"
          class="group-card"
          @click="openGroup(group)"
        >
          <div class="group-icon">👥</div>
          <div class="group-info">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-members">{{ group.members }}명 참여중</div>
          </div>
          <button class="share-btn" @click.stop="copyInviteCode(group)">공유하기</button>
        </div>
      </div>
    </main>

    <!-- ── 마이페이지 뷰 ── -->
    <main v-else-if="subView === 'mypage'" class="dash-body form-fade">
      <button class="back-link" @click="subView = 'groups'">← 그룹으로 돌아가기</button>
      <h2 class="sub-title">내 프로필</h2>
      <DashboardUserProfile
        :profile="userProfileData"
        @update-weight="handleWeightUpdateBackend"
      />
    </main>

    <!-- ── AI 분석 캘린더 뷰 ── -->
    <main v-else-if="subView === 'ai-calendar'" class="dash-body form-fade">
      <button class="back-link" @click="subView = 'groups'">← 그룹으로 돌아가기</button>
      <h2 class="sub-title">AI 분석 캘린더</h2>

      <div class="calendar-card">
        <div class="cal-header">
          <button class="cal-arrow" @click="prevMonth"><</button>
          <span class="cal-month-label">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth">></button>
        </div>
        <div class="cal-weekdays">
          <span v-for="d in ['일','월','화','수','목','금','토']" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{
              empty: !cell,
              selected: cell === selectedDay,
              today: cell === todayDate && currentMonth === todayMonth && currentYear === todayYear
            }"
            @click="cell && (selectedDay = cell)"
          >
            <template v-if="cell">
              <span class="cal-emoji">{{ getDayEmoji(cell) }}</span>
              <span class="cal-num">{{ cell }}</span>
            </template>
          </div>
        </div>
      </div>

      <div class="analysis-card">
        <div class="analysis-header">
          <span class="ai-badge">AI 분석</span>
          <span class="analysis-day">{{ currentMonth + 1 }}월 {{ selectedDay }}일</span>
          <span class="analysis-emoji">{{ getDayEmoji(selectedDay) || '—' }}</span>
        </div>
        <p class="analysis-main">{{ moodText }}</p>
        <p class="analysis-sub">단백질 섭취가 목표의 87%를 달성했으며 칼로리 균형이 잘 맞춰졌어요.</p>
        <div class="stats-row">
          <div class="stat"><div class="stat-val">{{ dayStats.calories }}</div><div class="stat-lbl">칼로리</div></div>
          <div class="stat"><div class="stat-val">{{ dayStats.protein }}g</div><div class="stat-lbl">단백질</div></div>
          <div class="stat"><div class="stat-val">{{ dayStats.carbs }}g</div><div class="stat-lbl">탄수화물</div></div>
        </div>
      </div>
    </main>

    <!-- ── 동영상 업로드 모달 ── -->
    <VideoUploadModal
      v-if="isUploadModalOpen"
      :teams="groups"
      @close="isUploadModalOpen = false"
      @upload="onVideoUploadSubmit"
    />

    <!-- ── 그룹 생성 모달 ── -->
    <div v-if="isCreateModalOpen" class="modal-overlay" @click.self="isCreateModalOpen = false">
      <div class="modal-box">
        <h3 class="modal-title">새로운 그룹 만들기</h3>
        <div class="form-group">
          <label>그룹 이름</label>
          <input v-model="newGroupName" placeholder="예: 다이어트 챌린지" class="form-input" maxlength="20" />
        </div>
        <div class="form-group">
          <label>최대 인원</label>
          <select v-model="newMemberCount" class="form-input">
            <option value="">인원수 선택</option>
            <option v-for="n in [2,3,4,5,6,7,8,9,10,15,20]" :key="n" :value="String(n)">{{ n }}명</option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="isCreateModalOpen = false" class="btn-cancel">취소</button>
          <button @click="handleCreateGroup" class="btn-submit">생성하기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import axios from 'axios'
import { emojis, calendarData } from '../data/mockData.js'
import { useStore } from '../composables/useStore.js'
import DashboardUserProfile from '@/components/DashboardUserProfile.vue'
import VideoUploadModal from '@/components/VideoUploadModal.vue'

const { goTo } = inject('navigation')
const auth = inject('auth')
const { groups, selectedGroup } = useStore()

const subView = ref('groups') // 'groups' | 'mypage' | 'ai-calendar'
const isUploadModalOpen = ref(false)
const isCreateModalOpen = ref(false)
const newGroupName = ref('')
const newMemberCount = ref('')

const userProfileData = ref({
  id: null, user_id: '', nickName: '', nick_name: '', profileImg: '', profile_img: '',
  age: 0, gender: 'NONE', height: 0, weight: 0, goalWeight: 0, goal_weight: 0,
  userGoal: '', user_goal: '',
})

// ── API 통신 ──

const fetchUserProfile = async () => {
  try {
    const res = await axios.get('/api/users/profile')
    if (res.data) userProfileData.value = res.data
  } catch (e) {
    console.error('프로필 로드 실패:', e)
  }
}

const fetchMyTeams = async () => {
  try {
    const res = await axios.get('/api/teams/my')
    groups.value = res.data
  } catch (e) {
    console.error('그룹 목록 로드 실패:', e)
  }
}

const handleWeightUpdateBackend = async (newWeight) => {
  try {
    await axios.post('/api/users/weight-history', { weight: newWeight })
    userProfileData.value.weight = newWeight
    alert(`오늘의 몸무게(${newWeight}kg)가 기록되었습니다.`)
  } catch (e) {
    alert('체중 기록 실패: ' + (e.response?.data || '서버 오류'))
  }
}

const handleCreateGroup = async () => {
  const name = newGroupName.value.trim()
  if (!name) return
  try {
    await axios.post('/api/teams', { teamName: name, capacity: parseInt(newMemberCount.value) || 10 })
    await fetchMyTeams()
    isCreateModalOpen.value = false
    newGroupName.value = ''
    newMemberCount.value = ''
  } catch (e) {
    alert('그룹 생성 오류: ' + (e.response?.data || '서버 오류'))
  }
}

const onVideoUploadSubmit = async ({ teamIds, mealType, mealDate, description, file }) => {
  try {
    await Promise.all(teamIds.map(teamId => {
      const formData = new FormData()
      formData.append('teamId', teamId)
      formData.append('mealType', mealType)
      formData.append('mealDate', mealDate)
      if (description) formData.append('description', description)
      formData.append('videoFile', file)
      return axios.post('/api/videos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }))
    const label = teamIds.length > 1 ? `${teamIds.length}개 팀에 ` : ''
    alert(`얌얌 로그가 ${label}업로드되었습니다!`)
    isUploadModalOpen.value = false
  } catch (e) {
    alert('업로드 실패: ' + (e.response?.data || '서버 오류'))
  }
}

const copyInviteCode = (group) => {
  alert(`그룹 "${group.name}" 공유 링크를 복사했습니다.`)
}

function openGroup(group) {
  selectedGroup.value = group
  goTo('group-detail')
}

onMounted(() => {
  fetchUserProfile()
  fetchMyTeams()
})

// ── 캘린더 로직 ──
const today = new Date()
const todayDate = today.getDate()
const todayMonth = today.getMonth()
const todayYear = today.getFullYear()

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

function getDayEmoji(day) {
  const mood = calendarData[day]
  return mood ? emojis[mood] : ''
}

const moodText = computed(() => {
  const mood = calendarData[selectedDay.value]
  if (!mood) return '이 날은 기록이 없어요.'
  if (mood === 'great' || mood === 'excited') return '컨디션이 최고였던 하루! 에너지가 넘쳤네요.'
  if (mood === 'good' || mood === 'happy') return '좋은 하루를 보냈어요. 꾸준히 유지하세요!'
  if (mood === 'tired') return '피곤했지만 식단을 지켜냈어요. 대단해요!'
  if (mood === 'stressed') return '스트레스받은 하루지만 건강하게 먹었어요.'
  if (mood === 'bad' || mood === 'terrible') return '힘든 하루였지만, 내일은 더 좋아질 거예요.'
  return '평범하게 지낸 하루였어요.'
})

const dayStats = computed(() => {
  const base = ((selectedDay.value * 31) % 400) + 1400
  return { calories: base, protein: Math.round(base * 0.08), carbs: Math.round(base * 0.085) }
})
</script>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: -0.02em;
  overflow: hidden;
}

/* ── 헤더 ── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}
.dash-logo {
  font-size: 20px;
  font-weight: 800;
  color: #000;
  letter-spacing: -0.04em;
}
.dash-nav {
  display: flex;
  gap: 8px;
  align-items: center;
}
.nav-pill {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid #e5e5e5;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}
.nav-pill:hover { border-color: #000; color: #000; }
.nav-pill.active { background: #000; color: #fff; border-color: #000; }
.nav-pill.logout { color: #999; border-color: transparent; }
.nav-pill.logout:hover { color: #e53e3e; border-color: #e53e3e; }

/* ── 바디 ── */
.dash-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px 40px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* ── 업로드 배너 ── */
.upload-banner {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 18px 22px;
  cursor: pointer;
  margin-bottom: 28px;
  transition: opacity 0.15s;
  text-align: left;
}
.upload-banner:hover { opacity: 0.88; }
.upload-icon { font-size: 28px; flex-shrink: 0; }
.upload-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.upload-text strong { font-size: 16px; font-weight: 700; }
.upload-text span { font-size: 12px; color: rgba(255,255,255,0.7); }
.upload-arrow { font-size: 18px; color: rgba(255,255,255,0.6); }

/* ── 섹션 헤더 ── */
.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.icon-btn-round {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  border: none;
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  line-height: 1;
}

/* ── 그룹 리스트 ── */
.group-list { display: flex; flex-direction: column; gap: 10px; }
.group-card {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.group-card:hover { background: #fafafa; }
.group-icon { font-size: 22px; }
.group-info { flex: 1; }
.group-name { font-size: 15px; font-weight: 600; color: #000; }
.group-members { font-size: 12px; color: #888; margin-top: 2px; }
.share-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
}
.share-btn:hover { background: #ebebeb; }

.empty-groups {
  text-align: center;
  padding: 40px 0;
  color: #888;
}
.btn-outline {
  margin-top: 12px;
  padding: 10px 20px;
  border: 1px solid #000;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* ── 서브뷰 공통 ── */
.back-link {
  background: none; border: none;
  font-size: 13px; color: #888;
  cursor: pointer; padding: 0;
  margin-bottom: 16px;
  display: block;
}
.back-link:hover { color: #000; }
.sub-title {
  font-size: 20px; font-weight: 700;
  margin: 0 0 20px 0;
  color: #000;
}

/* ── 캘린더 ── */
.calendar-card {
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
}
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.cal-month-label { font-size: 16px; font-weight: 700; color: #000; }
.cal-arrow {
  background: none; border: none;
  font-size: 16px; color: #888;
  cursor: pointer; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.cal-arrow:hover { color: #000; }
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7,1fr);
  margin-bottom: 6px;
}
.cal-weekdays span {
  text-align: center;
  font-size: 11px; font-weight: 600; color: #aaa;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7,1fr);
  gap: 4px;
}
.cal-cell {
  aspect-ratio: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  gap: 1px;
  transition: background 0.15s;
}
.cal-cell.empty { cursor: default; }
.cal-cell:not(.empty):active { background: #f5f5f5; }
.cal-cell.selected { background: #000; }
.cal-cell.selected .cal-num { color: #fff; }
.cal-cell.today:not(.selected) .cal-num { color: #000; font-weight: 800; }
.cal-emoji { font-size: 13px; line-height: 1; }
.cal-num { font-size: 10px; color: #555; line-height: 1; }

/* ── AI 분석 카드 ── */
.analysis-card {
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  padding: 18px;
}
.analysis-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
}
.ai-badge {
  background: #000; color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 3px 8px; border-radius: 20px;
}
.analysis-day { flex: 1; font-size: 14px; font-weight: 700; color: #000; }
.analysis-emoji { font-size: 26px; }
.analysis-main { font-size: 14px; font-weight: 600; color: #000; margin: 0 0 6px 0; }
.analysis-sub { font-size: 12px; color: #888; margin: 0 0 16px 0; line-height: 1.5; }
.stats-row { display: flex; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; }
.stat { flex: 1; text-align: center; padding: 10px 0; border-right: 1px solid #e5e5e5; }
.stat:last-child { border-right: none; }
.stat-val { font-size: 15px; font-weight: 700; color: #000; }
.stat-lbl { font-size: 10px; color: #888; margin-top: 2px; }

/* ── 모달 ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff; padding: 24px;
  border-radius: 12px; width: 100%; max-width: 360px;
}
.modal-title { margin: 0 0 20px 0; font-size: 16px; font-weight: 700; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-group label { font-size: 12px; color: #666; font-weight: 600; }
.form-input {
  width: 100%; padding: 10px 12px;
  border: 1px solid #ccc; border-radius: 8px;
  font-size: 14px; outline: none; box-sizing: border-box;
}
.form-input:focus { border-color: #000; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
.btn-cancel { padding: 8px 14px; background: #eee; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-submit { padding: 8px 14px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }

/* ── 트랜지션 ── */
.form-fade { animation: fadeIn 0.3s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
