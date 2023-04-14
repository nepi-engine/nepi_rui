#! /bin/bash

export RUI_HOME="/opt/nepi/nepi_rui"

# Use the correct python
source ${RUI_HOME}/venv/bin/activate || echo "Failed to load venv"

# Set environment variables
export PYTHONPATH="$PYTHONPATH:$RUI_HOME/src"

python $RUI_HOME/scripts/run_webserver.py
