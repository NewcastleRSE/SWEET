from re import L
from .az_persitent import AzurePersitentDict
from . import encryptUser, decryptUser
from ..secrets import connstr as az_connection, usersource, usertable, userlist
from .userdata import diaryexport


__userstore = AzurePersitentDict(az_connection, usersource, usertable)
# usermap maps participant emails to user ids for 
__usermap = AzurePersitentDict(az_connection, usersource, userlist)

def confirmUserID(id):
    if id not in __userstore:
        id = __usermap.get(id, None)

    return id

def getUser(userID):
    userID = confirmUserID(userID)

    if userID is None:
        return None

    user = decryptUser(__userstore[userID])
    dirty = False

    if "email" not in user:
        dirty = True
        user["email"] = userID
    if "firstName" not in user:
        dirty = True
        user["firstName"] = user["fullName"][:user["fullName"].rfind(" ")]
    if "lastName" not in user:
        dirty = True
        user["lastName"] = user["fullName"][user["fullName"].rfind(" ") + 1:]

    if userID in diaryexport:
        if "profile" in diaryexport[userID]:
            dirty = True
            user.update(**diaryexport[userID]["profile"])

    if dirty:
        __userstore[userID] = encryptUser(user)
        __userstore.commit()

    # confirm this user's email is reverse-mapped to their userID
    if user['email'] not in __usermap:
        __usermap[user['email']] = userID
        __usermap.commit()
    
    return { 'userID': userID, 'email': user['email'], 'firstName': user['firstName'], 'lastName': user['lastName'], 'role': user['role']}

def validateUser(userID, password):
    
    userID = confirmUserID(userID)

    if userID is None:
        return False, None

    user = decryptUser(__userstore[userID])

    if password not in user:
        return False, None

    if password != user['password']:
        return False, None

    return True, getUser(userID)


def registerUser(userID, password, fullName, role):
    
    if userID in __userstore:
        return False, { 'message': 'User with this UserID already exists'}

    user = { 'password': password, 'fullName': fullName, 'role': role}
    
    __userstore[userID] = encryptUser(user)
    __userstore.commit()

    return True, user

def createUser(userID, email, firstName, lastName, role):
    if userID in __userstore:
        return False, { 'message': 'User with this UserID already exists'}

    user = { "email": email, "firstName": firstName, "lastName": lastName, "role": role }
    
    __userstore[userID] = encryptUser(user)
    __userstore.commit()

    __usermap[email] = userID
    __usermap.commit()

    return True, user

def checkActiveUser(email):
    userID = confirmUserID(email)
    
    return "password" in decryptUser(__userstore[userID]), userID

def updateUser(userID, **kwargs):
    userID = confirmUserID(userID)

    if userID is None:
        return False, "User not found"

    # handle cases where email is used by another account
    if "email" in kwargs:
        email = kwargs["email"]

        if email in __userstore:
            return False, "Email in use as userID"
        
        if email in __usermap and __usermap[email] != userID:
            return False, "Email attached to another account"

        __usermap[kwargs["email"]] = userID
        __usermap.commit()

    user = decryptUser(__userstore[userID])
    user.update(**kwargs)
    __userstore[userID] = encryptUser(user)

        
    return True
    
def getAllUsers():
    return [getUser(user) for user in __userstore.keys()]
