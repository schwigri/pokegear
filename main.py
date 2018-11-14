import os

from flask import Flask
from flask import render_template
from flask import send_from_directory

import firebase_admin
from firebase_admin import firestore

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


@app.route('/')
def root():
    page = {
        'content': 'home.html',
        'id': 'portal',
        'title': 'Pokégear — Log In or Register',
        'head_tags': [
            '<link rel="stylesheet" href="https://cdn.firebase.com/libs/firebaseui/3.1.1/firebaseui.css">',
        ],
        'script_tags': [
            '<script src="https://cdn.firebase.com/libs/firebaseui/3.1.1/firebaseui.js"></script>',
            '<script src="/assets/scripts/auth.js"></script>',
        ],
    }
    return render_template('page.html', page=page)


@app.route('/welcome', strict_slashes=False)
def welcome():
    page = {
        'content': 'welcome.html',
        'id': 'welcome',
        'title': 'Welcome! | Pokégear',
    }
    return render_template('page.html', page=page)


@app.route('/dex', strict_slashes=False)
def dex():
    page = {
        'content': 'dex.html',
        'id': 'dex',
        'title': 'Pokédex | Pokégear',
    }
    return render_template('page.html', page=page)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
