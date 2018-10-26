import os
import sys

RUI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RUI_DIR)

from rui_webserver.server import start_server

if __name__ == '__main__':
    start_server()