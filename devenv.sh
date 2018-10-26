#!/bin/bash
# this is my standard environment setup

# use the correct python and npm
source venv/bin/activate || echo 'Failed to load venv'
nvm use

# set environment variables
export RUI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

