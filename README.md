# numurus_rui

Description: Web server for the Resident User Interface of Numurus

- Uses rosbridge to connect to ROS

<img src="https://picknik.ai/images/logo.jpg" width="100">

Developed by Lucas Doyle and Dave Coleman at [PickNik Consulting](http://picknik.ai/)

Travis CI: [![Build Status](https://travis-ci.com/PickNikRobotics/numurus_rui.svg?token=o9hPQnr2kShM9ckDs6J8&branch=master)](https://travis-ci.com/PickNikRobotics/numurus_rui)

Architecture:
![Alt text](/resources/architecture.png?raw=true "Architecture")

## Install

### Build from Source

1. [Install ROS Kinetic](http://wiki.ros.org/kinetic/Installation/Ubuntu) and the following Python and build tools:

        sudo apt-get install python python-wstool python-catkin-tools python-pip

1. Setup pip and a virtual environment:

        pip install --user -U pip
        pip install --user virtualenv

   Note: if you get the error ``ImportError: cannot import name main``, open a new terminal and retry the last command.

1. Install nvm (node version manager):

        curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        nvm install 8.11.1

   Note: don't miss the install script's instructions: "Close and reopen your terminal to start using nvm or run the following to use it now"

1. Re-use or create a Catkin workspace:

        mkdir -p ~/ws_numurus/src
        cd ~/ws_numurus/src

1. Download the required repositories and install any dependencies. Note this requires SSH key authentication setup with Github.

        git clone git@github.com:PickNikRobotics/numurus_rui.git
        wstool init .
        wstool merge numurus_rui/numurus_rui.rosinstall
        wstool update
        rosdep install --from-paths . --ignore-src --rosdistro kinetic

1. Setup the virtual environment:

        cd ~/ws_numurus/
        python -m virtualenv venv

1. Source the virtual environment and environment variables:

        source ~/ws_numurus/src/numurus_rui/devenv.sh

1. Install Python and javascript dependencies:

        cd ~/ws_numurus/src/numurus_rui
        pip install -r requirements.txt
        cd src/rui_webserver/rui-app/ && npm install

1. Configure and build the workspace:

        cd ~/ws_numurus/
        catkin config --extend /opt/ros/kinetic --cmake-args -DCMAKE_BUILD_TYPE=Release
        catkin build

   Note: if you get the error ``ImportError: No module named em`` try the following fix:

        pip install empy

1. Source the workspace:

        source devel/setup.bash

   Note: consider adding this to your .bashrc

## Development

### Quick update code repositories

To make sure you have the latest repos:

        cd ~/ws_numurus/src/numurus_rui
        git checkout master
        git pull origin master
        cd ..
        wstool merge numurus_rui/numurus_rui.rosinstall
        wstool update
        rosdep install --from-paths . --ignore-src --rosdistro kinetic

## Development

When developing, always source the `devenv.sh` to ensure the correct versions of Python, node and define environment variables:

        cd ~/ws_numurus/src/numurus_rui
        . devenv.sh

If working with the numurus dev board, you can also use `. boardenv.sh` instead of `devenv.sh`. This script will make it so that ROS nodes running on your computer connect to the ROS master on the device.

For it to work, you must add this line to your `etc/hosts` file:

        192.168.179.101 num-sb1-zynq

Additionally, this script makes some assumptions about which ethernet port you've plugged the device into, so users may need to modify `$NUMURUS_BOARD_INTERFACE` variable within the script.

### Frontend

This is only necessary when making changes to frontend code. Start the development server with:

        cd src/rui_webserver/rui-app/ && npm start

Various other npm commands are available such as `build`, `lint`, etc. See the `scripts` section of `rui-app/package.json` for a full list of commands.

When you're done changing frontend, make sure to build and commit build to this repository prior to a release:

        npm run build
        git add .
        git commit -m "Update build"

Also be sure to deploy the newest version of the demo site (see https://picknikrobotics.github.io/numurus_rui/):

        npm run deploy

### Backend

When changing backend code, run the webserver with:

    rosrun numurus_rui run_webserver.py

### Rosbridge

In all cases, rosbridge needs to run:

        roslaunch numurus_rui rosbridge.launch

## Simulation

### Fake Data Publishers

We have provided some fake data publishers for testing purposes. To run a node that publishes fake data that the UI responds to, follow the steps below. (Note: make sure that you have source'd your Catkin workspace)

1. If you do not already have a ros master running, run in a new terminal: (Append `&` to run the ros master in the background)

        roscore

1. Run the publisher in a different terminal:

        rosrun numurus_rui fake_data_pub.py

1. Verify that the publisher is working in a separate terminal by echoing one of the topics:

        rostopic echo /fake_nd_status

### Test Camera

If your dev machine has a webcam, you can simulate a video feed from the device using this command

        roslaunch numurus_rui test_camera.launch

This launch file assumes the webcam is at `/dev/video0`, but you can pass in a an argument to change this 

        roslaunch numurus_rui test_camera.launch DEVICE:=/dev/video1

## Production

TODO(Luke) ask Josh / Dave what the official steps to add rosbridge / other dependencies to the device's ROS installation 

To copy this module to the device (using boardenv above) please run this from the directory above this module:

        rsync -avzhe ssh --exclude node_modules --exclude .git numurus_rui/ root@num-sb1-zynq:/opt/numurus/ros/share/numurus_rui

To actually run the RUI on the device, please eject the SD card and use qemu to create a new python venv in the root of this module

        sudo apt install qemu-user-static
        mkdir ~/mnt/rootfs
        sudo mount /dev/mmcblk0p2 ~/mnt/rootfs
        sudo mount -t proc proc ~/mnt/rootfs/proc
        cp $(which qemu-arm-static) ~/mnt/rootfs
        cp etc/resolv.conf ~/mnt/rootfs/etc/resolv.conf
        sudo chroot ~/mnt/rootfs /bin/bash

Once the SD card is mounted, go to the directory where the package is located and create the venv

        cd /opt/numurus/ros/share/numurus_rui
        python -m virtualenv venv

Unmount and eject the SD card and put it back in the device

To run the webserver in production on the device, run the following in separate terminals:

        ssh root@num-sb1-zynq
        cd /opt/numurus/ros/share/numurus_rui
        . ../../setup.bash
        . prodenv.sh
        roslaunch numurus_rui rosbridge.launch

        ssh root@num-sb1-zynq
        cd /opt/numurus/ros/share/numurus_rui
        . ../../setup.bash
        . prodenv.sh
        rosrun numurus_rui run_webserver.py