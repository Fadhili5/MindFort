import type { LightwayTunnel, TunnelConfig } from "./types.js";
import { padTo450, stripPadding } from "./padding.js";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

export class StubTunnel implements LightwayTunnel {
  readonly isReady = true;
  private readonly config: TunnelConfig;

  constructor(config: TunnelConfig) {
    this.config = config;
  }

  async send(url: string, init?: RequestInit): Promise<Response> {
    const method = (init?.method ?? "GET").toUpperCase();

    if (METHODS_WITH_BODY.has(method) && init?.body != null) {
      const raw =
        typeof init.body === "string"
          ? new TextEncoder().encode(init.body)
          : new Uint8Array(init.body as ArrayBuffer);

      const padded = padTo450(raw);
      const verified = stripPadding(padded);

      console.log(
        `[lightway:stub] → ${method} ${url} (body: ${raw.byteLength}B → padded: ${padded.byteLength}B → verified: ${verified.byteLength}B, unencrypted)`
      );

      return fetch(url, { ...init, body: verified as unknown as BodyInit });
    }

    return fetch(url, init);
  }

  close(): void {
    console.log("[lightway:stub] tunnel closed");
  }
}
