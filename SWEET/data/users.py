from .az_persitent import AzurePersitentDict
from . import encryptUser, decryptUser
from ..secrets import connstr as az_connection

__userstore = AzurePersitentDict(az_connection, "users", "users.json")

def getUser(userID):
    
    if userID not in __userstore:
        return None

    user = decryptUser(__userstore[userID])

    return { 'userID': userID, 'fullName': user['fullName'], 'role': user['role']}

def validateUser(userID, password):
    
    if userID not in __userstore:
        return False, None

    user = decryptUser(__userstore[userID])
    if password != user['password']:
        return False, None

    return True, { 'userID': userID, 'fullName': user['fullName'], 'role': user['role']}


def registerUser(userID, password, fullName, role):
    
    if userID in __userstore:
        return False, { 'message': 'User with this UserID already exists'}

    user = { 'password': password, 'fullName': fullName, 'role': role}
    
    __userstore[userID] = encryptUser(user)
    __userstore.commit()

    return True, user

