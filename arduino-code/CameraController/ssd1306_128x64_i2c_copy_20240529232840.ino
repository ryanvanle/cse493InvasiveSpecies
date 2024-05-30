#include <Arduino.h>
#include "WiFi.h"
#include <HTTPClient.h>

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels

// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
// The pins for I2C are defined by the Wire-library. 
// On an arduino UNO:       A4(SDA), A5(SCL)
// On an arduino MEGA 2560: 20(SDA), 21(SCL)
// On an arduino LEONARDO:   2(SDA),  3(SCL), ...
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3D ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define WIFI_NETWORK "WEEEEEEEE"
#define WIFI_PASSWORD "monkeyflip!"
#define WIFI_TIMEOUT_MS 20000

void setup() {
  Serial.begin(9600);
  delay(2000);

  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }

  Serial.println("hi");
  connectToWifi();  

  display.clearDisplay();
 
}

void loop() {

  display.clearDisplay();
  boolean isConnected = WiFi.status() == WL_CONNECTED;
  if (!isConnected) {
    displayTextCenter("not connected", 1, 0 ,0);
    return;
  }



  displayTextCenter("connected", 1, 0, 0);
  sendRequest();
  display.display();


}


void connectToWifi() {
  Serial.print("connecting to wifi");
  WiFi.mode(WIFI_STA); 
  WiFi.begin(WIFI_NETWORK, WIFI_PASSWORD);

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < WIFI_TIMEOUT_MS) {
    Serial.print(".");
    delay(100);
  }  

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Failed");
  } else {
    Serial.print("Connected");
    Serial.println(WiFi.localIP());
  }
}


void sendRequest() {
  Serial.println("sendRequest");

  HTTPClient http;

  // String queries = "?x=" + String(xAcceleration) + "&y=" + String(yAcceleration) + "&z=" + String(zAcceleration) + "&pressed=" + buttonStateShorten;
  String getPointURL = "http://10.0.0.172:8005/receiveData"; // home
  // String getPointURL = "http://172.20.10.2:8005/sendData"; // hotspot

  String finalQuery = getPointURL;

  http.begin(finalQuery);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();

    displayData(payload);

    Serial.println(httpCode);
    Serial.println(payload);
  } else {
    Serial.print(httpCode);
    Serial.println(" code");
  }

  http.end();

  // j++;
  // Serial.print(j);


}

void displayData(String payload) {

  display.clearDisplay();
  int firstComma = payload.indexOf(',');
  int secondComma = payload.indexOf(',', firstComma + 1);

  String value1 = payload.substring(0, firstComma);
  String value2 = payload.substring(firstComma + 1, secondComma);
  String value3 = payload.substring(secondComma + 1);

  Serial.println(value3);

  displayTextCenter(value3, 2, 0, 0);

  display.display();


  // No need to convert to other data types, as they are already strings
  // Process the values (value1, value2, value3)
}

void displayTextCenter(String text, uint8_t textSize, int16_t xOffset, int16_t yOffset) {
  int16_t x;
  int16_t y;
  uint16_t textWidth;
  uint16_t textHeight;

  display.setTextSize(textSize);
  display.setTextColor(WHITE, BLACK);
  display.getTextBounds(text, 0, 0, &x, &y, &textWidth, &textHeight);
  centerCursorWithText(xOffset, yOffset, textWidth, textHeight);
  display.print(text);
}

void displayText(String text, uint8_t textSize, int16_t xPosition, int16_t yPosition) {
  int16_t x;
  int16_t y;
  uint16_t textWidth;
  uint16_t textHeight;

  display.setTextSize(textSize);
  display.setTextColor(WHITE, BLACK);
  display.getTextBounds(text, 0, 0, &x, &y, &textWidth, &textHeight);
  display.setCursor(xPosition, yPosition - textHeight);
  display.print(text);
}

void centerCursorWithText(int16_t xOffset, int16_t yOffset, uint16_t textWidth, uint16_t textHeight) {
  display.setCursor(display.width() / 2 - textWidth / 2 + xOffset, display.height() / 2 - textHeight / 2 + yOffset);
}

