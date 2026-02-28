"use client";

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import type { WalletState } from "./store";

const WALLET_STORAGE_KEY = "mindvault.wallet";

function hexSlice(value: Uint8Array, size: number): string {
  return bytesToHex(value).slice(0, size);
}

export function createWalletFromMnemonic(mnemonic: string): WalletState {
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const seed = mnemonicToSeedSync(mnemonic);
  const pseudoHash = sha256(seed);
  const addressHash = sha256(utf8ToBytes(`${mnemonic}:abelian-address`));
  const pqKeyHash = sha256(utf8ToBytes(`${mnemonic}:dilithium-public-key`));

  return {
    mnemonic,
    pseudoId: `stu_${hexSlice(pseudoHash, 20)}`,
    address: `abel1${hexSlice(addressHash, 48)}`,
    dilithiumPublicKey: `dili_pk_${hexSlice(pqKeyHash, 64)}`
  };
}

export function generateWallet(): WalletState {
  const mnemonic = generateMnemonic(wordlist, 128);
  return createWalletFromMnemonic(mnemonic);
}

export function saveWallet(wallet: WalletState): void {
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}

export function loadWallet(): WalletState | null {
  const raw = localStorage.getItem(WALLET_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as Partial<WalletState>;
  if (!parsed.mnemonic || !parsed.pseudoId || !parsed.address || !parsed.dilithiumPublicKey) {
    return null;
  }

  return {
    mnemonic: parsed.mnemonic,
    pseudoId: parsed.pseudoId,
    address: parsed.address,
    dilithiumPublicKey: parsed.dilithiumPublicKey
  };
}
