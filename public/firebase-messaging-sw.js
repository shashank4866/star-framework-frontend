importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAhSc0EZl-Ah1Af_YErhOx_0hFdBs1BXOI",
  authDomain: "fcm-demo-b8977.firebaseapp.com",
  projectId: "fcm-demo-b8977",
  storageBucket: "fcm-demo-b8977.firebasestorage.app",
  messagingSenderId: "546938487296",
  appId: "1:546938487296:web:0b7cb06338df8929f28ee5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
