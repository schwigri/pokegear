const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDAgH_lsRqdiAfaRwvw1EmnSqYXdmGXJ-o',
  authDomain: 'hcde-310-221704.firebaseapp.com',
  databaseURL: 'https://hcde-310-221704.firebaseio.com',
  projectId: 'hcde-310-221704',
  storageBucket: 'hcde-310-221704.appspot.com',
  messagingSenderId: '306209852582',
};
firebase.initializeApp(FIREBASE_CONFIG);

const PAGE = document.body.dataset.page;
const db = firebase.firestore();
db.settings({
  timestampsInSnapshots: true
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // Check if they've gone through onboarding
    let onboardingDone = false;
    db.collection('users').doc(user.uid).get().then((doc) => {
      if (doc.exists) {
        onboardingDone = true;
      }
    }).then(() => {
      if (!onboardingDone && PAGE !== 'welcome') {
        window.location.href = '/welcome';
      } else if (onboardingDone && (PAGE === 'portal' || PAGE === 'welcome')) {
        window.location.href = '/dex';
      }
    }).catch((error) => {
      console.error('Error!', error);
    });
  } else {
    if (PAGE !== 'portal') {
      window.location.href = '/';
    }
  }
});
