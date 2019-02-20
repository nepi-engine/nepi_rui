#! /bin/bash

source /opt/numurus/ros/setup.bash

export RUI_HOME="/opt/numurus/ros/share/numurus_rui"

# Use the correct python
source ${RUI_HOME}/venv/bin/activate || echo "Failed to load venv"

# Set environment variables
export PYTHONPATH="$PYTHONPATH:$RUI_HOME/src"

rosrun numurus_rui run_webserver.py