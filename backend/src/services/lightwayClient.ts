import type { AppConfig } from "../config.js";
import type { LightwayProxyRequest } from "../types.js";

export async function tunneledFetch(config: AppConfig, request: LightwayProxyRequest): Promise<Response> {
  try {
    const response = await fetch(`${config.LIGHTWAY_PROXY_URL}/proxy`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.LIGHTWAY_TOKEN ? { "x-lightway-token": config.LIGHTWAY_TOKEN } : {})
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Lightway proxy returned ${response.status}`);
    }

    const proxyData = (await response.json()) as {
      status: number;
      headers: Record<string, string>;
      body: unknown;
    };

    return new Response(JSON.stringify(proxyData.body), {
      status: proxyData.status,
      headers: proxyData.headers
    });
  } catch {
    const fallbackInit: RequestInit = {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined
    };
    return fetch(request.url, fallbackInit);
  }
}
