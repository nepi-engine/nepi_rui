# numurus_rui

Resident User Interface

## Setup

This project uses rosbridge to connect to ROS. If you don't have it, run:

```
sudo apt-get install ros-<rosdistro>-rosbridge-server
```

Make sure you have python3 and python3-venv. For ubuntu:

```
sudo apt-get install -y python3 python3-venv
```

nvm (node version manager) is also needed:

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```

Setup the virtual environment, source the devenv, and install python and javascript dependencies:

```
python3 -m venv venv
. devenv.sh
pip install -r requirements.txt
cd rui_webserver/rui-app/ && npm i
```

## Development

When developing, always source the devenv (`. devenv.sh`) to ensure the correct versions of python, node and define environment variables.

### Rosbridge

Start rosbridge with this roslaunch command in the root of this repository:

```
roslaunch rosbridge.launch
```

### Backend

If changing backend code, run the webserver with:

```
python -m rui_webserver
```

The backend only works if the frontend has been built for production (see below).

### Frontend

If changing frontend code, run the development server with:

```
cd rui_webserver/rui-app/ && npm start
```

There are a couple different commands that can be run with `npm`, such as `build`, `lint`, etc. See the scripts `scripts` section of `rui_webserver/rui-app/package.json` for a full list.

## Production

TODO(Stonelinks): figure out production

### Frontend

Get a production build of the frontend with:

```
cd rui_webserver/rui-app/ && npm build
```
