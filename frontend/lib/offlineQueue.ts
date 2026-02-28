"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CredentialMintRequest, FederatedGradient } from "@mindvault/api-types";
import { mintCredential, submitGradients } from "./api-client";

const DB_NAME = "mindvault-offline";
const DB_VERSION = 1;
const GRADIENT_STORE = "gradientQueue";
const CREDENTIAL_STORE = "credentialQueue";

interface GradientQueueItem {
  id: string;
  token: string;
  payload: FederatedGradient;
  createdAt: string;
}

interface CredentialQueueItem {
  id: string;
  token: string;
  payload: CredentialMintRequest;
  createdAt: string;
}

interface QueueFlushResult {
  mintedTxHashes: string[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GRADIENT_STORE)) {
        db.createObjectStore(GRADIENT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CREDENTIAL_STORE)) {
        db.createObjectStore(CREDENTIAL_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

function addRecord<T extends { id: string }>(db: IDBDatabase, storeName: string, record: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`Failed to add record to ${storeName}`));
  });
}

function getAllRecords<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error(`Failed to read store ${storeName}`));
  });
}

function deleteRecord(db: IDBDatabase, storeName: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`Failed to delete record from ${storeName}`));
  });
}

export async function enqueueGradient(token: string, payload: FederatedGradient): Promise<void> {
  const db = await openDb();
  await addRecord<GradientQueueItem>(db, GRADIENT_STORE, {
    id: crypto.randomUUID(),
    token,
    payload,
    createdAt: new Date().toISOString()
  });
}

export async function enqueueCredential(token: string, payload: CredentialMintRequest): Promise<void> {
  const db = await openDb();
  await addRecord<CredentialQueueItem>(db, CREDENTIAL_STORE, {
    id: crypto.randomUUID(),
    token,
    payload,
    createdAt: new Date().toISOString()
  });
}

export async function flushOfflineQueue(): Promise<QueueFlushResult> {
  const db = await openDb();
  const queuedGradients = await getAllRecords<GradientQueueItem>(db, GRADIENT_STORE);
  const queuedCredentials = await getAllRecords<CredentialQueueItem>(db, CREDENTIAL_STORE);

  for (const gradient of queuedGradients) {
    await submitGradients(gradient.token, gradient.payload);
    await deleteRecord(db, GRADIENT_STORE, gradient.id);
  }

  const mintedTxHashes: string[] = [];
  for (const credential of queuedCredentials) {
    const minted = await mintCredential(credential.token, credential.payload);
    mintedTxHashes.push(minted.txHash);
    await deleteRecord(db, CREDENTIAL_STORE, credential.id);
  }

  return { mintedTxHashes };
}

export interface OfflineSyncState {
  isOffline: boolean;
  queueCredential: (token: string, payload: CredentialMintRequest) => Promise<void>;
  queueGradient: (token: string, payload: FederatedGradient) => Promise<void>;
  flushNow: () => Promise<QueueFlushResult>;
}

export function useOfflineSync(): OfflineSyncState {
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);

  const flushNow = useCallback(async (): Promise<QueueFlushResult> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { mintedTxHashes: [] };
    }
    return flushOfflineQueue();
  }, []);

  useEffect(() => {
    function onOnline(): void {
      setIsOffline(false);
      void flushNow();
    }

    function onOffline(): void {
      setIsOffline(true);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushNow]);

  return useMemo(
    () => ({
      isOffline,
      queueCredential: enqueueCredential,
      queueGradient: enqueueGradient,
      flushNow
    }),
    [flushNow, isOffline]
  );
}
