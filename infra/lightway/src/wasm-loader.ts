import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export interface LightwayWasmExports {
  he_init(): void;
  he_tunnel_create(pskPtr: number, pskLen: number): number;
  he_tunnel_send(ctx: number, bufPtr: number, bufLen: number): number;
  he_tunnel_close(ctx: number): void;
}

export interface LightwayWasmModule {
  instance: WebAssembly.Instance;
  exports: LightwayWasmExports;
}

export class LightwayWasmNotFoundError extends Error {
  constructor(path: string) {
    super(`Lightway WASM binary not found at ${path}`);
    this.name = "LightwayWasmNotFoundError";
  }
}

export async function loadLightwayWasm(): Promise<LightwayWasmModule> {
  const selfDir = dirname(fileURLToPath(import.meta.url));
  const wasmPath = join(selfDir, "..", "wasm", "lightway.wasm");

  let bytes: Buffer;
  try {
    bytes = await readFile(wasmPath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new LightwayWasmNotFoundError(wasmPath);
    }
    throw err;
  }

  const result = await WebAssembly.instantiate(bytes) as unknown as { instance: WebAssembly.Instance };
  return {
    instance: result.instance,
    exports: result.instance.exports as unknown as LightwayWasmExports,
  };
}
