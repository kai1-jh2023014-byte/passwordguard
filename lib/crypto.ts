const PBKDF2_ITERATIONS = 120_000;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(
  password: string,
  salt: ArrayBuffer,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptVault(
  payload: string,
  password: string,
): Promise<{ salt: string; iv: string; ciphertext: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt.buffer);

  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(payload),
  );

  return {
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertext),
  };
}

export async function decryptVault(
  stored: { salt: string; iv: string; ciphertext: string },
  password: string,
): Promise<string | null> {
  try {
    const salt = base64ToBuffer(stored.salt);
    const iv = new Uint8Array(base64ToBuffer(stored.iv));
    const ciphertext = base64ToBuffer(stored.ciphertext);
    const key = await deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
