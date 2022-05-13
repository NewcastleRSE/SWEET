from azure.storage.blob import BlobServiceClient
import json, random, string
from .. import secrets
from cryptography.fernet import Fernet
__cryptor = Fernet(secrets.fernetkey)

# utility methods

def encryptUser(user):
    return __cryptor.encrypt(json.dumps(user).encode("utf8")).decode("utf8")

def decryptUser(data):
    return json.loads(__cryptor.decrypt(data.encode("utf8")).decode("utf8"))

def getContainer(name):
    return BlobServiceClient.from_connection_string(secrets.connstr).get_container_client(name)

def recursiveUpdate(d,u):
    import collections.abc
    for k, v in u.items():
        if isinstance(d, collections.abc.Mapping):
            if isinstance(v, collections.abc.Mapping):
                r = recursiveUpdate(d.get(k, {}), v)
                d[k] = r
            else:
                d[k] = u[k]
        else:
            d = {k: u[k]}
    return d

def getToken(N):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=N))

# setup
def ensureDataSources():
    from .users import getUser, registerUser
    
    service = BlobServiceClient.from_connection_string(secrets.connstr)
    existing_containers = [container['name'] for container in service.list_containers()]
    
    if secrets.datasource not in existing_containers:
        service.create_container(secrets.datasource)
    if secrets.usersource not in existing_containers:
        service.create_container(secrets.usersource)

    if getUser(secrets.admin_user) is None:
        registerUser(secrets.admin_user, secrets.admin_password, secrets.admin_role, email=secrets.admin_email, fullName=secrets.admin_fullName)
