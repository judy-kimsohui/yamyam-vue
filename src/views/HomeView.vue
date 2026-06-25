<template>
  <div class="home-wrap">
    <div class="grid-bg" />

    <div class="home-body">

      <!-- ── 좌측: 브랜딩 (항상 표시) ── -->
      <div class="panel-left">
        <span class="text-logo">YamYamLog</span>
        <h1 class="hero-slogan">
          Eat,<br />Record,<br />and Share.
        </h1>
        <p class="hero-desc">맛있는 로그를 함께 공유하세요!</p>
        <button
          class="btn-continue btn-hero"
          :class="{ pressed: btnPressed }"
          :style="btnHidden ? 'opacity: 0; pointer-events: none' : 'opacity: 1'"
          @click="handleLetsEat"
          @mousedown="btnPressed = true"
          @touchstart.passive="btnPressed = true"
          @mouseup="btnPressed = false"
          @touchend="btnPressed = false"
          @mouseleave="btnPressed = false"
        >
          <span class="btn-label default-label">Let's Eat!</span>
          <span class="btn-label eat-label">Let's Eat! &nbsp;→</span>
        </button>
        <button v-if="auth.isLoggedIn.value && !showForm" class="btn-logout" @click="auth.logout()">로그아웃</button>
      </div>

      <!-- ── 우측 (데스크탑) ── -->
      <div class="panel-right">
        <Transition name="slide-fade" mode="out-in">

          <!-- 폼 모드 -->
          <div v-if="showForm" class="form-wrap" key="form">
            <div v-if="authMode === 'login'" class="form-unit" key="login">
              <div class="form-header">
                <button class="btn-back" @click="handleBack">← back</button>
                <h2 class="form-title">Sign in</h2>
              </div>
              <div class="field-group">
                <input v-model="loginForm.userId" type="text" placeholder="ID" class="field" />
                <input
                  v-model="loginForm.password" type="password" placeholder="Password" class="field"
                  @keyup.enter="handleLogin"
                />
              </div>
              <button
                class="btn-continue"
                :class="{ pressed: btnPressed }"
                @click="handleLogin"
                @mousedown="btnPressed = true"
                @touchstart.passive="btnPressed = true"
                @mouseup="btnPressed = false"
                @touchend="btnPressed = false"
                @mouseleave="btnPressed = false"
              >
                <span class="btn-label default-label">Continue</span>
                <span class="btn-label eat-label">Let's Eat! &nbsp;→</span>
              </button>
              <button @click="handleDevLogin" class="btn-dev">Sign In to Mock</button>
              <p class="toggle-text">
                New to YamYam?
                <span @click="authMode = 'signup'">Create an account</span>
              </p>
            </div>

            <div v-else-if="authMode === 'signup'" class="form-unit" key="signup">
              <div class="form-header">
                <button class="btn-back" @click="handleBack">← back</button>
                <h2 class="form-title">Create account</h2>
              </div>
              <div class="field-group signup-scroll">
                <input v-model="signupForm.userId"     type="text"     placeholder="아이디 (필수)"     class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.password"   type="password" placeholder="비밀번호 (필수)"   class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.nickName"   type="text"     placeholder="닉네임 (필수)"     class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.age"        type="number"   placeholder="나이"              class="field" @keyup.enter="focusNext" />
                <select v-model="signupForm.gender" class="field field-select">
                  <option value="NONE">성별 (선택)</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
                <input v-model="signupForm.height"     type="number" step="0.1" placeholder="키 (cm)"         class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.weight"     type="number" step="0.1" placeholder="현재 체중 (kg)"   class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.goalWeight" type="number" step="0.1" placeholder="목표 체중 (kg)"   class="field" @keyup.enter="handleSignup" />
              </div>
              <button @click="handleSignup" class="btn-continue">Register</button>
              <p class="toggle-text">
                Already have an account?
                <span @click="authMode = 'login'">Sign in</span>
              </p>
            </div>
          </div>

          <!-- 카드 모드 (초기) -->
          <div v-else class="cards-unit" key="cards">
            <div class="cards-stage" ref="cardsEl">
              <img
                class="food-card card-back"
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop"
                alt="food"
              />
              <img
                class="food-card card-front"
                src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop"
                alt="food"
              />
              <svg v-if="cardDecosReady" class="cards-deco-svg" :viewBox="`-60 -60 ${SW+120} ${SH+120}`">
                <image v-for="d in cardDecos" :key="'cs'+d.id"
                  :href="d.src"
                  :x="d.x - d.size/2" :y="d.y - d.size/2"
                  :width="d.size" :height="d.size"
                  :transform="`rotate(${d.rot}, ${d.x}, ${d.y})`"
                  :style="`animation: deco-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${d.delay}s both`"
                />
                <text v-for="t in cardTextDecos" :key="'ct'+t.id"
                  :x="t.x" :y="t.y" :font-size="t.fs"
                  text-anchor="middle" dominant-baseline="middle"
                  :fill="t.color" font-weight="800"
                  :transform="`rotate(${t.rot}, ${t.x}, ${t.y})`"
                  :style="`animation: deco-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) ${t.delay}s both; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.18))`"
                >{{ t.char }}</text>
              </svg>
            </div>
          </div>

        </Transition>
      </div>

      <!-- ── 모바일 전용 ── -->
      <div class="mobile-pane">
        <Transition name="slide-fade" mode="out-in">

          <!-- 히어로 (초기) -->
          <div v-if="!showForm" class="mobile-hero" key="hero">
            <span class="text-logo">YamYamLog</span>
            <h1 class="hero-slogan">
              Eat,<br />Record,<br />and Share.
            </h1>
            <p class="hero-desc">맛있는 로그를 함께 공유하세요!</p>
            <button
              class="btn-continue btn-hero"
              :class="{ pressed: btnPressed }"
              @click="handleLetsEat"
              @mousedown="btnPressed = true"
              @touchstart.passive="btnPressed = true"
              @mouseup="btnPressed = false"
              @touchend="btnPressed = false"
              @mouseleave="btnPressed = false"
            >
              <span class="btn-label default-label">Let's Eat!</span>
              <span class="btn-label eat-label">Let's Eat! &nbsp;→</span>
            </button>
            <button v-if="auth.isLoggedIn.value" class="btn-logout" @click="auth.logout()">로그아웃</button>
          </div>

          <!-- 폼 (Let's Eat 클릭 후) -->
          <div v-else class="mobile-form" key="mform">
            <div v-if="authMode === 'login'" class="form-unit">
              <div class="form-header">
                <button class="btn-back" @click="handleBack">← back</button>
                <h2 class="form-title">Sign in</h2>
              </div>
              <div class="field-group">
                <input v-model="loginForm.userId" type="text" placeholder="ID" class="field" />
                <input
                  v-model="loginForm.password" type="password" placeholder="Password" class="field"
                  @keyup.enter="handleLogin"
                />
              </div>
              <button
                class="btn-continue"
                :class="{ pressed: btnPressed }"
                @click="handleLogin"
                @mousedown="btnPressed = true"
                @touchstart.passive="btnPressed = true"
                @mouseup="btnPressed = false"
                @touchend="btnPressed = false"
                @mouseleave="btnPressed = false"
              >
                <span class="btn-label default-label">Continue</span>
                <span class="btn-label eat-label">Let's Eat! &nbsp;→</span>
              </button>
              <button @click="handleDevLogin" class="btn-dev">Sign In to Mock</button>
              <p class="toggle-text">
                New to YamYam?
                <span @click="authMode = 'signup'">Create an account</span>
              </p>
            </div>

            <div v-else-if="authMode === 'signup'" class="form-unit">
              <div class="form-header">
                <button class="btn-back" @click="handleBack">← back</button>
                <h2 class="form-title">Create account</h2>
              </div>
              <div class="field-group signup-scroll">
                <input v-model="signupForm.userId"     type="text"     placeholder="아이디 (필수)"     class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.password"   type="password" placeholder="비밀번호 (필수)"   class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.nickName"   type="text"     placeholder="닉네임 (필수)"     class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.age"        type="number"   placeholder="나이"              class="field" @keyup.enter="focusNext" />
                <select v-model="signupForm.gender" class="field field-select">
                  <option value="NONE">성별 (선택)</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
                <input v-model="signupForm.height"     type="number" step="0.1" placeholder="키 (cm)"         class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.weight"     type="number" step="0.1" placeholder="현재 체중 (kg)"   class="field" @keyup.enter="focusNext" />
                <input v-model="signupForm.goalWeight" type="number" step="0.1" placeholder="목표 체중 (kg)"   class="field" @keyup.enter="handleSignup" />
              </div>
              <button @click="handleSignup" class="btn-continue">Register</button>
              <p class="toggle-text">
                Already have an account?
                <span @click="authMode = 'login'">Sign in</span>
              </p>
            </div>
          </div>

        </Transition>
      </div>

    </div>

    <!-- 알림 모달 -->
    <Transition name="modal-pop">
      <div v-if="modal.visible" class="notify-overlay" @click.self="modal.type === 'error' && closeModal()">
        <div class="notify-card" :class="modal.type">
          <div class="notify-icon">
            <span v-if="modal.type === 'error'">✕</span>
            <span v-else-if="modal.type === 'success'">✓</span>
            <span v-else class="notify-spin">◌</span>
          </div>
          <p class="notify-title">{{ modal.title }}</p>
          <p v-if="modal.message" class="notify-msg">{{ modal.message }}</p>
          <button v-if="modal.type === 'error'" class="notify-btn" @click="closeModal">확인</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import axios from "axios";

import bearUrl       from '@/assets/stickers/bear.svg?url'
import heartUrl      from '@/assets/stickers/heart.svg?url'
import coffeeHotUrl  from '@/assets/stickers/coffee-hot.svg?url'
import iceCoffeeUrl  from '@/assets/stickers/ice-coffee.svg?url'
import tulipUrl      from '@/assets/stickers/tulip.svg?url'
import cameraUrl     from '@/assets/stickers/camera.svg?url'
import catSleepUrl   from '@/assets/stickers/cat-sleep.svg?url'
import strawberryUrl from '@/assets/stickers/strawberry.svg?url'
import cloudUrl      from '@/assets/stickers/cloud.svg?url'
import dogUrl        from '@/assets/stickers/dog.svg?url'
import envelopeUrl   from '@/assets/stickers/envelope.svg?url'
import musicUrl      from '@/assets/stickers/music.svg?url'
import flowerPotUrl  from '@/assets/stickers/flower-pot.svg?url'
import noteUrl       from '@/assets/stickers/note.svg?url'

const STICKERS = [
  bearUrl, heartUrl, coffeeHotUrl, iceCoffeeUrl, tulipUrl,
  cameraUrl, catSleepUrl, strawberryUrl, cloudUrl,
  dogUrl, envelopeUrl, musicUrl, flowerPotUrl, noteUrl,
]
const DECO_SET = [
  { char: '✦', colors: ['#fff', '#fff9c4', '#ffd6e7'] },
  { char: '♡', colors: ['#ffb3c6', '#ff8fab', '#fff'] },
  { char: '✧', colors: ['#fff', '#e0f0ff', '#ffd6e7'] },
  { char: '⋆', colors: ['#fff', '#fff9c4'] },
  { char: '✿', colors: ['#ffcfe2', '#ffd6a5', '#fff'] },
  { char: '✰', colors: ['#fff9c4', '#fff', '#ffd6e7'] },
  { char: '❀', colors: ['#ffcfe2', '#fff'] },
  { char: '˚', colors: ['#fff', '#e0f0ff'] },
]

const navigation       = inject("navigation")
const auth             = inject("auth")
const pendingInviteCode = inject("inviteCode")

const authMode   = ref("login")
const btnPressed = ref(false)
const showForm   = ref(false)
const btnHidden  = ref(false)   // 버튼 숨김 상태 (전환과 동기화)
const modal      = ref({ visible: false, type: "error", title: "", message: "" })

// 카드 스티커
const cardsEl        = ref(null)
const cardDecosReady = ref(false)
const cardDecos      = ref([])
const cardTextDecos  = ref([])
const SW = 340, SH = 380

function rand(a, b) { return a + Math.random() * (b - a) }
function pick(arr)  { return arr[Math.floor(Math.random() * arr.length)] }

function buildCardDecos() {
  const positions = [
    [rand(-40, 10),     rand(-40, 10)],
    [rand(SW-10, SW+40), rand(-40, 10)],
    [rand(-40, 10),     rand(SH-10, SH+40)],
    [rand(SW-10, SW+40), rand(SH-10, SH+40)],
    [rand(SW*0.3, SW*0.7), rand(-50, -10)],
    [rand(SW*0.3, SW*0.7), rand(SH+10, SH+50)],
    [rand(-50, -10),    rand(SH*0.3, SH*0.7)],
    [rand(SW+10, SW+50), rand(SH*0.3, SH*0.7)],
  ]
  const shuffled = [...STICKERS].sort(() => Math.random() - 0.5)
  const count = 3 + Math.floor(Math.random() * 3)
  cardDecos.value = positions
    .sort(() => Math.random() - 0.5).slice(0, count)
    .map((pos, i) => ({
      id: i, x: pos[0], y: pos[1],
      src: shuffled[i % shuffled.length],
      size: rand(30, 46), rot: rand(-35, 35),
      delay: 0.3 + i * 0.1,
    }))

  const tpos = [
    [rand(-30, 10),      rand(SH*0.1, SH*0.4)],
    [rand(SW+10, SW+40), rand(SH*0.2, SH*0.5)],
    [rand(SW*0.2, SW*0.5), rand(-40, -10)],
    [rand(SW*0.5, SW*0.8), rand(SH+10, SH+40)],
    [rand(-30, 10),      rand(SH*0.6, SH*0.9)],
    [rand(SW+10, SW+40), rand(SH*0.6, SH*0.9)],
  ]
  const tc = 4 + Math.floor(Math.random() * 3)
  cardTextDecos.value = tpos
    .sort(() => Math.random() - 0.5).slice(0, tc)
    .map((pos, i) => {
      const info = pick(DECO_SET)
      return {
        id: i, x: pos[0], y: pos[1],
        char: info.char, color: pick(info.colors),
        fs: rand(8, 16), rot: rand(-45, 45),
        delay: 0.6 + i * 0.08,
      }
    })
  cardDecosReady.value = true
}

onMounted(() => { buildCardDecos() })

function handleLetsEat() {
  if (auth.isLoggedIn.value) {
    navigation.goTo(pendingInviteCode?.value ? "groups" : "calendar")
  } else {
    btnHidden.value = true      // 버튼 즉시 숨김
    showForm.value  = true      // 우측 전환 시작
  }
}

function focusNext(event) {
  const form = event.target.closest('.field-group')
  if (!form) return
  const fields = [...form.querySelectorAll('input, select')]
  const idx = fields.indexOf(event.target)
  if (idx >= 0 && idx < fields.length - 1) {
    const next = fields[idx + 1]
    next.focus()
    next.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

function handleBack() {
  showForm.value = false        // 우측 전환 시작 (leave 60ms)
  setTimeout(() => {            // leave 끝난 뒤 버튼 등장
    btnHidden.value = false
  }, 760)
}

function showModal(type, title, message = "") {
  modal.value = { visible: true, type, title, message }
}
function closeModal() {
  modal.value.visible = false
}

const loginForm = ref({ userId: "", password: "" })
const signupForm = ref({
  userId: "", password: "", nickName: "",
  age: 0, gender: "NONE", height: "", weight: "", goalWeight: "",
})

const handleLogin = async () => {
  try {
    const loginRes = await axios.post("/api/users/login", loginForm.value)
    const { token } = loginRes.data
    const profileRes = await axios.get("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const p = profileRes.data
    auth.loginSuccess(
      { id: p.id, nickName: p.nick_name || p.nickName || loginForm.value.userId, userId: loginForm.value.userId },
      token,
    )
    navigation.goTo(pendingInviteCode?.value ? "groups" : "calendar")
  } catch (error) {
    showModal("error", "로그인 실패", error.response?.data || "아이디 또는 비밀번호를 확인해주세요.")
  }
}

const handleDevLogin = async () => {
  try {
    const loginRes = await axios.post("/api/users/login", { userId: "ssafy1", password: "ssafy1" })
    const { token } = loginRes.data
    const profileRes = await axios.get("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const p = profileRes.data
    auth.loginSuccess(
      { id: p.id, nickName: p.nick_name || p.nickName || "ssafy1", userId: "ssafy1" },
      token,
    )
  } catch {
    auth.loginSuccess({ id: 1, nickName: "ssafy1", userId: "ssafy1" }, "dummy_token")
  }
  navigation.goTo(pendingInviteCode?.value ? "groups" : "calendar")
}

const handleSignup = async () => {
  if (!signupForm.value.userId.trim())   return showModal("error", "아이디를 입력해주세요")
  if (!signupForm.value.password.trim()) return showModal("error", "비밀번호를 입력해주세요")
  if (!signupForm.value.nickName.trim()) return showModal("error", "닉네임을 입력해주세요")
  try {
    const formData = new FormData()
    Object.keys(signupForm.value).forEach(k => formData.append(k, signupForm.value[k]))
    await axios.post("/api/users/signup", formData, { headers: { "Content-Type": "multipart/form-data" } })
    showModal("loading", "가입 완료!", "잠시 후 로그인합니다...")
    await new Promise(r => setTimeout(r, 1500))
    const loginRes = await axios.post("/api/users/login", {
      userId: signupForm.value.userId, password: signupForm.value.password,
    })
    const { token } = loginRes.data
    const profileRes = await axios.get("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const p = profileRes.data
    closeModal()
    auth.loginSuccess(
      { id: p.id, nickName: p.nick_name || p.nickName || signupForm.value.userId, userId: signupForm.value.userId },
      token,
    )
    navigation.goTo(pendingInviteCode?.value ? "groups" : "calendar")
  } catch (error) {
    const msg = error.response?.data || "회원가입에 실패했습니다."
    showModal(
      "error",
      msg.includes("아이디") || msg.includes("중복") || msg.includes("존재") ? "이미 사용 중인 아이디예요" : "회원가입 실패",
      msg.includes("아이디") || msg.includes("중복") ? "다른 아이디를 입력해주세요." : msg,
    )
  }
}
</script>

<style scoped>
/* ── 기반 ── */
.home-wrap {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fdfaf7;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.02em;
  overflow: hidden;
}
.grid-bg {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(168,197,160,0.18) 1px, transparent 1px),
    linear-gradient(to right, rgba(168,197,160,0.18) 1px, transparent 1px);
  background-size: 44px 44px;
  pointer-events: none;
}
.home-wrap::after {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, #fdfaf7 100%);
  pointer-events: none;
}

/* ── 레이아웃 ── */
.home-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 900px;
  padding: 0 40px;
}

/* ── 좌측 패널 ── */
.panel-left {
  flex: 0 0 46%;
  display: flex;
  flex-direction: column;
  padding-right: 60px;
  animation: fade-up 0.65s cubic-bezier(0.16,1,0.3,1) both;
}
.text-logo {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #7ab870;
  user-select: none;
  margin-bottom: 40px;
}
.hero-slogan {
  font-size: clamp(38px, 4vw, 56px);
  font-weight: 800;
  line-height: 1.07;
  letter-spacing: -0.04em;
  margin: 0 0 18px;
  background: linear-gradient(135deg, #ffb6c1 0%, #ffd6a5 40%, #caffbf 70%, #a0c4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc {
  font-size: 15px;
  color: #aaa;
  margin: 0 0 32px;
  line-height: 1.6;
}

/* ── 우측 패널 ── */
.panel-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
}

/* 카드 */
.cards-unit {
  animation: fade-left 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both;
}
.cards-stage {
  position: relative;
  width: 340px;
  height: 380px;
}
.food-card {
  position: absolute;
  width: 240px;
  height: 310px;
  border-radius: 20px;
  object-fit: cover;
  box-shadow: 0 20px 56px rgba(0,0,0,0.13);
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s;
}
.card-back  { transform: rotate(-7deg) translate(70px, 24px); z-index: 1; }
.card-front { transform: rotate(5deg)  translate(-20px, 8px); z-index: 2; }
.card-back:hover  { transform: rotate(-10deg) translate(70px, 14px); box-shadow: 0 28px 72px rgba(0,0,0,0.18); }
.card-front:hover { transform: rotate(8deg)   translate(-20px, 0px); box-shadow: 0 28px 72px rgba(0,0,0,0.18); }

.cards-deco-svg {
  position: absolute;
  inset: -60px;
  width: calc(100% + 120px);
  height: calc(100% + 120px);
  pointer-events: none;
  overflow: visible;
  z-index: 10;
}

/* 폼 */
.form-wrap {
  width: 100%;
  max-width: 300px;
  animation: fade-left 0.65s cubic-bezier(0.16,1,0.3,1) both;
}
.form-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 28px;
}
.btn-back {
  background: none;
  border: none;
  color: #bbb;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: color 0.15s;
}
.btn-back:hover { color: #666; }
.form-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin: 0;
  letter-spacing: -0.03em;
}
.field-group { display: flex; flex-direction: column; margin-bottom: 24px; }
.field {
  width: 100%;
  padding: 13px 0;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  font-size: 15px;
  outline: none;
  background: transparent;
  box-sizing: border-box;
  color: #111;
  border-radius: 0;
  transition: border-color 0.2s;
}
.field:focus { border-bottom-color: #7ab870; }
.field-select { color: #999; cursor: pointer; }
.signup-scroll { max-height: 270px; overflow-y: auto; padding-right: 4px; }
.signup-scroll::-webkit-scrollbar { display: none; }

/* ── 버튼 ── */
.btn-continue {
  width: 100%;
  padding: 13px;
  background: #f6aeba;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.btn-continue:hover  { background: #e8909e; }
.btn-continue.pressed { transform: scale(0.97); background: #e8909e; }

.btn-hero { width: auto; padding: 13px 36px; transition: opacity 0.08s ease, transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.2s; }

.btn-label { display: block; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s; }
.default-label { transform: translateY(0) scale(1); opacity: 1; }
.btn-continue:hover .default-label,
.btn-continue.pressed .default-label { transform: translateY(-120%) scale(0.6); opacity: 0; }
.eat-label {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  transform: translateY(120%) scale(0.5); opacity: 0; font-weight: 700;
}
.btn-continue:hover .eat-label,
.btn-continue.pressed .eat-label {
  transform: translateY(0) scale(1); opacity: 1;
  animation: spring-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
@keyframes spring-pop {
  0%   { transform: translateY(30%) scale(0.5); opacity: 0; }
  50%  { transform: translateY(-8%) scale(1.12); opacity: 1; }
  75%  { transform: translateY(3%) scale(0.96); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

.btn-dev {
  width: 100%; margin-top: 9px; padding: 10px;
  background: transparent; color: #22c55e;
  border: 1px dashed #22c55e; border-radius: 8px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.btn-dev:hover { background: #f0fdf4; }

.btn-logout {
  margin-top: 20px; background: none; border: none;
  color: #ccc; font-size: 12px; cursor: pointer; padding: 0;
  transition: color 0.15s; align-self: flex-start;
}
.btn-logout:hover { color: #e53e3e; }

.toggle-text { margin-top: 20px; font-size: 13px; color: #aaa; }
.toggle-text span {
  color: #111; font-weight: 500; cursor: pointer;
  margin-left: 3px; text-decoration: underline; text-underline-offset: 3px;
}

/* 모바일 전용 패널: 데스크탑에서 숨김 */
.mobile-pane { display: none; }

/* ── 전환 ── */
.slide-fade-enter-active { transition: opacity 0.08s ease; }
.slide-fade-leave-active { transition: opacity 0.06s ease; }
.slide-fade-enter-from  { opacity: 0; }
.slide-fade-leave-to    { opacity: 0; }

@keyframes deco-pop {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fade-left {
  from { opacity: 0; transform: translateX(28px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── 모바일 ── */
@media (max-width: 680px) {
  .home-wrap {
    height: auto;
    min-height: 100dvh;
    align-items: center;
    overflow-y: auto;
  }
  .home-body {
    flex-direction: column;
    max-width: 100%;
    padding: 0;
  }

  /* 데스크탑 패널 숨김 */
  .panel-left,
  .panel-right { display: none; }

  /* 모바일 패널 표시 */
  .mobile-pane {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100dvh;
    padding: 64px 36px 72px;
    box-sizing: border-box;
    justify-content: center;
  }

  .mobile-hero {
    display: flex;
    flex-direction: column;
    animation: fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }
  .mobile-hero .text-logo { margin-bottom: 36px; }
  .mobile-hero .hero-slogan { font-size: 40px; }
  .mobile-hero .hero-desc { margin-bottom: 36px; }
  .mobile-hero .btn-hero { width: 100%; padding: 15px; font-size: 16px; }
  .mobile-hero .btn-logout { margin-top: 20px; }

  .mobile-form {
    animation: fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }

  .field { font-size: 16px; padding: 14px 0; }
  .signup-scroll { max-height: none; }
  .btn-continue { font-size: 16px; padding: 15px; }
}

/* ── 알림 모달 ── */
.notify-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; backdrop-filter: blur(3px);
}
.notify-card {
  background: #fff; border-radius: 22px;
  padding: 36px 32px 28px;
  width: min(300px, calc(100vw - 48px));
  text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.notify-icon {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 700; margin-bottom: 4px;
}
.notify-card.error   .notify-icon { background: #fff0f0; color: #e53e3e; }
.notify-card.success .notify-icon { background: #f0fff4; color: #38a169; }
.notify-card.loading .notify-icon { background: #fff5f7; color: #e8909e; }
.notify-title { font-size: 17px; font-weight: 700; color: #111; margin: 0; letter-spacing: -0.02em; }
.notify-msg   { font-size: 13px; color: #888; margin: 0; line-height: 1.5; }
.notify-btn {
  margin-top: 12px; width: 100%; padding: 12px;
  border: none; border-radius: 10px;
  background: #f6aeba; color: #fff;
  font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.15s;
}
.notify-btn:hover { background: #e8909e; }
.notify-spin { display: inline-block; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.modal-pop-enter-active { animation: modal-in 0.28s cubic-bezier(0.34,1.56,0.64,1); }
.modal-pop-leave-active { animation: modal-in 0.18s cubic-bezier(0.34,1.56,0.64,1) reverse; }
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
