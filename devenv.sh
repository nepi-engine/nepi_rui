#!/bin/bash
# this is my standard environment setup

# use the correct python and npm
source $CATKIN_WS/venv/bin/activate || echo "Failed to load venv"

# set environment variables
export RUI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && nvm use )"

