#!/bin/bash

# This interactive script installs the RUI to either a local or remote system

echo "Are you installing to a remote system? (y/n)"
read REMOTE
if [ "$REMOTE" == "y" ]; then
	echo "Enter the path to the SSH key"
	read SSH_KEY_PATH
	if [ ! -f "$SSH_KEY_PATH" ]; then
		echo "Error: $SSH_KEY_PATH does not exist... exiting"
		exit 1
	fi
elif [ "$REMOTE" != "n" ]; then
	echo "Invalid selection: $REMOTE, must be 'y' or 'n'... exiting"
	exit 1
fi

EXCLUDE_SWITCH="--exclude .git"

SRC_PATH=../../numurus_rui
if [ ! -d $SRC_PATH ]; then
	echo "Error: Installation directory $SRC_PATH does not exist... exiting"
	exit 1
fi

echo "Check these selections carefully. Press ctl+C to abort the install or press enter to continue"
echo "   Remote Installation = $REMOTE"
read CONTINUE

if [ "$REMOTE" == "y" ]; then
	echo numurus | ssh -tt -i $SSH_KEY_PATH numurus@192.168.179.102 "sudo systemctl stop numurus_rui"
	sleep 1
	ssh -i $SSH_KEY_PATH numurus@192.168.179.102 "rm -rf /opt/numurus/ros/share/numurus_rui" 
	sleep 1
	rsync -avzhe "ssh -i $SSH_KEY_PATH" $EXCLUDE_SWITCH $SRC_PATH/ numurus@192.168.179.102:/opt/numurus/ros/share/numurus_rui
	sleep 1
	#Work-around the issue that we can't seem to exclude the HUGE node_modules folder
	ssh -i $SSH_KEY_PATH numurus@192.168.179.102 "rm -rf /opt/numurus/ros/share/numurus_rui/src/rui_webserver/rui-app/node_modules/"
	sleep 1
	echo numurus | ssh -tt -i $SSH_KEY_PATH numurus@192.168.179.102 "sudo systemctl start numurus_rui"
else
	sudo systemctl stop numurus_rui
	sleep 1
	rm -rf /opt/numurus/ros/share/numurus_rui
	sleep 1
	rsync -avzh $EXCLUDE_SWITCH $SRC_PATH/ /opt/numurus/ros/share/numurus_rui
	sleep 1
	rm -rf /opt/numurus/ros/share/numurus_rui/src/rui_webserver/rui-app/node_modules/
	sleep 1
	sudo systemctl start numurus_rui
fi

# All done
echo "RUI Installation Complete"
