<template>
  <div class="sk-root" ref="rootEl">
    <video v-lazy-video v-bind="$attrs" class="sk-video" />

    <svg v-if="ready" class="sk-svg" :viewBox="`0 0 ${W} ${H}`">
      <!-- 바깥 흰 테두리 (얇고 울퉁불퉁) -->
      <path :d="outerPath"
            stroke="white" stroke-width="4.5"
            fill="none" stroke-linecap="round" stroke-linejoin="round"
            :stroke-dasharray="pLen" :stroke-dashoffset="dashOff"
            class="sk-draw" />
      <!-- 안쪽 얇은 스케치 선 -->
      <path :d="innerPath"
            stroke="rgba(255,255,255,0.45)" stroke-width="1.2"
            fill="none" stroke-linecap="round" stroke-linejoin="round"
            stroke-dasharray="4 6"
            :style="`opacity: ${dashOff === 0 ? 1 : 0}; transition: opacity 0.4s 1.4s`" />

      <!-- SVG 스티커 -->
      <image v-for="d in decos" :key="'s'+d.id"
             :href="d.src"
             :x="d.x - d.size/2"
             :y="d.y - d.size/2"
             :width="d.size"
             :height="d.size"
             :transform="`rotate(${d.rot}, ${d.x}, ${d.y})`"
             :style="`animation: deco-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${d.delay}s both`"
             class="sk-deco-img" />

      <!-- 작은 글자 데코 -->
      <text v-for="t in textDecos" :key="'t'+t.id"
            :x="t.x" :y="t.y"
            :font-size="t.fs"
            text-anchor="middle" dominant-baseline="middle"
            :fill="t.color" font-weight="800"
            :transform="`rotate(${t.rot}, ${t.x}, ${t.y})`"
            :style="`animation: deco-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) ${t.delay}s both; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2))`">{{ t.char }}</text>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

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

defineOptions({ inheritAttrs: false })

const DECO_SET = [
  { char: '✦', colors: ['#fff', '#fff9c4', '#ffd6e7'] },
  { char: '♡', colors: ['#ffb3c6', '#ff8fab', '#fff'] },
  { char: '✧', colors: ['#fff', '#e0f0ff', '#ffd6e7'] },
  { char: '⋆',  colors: ['#fff', '#fff9c4'] },
  { char: '✿',  colors: ['#ffcfe2', '#ffd6a5', '#fff'] },
  { char: '✰',  colors: ['#fff9c4', '#fff', '#ffd6e7'] },
  { char: '˚',  colors: ['#fff', '#e0f0ff'] },
  { char: '❀',  colors: ['#ffcfe2', '#fff'] },
  { char: '﹡', colors: ['#fff', '#ffd6e7'] },
  { char: '·',  colors: ['#fff'] },
]

const rootEl    = ref(null)
const ready     = ref(false)
const W = ref(0), H = ref(0)
const outerPath  = ref('')
const innerPath  = ref('')
const pLen       = ref(800)
const dashOff    = ref(800)
const decos      = ref([])
const textDecos  = ref([])

function rand(a, b) { return a + Math.random() * (b - a) }
function pick(arr)  { return arr[Math.floor(Math.random() * arr.length)] }

/* ── 울퉁불퉁한 테두리 경로 ── */
function makeWobblePath(w, h, inset, amp, steps) {
  const pts = []
  const p = (x, y) => pts.push([
    +(x + rand(-amp, amp)).toFixed(1),
    +(y + rand(-amp, amp)).toFixed(1),
  ])
  const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset
  for (let i = 0; i <= steps; i++) p(x0 + i*(x1-x0)/steps, y0)
  for (let i = 1; i <= steps; i++) p(x1, y0 + i*(y1-y0)/steps)
  for (let i = steps-1; i >= 0; i--) p(x0 + i*(x1-x0)/steps, y1)
  for (let i = steps-1; i >= 1; i--) p(x0, y0 + i*(y1-y0)/steps)
  return 'M ' + pts.map(p => p.join(',')).join(' L ') + ' Z'
}

function pathLength(d) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  el.setAttribute('d', d)
  el.style.cssText = 'visibility:hidden;position:fixed;pointer-events:none'
  document.body.appendChild(el)
  const len = el.getTotalLength()
  document.body.removeChild(el)
  return len
}

/* ── 스티커 배치: 테두리 근처에 골고루 ── */
function makeDecos(w, h) {
  const PAD = 14
  const positions = [
    // 4 모서리
    [rand(PAD, PAD+14), rand(PAD, PAD+14)],
    [w - rand(PAD, PAD+14), rand(PAD, PAD+14)],
    [rand(PAD, PAD+14), h - rand(PAD, PAD+14)],
    [w - rand(PAD, PAD+14), h - rand(PAD, PAD+14)],
    // 4 엣지 중간
    [w/2 + rand(-24, 24), rand(PAD, PAD+12)],
    [w/2 + rand(-24, 24), h - rand(PAD, PAD+12)],
    [rand(PAD, PAD+12), h/2 + rand(-24, 24)],
    [w - rand(PAD, PAD+12), h/2 + rand(-24, 24)],
    // 추가 2개
    [rand(PAD, w-PAD), rand(PAD, PAD+18)],
    [rand(PAD, w-PAD), h - rand(PAD, PAD+18)],
  ]

  // 3~5개 랜덤 선택
  const count = 3 + Math.floor(Math.random() * 3)
  const shuffled = [...STICKERS].sort(() => Math.random() - 0.5)
  return positions
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((pos, i) => ({
      id:    i,
      x:     pos[0],
      y:     pos[1],
      src:   shuffled[i % shuffled.length],
      size:  rand(28, 44),
      rot:   rand(-35, 35),
      delay: 0.5 + i * 0.09,
    }))
}

/* ── 작은 텍스트 데코 배치 ── */
function makeTextDecos(w, h) {
  const PAD = 8
  // 테두리 안쪽의 여러 지점에 촘촘하게 배치
  const positions = [
    // 상단
    [rand(PAD+8, w*0.3), rand(PAD, PAD+10)],
    [rand(w*0.3, w*0.7), rand(PAD, PAD+8)],
    [rand(w*0.7, w-PAD-8), rand(PAD, PAD+10)],
    // 하단
    [rand(PAD+8, w*0.35), h - rand(PAD, PAD+10)],
    [rand(w*0.35, w*0.65), h - rand(PAD, PAD+8)],
    [rand(w*0.65, w-PAD-8), h - rand(PAD, PAD+10)],
    // 좌측
    [rand(PAD, PAD+10), rand(PAD+8, h*0.4)],
    [rand(PAD, PAD+8), rand(h*0.4, h*0.6)],
    [rand(PAD, PAD+10), rand(h*0.6, h-PAD-8)],
    // 우측
    [w - rand(PAD, PAD+10), rand(PAD+8, h*0.4)],
    [w - rand(PAD, PAD+8), rand(h*0.4, h*0.6)],
    [w - rand(PAD, PAD+10), rand(h*0.6, h-PAD-8)],
  ]

  const count = 6 + Math.floor(Math.random() * 3)
  return positions
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((pos, i) => {
      const info = pick(DECO_SET)
      return {
        id:    i,
        x:     pos[0],
        y:     pos[1],
        char:  info.char,
        color: pick(info.colors),
        fs:    rand(7, 14),
        rot:   rand(-45, 45),
        delay: 1.0 + i * 0.06,
      }
    })
}

onMounted(() => {
  const { width: w, height: h } = rootEl.value.getBoundingClientRect()
  W.value = w; H.value = h

  outerPath.value = makeWobblePath(w, h, 5,   2.8, 24)
  innerPath.value = makeWobblePath(w, h, 9.5, 2.0, 20)

  pLen.value      = pathLength(outerPath.value)
  dashOff.value   = pLen.value
  decos.value     = makeDecos(w, h)
  textDecos.value = makeTextDecos(w, h)
  ready.value     = true

  requestAnimationFrame(() => setTimeout(() => { dashOff.value = 0 }, 60))
})
</script>

<style scoped>
.sk-root {
  position: relative;
  width: 100%;
  height: 100%;
}

.sk-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sk-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

/* 테두리 그려지는 애니메이션 */
.sk-draw {
  transition: stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 스티커 팝인 */
.sk-deco-img {
  animation: deco-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

@keyframes deco-pop {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
