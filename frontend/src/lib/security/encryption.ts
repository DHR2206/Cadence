import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 32;
const VERSION = "v1";

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.ENCRYPTION_KEY;

  if (!configuredKey) {
    throw new Error("ENCRYPTION_KEY is required for integration credential encryption.");
  }

  const trimmedKey = configuredKey.trim();
  const candidateKeys = [
    Buffer.from(trimmedKey, "base64"),
    /^[0-9a-f]+$/i.test(trimmedKey) ? Buffer.from(trimmedKey, "hex") : Buffer.alloc(0),
    Buffer.from(trimmedKey, "utf8")
  ];

  const key = candidateKeys.find((candidate) => candidate.length === KEY_LENGTH_BYTES);

  if (!key) {
    throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM.");
  }

  return key;
}

export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt an empty credential.");
  }

  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64")
  ].join(":");
}

export function decrypt(encryptedValue: string): string {
  const [version, ivValue, authTagValue, ciphertextValue, ...extra] = encryptedValue.split(":");

  if (version !== VERSION || extra.length > 0 || !ivValue || !authTagValue || !ciphertextValue) {
    throw new Error("Credential is not in the expected encrypted format.");
  }

  const iv = Buffer.from(ivValue, "base64");
  const authTag = Buffer.from(authTagValue, "base64");
  const ciphertext = Buffer.from(ciphertextValue, "base64");

  if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error("Credential encryption envelope is invalid.");
  }

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString("utf8");
}
