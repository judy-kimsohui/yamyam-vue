import Hls from 'hls.js'

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
  if (el.canPlayType('application/vnd.apple.mpegurl')) return
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
  el._hasLoaded = true
  el._overlay?.classList.add('vlv-ready')
  el.style.opacity = '1'
}

function markLoading(el) {
  if (el._hasLoaded) return
  el._overlay?.classList.remove('vlv-ready')
  el.style.opacity = '0'
}

function applyPreload(el) {
  el.preload = 'auto'
  el._preloadStarted = true
}

function tryPlay(el) {
  if (!el._shouldPlay) return

  if (el.readyState >= 2) {
    el.play().catch(() => {})
    markReady(el)
    return
  }

  markLoading(el)

  if (!el._pendingCanPlay) {
    el._pendingCanPlay = true
    el.addEventListener('canplay', () => {
      el._pendingCanPlay = false
      markReady(el)
      if (el._shouldPlay) el.play().catch(() => {})
    }, { once: true })
  }
}

// Fires 600 px before the viewport — switches preload to "auto" so the browser
// starts buffering before the video is actually visible.
const preloadObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target: el, isIntersecting }) => {
    if (!isIntersecting || el._preloadStarted) return
    applyPreload(el)
    preloadObserver.unobserve(el)
  })
}, { rootMargin: '600px 0px', threshold: 0 })

// Fires when any pixel of the video enters/leaves the viewport.
// threshold: 0 means pause only when completely off screen (not at 25%).
const playObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target: el, isIntersecting }) => {
    if (isIntersecting) {
      el._shouldPlay = true
      tryPlay(el)
    } else {
      el._shouldPlay = false
      el.pause()
    }
  })
}, { threshold: 0 })

export const autoplayWhenVisible = {
  mounted(el) {
    injectStyle()

    el.loop = false
    el._hasLoaded = false
    el._preloadStarted = false

    const overlay = document.createElement('div')
    overlay.className = 'vlv-overlay'
    overlay.innerHTML = '<div class="vlv-spinner"></div>'
    const parent = el.parentElement
    if (parent) {
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
      parent.insertBefore(overlay, el)
    }
    el._overlay = overlay

    el.style.opacity = '0'
    el.style.transition = 'opacity 0.25s ease'

    el._onTimeUpdate = () => {
      if (el.currentTime >= 2) {
        el.currentTime = 0
        if (el._shouldPlay && el.paused) el.play().catch(() => {})
      }
    }
    el._onEnded = () => {
      el.currentTime = 0
      if (el._shouldPlay) el.play().catch(() => {})
    }

    el.addEventListener('timeupdate', el._onTimeUpdate)
    el.addEventListener('ended', el._onEnded)

    const src = getSrc(el)
    el._prevSrc = src
    attachHls(el, src)

    preloadObserver.observe(el)
    playObserver.observe(el)
  },

  updated(el) {
    el.loop = false

    // Vue re-renders can reset the preload attribute — re-apply our value.
    if (el._preloadStarted) applyPreload(el)

    const newSrc = getSrc(el)
    if (newSrc === el._prevSrc) return

    el._prevSrc = newSrc
    el._hasLoaded = false
    el._preloadStarted = false
    markLoading(el)
    destroyHls(el)
    attachHls(el, newSrc)

    preloadObserver.observe(el)
  },

  unmounted(el) {
    el._shouldPlay = false
    el.removeEventListener('timeupdate', el._onTimeUpdate)
    el.removeEventListener('ended', el._onEnded)
    el._overlay?.remove()
    preloadObserver.unobserve(el)
    playObserver.unobserve(el)
    destroyHls(el)
  },
}
