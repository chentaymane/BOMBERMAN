// Play an audio file. Clips on the same channel replace each other.
// A missing file or a blocked autoplay simply stays silent.
const channels = {};
let muted = false;

export function playSound(url, channel) {
  if (muted) return;
  if (channel) channels[channel]?.pause();
  const audio = new Audio(url);
  if (channel) channels[channel] = audio;
  audio.play().catch(() => {});
}

export function muteSounds(value) {
  muted = value;
  if (muted) Object.values(channels).forEach(audio => audio.pause());
}
