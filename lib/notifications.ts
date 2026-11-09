// Push Notifications & Web Audio Chime Manager for LMC Chats

let audioCtxInstance: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtxInstance) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxInstance = new AudioCtx();
      }
    }
    if (audioCtxInstance && audioCtxInstance.state === 'suspended') {
      audioCtxInstance.resume().catch(() => {});
    }
    return audioCtxInstance;
  } catch {
    return null;
  }
}

/**
 * Play a synthetic, zero-dependency two-tone or triplet audio chime using Web Audio API
 */
export function playWebAudioChime(type: 'message' | 'call' | 'sent' = 'message'): void {
  try {
    const isMuted = getSoundMuted();
    if (isMuted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'message') {
      // Pleasant two-tone chime (E5 -> C6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

      osc2.frequency.setValueAtTime(329.63, now); // E4

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } else if (type === 'sent') {
      // Crisp outgoing message pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'call') {
      // Incoming call ringtone pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440.0, now);
      osc.frequency.setValueAtTime(480.0, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {}
}

export function getSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('lmc_sound_muted') === 'true';
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lmc_sound_muted', muted ? 'true' : 'false');
}

/**
 * Request Browser Notification Permission
 */
export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      playWebAudioChime('message');
    }
    return result;
  } catch {
    return 'unsupported';
  }
}

/**
 * Dispatch desktop / mobile browser notification via Web Notification or ServiceWorker
 */
export function sendBrowserNotification(
  title: string,
  options: NotificationOptions & { groupId?: string; onClick?: () => void }
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    // If ServiceWorker registration is ready, prefer showNotification for rich background notifications
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          ...options,
          badge: options.badge || '/icon-192.png',
          icon: options.icon || '/logo.png',
        });
      }).catch(() => {
        fallbackNotification(title, options);
      });
    } else {
      fallbackNotification(title, options);
    }
  } catch {
    fallbackNotification(title, options);
  }
}

function fallbackNotification(
  title: string,
  options: NotificationOptions & { onClick?: () => void }
): void {
  try {
    const notif = new Notification(title, {
      ...options,
      badge: options.badge || '/icon-192.png',
      icon: options.icon || '/logo.png',
    });

    if (options.onClick) {
      notif.onclick = () => {
        window.focus();
        notif.close();
        options.onClick?.();
      };
    }
  } catch {}
}

