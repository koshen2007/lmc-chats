const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

function writeWav(filename, durationSec, sampleRate, generatorFn) {
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audio format 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const [left, right] = generatorFn(t, durationSec);
    const clampedLeft = Math.max(-1, Math.min(1, left));
    const clampedRight = Math.max(-1, Math.min(1, right));

    const intLeft = Math.floor(clampedLeft < 0 ? clampedLeft * 32768 : clampedLeft * 32767);
    const intRight = Math.floor(clampedRight < 0 ? clampedRight * 32768 : clampedRight * 32767);

    buffer.writeInt16LE(intLeft, offset);
    buffer.writeInt16LE(intRight, offset + 2);
    offset += 4;
  }

  const filePath = path.join(audioDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

// 1. Lofi Chill Beats (Smooth mellow jazz chords + vinyl noise + kick/snare pulse)
writeWav('lofi_chill_beats.wav', 30, 44100, (t, dur) => {
  // Chords: Cmaj7 (261.63, 329.63, 392, 493.88), Am7 (220, 261.63, 329.63, 392), Dm7 (293.66, 349.23, 440, 523.25), G7 (196, 246.94, 293.66, 349.23)
  const bar = Math.floor(t * 1.25) % 4; // 75 BPM
  const chordFreqs = [
    [261.63, 329.63, 392.00, 493.88],
    [220.00, 261.63, 329.63, 392.00],
    [293.66, 349.23, 440.00, 523.25],
    [196.00, 246.94, 293.66, 349.23],
  ][bar];

  let chord = 0;
  for (let f of chordFreqs) {
    chord += Math.sin(2 * Math.PI * f * t) * 0.08;
    chord += Math.sin(2 * Math.PI * f * 2 * t) * 0.02; // soft overtone
  }

  // Soft electric piano envelope
  const noteT = (t * 1.25) % 1;
  const env = Math.exp(-noteT * 2.5);
  chord *= env;

  // Soft lo-fi kick & snare
  const beat = (t * 1.25) % 2;
  let drum = 0;
  if (beat < 0.2) {
    // kick
    drum += Math.sin(2 * Math.PI * (70 - beat * 200) * beat) * Math.exp(-beat * 15) * 0.35;
  }
  if (beat >= 1.0 && beat < 1.2) {
    // snare
    const snareT = beat - 1.0;
    const noise = (Math.random() * 2 - 1) * Math.exp(-snareT * 20) * 0.15;
    drum += noise;
  }

  // Vinyl warm hiss
  const vinyl = (Math.random() * 2 - 1) * 0.008;

  // Bassline
  const bassFreq = chordFreqs[0] / 2;
  const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.22 * Math.exp(-noteT * 1.5);

  const master = (chord + drum + bass + vinyl) * 0.85;
  return [master, master * 0.98 + chord * 0.05];
});

// 2. Synthwave Neon Highway (Punchy bass arpeggio + uplifting synth pad)
writeWav('synthwave_neon.wav', 25, 44100, (t, dur) => {
  const bpm = 110;
  const beatTime = 60 / bpm;
  const step = Math.floor(t / (beatTime / 4)) % 16;
  const arpNotes = [130.81, 164.81, 196.0, 246.94, 261.63, 196.0, 164.81, 130.81];
  const freq = arpNotes[step % arpNotes.length];

  const arpT = (t / (beatTime / 4)) % 1;
  const saw = (2 * ((freq * t) % 1) - 1) * 0.12 * Math.exp(-arpT * 4);

  // Warm Pad (A minor -> F -> C -> G)
  const padBar = Math.floor(t / (beatTime * 4)) % 4;
  const pads = [
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
    [261.63, 329.63, 392],
    [196, 246.94, 293.66],
  ][padBar];

  let pad = 0;
  for (let p of pads) {
    pad += Math.sin(2 * Math.PI * p * t) * 0.07;
  }

  // Kick on every beat
  const kBeat = (t / beatTime) % 1;
  const kick = Math.sin(2 * Math.PI * (110 - kBeat * 350) * kBeat) * Math.exp(-kBeat * 16) * 0.35;

  const master = (saw + pad + kick) * 0.9;
  return [master + saw * 0.05, master - saw * 0.05];
});

// 3. Cyberpunk Night Drive (Dark reese bass + high atmospheric arps)
writeWav('cyber_night_drive.wav', 24, 44100, (t, dur) => {
  // Heavy sub bass with slight detuned chorus
  const bassF = 55; // A1
  const reese =
    (Math.sin(2 * Math.PI * bassF * t) +
      Math.sin(2 * Math.PI * (bassF + 0.8) * t) * 0.8 +
      Math.sin(2 * Math.PI * (bassF - 0.8) * t) * 0.8) *
    0.16;

  // Futuristic tech chirp
  const chirpStep = Math.floor(t * 8) % 16;
  const chirpNotes = [440, 523.25, 659.25, 880, 659.25, 523.25, 783.99, 1046.5];
  const cFreq = chirpNotes[chirpStep % chirpNotes.length];
  const cT = (t * 8) % 1;
  const chirp = Math.sin(2 * Math.PI * cFreq * t) * Math.exp(-cT * 8) * 0.08;

  // Dark hi-hat rhythm
  const hatT = (t * 4) % 1;
  const hat = (Math.random() * 2 - 1) * Math.exp(-hatT * 25) * 0.05;

  const master = (reese + chirp + hat) * 0.9;
  return [master, master * 0.95 + chirp * 0.05];
});

// 4. Acoustic Peace (Gentle harp / acoustic string notes)
writeWav('acoustic_peace.wav', 26, 44100, (t, dur) => {
  const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23, 440, 587.33];
  const step = Math.floor(t * 2.5) % notes.length;
  const f = notes[step];
  const noteT = (t * 2.5) % 1;

  // Plucked string harmonic synthesis
  let pluck = 0;
  for (let h = 1; h <= 4; h++) {
    pluck += (Math.sin(2 * Math.PI * f * h * t) / h) * Math.exp(-noteT * (2 + h * 1.5)) * 0.12;
  }

  // Soft atmospheric drone in background
  const drone = (Math.sin(2 * Math.PI * 130.81 * t) + Math.sin(2 * Math.PI * 196.0 * t)) * 0.04;

  const master = (pluck + drone) * 0.95;
  return [master, master * 0.98 + pluck * 0.04];
});

console.log('All 4 music tracks successfully generated in public/audio/');

