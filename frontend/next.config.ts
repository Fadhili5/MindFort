/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mindvault/types", "@mindvault/llm"],

  /**
   * COOP + COEP headers are required for SharedArrayBuffer, which WebLLM needs
   * to parallelise WebGPU shader compilation across worker threads.
   * Applied to every route so the tutor page gets it automatically.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy",  value: "require-corp" },
          { key: "Cross-Origin-Resource-Policy",  value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
