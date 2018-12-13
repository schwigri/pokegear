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

let bodyMasthead = document.getElementById('masthead');

let alternateMasthead = () => {
  if (window.scrollY === 0) {
    bodyMasthead.classList.add('inverse');
  } else {
    bodyMasthead.classList.remove('inverse');
  }
};

window.requestAnimationFrame(alternateMasthead);
window.setInterval(alternateMasthead, 10);

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    bodyMasthead.classList.remove('logged-out');
    bodyMasthead.classList.add('logged-in');
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
          let selectedGame = document.getElementById('game').value;
          let trainerName = document.getElementById('trainer-name').value;
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
            let pokedexItemContainer = document.createElement('div');
            pokedexItemContainer.classList.add('pokedex-list-item');
            pokedexItemContainer.classList.add(doc.data()['pokedex']);

            let pokedexButton = document.createElement('a');
            let pokedexImage = document.createElement('img');
            pokedexImage.setAttribute('src', '/assets/graphics/covers/' + doc.data()['pokedex'] + '.png');
            pokedexImage.setAttribute('alt', 'Pokémon ' + doc.data()['pokedex'] + ' version cover');
            pokedexButton.appendChild(pokedexImage);
            let pokedexText = document.createElement('span');
            pokedexText.innerHTML = doc.data()['trainerName'];
            pokedexButton.appendChild(pokedexText);
            pokedexButton.setAttribute('href', '/dex?uid=' + user.uid + '&id=' + doc.id);
            pokedexItemContainer.appendChild(pokedexButton);
            userPokedexesContainer.appendChild(pokedexItemContainer);
          });
        });
      }


      // If page is Dex
      if (PAGE === 'dex') {
        let currentUrl = new URL(window.location.href);
        let pokedexId = currentUrl.searchParams.get('id');
        let pokemonItems = document.getElementsByClassName('pokedex-item-choose-link');

        let numTotalContainer = document.getElementById('num-total');
        let numCaughtContainer = document.getElementById('num-caught');

        let updateCount = () => {
          let caught = document.getElementsByClassName('caught');
          numCaughtContainer.innerText = '' + caught.length;
        };

        for (let button of pokemonItems) {
          button.addEventListener('click', () => {
            let item = button.parentElement;
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
                }).then(() => {
                  updateCount();
                });
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
                }).then(() => {
                  updateCount();
                });
              });
            }
          }, true);
        }
        let infoButtons = document.getElementsByClassName('pokedex-item-info-button-container');
        let getBulbaUrl = (name) => {
          return 'https://cors.io/?https://bulbapedia.bulbagarden.net/wiki/' + name + '_(Pok%C3%A9mon)';
        };

        let bulbaContent = document.getElementById('bulbapedia-content');

        let pokemonLocationInfo = document.getElementById('pokemon-location-info');
        let pokemonLocationInfoContainer = document.getElementById('li-container');
        let pokemonLocationName = document.getElementById('li-name');
        let pokemonLocationsContainer = document.getElementById('li-spots');


        for (let button of infoButtons) {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            pokemonLocationInfo.classList.add('visible');
            pokemonLocationInfoContainer.classList.remove('visible');
            let pokemonTarget = button.dataset.pokemon;
            let url = getBulbaUrl(pokemonTarget.replace(/ /g, '_'));

            pokemonLocationName.innerText = pokemonTarget;
            pokemonLocationsContainer.innerHTML = '';

            fetch(url).then((response) => response.text()).then(pageSource => {
              bulbaContent.innerHTML = pageSource;
              let locationsTable = document.getElementById('Game_locations').parentElement.nextElementSibling.firstElementChild;
              let found = false;
              for (let node of locationsTable.children) {
                if (!found) {
                  let games = node.querySelectorAll('td table tbody tr:nth-child(2) td table tbody');
                  for (let game of games) {
                    if (!found) {
                      let gameTitles = game.querySelectorAll('th');
                      for (let gameTitle of gameTitles) {
                        if (!found) {
                          let rowGameTitle = gameTitle.firstElementChild.firstElementChild.innerHTML.toLocaleLowerCase().trim().replace(/ /g, '-');
                          if (rowGameTitle === document.getElementById('pokedex').dataset.game) {
                            let locations = gameTitle.parentElement.querySelector('td').firstElementChild.firstElementChild.firstElementChild.firstElementChild.innerHTML;
                            let allLocations = locations.split(', ');
                            pokemonLocationsContainer.innerHMTL = '';
                            for (let loc of allLocations) {
                              let locEl = document.createElement('li');
                              locEl.innerHTML = loc;
                              pokemonLocationsContainer.appendChild(locEl);
                            }
                            found = true;
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              }
              let bulbaLinks = document.querySelectorAll('#pokemon-location-info a');
              for (let link of bulbaLinks) {
                let currentDest = link.getAttribute('href');
                link.setAttribute('target', '_blank');
                link.setAttribute('href', 'https://bulbapedia.bulbagarden.net' + currentDest);
              }
              pokemonLocationInfoContainer.classList.add('visible');
            });
          }, true);
        }
        db.collection('users').doc(user.uid).collection('pokedexes').doc(pokedexId).get().then((doc) => {
          document.getElementById('trainer-name').innerText = doc.data()['trainerName'];
          if (doc.data()['caught'] !== undefined) {
            for (let pokemonNumber of doc.data()['caught']) {
              document.getElementById('pokemon-' + pokemonNumber).classList.add('caught');
            }
            updateCount();
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
