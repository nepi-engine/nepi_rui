import os
import time
from flask import Flask, send_from_directory, jsonify, g
from flask_cors import CORS

from rui_webserver.config import APP_PATH


app = Flask(__name__, static_folder=APP_PATH)
CORS(app)


"""
Test route
"""
@app.route('/test')
def data_files():
    return jsonify({
        "foo": "bar"
    })


"""
Catchall, serve the frontend
"""
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(APP_PATH, path)):
        return send_from_directory(APP_PATH, path)
    else:
        return send_from_directory(APP_PATH, 'index.html')


@app.before_request
def before_request():
    g.start = time.time()
    g.end = None


@app.teardown_request
def teardown_request(exc):
    g.end = time.time()
    diff = g.end - g.start
    if app.debug:
        print("Request took {} secs".format(str(diff)))


def start_server():
    app.run(use_reloader=True, host='0.0.0.0',
            port=5000, threaded=True, debug=True)
