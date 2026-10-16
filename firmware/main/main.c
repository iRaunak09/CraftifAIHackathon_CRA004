/*
 * ESP32 FirmGen Firmware: OmniRetail IoT Cashier Actuator Beacon
 * Built for HackwithBangalore 4.0 / Embedded SF (Closed-Loop Bonus)
 * Target MCU: ESP32 / ESP32-S3 (ESP-IDF v5.5)
 * Communication: MQTT over Wi-Fi + Serial UART
 */

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_system.h"
#include "esp_log.h"
#include "driver/gpio.h"
#include "driver/ledc.h"
#include "esp_wifi.h"
#include "mqtt_client.h"
#include "cJSON.h"

static const char *TAG = "OMNIRETAIL_ACTUATOR";

#define GPIO_PIN_STROBE_LED    GPIO_NUM_18
#define GPIO_PIN_BUZZER        GPIO_NUM_19
#define GPIO_PIN_STATUS_LED    GPIO_NUM_21

#define MQTT_BROKER_URI        "mqtt://192.168.1.100:1883"
#define MQTT_TOPIC_EVENTS      "retail/store1/events"

static esp_mqtt_client_handle_t mqtt_client = NULL;
static bool alert_active = false;

// Configure GPIO and PWM timer for auditory alarm
static void init_actuator_hardware(void) {
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << GPIO_PIN_STROBE_LED) | (1ULL << GPIO_PIN_STATUS_LED),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&io_conf);

    // PWM configuration for Buzzer (900 Hz tone)
    ledc_timer_config_t ledc_timer = {
        .speed_mode       = LEDC_LOW_SPEED_MODE,
        .timer_num        = LEDC_TIMER_0,
        .duty_resolution  = LEDC_TIMER_10_BIT,
        .freq_hz          = 900,
        .clk_cfg          = LEDC_AUTO_CLK
    };
    ledc_timer_config(&ledc_timer);

    ledc_channel_config_t ledc_channel = {
        .speed_mode     = LEDC_LOW_SPEED_MODE,
        .channel        = LEDC_CHANNEL_0,
        .timer_sel      = LEDC_TIMER_0,
        .intr_type      = LEDC_INTR_DISABLE,
        .gpio_num       = GPIO_PIN_BUZZER,
        .duty           = 0,
        .hpoint         = 0
    };
    ledc_channel_config(&ledc_channel);

    gpio_set_level(GPIO_PIN_STATUS_LED, 1);
    ESP_LOGI(TAG, "Hardware GPIO 18 (Strobe), 19 (Buzzer), 21 (Status) Initialized.");
}

// Actuator strobe task
static void strobe_alert_task(void *pvParameters) {
    while (1) {
        if (alert_active) {
            gpio_set_level(GPIO_PIN_STROBE_LED, 1);
            ledc_set_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 512); // 50% duty
            ledc_update_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0);
            vTaskDelay(pdMS_TO_TICKS(150));

            gpio_set_level(GPIO_PIN_STROBE_LED, 0);
            ledc_set_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 0);
            ledc_update_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0);
            vTaskDelay(pdMS_TO_TICKS(150));
        } else {
            gpio_set_level(GPIO_PIN_STROBE_LED, 0);
            ledc_set_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 0);
            ledc_update_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0);
            vTaskDelay(pdMS_TO_TICKS(500));
        }
    }
}

// Handle incoming perception events from CraftifAI PipeGen
static void process_perception_payload(const char *payload) {
    cJSON *root = cJSON_Parse(payload);
    if (!root) return;

    cJSON *event_type = cJSON_GetObjectItem(root, "event_type");
    if (event_type && event_type->valuestring) {
        if (strcmp(event_type->valuestring, "QUEUE_OVERFLOW_ALERT") == 0) {
            alert_active = true;
            ESP_LOGW(TAG, "🚨 PipeGen Perception Trigger: QUEUE_OVERFLOW -> Activating Cashier Strobe & Buzzer!");
        } else if (strcmp(event_type->valuestring, "QUEUE_NORMALIZED") == 0) {
            alert_active = false;
            ESP_LOGI(TAG, "✅ PipeGen Perception Trigger: QUEUE_NORMALIZED -> Deactivating Alarm.");
        }
    }
    cJSON_Delete(root);
}

// MQTT Event Callback
static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = event_data;
    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "Connected to PipeGen MQTT broker.");
            esp_mqtt_client_subscribe(mqtt_client, MQTT_TOPIC_EVENTS, 0);
            break;
        case MQTT_EVENT_DATA:
            process_perception_payload(event->data);
            break;
        default:
            break;
    }
}

void app_main(void) {
    ESP_LOGI(TAG, "Booting FirmGen v0.4.1 Actuator Runtime for ESP32-S3...");
    init_actuator_hardware();

    // Start background actuator task
    xTaskCreate(strobe_alert_task, "strobe_task", 2048, NULL, 5, NULL);

    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = MQTT_BROKER_URI,
    };
    mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_mqtt_client_start(mqtt_client);

    ESP_LOGI(TAG, "Closed Loop Ready. Free Heap: %lu B", esp_get_free_heap_size());
}
