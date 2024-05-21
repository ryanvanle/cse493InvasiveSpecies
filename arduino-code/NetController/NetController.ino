// used code
// https://www.youtube.com/watch?v=6zbEVAXVBjI wifi connecting
// https://www.youtube.com/watch?v=s_2cw0k6lgs http get request


#include <Arduino.h>
#include "WiFi.h"
#include <HTTPClient.h>

#include <Wire.h>
#include <SPI.h>
#include <Adafruit_LIS3DH.h>
#include <Adafruit_Sensor.h>

// Used for software SPI
#define LIS3DH_CLK 13
#define LIS3DH_MISO 12
#define LIS3DH_MOSI 11
// Used for hardware & software SPI
#define LIS3DH_CS 10

Adafruit_LIS3DH lis = Adafruit_LIS3DH();


#define WIFI_NETWORK "Ryan"
#define WIFI_PASSWORD "monkeyflip"
#define WIFI_TIMEOUT_MS 20000


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

void setup() {
  Serial.begin(9600);
  while (!Serial) delay(10);     // will pause Zero, Leonardo, etc until serial console opens
  
  if (! lis.begin(0x18)) {   // change this to 0x19 for alternative i2c address
    Serial.println("Couldnt start");
    while (1) yield();
  }

  // connectToWifi();  
}

void loop() {
  boolean isConnected = WiFi.status() == WL_CONNECTED;
  // if (!isConnected) return;
  // sendRequest();
  sendData();

}

// "x,y,z,x-acc,y-acc,z-acc, isButtonPressed"
void sendData() {
  // printAllData();
  sensors_event_t event;
  lis.getEvent(&event);

  float zAcceleration = event.acceleration.z;
  float difference =  abs(zAcceleration + 9.81);
  
  float upperBound = 2;

  boolean isCaught = 0 < difference && difference < upperBound;

  String status = isCaught ? "Caught" : "No Caught";

  Serial.println(status);

 
}

void printAllData() {
  sensors_event_t event;
  lis.getEvent(&event);


  float data[] = {lis.x, lis.y, lis.z, event.acceleration.x, event.acceleration.y, event.acceleration.z};
  const int DATA_LENGTH = 6;

  String output = "";
  for (int i = 0; i < DATA_LENGTH; i++) {
    output += String(data[i]);
    if (i + 1 != DATA_LENGTH) output += ",";
  }


  Serial.println(output);

}



void sendRequest() {
  delay(5000);

  HTTPClient http;

  String getPointURL = "https://capture-maqg6drbdq-uc.a.run.app/";
  http.begin(getPointURL);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    Serial.println(httpCode);
    Serial.println(payload);
  } else {
    Serial.print(httpCode);
    Serial.println(" code");
  }

  http.end();

  delay(5000);



}