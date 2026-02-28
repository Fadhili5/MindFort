import type { LightwayTunnel, TunnelConfig } from "./types.js";
import type { LightwayWasmExports } from "./wasm-loader.js";
import { loadLightwayWasm, LightwayWasmNotFoundError } from "./wasm-loader.js";
import { StubTunnel } from "./stub.js";
import { padTo450, stripPadding } from "./padding.js";

export class WasmTunnel implements LightwayTunnel {
  private readonly config: TunnelConfig;
  private wasm: LightwayWasmExports | null = null;
  private ctx = 0;
  private fallback: StubTunnel | null = null;

  get isReady(): boolean {
    return this.wasm != null || this.fallback != null;
  }

  constructor(config: TunnelConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      const mod = await loadLightwayWasm();
      this.wasm = mod.exports;
      this.wasm.he_init();
      const pskBuf = new TextEncoder().encode(this.config.psk);
      this.ctx = this.wasm.he_tunnel_create(0, pskBuf.byteLength);
      console.log("[lightway:wasm] tunnel initialised");
    } catch (err) {
      if (err instanceof LightwayWasmNotFoundError) {
        console.warn(
          `[lightway:wasm] WASM binary not found — falling back to stub`
        );
        this.fallback = new StubTunnel(this.config);
      } else {
        throw err;
      }
    }
  }

  async send(url: string, init?: RequestInit): Promise<Response> {
    if (this.fallback) return this.fallback.send(url, init);

    if (!this.wasm) throw new Error("WasmTunnel not initialised");

    const method = (init?.method ?? "GET").toUpperCase();
    if (init?.body != null && ["POST", "PUT", "PATCH"].includes(method)) {
      const raw =
        typeof init.body === "string"
          ? new TextEncoder().encode(init.body)
          : new Uint8Array(init.body as ArrayBuffer);

      const padded = padTo450(raw);
      this.wasm.he_tunnel_send(this.ctx, 0, padded.byteLength);
      const verified = stripPadding(padded);
      return fetch(url, { ...init, body: verified as unknown as BodyInit });
    }

    return fetch(url, init);
  }

  close(): void {
    if (this.fallback) {
      this.fallback.close();
    } else if (this.wasm) {
      this.wasm.he_tunnel_close(this.ctx);
      console.log("[lightway:wasm] tunnel closed");
    }
  }
}
