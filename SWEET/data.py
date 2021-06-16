from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import json, random, string
from . import secrets
from cryptography.fernet import Fernet

__logged_in_users = {}

# content and structure
def getStructure():
    return json.loads(getContainer(secrets.datasource).download_blob(secrets.structure).readall())

def updateStructure(newStructure):
    oldStructure = getStructure()
    recursiveUpdate(oldStructure, newStructure)

    save(secrets.datasource, secrets.structure, json.dumps(oldStructure))

def getPageDetails(path):
    struct = getStructure()
        
    for slug in path[1:].split("/"):
        if slug in struct:
            struct = struct[slug]
        else:
            struct = next(i for i in struct['pages'] if i['slug'] == slug)

    return struct

def getPages():
    return json.loads(getContainer(secrets.datasource).download_blob(secrets.content).readall())

def getPageContents(path):
    return getPages().get(path, "")

def updatePageContent(details):
    pages = getPages()
    pages[details["path"]] = details["content"]
    save(secrets.datasource, secrets.content, json.dumps(pages))

    if "title" in details:
        struct = oldstruct = getStructure()
        slugs = details["path"][1:].split("/")
        for slug in slugs:
            if slug in struct:
                struct = struct[slug]
            else:
                struct = next(i for i in struct['pages'] if i['slug'] == slug)
        
        struct['title'] = details['title']

        updateStructure(oldstruct)

def getResources():
    return json.loads(getContainer(secrets.datasource).download_blob(secrets.resources).readall())
        
def getResource(name):
    res = getResources()
    if name in res:
        return { "name": name, "source": res[name]['source'], "description": res[name]['description']}
    
    return None

def saveResource(newres):
    res = getResources()
    res[newres['name']] = { 'source': newres['source'], 'description': newres['description']}
    save(secrets.datasource, secrets.resources, json.dumps(res))


#users and auth
def isOnline(token):
    return token in __logged_in_users

def getLoggedInUser(token):
    if token in __logged_in_users:
        return getUser(__logged_in_users[token])
    
    return None

def logout(token):
    if token in __logged_in_users:
        del __logged_in_users[token]

def getUsers():
    return json.loads(getContainer(secrets.usersource).download_blob(secrets.usertable).readall())

def getUser(userID):
    users = getUsers()
    if userID not in users:
        return None

    user = decryptUser(users[userID])
    return { 'userID': userID, 'fullName': user['fullName'], 'role': user['role']}

def validateUser(userID, password):
    users = getUsers()
    if userID not in users:
        return False, None

    user = decryptUser(users[userID])
    if password != user['password']:
        return False, None

    token = getToken(6)
    __logged_in_users[token] = userID
    return True, token

def registerUser(userID, password, fullName, role):
    users = getUsers()
    if userID in users:
        return False, { 'message': 'User with this UserID already exists'}

    user = { 'password': password, 'fullName': fullName, 'role': role}
    
    users[userID] = encryptUser(user)
    save(secrets.usersource, secrets.usertable, json.dumps(users))

    return True, user

def encryptUser(user):
    return Fernet(secrets.fernetkey).encrypt(json.dumps(user).encode("utf8")).decode("utf8")

def decryptUser(data):
    return json.loads(Fernet(secrets.fernetkey).decrypt(data.encode("utf8")).decode("utf8"))

# utility methods

def getContainer(name):
    return BlobServiceClient.from_connection_string(secrets.connstr).get_container_client(name)

def save(container, filename, content):
    getContainer(container).upload_blob(filename, content, overwrite=True)
    pass

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
    service = BlobServiceClient.from_connection_string(secrets.connstr)
    existing_containers = [container['name'] for container in service.list_containers()]
    
    if secrets.datasource not in existing_containers:
        service.create_container(secrets.datasource)
    if secrets.usersource not in existing_containers:
        service.create_container(secrets.usersource)

    datacnt = getContainer(secrets.datasource)
    contents = [blob.name for blob in datacnt.list_blobs()]
    if secrets.structure not in contents:
        datacnt.upload_blob(secrets.structure, json.dumps({}))
    if secrets.content not in contents:
        datacnt.upload_blob(secrets.content, json.dumps({}))
    if secrets.resources not in contents:
        datacnt.upload_blob(secrets.resources, json.dumps({}))

    usercnt = getContainer(secrets.usersource)
    if secrets.usertable not in [blob.name for blob in usercnt.list_blobs()]:
        usercnt.upload_blob(secrets.usertable, json.dumps({}))

    if getUser(secrets.admin_user) is None:
        registerUser(secrets.admin_user, secrets.admin_password, secrets.admin_fullName, secrets.admin_role)
