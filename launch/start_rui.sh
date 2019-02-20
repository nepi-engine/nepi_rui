#! /bin/bash

source /opt/numurus/sys_env.bash
source /opt/numurus/ros/setup.bash

# Use the correct python
source /opt/numurus/ros/share/venv/bin/activate || echo "Failed to load venv"

# Set environment variables
export RUI_HOME="/opt/numurus/ros/share/numurus_rui"
export PYTHONPATH="$PYTHONPATH:/opt/numurus/ros/share/numurus_rui/src"

rosrun numurus_rui run_webserver.py