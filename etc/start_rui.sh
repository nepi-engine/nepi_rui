#! /bin/bash
source /opt/numurus/ros/setup.bash

# The sys_env script must exist and be valid. The committed base file is
# (intentionally) not valid because TBD fields are not populated
if [ ! -f /opt/numurus/ros/etc/sys_env.bash ]; then
	echo "ERROR! Could not find /opt/numurus/ros/etc/sys_env.bash"
	exit 1
fi

source /opt/numurus/ros/etc/sys_env.bash
if [ "$DEVICE_TYPE" = "TBD" ]; then
	echo "ERROR! DEVICE_TYPE must be set in /opt/numurus/ros/sys_env.bash"
	exit 1
fi

if [ "$DEVICE_SN" = "TBD" ]; then
	echo "ERROR! DEVICE_SN must be set in /opt/numurus/ros/sys_env.bash"
	exit 1
fi

export RUI_HOME="/opt/numurus/ros/share/numurus_rui"

# Use the correct python
source ${RUI_HOME}/venv/bin/activate || echo "Failed to load venv"

# Set environment variables
export PYTHONPATH="$PYTHONPATH:$RUI_HOME/src"

# Launch in "wait" mode to allow roscore to come up
roslaunch --wait numurus_rui numurus_rui.launch
#rosrun numurus_rui run_webserver.py
