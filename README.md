# SWEET
Flask-based back-end for SWEET web app. 

## About

There is strong evidence that five or more years of adjuvant endocrine therapy (AET) substantially reduces risks of recurrence and mortality in some  forms of early breast cancer. However, many women struggle to adhere to this therapy for such a long period. SWEET will develop and test a support package to help women adhere to their therapy, centred around an app/website which will: provide information about AET; allow users to monitor their  own adherence; and support them to self-manage any problems, symptoms and side-effects that they might experience.

### Project Team
Linda Sharp, Newcastle University  ([linda.sharp@newcastle.ac.uk](mailto:linda.sharp@newcastle.ac.uk))  
Eila Watson, Oxford Brookes University  ([ewatson@brookes.ac.uk](mailto:ewatson@brookes.ac.uk))  

### RSE Contact
Jim McGrath  
RSE Team  
Newcastle University  
([jim.mcgrath@newcastle.ac.uk](mailto:jim.mcgrath@newcastle.ac.uk))  

## Built With

[Flask](https://flask.palletsprojects.com/)  
[FireText](https://www.firetext.co.uk/)  
[Bootstrap](https://getbootstrap.com)  

## Getting Started

The application installation and local deployment assumes you have Python3 installed.

### Storage
This early development version of SWEET uses the Azure storage libraries for python, and holds all of its data in json files in blob containers. This is simple and efficient for development. To run the application you will need to set up a storage account in Azure and obtain an api connection string from the Azure portal.

The application expects user data and app content to be stored in separate blob containers, but this is not essential. If you would like to use the original SWEET app content this is available on request.

User details are encrypted using `crytography.fernet.Fernet`

### secrets.py
SWEET extracts sensitive data (i.e. application keys, Azure conncetion details etc.) from a file called `secrets.py` which is not tracked in the repository; you should create your own `secrets.py` under the SWEET directory in the repository. A sample `secrets.sample.py` is included to document the variables that need to be set.

In GitHub the secrets are split into three files, `SHARED_ENVS`, `STAGING_ENVS` and `PRODUCTION_ENVS`. This allows for common values to be reused across environments as well as loading in environment specific values. During the build stages of the workflow values are combined into a single `secrets.py` file.

### Installation

### Running Tests

How to run tests on your local system.

## Deployment

### Local

After cloning the repository into a new directory (e.g. ~/sweet/), make a virtual environment, activate it, and install the dependencies with pip. e.g. (on linux)
```bash
[user@system sweet]$ python3 -m venv venv
[user@system sweet]$ source ./venv/bin/activate
(venv) [user@system sweet]$ pip install -r requirements.txt
```


Running SWEET locally for development purposes is the same as running any other flask app. Once you've installed the app as above and set the variables in `secrets.py`, set the `FLASK_APP` environment variable to 'SWEET', optionally set the `FLASK_ENV` environment variable, then execute `flask run`. e.g. (on linux)

```bash
(venv) [user@system sweet]$ export FLASK_APP=SWEET
(venv) [user@system sweet]$ export FLASK_ENV=development
(venv) [user@system sweet]$ flask run
```

On Windows using powershell:
```bash
> python3 -m venv venv
> ./venv/scripts/activate
> pip install -r requirements.txt
> $env:FLASK_APP='SWEET'
> $env:FLASK_ENV='development'
> flask run
```

This will start the app locally (usually at 127.0.0.1:5000) for development purposes.

### Azure Infrastructure

Remote azure infrastructure is managed via [Terraform](https://www.terraform.io/). The `terraform` directory contains the files used to create the resource group, storage account, app service plan and app service used for `dev`, `staging` and `production` environments. Consult the Terraform [documentation](https://www.terraform.io/docs) for further information.

### Staging

There are two automated deployment workflows configured using GitHub actions. **Any push** to the `dev` branch will trigger a build and deploy to the staging environment in Azure. The environment should be considered brittle and whilst controls are in place to ensure code on the dev branch builds and runs, it is designed for testing out new features.

### Production

The second workflow is for deployment to the production environment. It is triggered manually by created a new release in [GitHub](https://github.com/NewcastleRSE/SWEET/releases) with a new version number. The production environment has live user data and is part of a clinical trial, **DO NOT** deploy a new version unless the latest code has been tested in the staging environment and has been signed-off by the project team.

## Usage

STAGING - [sweet.ncldata.dev](https://sweet.ncldata.dev)  
PRODUCTION - [htandme.co.uk](https://htandme.co.uk)

## Roadmap

- [x] Initial Research  
- [x] Minimum viable product  
- [x] Alpha Release  
- [ ] Feature-Complete Release  

## Contributing

### Main Branch
Protected and can only be pushed to via pull requests. Should be considered stable and a representation of production code.

### Dev Branch
Protected and can only be pushed to via pull requests. Should be considered fragile, code should compile and run but features may be prone to errors.

### Feature Branches
A branch per feature being worked on.

https://nvie.com/posts/a-successful-git-branching-model/

## License

## Citiation

Please cite the associated papers for this work if you use this code:

```
@article{xxx2021paper,
  title={Title},
  author={Author},
  journal={arXiv},
  year={2021}
}
```


## Acknowledgements
This work was funded by a grant from the UK Research Councils, NIHR grant ref. EP/L012345/1, “Example project title, please update”.
