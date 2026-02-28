export interface TunnelConfig {
  serverIp: string;
  port: number;
  psk: string;
  mode: "wasm" | "stub";
}

export interface LightwayTunnel {
  readonly isReady: boolean;
  send(url: string, init?: RequestInit): Promise<Response>;
  close(): void;
}
