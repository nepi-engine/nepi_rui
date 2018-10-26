# numurus_rui
Resident User Interface


## setup

make sure you have python3, nvm (https://github.com/creationix/nvm) installed

```
python3 -m venv venv
. devenv.sh
pip install -r requirements.txt
cd rui_webserver/rui-app/ && npm i
```

## development

backend
```
python -m rui_webserver
```

frontend
```
cd rui_webserver/rui-app/ && npm start
```

## production

TBD
