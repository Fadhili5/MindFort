#include <napi.h>
#include <string>

extern "C" {
#include "../../../include/lightway_bridge.h"
}

namespace {

int he_outside_write_cb_impl(const uint8_t *data, size_t len, void *ctx) {
  (void)data;
  (void)len;
  (void)ctx;
  return 0;
}

int he_inside_write_cb_impl(const uint8_t *data, size_t len, void *ctx) {
  (void)data;
  (void)len;
  (void)ctx;
  return 0;
}

Napi::Value Initialize(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() < 4 || !info[0].IsString() || !info[1].IsString() || !info[2].IsNumber() || !info[3].IsBoolean()) {
    Napi::TypeError::New(env, "Expected token, host, port, enableMlKem").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string token = info[0].As<Napi::String>().Utf8Value();
  std::string host = info[1].As<Napi::String>().Utf8Value();
  uint16_t port = static_cast<uint16_t>(info[2].As<Napi::Number>().Uint32Value());
  bool enable_mlkem = info[3].As<Napi::Boolean>().Value();

  lightway_config_t config = {
      token.c_str(),
      host.c_str(),
      port,
      enable_mlkem,
      he_outside_write_cb_impl,
      he_inside_write_cb_impl,
      nullptr};

  bool ok = lightway_init(&config);
  return Napi::Boolean::New(env, ok);
}

Napi::Value IsReady(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  return Napi::Boolean::New(env, lightway_is_ready());
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("initialize", Napi::Function::New(env, Initialize));
  exports.Set("isReady", Napi::Function::New(env, IsReady));
  return exports;
}

}  // namespace

NODE_API_MODULE(lightway_bridge, Init)
