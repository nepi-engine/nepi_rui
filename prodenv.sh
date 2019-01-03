#!/bin/bash
# Setup environment

# Use the correct python
source ./venv/bin/activate || echo "Failed to load venv"

# Set environment variables
export RUI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$( cd "$( dirname "${BASH_SOURCE[0]}" )")"

export PYTHONPATH="$PYTHONPATH:/opt/numurus/ros/share/numurus_rui/src"