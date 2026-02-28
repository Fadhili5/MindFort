import type { LightwayTunnel, TunnelConfig } from "./types.js";
import { StubTunnel } from "./stub.js";
import { WasmTunnel } from "./wasm-tunnel.js";

export async function createTunnel(config: TunnelConfig): Promise<LightwayTunnel> {
  if (config.mode === "stub") {
    return new StubTunnel(config);
  }
  const tunnel = new WasmTunnel(config);
  await tunnel.initialize();
  return tunnel;
}
