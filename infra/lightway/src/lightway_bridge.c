#include "../include/lightway_bridge.h"

#include <stdbool.h>
#include <string.h>

static bool g_ready = false;
static lightway_config_t g_config;

bool lightway_init(const lightway_config_t *config) {
  if (config == NULL || config->token == NULL || strlen(config->token) == 0) {
    g_ready = false;
    return false;
  }

  g_config = *config;
  g_ready = true;
  return true;
}

bool lightway_is_ready(void) {
  return g_ready;
}

int lightway_outside_send(const uint8_t *data, size_t len) {
  if (!g_ready || g_config.outside_cb == NULL) {
    return -1;
  }
  return g_config.outside_cb(data, len, g_config.callback_ctx);
}

int lightway_inside_send(const uint8_t *data, size_t len) {
  if (!g_ready || g_config.inside_cb == NULL) {
    return -1;
  }
  return g_config.inside_cb(data, len, g_config.callback_ctx);
}
