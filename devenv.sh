#!/bin/bash
# Setup environment

# Use the correct python and npm
source ../../venv/bin/activate || echo "Failed to load venv"

# Set environment variables
export RUI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && nvm use )"

# Setup ROS environment
source ../../devel/setup.bash