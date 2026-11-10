/**
 * LMC Chats Client Security Shield & DevTools Honeypot Traps
 * 1. Prototype Freezing (Anti-Tampering)
 * 2. Deceptive Honeypot Traps on window (__LMC_ADMIN_OVERRIDE__, unlockPremiumStickers, spamMessages)
 * 3. Silent Shadowban Telemetry Trigger
 */

declare global {
  interface Window {
    __LMC_ADMIN_OVERRIDE__?: () => unknown;
    unlockPremiumStickers?: () => unknown;
    spamMessages?: (count?: number) => unknown;
    __LMC_CLIENT_SHIELD_INITIALIZED__?: boolean;
  }
}

/**
 * Trigger silent shadowban via honeypot endpoint
 */
async function reportHoneypotTrigger(trapName: string, details?: Record<string, unknown>) {
  try {
    let currentUser = '';
    let currentId = '';
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('lmc_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          currentUser = parsed.username || parsed.name || '';
          currentId = parsed.id || '';
        }
      } catch {}
    }

    // Mark locally
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lmc_shadowbanned', 'true');
    }

    const payload = JSON.stringify({
      trap: trapName,
      username: currentUser,
      user_id: currentId,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/security/honeypot', payload);
    } else {
      fetch('/api/security/honeypot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Initialize Client Shield & Honeypots
 */
export function initClientShield(): void {
  if (typeof window === 'undefined') return;
  if (window.__LMC_CLIENT_SHIELD_INITIALIZED__) return;
  window.__LMC_CLIENT_SHIELD_INITIALIZED__ = true;

  // 1. PROTOTYPE LOCKDOWN & FREEZING (Prevents malicious monkey-patching in console)
  try {
    if (typeof WebSocket !== 'undefined' && WebSocket.prototype) {
      Object.freeze(WebSocket.prototype);
    }
    if (typeof Headers !== 'undefined' && Headers.prototype) {
      Object.freeze(Headers.prototype);
    }
  } catch (err) {
    console.debug('Prototype freeze non-critical notice:', err);
  }

  // 2. HONEYPOT TRAP 1: window.__LMC_ADMIN_OVERRIDE__
  Object.defineProperty(window, '__LMC_ADMIN_OVERRIDE__', {
    configurable: false,
    writable: false,
    value: function () {
      reportHoneypotTrigger('__LMC_ADMIN_OVERRIDE__', { action: 'Invoked root admin override' });
      console.log(
        '%c[LMC SYSTEM] Admin Override Granted. God Mode Active. Root privileges assigned.',
        'color: #00ff66; font-size: 14px; font-weight: bold; background: #000; padding: 4px;'
      );
      return {
        status: 'ADMIN_ACCESS_GRANTED',
        role: 'SUPER_ADMIN',
        session: 'SEC_ROOT_' + Math.random().toString(36).substring(2, 10),
        privileges: ['ROOT', 'UNLIMITED_BURST', 'BYPASS_RLS', 'ALL_ACCESS'],
      };
    },
  });

  // 3. HONEYPOT TRAP 2: window.unlockPremiumStickers
  Object.defineProperty(window, 'unlockPremiumStickers', {
    configurable: false,
    writable: false,
    value: function () {
      reportHoneypotTrigger('unlockPremiumStickers', { action: 'Attempted to unlock paid sticker pack' });
      console.log(
        '%c[LMC REWARDS] All 150+ Animated VIP Stickers Unlocked Successfully!',
        'color: #ff00ea; font-size: 13px; font-weight: bold; background: #111; padding: 4px;'
      );
      return {
        success: true,
        count: 152,
        unlockedPacks: ['VIP_ANIME', 'PEPE_RARE', 'NEON_CYBER', 'GOLDEN_EMOJIS'],
      };
    },
  });

  // 4. HONEYPOT TRAP 3: window.spamMessages
  Object.defineProperty(window, 'spamMessages', {
    configurable: false,
    writable: false,
    value: function (count = 100) {
      reportHoneypotTrigger('spamMessages', { targetCount: count });
      console.log(
        `%c[LMC BOT ENGINE] Spam socket connected. Dispatching ${count} high-speed payloads...`,
        'color: #00e5ff; font-size: 13px; font-weight: bold; background: #111; padding: 4px;'
      );
      return {
        status: 'ONLINE',
        mode: 'ASYNC_SOCKET_FLOOD',
        targetCount: count,
        delayMs: 25,
      };
    },
  });
}

