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

# user-submitted data

def getGoals(user=None):
    goals = json.loads(getContainer(secrets.usersource).download_blob(secrets.usergoals).readall())
    if user is None:
        return goals

    if user['userID'] not in goals:
        return { "current": [], "complete": []}

    goals = goals[user['userID']]
    return {
        "current": [g for g in goals if g['status'] == "active"],
        "complete": [g for g in goals if g['status'] == "complete"]
    }

def updateGoals(user, goal):
    goals = getGoals()
    id = user['userID']

    if id not in goals:
        goals[id] = []

    if goal['status'] == "complete":
        oldgoal = next(g for g in goals[id] if g['goaltype'] == goal['goaltype'] and g['reviewDate'] == goal['reviewDate'] and g['detail'] == goal['detail'])
        if oldgoal is not None:
            goals[id].remove(oldgoal)
            
        goals[id].append(goal)
        save(secrets.usersource, secrets.usergoals, json.dumps(goals))
        return True, "Update"

    if goal['status'] == "active":
        activegoals = [g for g in goals[id] if g['status'] == "active" and g['goaltype'] == goal['goaltype']]
        if len([g for g in activegoals if g['detail'] == goal['detail']]) != 0:
            return False, "Existing active goal of this type"
        
        if len(activegoals) < 3:
            goals[id].append(goal)
            save(secrets.usersource, secrets.usergoals, json.dumps(goals))
            return True, "New"
        
        return False, "3 active goals of this type already"

    return False, f"Unrecognised new goal status {goal['status']}"

def getDiary(user=None):
    diary = json.loads(getContainer(secrets.usersource).download_blob(secrets.userdiary).readall())
    if user is None:
        return diary

    if user['userID'] not in diary:
        diary[user["userID"]] = {"sideeffects": [], "reminders": [], "adherence": [], "notes": []}
        save(secrets.usersource, secrets.userdiary, json.dumps(diary))

    return diary[user['userID']]


def getSideEffects(user=None, type=None):
    diary = getDiary(user)
    if user is None:
        return { "sideeffects": [ s for u in diary.values() for s in u["sideeffects"] ]}

    if type is None:
        return { "sideeffects": diary["sideeffects"] }
    else:
        return { "sideeffects": [s for s in diary['sideeffects'] if s['type'] == type]}

def recordSideEffect(user, sideeffect):
    diary = getDiary()
    id = user['userID']

    if id not in diary:
       diary[id] = {"sideeffects": [], "reminders": [], "adherence": [], "notes": []}

    userse = diary[id]['sideeffects']

    existing = next((s for s in userse if s['type'] == sideeffect['type'] and s['todate'] == sideeffect['todate']), False)

    if existing:
        existing.update(sideeffect)
    else:
        userse.append(sideeffect)

    save(secrets.usersource, secrets.userdiary, json.dumps(diary))


# utility methods

def encryptUser(user):
    return Fernet(secrets.fernetkey).encrypt(json.dumps(user).encode("utf8")).decode("utf8")

def decryptUser(data):
    return json.loads(Fernet(secrets.fernetkey).decrypt(data.encode("utf8")).decode("utf8"))

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
    if secrets.usergoals not in [blob.name for blob in usercnt.list_blobs()]:
        usercnt.upload_blob(secrets.usergoals, json.dumps({}))
    if secrets.userdiary not in [blob.name for blob in usercnt.list_blobs()]:
        usercnt.upload_blob(secrets.userdiary, json.dumps({}))

    if getUser(secrets.admin_user) is None:
        registerUser(secrets.admin_user, secrets.admin_password, secrets.admin_fullName, secrets.admin_role)
