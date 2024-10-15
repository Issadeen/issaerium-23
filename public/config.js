// public/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDklv5Sgwiy84_fCOqiQRCiuTBVRZ_2EvY",
    authDomain: "my-1-wb.firebaseapp.com",
        projectId: "my-1-wb",
        storageBucket: "my-1-wb.appspot.com",
        messagingSenderId: "865633557898",
        appId: "1:865633557898:web:5e8a848b08d7475054bc73"
  };
  
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  