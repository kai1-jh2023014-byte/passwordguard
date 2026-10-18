export type PasswordEntry = {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type VaultPayload = {
  version: 1;
  entries: PasswordEntry[];
};

export type StoredVault = {
  salt: string;
  iv: string;
  ciphertext: string;
};

export const VAULT_STORAGE_KEY = "local-pm-vault";
