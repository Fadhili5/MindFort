import { createRequire } from "node:module";

interface LightwayNative {
  initialize: (token: string, host: string, port: number, enableMlKem: boolean) => boolean;
  isReady: () => boolean;
}

const nodeRequire = createRequire(import.meta.url);

export function loadNativeBridge(): LightwayNative {
  const modulePath = new URL("./lightway_bridge.node", import.meta.url);
  return nodeRequire(modulePath.pathname) as LightwayNative;
}
