# numurus_rui

Description: Web server for the Resident User Interface of Numurus

- Uses rosbridge to connect to ROS

<img src="https://picknik.ai/images/logo.jpg" width="100">

Developed by Lucas Doyle and Dave Coleman at [PickNik Consulting](http://picknik.ai/)

TODO(dave@picknik.ai): fix Travis badge:
[![Build Status](https://travis-ci.com/PickNikRobotics/numurus_rui.svg?token=o9hPQnr2kShM9ckDs6J8&branch=master)](https://travis-ci.com/PickNikRobotics/numurus_rui)

## Install

### Build from Source

1. [Install ROS Kinetic](http://wiki.ros.org/kinetic/Installation/Ubuntu) and the following python and build tools.

        sudo apt-get install python python-wstool python-catkin-tools python-pip
        pip install --user -U pip
        pip install --user virtualenv

1. The following is a temporary fix for a ROS issue and may not be needed:

        pip install empy

1. nvm (node version manager) is also needed:

        curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        nvm install 8.11.1

1. Re-use or create a catkin workspace:

        export CATKIN_WS=~/ws_numurus/
        mkdir -p $CATKIN_WS/src
        cd $CATKIN_WS/src

1. Download the required repositories and install any dependencies:

        git clone git@github.com:PickNikRobotics/numurus_rui.git
        wstool init .
        wstool merge numurus_rui/numurus_rui.rosinstall
        wstool update
        rosdep install --from-paths . --ignore-src --rosdistro kinetic

1. Setup the virtual environment

        cd $CATKIN_WS
        python -m virtualenv venv

1. Source the virtual environment and environment variables (NOTE: you may want to add this to your .bashrc)

        source $CATKIN_WS/src/numurus_rui/devenv.sh

1. Install python and javascript dependencies:

        cd $CATKIN_WS/src/numurus_rui
        pip install -r requirements.txt
        cd rui_webserver/rui-app/ && npm install

1. Configure and build the workspace:

        cd $CATKIN_WS
        catkin config --extend /opt/ros/kinetic --cmake-args -DCMAKE_BUILD_TYPE=Release
        catkin build

1. Source the workspace.

        source devel/setup.bash


## Development

### Quick update code repositories

To make sure you have the latest repos:

    cd $CATKIN_WS/src/numurus_rui
    git checkout master
    git pull origin master
    cd ..
    wstool merge numurus_rui/numurus_rui.rosinstall
    wstool update
    rosdep install --from-paths . --ignore-src --rosdistro kinetic

## Run

TODO luke - write instructions for running in prod 

### Development

When developing, always source the devenv.sh to ensure the correct versions of python, node and define environment variables:

    cd $CATKIN_WS/src/numurus_rui
    . devenv.sh

### Rosbridge

You always need to run rosbridge. Start rosbridge with this roslaunch command in the root of this repository:

    roslaunch numurus_rui rosbridge.launch

### Frontend

If changing frontend code, run the development server with:

    cd rui_webserver/rui-app/ && npm start

There are a couple different commands that can be run with `npm`, such as `build`, `lint`, etc. See the scripts `scripts` section of `rui_webserver/rui-app/package.json` for a full list.

### Backend

If changing backend code, run the webserver with:

    rosrun numurus_rui run_webserver.py

The backend only works if the frontend has been built for production (see below).


### Fake Data Publishers

We have provided some fake data publishers for testing purposes. To run a node that publishes NDStatus messages to a topic `/fake_nd_status` follow the steps below. (Note: make sure that you have source'd your catkin workspace in every terminal)

1. If you do not already have a ros master running, run in a new terminal: (Append `&` to run the ros master in the background)

        roscore

1. Run the publisher in a different terminal:

        rosrun numurus_rui nd_status_pub.py

1. Verify that the publisher is working in a separate terminal:

        rostopic echo /fake_nd_status

## Production

TODO(Stonelinks): figure out production

### Frontend

Get a production build of the frontend with:

    cd rui_webserver/rui-app/ && npm build

## Run Docker

### Prerequisite

TODO(davetcoleman): test Docker instructions, may not work

You must have a private rsa key `~/.ssh/id_rsa` that is not password protected and is attached to your Github and Bitbucket accounts. You must also have a working installation of `docker`.

1. Navigate to `$CATKIN_WS/src/numurus_rui/.docker`. You should see the `Dockerfile` recipe in the directory.

1. Build the docker image

        cd $CATKIN_WS/src/numurus_rui/.docker
        cp ~/.ssh/id_rsa id_rsa && docker build -t numurus_rui:kinetic-source .; rm id_rsa

1. Run the docker image

    * Without the gui

            docker run -it --rm numurus_rui:kinetic-source /bin/bash

    * With the gui (tested with Ubuntu native and a Ubuntu VM)

            . ./gui-docker -it --rm numurus_rui:kinetic-source /bin/bash

## Testing and Linting

TODO(davetcoleman): test Docker instructions, may not work

To run [roslint](http://wiki.ros.org/roslint), use the following command with [catkin-tools](https://catkin-tools.readthedocs.org/).

    catkin build --no-status --no-deps --this --make-args roslint

To run [catkin lint](https://pypi.python.org/pypi/catkin_lint), use the following command with [catkin-tools](https://catkin-tools.readthedocs.org/).

    catkin lint -W2 --rosdistro kinetic

Use the following command with [catkin-tools](https://catkin-tools.readthedocs.org/) to run tests.

    catkin run_tests --no-deps --this -i
