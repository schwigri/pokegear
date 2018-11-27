from time import time
from time import sleep

import urllib.request
import urllib.error

import json


class PokeApiDataCollector:
    __API_BASE_URL = 'https://pokeapi.co/api/v2'
    __API_HEADERS = {
        'User-Agent': 'URLLIB',
    }

    def __init__(self):
        self.api_requests_count = 0
        self.timer = {}
        self.data = {
            'evolutions': {},
            'games': {},
            'generations': {},
            'pokedexes': {},
            'pokemon': {},
        }

    def __get_data(self, method='generation', url=None):
        if (self.timer.get('start')) is None or time() - self.timer.get('start') >= 60:
            self.timer['start'] = time()
        if self.api_requests_count >= 99:
            if time() - self.timer.get('start') < 60:
                print('Near requests-per-minute limit so pausing until the next minute. ({}/100 in {} seconds)'
                      .format(self.api_requests_count, time() - self.timer.get('start')))
                # PokéAPI limits requests per minute to 100 by IP address, so once the limit is reached,
                # pause the program until the next minute.
                sleep(60 - (time() - self.timer.get('start')))
                self.api_requests_count = 0
                self.timer = {}
        if url is None:
            url = '{}/{}'.format(self.__API_BASE_URL, method)
        request = urllib.request.Request(url, data=None, headers=self.__API_HEADERS)
        data = {}
        try:
            with urllib.request.urlopen(request) as response:
                response_data = response.read()
            data = json.loads(response_data)
            self.api_requests_count += 1
        except urllib.error.URLError as error:
            print('URL Error: {}'.format(error))
        return data

    def collect_pokedexes_info(self):
        # Get every Pokédex
        for pokedex in self.__get_data(method='pokedex').get('results', []):
            pokedex_shortcode = pokedex.get('name')
            pokedex_data = self.__get_data(url=pokedex.get('url'))
            pokedex_name = pokedex_shortcode
            for name in pokedex_data.get('names'):
                if name.get('language', {}).get('name') == 'en':
                    pokedex_name = name.get('name')
                    break
            pokedex_description = pokedex_name
            for description in pokedex_data.get('descriptions', []):
                if description.get('language', {}).get('name') == 'en':
                    pokedex_description = description.get('description')
                    break
            pokedex_pokemon = [self.__get_pokemon_dex_number_from_url(pokemon.get('pokemon_species', {}).get('url'))
                               for pokemon in pokedex_data.get('pokemon_entries', [])]
            self.data['pokedexes'].update({
                pokedex_shortcode: {
                    'name': pokedex_name,
                    'description': pokedex_description,
                    'pokemon': pokedex_pokemon,
                }
            })

    def write_pokedexes_info(self, filename='data/pokedexes.json'):
        pokedexes_data = json.dumps(self.data.get('pokedexes'), ensure_ascii=False)
        with open(filename, 'w') as file:
            file.write(pokedexes_data)

    def collect_games_info(self):
        # Get every game
        for generation in self.__get_data(method='generation').get('results', []):
            generation_data = self.__get_data(url=generation.get('url'))
            for version_group in generation_data.get('version_groups', []):
                version_group_data = self.__get_data(url=version_group.get('url'))
                for version in version_group_data.get('versions'):
                    game_id = version.get('name')
                    game_names = self.__get_data(url=version.get('url')).get('names', [])
                    game_name = game_id
                    for name in game_names:
                        if name.get('language', {}).get('name') == 'en':
                            game_name = name.get('name')
                    pokedexes = [pokedex.get('name') for pokedex in version_group_data.get('pokedexes', [])]
                    self.data['games'].update({
                        game_id: {
                            'name': game_name,
                            'pokedexes': pokedexes
                        }
                    })

    def write_games_info(self, filename='data/games.json'):
        games_data = json.dumps(self.data.get('games'), ensure_ascii=False)
        with open(filename, 'w') as file:
            file.write(games_data)


    @staticmethod
    def __get_pokemon_dex_number_from_url(url):
        """Returns an integer representing the Pokédex number for a given PokéAPI species URL."""
        return url.replace('https://pokeapi.co/api/v2/pokemon-species/', '').replace('/', '')

    def collect_pokemon_info(self):
        """Collects the data for each species of Pokémon."""
        # Pokémon count as of 13 November 2018 is 802; the PokéAPI provides for a greater number of Pokémon as it
        # includes various formes which are not separate species.
        pokemon_count = 802
        pokemon_count = 2
        sprite_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{}.png'
        for i in range(pokemon_count):
            dex_num = i + 1
            print('On Pokémon {}/802'.format(dex_num))

            raw_data = self.__get_data(method='pokemon-species/{}'.format(dex_num))

            # Get the proper name
            name = raw_data.get('name')
            for localized_name in raw_data.get('names', []):
                if localized_name.get('language', {}).get('name') == 'en':
                    name = localized_name.get('name')
                    break

            pokemon_data = {}

            # Get the evolution chain
            evolution_chain_request_url = raw_data.get('evolution_chain', {}).get('url')
            if evolution_chain_request_url is not None:
                evolution_chain_id = evolution_chain_request_url.replace(
                    'https://pokeapi.co/api/v2/evolution-chain/', '').replace('/', '')

                pokemon_data.update({
                    'evolution_chain': evolution_chain_id
                })

                # Only get the chain from the API if we haven't already
                if self.data.get('evolutions', {}).get(evolution_chain_id) is None:
                    evolution_chain_raw_data = self.__get_data(url=evolution_chain_request_url)
                    evolution_chain = evolution_chain_raw_data

                    # Update the chain's species' with their appropriate Pokédex numbers
                    evolution_chain['chain'].update({
                        'species': self.__get_pokemon_dex_number_from_url(evolution_chain_raw_data.get('chain', {})
                                                                          .get('species', {})
                                                                          .get('url', ''))
                    })
                    for primary_evolution in evolution_chain_raw_data.get('chain', {}).get('evolves_to', []):
                        evolution_chain['chain']['evolves_to'][evolution_chain['chain']['evolves_to'].index(
                            primary_evolution)].update({
                                'species': self.__get_pokemon_dex_number_from_url(primary_evolution.get('species', {})
                                                                                  .get('url', ''))
                            })
                        for secondary_evolution in primary_evolution.get('evolves_to', []):
                            evolution_chain['chain']['evolves_to'][evolution_chain['chain']['evolves_to'].index(
                                primary_evolution)]['evolves_to'][primary_evolution['evolves_to'].index(
                                    secondary_evolution)].update({
                                        'species': self.__get_pokemon_dex_number_from_url(secondary_evolution.get(
                                            'species', {}).get('url', ''))

                                    })
                    self.data['evolutions'].update({
                        evolution_chain_id: evolution_chain
                    })

            pokemon_data.update({
                'sprite': sprite_url.format(dex_num),
                'name': name
            })
            self.data['pokemon'].update({
                dex_num: pokemon_data
            })

    def write_pokemon_info(self, pokemon_file='data/pokemon.json', evolutions_file='data/evolutions.json'):
        pokemon_data = json.dumps(self.data.get('pokemon'), ensure_ascii=False)
        with open(pokemon_file, 'w') as file:
            file.write(pokemon_data)
        evolutions_data = json.dumps(self.data.get('evolutions'), ensure_ascii=False)
        with open(evolutions_file, 'w') as file:
            file.write(evolutions_data)


data_collector = PokeApiDataCollector()
# data_collector.collect_pokemon_info()
# data_collector.write_pokemon_info()
# data_collector.collect_games_info()
# data_collector.write_games_info()
data_collector.collect_pokedexes_info()
data_collector.write_pokedexes_info()
print('Done!')
