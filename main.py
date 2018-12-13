import os

from flask import Flask
from flask import redirect
from flask import request
from flask import render_template
from flask import send_from_directory

import firebase_admin
from firebase_admin import firestore

import google

credentials = firebase_admin.credentials.Certificate('private/firebase-credentials.json')
firebase_admin.initialize_app(credentials, {
    'projectId': 'hcde-310-221704',
})
db = firestore.client()

if os.environ.get('FLASK_ENV') == 'development':
    app = Flask(__name__, static_url_path='')


    @app.route('/assets/<path:path>')
    def assets(path):
        return send_from_directory('assets', path)

else:
    app = Flask(__name__)

all_pokemon = db.collection('pokemon').get()


@app.route('/')
def root():
    return render_template('preview.html')


@app.route('/log-in', strict_slashes=False)
def log_in():
    page = {
        'head_tags': [
            '<link rel="stylesheet" href="https://cdn.firebase.com/libs/firebaseui/3.1.1/firebaseui.css">',
        ],
        'script_tags': [
            '<script src="https://cdn.firebase.com/libs/firebaseui/3.1.1/firebaseui.js"></script>',
            '<script src="/assets/scripts/auth.min.js"></script>',
        ],
    }
    return 'logging in'


@app.route('/log-out', strict_slashes=False)
def log_out():
    return redirect('/', code=303)


@app.route('/welcome', strict_slashes=False, methods=['GET'])
def welcome():
    page = {
        'content': 'welcome.html',
        'id': 'welcome',
        'title': 'Welcome! | Pokégear',
        'script_tags': [
            '<script src="/assets/scripts/onboarding.js"></script>'
        ]
    }

    games = [{'id': game_doc.id, 'name': game_doc.to_dict().get('name')} for game_doc in db.collection('games').get()]

    return render_template('page.html', page=page, games=games)


@app.route('/dex', strict_slashes=False)
def dex():
    user_id = request.args.get('uid', type=str)
    dex_id = request.args.get('id', type=str)
    pokedexes = []
    game = ''
    num_pokemon = 0
    if dex_id:
        try:
            all_pokemon = db.collection('pokemon').get()
            pokemon_data = {doc.id: doc.to_dict() for doc in all_pokemon}
            dex_data = db.collection('users').document(user_id).collection('pokedexes').document(dex_id).get().to_dict()
            game = dex_data.get('pokedex')
            pokedex_names = [pokedex for pokedex in
                             db.collection('games').document(dex_data.get('pokedex')).get().to_dict().get('pokedexes')]

            for pokedex in pokedex_names:
                pokedex_data= db.collection('pokedexes').document(pokedex).get().to_dict()
                pokedex_pokemon_list = pokedex_data.get('pokemon')
                pokedex_pokemon = []
                for pokemon in pokedex_pokemon_list:
                    pokedex_pokemon.append(pokemon_data.get(pokemon))
                    num_pokemon += 1
                pokedexes.append({
                    'tag': pokedex,
                    'name': pokedex_data.get('name', pokedex),
                    'pokemon': pokedex_pokemon,
                })

        except google.cloud.exceptions.NotFound:
            print('No document found!')
    if len(pokedexes) > 0:
        page = {
            'content': 'dex.html',
            'id': 'dex',
            'title': 'Pokédex | Pokégear',
        }
    else:
        page = {
            'content': 'selector.html',
            'id': 'selector',
            'title': 'Select a Pokédex | Pokégear'
        }
    return render_template('page.html', page=page, pokedexes=pokedexes, game=game, pokemon_count=num_pokemon)


@app.route('/about', strict_slashes=False)
def about():
    page = {
        'content': 'about.html',
        'id': 'about',
        'title': 'About | Pokégear'
    }
    return render_template('page.html', page=page)


@app.route('/contact', strict_slashes=False)
def contact():
    page = {
        'content': 'contact.html',
        'id': 'contact',
        'title': 'Get In Touch | Pokégear'
    }
    return render_template('page.html', page=page)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
