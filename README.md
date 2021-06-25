# SWEET
Flask-based back-end for SWEET web app.

## Installation
After cloning the repository into a new directory (e.g. ~/sweet/), make a virtual environment, activate it, and install the dependencies with pip. e.g. (on linux)
```bash
[user@system sweet]$ python3 -m venv venv
[user@system sweet]$ source ./venv/bin/activate
(venv) [user@system sweet]$ pip install -r requirements.txt
```
### Storage
This early development version of SWEET uses the Azure storage libraries for python, and holds all of its data in json files in blob containers. This is simple and efficient for development. To run the application you will need to set up a storage account in Azure and obtain an api connection string from the Azure portal.

The application expects user data and app content to be stored in separate blob containers, but this is not essential. If you would like to use the original SWEET app content this is available on request.

User details are encrypted using `crytography.fernet.Fernet`

### secrets.py
SWEET extracts sensitive data (i.e. application keys, Azure conncetion details etc.) from a file called `secrets.py` which is not tracked in the repository; you should create your own `secrets.py` under the SWEET directory in the repository. A sample secrets.py is included to document the variables that need to be set. 


## Running SWEET
Running SWEET locally for development purposes is the same as running any other flask app. Once you've installed the app as above and set the variables in `secrets.py`, set the FLASK_APP environment variable to 'SWEET', optionally set the FLASK_ENV environment variable, then execute `flask run`. e.g. (on linux)

```bash
(venv) [user@system sweet]$ export FLASK_APP=SWEET
(venv) [user@system sweet]$ export FLASK_ENV=development
(venv) [user@system sweet]$ flask run
```

This will start the app locally (usually at 127.0.0.1:5000) for development purposes.

**N.B. as the application uses the Azure storage api, it will connect to your live storage blobs even if it is running under localhost. If this is a concern, either change the blob/container names (in setup.py) during testing, or proceed with EXTREME CAUTION**