import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getMessaging, onMessage, getToken } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOn_7nMgJAQ3PzXULYXkCnzWNjUDZDp4U",
  authDomain: "cse493e-ryan.firebaseapp.com",
  projectId: "cse493e-ryan",
  storageBucket: "cse493e-ryan.appspot.com",
  messagingSenderId: "140556261506",
  appId: "1:140556261506:web:d2b4af3da671db1f5b7c9b"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

function requestPermission() {
  console.log("requesting permission");
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("notification permission granted");
    }
  })
}

requestPermission()

getToken(messaging, { vapidKey: "BNxcgsUeeJp_f1cfXV638TB0IAUVjU9EW7P8xD2cT7hsGpVV7Bd8vtLHYgBTQLT-727m7OQYdsE1rENHxBLfyoQ"})
  .then((currentToken) => {
   if (currentToken) {
    console.log("token: ", currentToken)
   } else {
    console.log("cannot find token");
   }
  }).catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
});


onMessage(messaging, (payload) => {
  // console.log('Message received. ', payload);
  let data = payload.notification.title.split(",");

  let isPressed = data[3] === "t";

  let dataObject = {
    x: Number(data[0]),
    y: Number(data[1]),
    z: Number(data[2]),
    pressed: isPressed
  }

  window.netData = dataObject;
});


window.netData = {
  x: 0,
  y: 0,
  z: 0,
  pressed: false
};






