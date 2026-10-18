import { decryptVault, encryptVault } from "@/lib/crypto";
import {
  StoredVault,
  VAULT_STORAGE_KEY,
  VaultPayload,
} from "@/lib/types";

const vaultListeners = new Set<() => void>();

export function subscribeVault(onChange: () => void): () => void {
  vaultListeners.add(onChange);
  return () => {
    vaultListeners.delete(onChange);
  };
}

function notifyVaultChange(): void {
  for (const listener of vaultListeners) {
    listener();
  }
}

export function readStoredVault(): StoredVault | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredVault;
  } catch {
    return null;
  }
}

export function hasVault(): boolean {
  return readStoredVault() !== null;
}

export async function createVault(
  masterPassword: string,
): Promise<VaultPayload> {
  const payload: VaultPayload = { version: 1, entries: [] };
  await saveVault(payload, masterPassword);
  return payload;
}

export async function unlockVault(
  masterPassword: string,
): Promise<VaultPayload | null> {
  const stored = readStoredVault();
  if (!stored) return null;

  const json = await decryptVault(stored, masterPassword);
  if (!json) return null;

  try {
    const payload = JSON.parse(json) as VaultPayload;
    if (payload.version !== 1 || !Array.isArray(payload.entries)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function saveVault(
  payload: VaultPayload,
  masterPassword: string,
): Promise<void> {
  const json = JSON.stringify(payload);
  const encrypted = await encryptVault(json, masterPassword);
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(encrypted));
  notifyVaultChange();
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
  notifyVaultChange();
}
