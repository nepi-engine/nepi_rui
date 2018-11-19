#!/bin/bash
# Environment for working with the numurus dev board

source ./devenv.sh

NUMURUS_BOARD_HOSTNAME="num-sb1-zynq"
NUMURUS_BOARD_INTERFACE="enp0s31f6"
NUMURUS_BOARD_INTERFACE_IP="192.168.179.5"

sudo ip addr add $NUMURUS_BOARD_INTERFACE_IP/24 dev $NUMURUS_BOARD_INTERFACE

ping -w 1 -c 1 $NUMURUS_BOARD_HOSTNAME >/dev/null 2>&1
if [ $? -ne 0 ] ; then #if ping exits nonzero...
  echo "$NUMURUS_BOARD_HOSTNAME not connected"
else
  echo "$NUMURUS_BOARD_HOSTNAME connected!"
  export ROS_MASTER_URI=http://$NUMURUS_BOARD_HOSTNAME:11311
  export ROS_IP=$NUMURUS_BOARD_INTERFACE_IP

  echo "ROS_MASTER_URI=$ROS_MASTER_URI"
  echo "ROS_IP=$ROS_IP"
fi