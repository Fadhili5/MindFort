FROM ghcr.io/ggml-org/llama.cpp:server
EXPOSE 8080
CMD ["--model", "/models/phi-3-mini-4k-instruct-q4_k_m.gguf", "--host", "0.0.0.0", "--port", "8080", "--ctx-size", "4096", "--seed", "42", "--threads", "4", "--no-warmup"]
