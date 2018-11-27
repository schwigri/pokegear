import os

import json

import firebase_admin
from firebase_admin import firestore

credentials = firebase_admin.credentials.Certificate('../private/firebase-credentials.json')
firebase_admin.initialize_app(credentials, {
    'projectId': os.environ.get('PROJECT_ID'),
})
db = firestore.client()

class PokeApiDataProcessor:
    __DATA_TYPES = {
        'evolutions': 'Evolutions',
        'games': 'Games',
        'generations': 'Generations',
        'pokedexes': 'Pokédexes',
        'pokemon': 'Pokémon',
    }
    __DATA_FILES = {
        'evolutions': 'evolutions.json',
        'games': 'games.json',
        'generations': 'generations.json',
        'pokedexes': 'pokedexes.json',
        'pokemon': 'pokemon.json',
    }

    def __init__(self):
        self.data = {
            'evolutions': {},
            'generations': {},
            'pokemon': {},
        }

    def load_data(self, data_type):
        if data_type in self.__DATA_TYPES:
            print('Loading data for {}'.format(self.__DATA_TYPES.get(data_type)))
            with open(self.__DATA_FILES.get(data_type)) as file:
                raw_data = file.read()
            parsed_data = json.loads(raw_data)
            self.data.update({
                data_type: parsed_data
            })
            print('Loaded!')
        else:
            print('Unknown data type')

    def store_data(self, data_type):
        if data_type in self.__DATA_TYPES:
            print('Storing data in Firestore')
            for document in self.data.get(data_type):
                db.collection(data_type).document(document).set(self.data.get(data_type, {}).get(document))
            print('Stored!')
        else:
            print('Unknown data type')


processor = PokeApiDataProcessor()
# processor.load_data('pokemon')
# processor.store_data('pokemon')
# processor.load_data('evolutions')
# processor.store_data('evolutions')
# processor.load_data('games')
# processor.store_data('games')
# processor.load_data('pokedexes')
# processor.store_data('pokedexes')
