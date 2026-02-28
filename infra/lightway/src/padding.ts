const BLOCK = 450;

/**
 * Pad data to the next multiple of 450 bytes.
 * Format: [4-byte big-endian length][original data][random padding]
 */
export function padTo450(data: Uint8Array): Uint8Array {
  const total = Math.ceil((4 + data.byteLength) / BLOCK) * BLOCK;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.byteLength, false); // big-endian length
  out.set(data, 4);
  crypto.getRandomValues(out.subarray(4 + data.byteLength));
  return out;
}

/** Strip padding produced by padTo450. */
export function stripPadding(padded: Uint8Array): Uint8Array {
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  const len = view.getUint32(0, false);
  return padded.slice(4, 4 + len);
}
