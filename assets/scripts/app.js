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

let masthead = document.getElementById('masthead');

let alternateMasthead = () => {
  if (window.scrollY === 0) {
    masthead.classList.add('inverse');
  } else {
    masthead.classList.remove('inverse');
  }
};

window.requestAnimationFrame(alternateMasthead);
window.setInterval(alternateMasthead, 10);

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('masthead').classList.remove('logged-out');
    document.getElementById('masthead').classList.add('logged-in');
    // Check if they've gone through onboarding
    let onboardingDone = false;
    db.collection('users').doc(user.uid).collection('pokedexes').limit(1).get().then((qs) => {
      qs.forEach((doc) => {
        onboardingDone = true;
      });
    }).then(() => {
      if (PAGE !== 'portal' && PAGE !== 'about' && PAGE !== 'contact' && !onboardingDone && PAGE !== 'welcome') {
        window.location.href = '/welcome';
      }

      // If page is Welcome
      if (PAGE === 'welcome') {
        let onboardingForm = document.getElementById('onboarding-form');
        onboardingForm.addEventListener('submit', (e) => {
          e.preventDefault();
          selectedGame = document.getElementById('game').value;
          trainerName = document.getElementById('trainer-name').value;
          if (trainerName === '' || selectedGame === '') {
            return false;
          }
          db.collection('users').doc(firebase.auth().currentUser.uid).collection('pokedexes').add({
            'pokedex': selectedGame,
            'trainerName': trainerName
          }).catch((error) => {
            console.error(error);
          }).then((documentReference) => {
            window.location.href = '/dex?uid=' + firebase.auth().currentUser.uid + '&id=' + documentReference.id;
          });
        });
      }


      // If page is Selector
      if (PAGE === 'selector') {
        db.collection('users').doc(user.uid).collection('pokedexes').get().then((ps) => {
          let userPokedexesContainer = document.getElementById('user-pokedexes');
          ps.forEach((doc) => {
            console.log(doc.data());
            let pokedexItemContainer = document.createElement('div');
            pokedexItemContainer.classList.add('pokedex-list-item');
            let pokedexButton = document.createElement('a');
            pokedexButton.innerHTML = doc.data()['trainerName'] + '\'s ' + doc.data()['pokedex'] + ' Pokédex';
            pokedexButton.setAttribute('href', '/dex?uid=' + user.uid + '&id=' + doc.id);
            pokedexButton.classList.add('btn');
            pokedexButton.classList.add('btn-submit');
            pokedexItemContainer.appendChild(pokedexButton);
            userPokedexesContainer.appendChild(pokedexItemContainer);
          });
        });
      }


      // If page is Dex
      if (PAGE === 'dex') {
        let currentUrl = new URL(window.location.href);
        let pokedexId = currentUrl.searchParams.get('id');
        let pokemonItems = document.getElementsByClassName('pokedex-item');
        for (let item of pokemonItems) {
          item.addEventListener('click', () => {
            if (item.classList.contains('caught')) {
              item.classList.remove('caught');
              db.collection('users').doc(user.uid).collection('pokedexes').doc(pokedexId).get().then((doc) => {
                let caughtPokemon = doc.data()['caught'];
                if (caughtPokemon !== undefined) {
                  let i = caughtPokemon.indexOf(item.dataset.id);
                  if (i > -1) {
                    caughtPokemon.splice(i, 1);
                  }
                }
                db.collection('users').doc(user.uid).collection('pokedexes').doc(pokedexId).update({
                  'caught': caughtPokemon
                })
              });
            } else {
              item.classList.add('caught');
              db.collection('users').doc(user.uid).collection('pokedexes').doc(pokedexId).get().then((doc) => {
                let caughtPokemon = doc.data()['caught'];
                if (caughtPokemon !== undefined) {
                  caughtPokemon.push(item.dataset.id)
                } else {
                  caughtPokemon = [item.dataset.id]
                }
                db.collection('users').doc(user.uid).collection('pokedexes').doc(pokedexId).update({
                  'caught': caughtPokemon
                })
              });
            }
          });
        }
        db.collection('users').doc(user.uid).collection('pokedexes').doc(pokedexId).get().then((doc) => {
          if (doc.data()['caught'] !== undefined) {
            for (let pokemonNumber of doc.data()['caught']) {
              document.getElementById('pokemon-' + pokemonNumber).classList.add('caught');
            }
          }
        }).catch((error) => {
          console.error(error);
        });
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

let logOutLink = document.getElementById('log-out-link');
logOutLink.addEventListener('click', (e) => {
  e.preventDefault();
  firebase.auth().signOut();
});

if (PAGE === 'portal') {
  let authenticationPortal = document.getElementById('authentication-portal');
  let logInLinks = document.getElementsByClassName('log-in-link');
  for (let logInLink of logInLinks) {
    logInLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (firebase.auth().currentUser) {
        window.location.href = '/dex';
      } else {
        authenticationPortal.classList.add('visible');
      }
    });
  }
  authenticationPortal.addEventListener('click', () => {
    authenticationPortal.classList.remove('visible');
  });
}
