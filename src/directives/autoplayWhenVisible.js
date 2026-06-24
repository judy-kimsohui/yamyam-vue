import Hls from 'hls.js'

function attachHls(video) {
  const src = video.src || video.getAttribute('src')
  if (!src) return

  if (src.endsWith('.m3u8')) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari: native HLS support
      video.src = src
    } else if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 10 })
      hls.loadSource(src)
      hls.attachMedia(video)
      video._hls = hls
    }
  }
}

function destroyHls(video) {
  if (video._hls) {
    video._hls.destroy()
    delete video._hls
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target
      if (entry.isIntersecting) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  },
  { threshold: 0.25 }
)

export const autoplayWhenVisible = {
  mounted(el) {
    attachHls(el)
    observer.observe(el)
  },
  updated(el, binding, vnode, prevVnode) {
    // If src changed and is now HLS, re-attach
    const newSrc = el.src || el.getAttribute('src')
    if (newSrc && newSrc.endsWith('.m3u8') && !el._hls) {
      destroyHls(el)
      attachHls(el)
    }
  },
  unmounted(el) {
    observer.unobserve(el)
    destroyHls(el)
  },
}
