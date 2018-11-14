import os

import urllib.request
import urllib.error

import json

import firebase_admin
from firebase_admin import firestore

credentials = firebase_admin.credentials.Certificate('private/firebase-credentials.json')
firebase_admin.initialize_app(credentials, {
    'projectId': os.environ.get('PROJECT_ID'),
})
db = firestore.client()

API_BASE_URL = 'https://pokeapi.co/api/v2'
API_HEADERS = {
    'User-Agent': 'URLLIB'
}

master_data = {
    'generations': {},
    'games': {}
}


def get_data(url):
    request = urllib.request.Request(url, data=None, headers=API_HEADERS)
    data = {}
    try:
        with urllib.request.urlopen(request) as response:
            response_data = response.read()
        data = json.loads(response_data)
    except urllib.error.URLError as error:
        print('Url Error: {}'.format(error))
    return data


request_url = '{}/{}'.format(API_BASE_URL, 'generation')
data = get_data(request_url)

for generation in data.get('results', []):
    data = get_data(generation.get('url'))

    name = generation.get('name')

    # Setup basic structure
    master_data['generations'][name] = {
        'id': data.get(1, 0),
        'main-region': {},
        'name': data.get('name'),
        'names': {},
        'pokemon': [],
        'versions': []
    }

    # Get region information
    region_data = get_data(data.get('main_region', {}).get('url'))
    for name in region_data.get('names', []):
        master_data['generations'][name]['main-region'][name.get('language', {}).get('name')] = name.get('name')

    # Get generation names
    for name in data.get('names', []):
        master_data['generations'][name]['names'][name.get('language', {}).get('name')] = name.get('name')

    # Get pokemon for the generation
    for pokemon in data.get('pokemon_species', []):
        number = pokemon.get('url', '').replace('https://pokeapi.co/api/v2/pokemon-species/', '').replace('/', '')
        master_data[generation.get('name')]['pokemon'].append(number)

    # Get versions
    for version_group in generation.get('version_groups', []):
        version_group_data = get_data(version_group.get('url'))
        for version in version_group_data.get('versions', []):
            master_data['generations'][name]['versions'].append(version.get('name'))
            
            # Add version data to master
            master_data['games'][version.get('name')] = {}

print(master_data)
