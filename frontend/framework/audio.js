/** Play recorded audio files, decoded once and cached. No synthesized sounds. */
export function createAudioPlayer({ volume = 0.5 } = {}) {
  let context = null
  let output = null
  let enabled = true
  const buffers = new Map()

  async function unlock() {
    const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext
    if (!Audio) return false
    try {
      if (!context) {
        context = new Audio()
        output = context.createGain()
        output.gain.value = enabled ? volume : 0
        output.connect(context.destination)
      }
      if (context.state !== 'running') await context.resume()
      return context.state === 'running'
    } catch {
      return false
    }
  }

  async function load(url) {
    if (!buffers.has(url)) {
      const loading = (async () => {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Audio file unavailable: ' + url)
        return context.decodeAudioData(await response.arrayBuffer())
      })()
      buffers.set(url, loading)
      // Failed downloads are retryable, including files added after page load.
      loading.catch(() => buffers.delete(url))
    }
    return buffers.get(url)
  }

  async function play(url) {
    if (!enabled || context?.state !== 'running') return false
    try {
      const buffer = await load(url)
      if (!enabled || context.state !== 'running') return false
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(output)
      source.onended = () => source.disconnect()
      source.start()
      return true
    } catch {
      return false
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value)
    if (output) output.gain.setValueAtTime(enabled ? volume : 0, context.currentTime)
  }

  return { unlock, play, setEnabled }
}
