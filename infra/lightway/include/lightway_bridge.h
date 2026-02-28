#ifndef LIGHTWAY_BRIDGE_H
#define LIGHTWAY_BRIDGE_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef int (*he_outside_write_cb)(const uint8_t *data, size_t len, void *ctx);
typedef int (*he_inside_write_cb)(const uint8_t *data, size_t len, void *ctx);

typedef struct {
  const char *token;
  const char *remote_host;
  uint16_t remote_port;
  bool enable_mlkem;
  he_outside_write_cb outside_cb;
  he_inside_write_cb inside_cb;
  void *callback_ctx;
} lightway_config_t;

bool lightway_init(const lightway_config_t *config);
bool lightway_is_ready(void);
int lightway_outside_send(const uint8_t *data, size_t len);
int lightway_inside_send(const uint8_t *data, size_t len);

#endif
