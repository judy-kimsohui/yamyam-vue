import Hls from 'hls.js'

// Inject CSS once for overlay + spinner
let styleInjected = false
function injectStyle() {
  if (styleInjected) return
  styleInjected = true
  const s = document.createElement('style')
  s.textContent = `
    .vlv-overlay {
      position: absolute;
      inset: 0;
      background: #fdf8f3;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    .vlv-overlay.vlv-ready { opacity: 0; }
    .vlv-spinner {
      width: 28px;
      height: 28px;
      border: 2.5px solid rgba(232, 144, 158, 0.25);
      border-top-color: #e8909e;
      border-radius: 50%;
      animation: vlv-spin 0.75s linear infinite;
    }
    @keyframes vlv-spin { to { transform: rotate(360deg); } }
  `
  document.head.appendChild(s)
}

function getSrc(el) {
  return el.getAttribute('src') || ''
}

function attachHls(el, src) {
  if (!src?.endsWith('.m3u8')) return
  if (el.canPlayType('application/vnd.apple.mpegurl')) return // Safari native
  if (!Hls.isSupported()) return
  const hls = new Hls({ maxBufferLength: 10, enableWorker: true })
  hls.loadSource(src)
  hls.attachMedia(el)
  el._hls = hls
}

function destroyHls(el) {
  if (el._hls) {
    el._hls.destroy()
    delete el._hls
  }
}

function markReady(el) {
  el._overlay?.classList.add('vlv-ready')
  el.style.opacity = '1'
}

function markLoading(el) {
  el._overlay?.classList.remove('vlv-ready')
  el.style.opacity = '0'
}

function tryPlay(el) {
  if (!el._shouldPlay) return

  if (el.readyState >= 2) {
    el.play().catch(() => {})
    markReady(el)
    return
  }

  // Not buffered yet — show spinner and wait
  markLoading(el)

  if (!el._pendingCanPlay) {
    el._pendingCanPlay = true
    el.addEventListener('canplay', () => {
      el._pendingCanPlay = false
      // Always mark ready regardless of shouldPlay so re-entry is instant
      markReady(el)
      if (el._shouldPlay) el.play().catch(() => {})
    }, { once: true })
  }
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target
    if (entry.isIntersecting) {
      el._shouldPlay = true
      tryPlay(el)
    } else {
      el._shouldPlay = false
      el._pendingCanPlay = false
      el.pause()
      // Keep overlay/opacity as-is when scrolling away — no flash on re-entry
    }
  })
}, { threshold: 0.25 })

export const autoplayWhenVisible = {
  mounted(el) {
    injectStyle()

    // Disable native loop — controlled manually for the 2-second limit
    el.loop = false

    // Inject beige loading overlay as first child of parent
    const overlay = document.createElement('div')
    overlay.className = 'vlv-overlay'
    overlay.innerHTML = '<div class="vlv-spinner"></div>'
    const parent = el.parentElement
    if (parent) {
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
      parent.insertBefore(overlay, el)
    }
    el._overlay = overlay

    // Start invisible; overlay covers until ready
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.25s ease'

    // 2-second clip limit — seamless loop
    el._onTimeUpdate = () => {
      if (el.currentTime >= 2) {
        el.currentTime = 0
        if (el._shouldPlay && el.paused) el.play().catch(() => {})
      }
    }
    // Handle videos shorter than 2 s
    el._onEnded = () => {
      el.currentTime = 0
      if (el._shouldPlay) el.play().catch(() => {})
    }

    el.addEventListener('timeupdate', el._onTimeUpdate)
    el.addEventListener('ended', el._onEnded)

    const src = getSrc(el)
    el._prevSrc = src
    attachHls(el, src)
    observer.observe(el)
  },

  updated(el) {
    // Always keep native loop disabled even after Vue re-renders the attribute
    el.loop = false

    const newSrc = getSrc(el)
    if (newSrc === el._prevSrc) return

    el._prevSrc = newSrc
    markLoading(el)
    destroyHls(el)
    attachHls(el, newSrc)
  },

  unmounted(el) {
    el._shouldPlay = false
    el._pendingCanPlay = false
    el.removeEventListener('timeupdate', el._onTimeUpdate)
    el.removeEventListener('ended', el._onEnded)
    el._overlay?.remove()
    observer.unobserve(el)
    destroyHls(el)
  },
}
