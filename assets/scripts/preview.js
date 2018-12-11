const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDAgH_lsRqdiAfaRwvw1EmnSqYXdmGXJ-o',
  authDomain: 'hcde-310-221704.firebaseapp.com',
  databaseURL: 'https://hcde-310-221704.firebaseio.com',
  projectId: 'hcde-310-221704',
  storageBucket: 'hcde-310-221704.appspot.com',
  messagingSenderId: '306209852582',
};
firebase.initializeApp(FIREBASE_CONFIG);

class PokegearPreview {
  static get supportedWheelEvent() {
    return 'onwheel' in HTMLDivElement.prototype ? 'wheel' : document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';
  }

  static get passivity() {
    let passive = false;
    try {
      let options = Object.defineProperty({}, 'passive', {
        get: () => {
          passive = true;
        }
      });
      window.addEventListener('test', null, options);
    } catch (e) {
      console.error('Oops!', e);
    }
    return {
      passive: passive,
    };
  }

  constructor() {

    this.status = {
      'currentWidth': 50,
      'leftPanel': document.getElementById('introduction-left-panel'),
      'rightPanel': document.getElementById('introduction-right-panel'),
    };

    this.scrollListener = this.scrollListener.bind(this);
    this.updateWidths = this.updateWidths.bind(this);
  }

  scrollListener(e) {
    let change = e.deltaY / 50;
    this.status.currentWidth = Math.min(85, Math.max(15, this.status.currentWidth + change));
    window.requestAnimationFrame(this.updateWidths);
  }

  updateWidths() {
    this.status.leftPanel.style.width = this.status.currentWidth + 'vw';
    this.status.rightPanel.style.width = (100 - this.status.currentWidth) + 'vw';
  }

  createScrollListener() {
    window.addEventListener(PokegearPreview.supportedWheelEvent, this.scrollListener, PokegearPreview.passivity);
  }

  destroyScrollListener() {
    window.removeEventListener(PokegearPreview.supportedWheelEvent, this.scrollListener, PokegearPreview.passivity);
  }
}

let app = new PokegearPreview();
app.createScrollListener();

let authScreen = document.getElementById('auth-screen');

let authLinks = document.getElementsByClassName('auth-link');
for (let link of authLinks) {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.body.classList.add('auth-visible');
    authScreen.classList.add('visible');
    app.destroyScrollListener();
  }, false);
}

let authExit = document.getElementById('auth-exit');
authExit.addEventListener('click', (e) => {
  e.preventDefault();
  document.body.classList.remove('auth-visible');
  authScreen.classList.remove('visible');
  app.createScrollListener();
}, false);

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    for (let link of authLinks) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/dex';
      });
    }
  }
});
