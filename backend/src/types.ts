export interface AuthContext {
  pseudoId: string;
}

export interface LightwayProxyRequest {
  method: "GET" | "POST";
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}
