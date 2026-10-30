/** Play recorded audio files, decoded once and cached. No synthesized sounds. */
export function createAudioPlayer({ volume = 0.5 } = {}) {
  let context = null
  let output = null
  let enabled = true
  const buffers = new Map()
  const channels = new Map()

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

  function stop(channel) {
    const playback = channels.get(channel)
    channels.delete(channel)
    playback?.source?.stop()
  }

  async function play(url, { channel = null } = {}) {
    if (channel !== null) stop(channel)
    if (!enabled || context?.state !== 'running') return false
    const playback = channel !== null ? {} : null
    if (playback) channels.set(channel, playback)
    try {
      const buffer = await load(url)
      // A newer clip or stop() invalidates a pending download on this channel.
      if (playback && channels.get(channel) !== playback) return false
      if (!enabled || context.state !== 'running') return false
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(output)
      source.onended = () => {
        source.disconnect()
        if (playback && channels.get(channel) === playback) channels.delete(channel)
      }
      source.start()
      if (playback) playback.source = source
      return true
    } catch {
      return false
    } finally {
      if (playback && !playback.source && channels.get(channel) === playback) channels.delete(channel)
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value)
    if (output) output.gain.setValueAtTime(enabled ? volume : 0, context.currentTime)
  }

  return { unlock, play, stop, setEnabled }
}
