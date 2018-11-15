import os
import time
import socket
import threading
from threading import Thread

from flask import Flask, send_from_directory, jsonify, g
from flask_cors import CORS


from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

from rui_webserver.config import APP_BUILD_PATH


app = Flask(__name__, static_folder=APP_BUILD_PATH)
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
Network info route
"""
@app.route('/api/networkinfo')
def network_info():
    return jsonify({
        "ipAddress": socket.gethostbyname(socket.gethostname())
    })


"""
Catchall, serve the frontend
"""
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(APP_BUILD_PATH, path)):
        return send_from_directory(APP_BUILD_PATH, path)
    else:
        return send_from_directory(APP_BUILD_PATH, 'index.html')


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



def start_flask():
    app.run(use_reloader=True, host='0.0.0.0',
            port=5003, threaded=True, debug=True)

def start_ftp():

    authorizer = DummyAuthorizer()
    # authorizer.add_user("user", "12345", "/home/giampaolo", perm="elradfmwMT")
    authorizer.add_anonymous(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    ftp_handler = FTPHandler
    ftp_handler.authorizer = authorizer
    ftp_server = FTPServer(("0.0.0.0", 5051), ftp_handler)
    ftp_server.serve_forever()

def start_servers():
    # Thread(target = start_flask).start()
    # Thread(target = start_ftp).start()
    start_flask()
    
