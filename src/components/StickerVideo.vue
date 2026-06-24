<template>
  <div class="sk-root" :style="rootStyle">
    <!-- 영상 카드 -->
    <div class="sk-card" ref="cardEl">
      <video v-lazy-video v-bind="$attrs" class="sk-video" />
    </div>

    <!-- 스티커 외곽선 SVG (카드 밖으로 삐져나옴) -->
    <svg v-if="ready" class="sk-svg"
         :viewBox="`0 0 ${vw} ${vh}`"
         overflow="visible"
         style="pointer-events:none">
      <!-- 두꺼운 흰 외곽 (스티커 느낌) -->
      <path :d="border"
            stroke="white" :stroke-width="sw"
            fill="none"
            stroke-linejoin="round" stroke-linecap="round" />
      <!-- 얇은 회색 연필선 (그려지는 애니메이션) -->
      <path :d="sketch"
            stroke="rgba(90,90,90,0.35)" stroke-width="1.4"
            fill="none"
            stroke-linejoin="round" stroke-linecap="round"
            :stroke-dasharray="pLen" :stroke-dashoffset="dashOff"
            class="sk-draw" />
    </svg>

    <!-- 낙서 데코 -->
    <span v-for="d in decos" :key="d.id" class="sk-deco" :style="d.style">{{ d.char }}</span>

    <!-- 식사 타입 라벨 (하단 캡션) -->
    <span v-if="label" class="sk-label">{{ label }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  label: { type: String, default: '' },
})

// 데코 문자 세트 (손그림 느낌)
const CHARS = ['✦', '✧', '♡', '✿', '◡◡', '˘ᵕ˘', '〰', '✰', '*', '˙˙']

const cardEl = ref(null)
const ready  = ref(false)

// SVG 좌표계: 카드 외부 여백 PAD 포함
const PAD = 22          // 카드 밖으로 나오는 픽셀
const vw  = ref(0)
const vh  = ref(0)
const sw  = ref(26)     // 흰 stroke-width (픽셀)
const border  = ref('')
const sketch  = ref('')
const pLen    = ref(900)
const dashOff = ref(900)
const decos   = ref([])

// 랜덤 기울기 (±3.5°, 약간 더 과감하게)
const rot = (Math.random() - 0.5) * 7
const rootStyle = {
  '--rot': `${rot}deg`,
  '--shadow-rot': `${-rot * 0.5}deg`,
}

function rand(a, b) { return a + Math.random() * (b - a) }

// 울퉁불퉁한 경계선 생성
// - path가 카드 경계(PAD,PAD → W+PAD,H+PAD)를 따라가되 AMP만큼 흔들림
function makeWobble(W, H, amp) {
  const STEPS = 24
  const pts = []
  const p = (x, y) => pts.push([
    +(x + rand(-amp, amp)).toFixed(1),
    +(y + rand(-amp, amp)).toFixed(1),
  ])
  const x0 = PAD, y0 = PAD, x1 = W + PAD, y1 = H + PAD

  for (let i = 0; i <= STEPS; i++) p(x0 + i * (x1 - x0) / STEPS, y0)  // 위
  for (let i = 1; i <= STEPS; i++) p(x1, y0 + i * (y1 - y0) / STEPS)  // 오른쪽
  for (let i = STEPS - 1; i >= 0; i--) p(x0 + i * (x1 - x0) / STEPS, y1)  // 아래
  for (let i = STEPS - 1; i >= 1; i--) p(x0, y0 + i * (y1 - y0) / STEPS)  // 왼쪽

  return 'M ' + pts.map(([x, y]) => `${x},${y}`).join(' L ') + ' Z'
}

// 데코 배치: 모서리 주변, 바깥쪽에 살짝 겹침
function makeDecos(W, H) {
  const count = 2 + Math.floor(Math.random() * 2)
  const all = [
    // 좌상단 근처
    { top: `${rand(-20, -4)}px`,   left:  `${rand(-8, 16)}px`  },
    // 우상단 근처
    { top: `${rand(-20, -4)}px`,   right: `${rand(-8, 16)}px`  },
    // 좌하단 근처
    { bottom: `${rand(-20, -4)}px`, left:  `${rand(-8, 16)}px` },
    // 우하단 근처
    { bottom: `${rand(-20, -4)}px`, right: `${rand(-8, 16)}px` },
    // 왼쪽 중간
    { top: `${rand(20, 60)}%`, left: `${rand(-22, -6)}px` },
    // 오른쪽 중간
    { top: `${rand(20, 60)}%`, right: `${rand(-22, -6)}px` },
  ].sort(() => Math.random() - 0.5).slice(0, count)

  return all.map((pos, i) => ({
    id: i,
    char: CHARS[Math.floor(Math.random() * CHARS.length)],
    style: {
      ...pos,
      fontSize: `${rand(11, 18)}px`,
      transform: `rotate(${rand(-35, 35)}deg)`,
      opacity: rand(0.7, 1),
    },
  }))
}

onMounted(() => {
  const { width: W, height: H } = cardEl.value.getBoundingClientRect()

  vw.value = W + PAD * 2
  vh.value = H + PAD * 2
  sw.value = Math.max(20, Math.min(W, H) * 0.12)  // 크기에 비례한 stroke

  const amp = Math.min(W, H) * 0.028  // 흔들림 폭 (약 2.8%)
  border.value = makeWobble(W, H, amp)
  sketch.value = makeWobble(W, H, amp * 1.3)  // 연필선은 조금 더 많이 흔들림

  pLen.value    = 2 * (W + H) + 30
  dashOff.value = pLen.value
  decos.value   = makeDecos(W, H)
  ready.value   = true

  requestAnimationFrame(() =>
    setTimeout(() => { dashOff.value = 0 }, 80)
  )
})
</script>

<style scoped>
.sk-root {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(var(--rot));
  /* 들어올린 스티커 느낌 그림자 */
  filter: drop-shadow(2px 5px 6px rgba(0, 0, 0, 0.28))
          drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.sk-card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 3px;
  /* 사진 특유의 따뜻하고 선명한 보정 */
  filter: contrast(1.06) saturate(1.12) brightness(1.03);
}

.sk-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* SVG: PAD만큼 카드 밖으로 확장 */
.sk-svg {
  position: absolute;
  top: -22px;
  left: -22px;
  width: calc(100% + 44px);
  height: calc(100% + 44px);
  overflow: visible;
}

/* 연필선 그려지기 애니메이션 */
.sk-draw {
  transition: stroke-dashoffset 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 손그림 데코 */
.sk-deco {
  position: absolute;
  pointer-events: none;
  z-index: 4;
  line-height: 1;
  user-select: none;
  color: rgba(60, 60, 60, 0.8);
  font-weight: 600;
}

/* 하단 캡션 */
.sk-label {
  position: absolute;
  bottom: -22px;
  left: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #333;
  letter-spacing: 0.02em;
  pointer-events: none;
  white-space: nowrap;
}
</style>
