// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyCOn_7nMgJAQ3PzXULYXkCnzWNjUDZDp4U",
  authDomain: "cse493e-ryan.firebaseapp.com",
  projectId: "cse493e-ryan",
  storageBucket: "cse493e-ryan.appspot.com",
  messagingSenderId: "140556261506",
  appId: "1:140556261506:web:d2b4af3da671db1f5b7c9b"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();