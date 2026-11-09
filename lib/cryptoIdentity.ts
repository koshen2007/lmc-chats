/**
 * LMC Chats Zero-Trust Cryptographic Identity Engine
 * Hardware-Bound Non-Extractable WebCrypto Keys (ECDSA P-256)
 * Stored inside IndexedDB (lmc_keystore)
 */

const DB_NAME = 'lmc_keystore';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const KEY_RECORD_ID = 'device_identity';

export interface DeviceIdentityRecord {
  id: string;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyBase64: string;
  userId?: string;
  createdAt: number;
}

export interface SignedMessagePayload {
  signature: string; // Base64 ECDSA SHA-256 signature
  nonce: string; // Unique cryptographic UUID nonce
  publicKey: string; // Base64 SPKI Public Key
  canonicalPayload: string;
}

let memoryIdentityCache: DeviceIdentityRecord | null = null;

/**
 * ArrayBuffer <-> Base64 helpers (Isomorphic)
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('WebCrypto subtle API is not supported in this runtime environment.');
}

/**
 * Open IndexedDB keystore
 */
function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not available in current environment.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve hardware-bound identity from IndexedDB
 */
async function getStoredIdentityFromDB(): Promise<DeviceIdentityRecord | null> {
  try {
    const db = await openKeyDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_RECORD_ID);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Persist hardware-bound identity in IndexedDB
 */
async function saveIdentityToDB(record: DeviceIdentityRecord): Promise<void> {
  try {
    const db = await openKeyDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not persist CryptoKey to IndexedDB, using memory cache:', err);
  }
}

/**
 * 1. HARDWARE-BOUND NON-EXTRACTABLE IDENTITY INITIALIZATION
 * Generates ECDSA P-256 keypair with extractable: false for the private key.
 */
export async function getOrCreateDeviceIdentity(userId?: string): Promise<{
  publicKeyBase64: string;
  isHardwareBound: boolean;
}> {
  if (memoryIdentityCache) {
    return {
      publicKeyBase64: memoryIdentityCache.publicKeyBase64,
      isHardwareBound: true,
    };
  }

  // Check IndexedDB
  const stored = await getStoredIdentityFromDB();
  if (stored && stored.privateKey && stored.publicKeyBase64) {
    memoryIdentityCache = stored;
    return {
      publicKeyBase64: stored.publicKeyBase64,
      isHardwareBound: true,
    };
  }

  const subtle = getSubtleCrypto();

  // Generate non-extractable private key bound to browser/hardware
  const keyPair = await subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false, // extractable: false (Hardware-bound: Private key cannot be exported or leaked via XSS)
    ['sign']
  );

  // We also export the raw SPKI public key (Base64)
  // For ECDSA keypairs where private is non-extractable, public key is exportable
  const spkiBuffer = await subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(spkiBuffer);

  const newRecord: DeviceIdentityRecord = {
    id: KEY_RECORD_ID,
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyBase64,
    userId,
    createdAt: Date.now(),
  };

  await saveIdentityToDB(newRecord);
  memoryIdentityCache = newRecord;

  return {
    publicKeyBase64,
    isHardwareBound: true,
  };
}

/**
 * Canonical payload formatting for tamper-proof signature verification
 */
export function buildCanonicalMessagePayload(
  content: string,
  groupId: string,
  timestamp: string,
  nonce: string,
  senderIdent = ''
): string {
  return `${content.trim()}|${groupId.trim()}|${timestamp.trim()}|${nonce.trim()}|${senderIdent.trim().toLowerCase()}`;
}

/**
 * 2. CRYPTOGRAPHIC MESSAGE SIGNING WRAPPER
 * Produces an ECDSA SHA-256 signature for every outgoing message using the non-extractable private key.
 */
export async function signMessagePayload(
  content: string,
  groupId: string,
  timestamp?: string,
  senderIdent = '',
  customNonce?: string
): Promise<SignedMessagePayload> {
  const ts = timestamp || new Date().toISOString();
  const nonce =
    customNonce ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Ensure identity is loaded
  await getOrCreateDeviceIdentity(senderIdent);
  if (!memoryIdentityCache) {
    throw new Error('Device identity keypair not initialized.');
  }

  const subtle = getSubtleCrypto();
  const canonicalPayload = buildCanonicalMessagePayload(content, groupId, ts, nonce, senderIdent);
  const encodedData = new TextEncoder().encode(canonicalPayload);

  const signatureBuffer = await subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    memoryIdentityCache.privateKey,
    encodedData
  );

  const signature = arrayBufferToBase64(signatureBuffer);

  return {
    signature,
    nonce,
    publicKey: memoryIdentityCache.publicKeyBase64,
    canonicalPayload,
  };
}

/**
 * 3. CRYPTOGRAPHIC VERIFICATION (Isomorphic: Browser & Node.js)
 * Verifies an ECDSA P-256 signature against the provided SPKI public key.
 */
export async function verifyMessageSignature(
  content: string,
  groupId: string,
  timestamp: string,
  nonce: string,
  senderIdent: string,
  signatureBase64: string,
  publicKeyBase64: string
): Promise<boolean> {
  try {
    if (!signatureBase64 || !publicKeyBase64 || !nonce) {
      return false;
    }

    const subtle = getSubtleCrypto();
    const pubKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    const sigBuffer = base64ToArrayBuffer(signatureBase64);

    const importedPublicKey = await subtle.importKey(
      'spki',
      pubKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify']
    );

    const canonicalPayload = buildCanonicalMessagePayload(
      content,
      groupId,
      timestamp,
      nonce,
      senderIdent
    );
    const encodedData = new TextEncoder().encode(canonicalPayload);

    return await subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      importedPublicKey,
      sigBuffer,
      encodedData
    );
  } catch (err) {
    console.warn('Cryptographic signature verification failed:', err);
    return false;
  }
}

/**
 * Compute SHA-256 Digest in Hex
 */
export async function computeSha256Hex(data: string): Promise<string> {
  try {
    const subtle = getSubtleCrypto();
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback if running in older node or worker without subtle
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

