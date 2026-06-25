import Hls from 'hls.js'

function getSrc(el) {
  return el.getAttribute('src') || ''
}

function attachHls(el, src) {
  if (!src || !src.endsWith('.m3u8')) return
  if (el.canPlayType('application/vnd.apple.mpegurl')) return // Safari native
  if (!Hls.isSupported()) return

  const hls = new Hls({ maxBufferLength: 10, enableWorker: true })
  hls.loadSource(src)
  hls.attachMedia(el)
  el._hls = hls
  el._hlsSrc = src
}

function destroyHls(el) {
  if (el._hls) {
    el._hls.destroy()
    delete el._hls
    delete el._hlsSrc
  }
}

function tryPlay(el) {
  if (!el._shouldPlay) return

  if (el.readyState >= 2) {
    el.play().catch(() => {})
    return
  }

  // Not enough data yet — wait for canplay before playing
  if (!el._waitingForCanPlay) {
    el._waitingForCanPlay = true
    el.addEventListener('canplay', function onCanPlay() {
      el._waitingForCanPlay = false
      if (el._shouldPlay) el.play().catch(() => {})
    }, { once: true })
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const el = entry.target
      if (entry.isIntersecting) {
        el._shouldPlay = true
        tryPlay(el)
      } else {
        el._shouldPlay = false
        el._waitingForCanPlay = false
        el.pause()
      }
    })
  },
  { threshold: 0.25 }
)

export const autoplayWhenVisible = {
  mounted(el) {
    // Fade in once first frame is decoded
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.35s ease'
    el.addEventListener('loadeddata', () => {
      el.style.opacity = '1'
    }, { once: true })

    const src = getSrc(el)
    el._prevSrc = src
    attachHls(el, src)
    observer.observe(el)
  },

  updated(el) {
    const newSrc = getSrc(el)
    if (newSrc === el._prevSrc) return // src unchanged — don't touch

    el._prevSrc = newSrc
    destroyHls(el)
    attachHls(el, newSrc)
  },

  unmounted(el) {
    el._shouldPlay = false
    el._waitingForCanPlay = false
    observer.unobserve(el)
    destroyHls(el)
  },
}
