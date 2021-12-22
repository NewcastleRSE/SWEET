from re import L
from .az_persitent import AzurePersistentList, AzurePersitentDict
from . import encryptUser, decryptUser
from ..secrets import connstr as az_connection, usersource, usertable, userlist, userlog, registration_list
from datetime import datetime


__userstore = AzurePersitentDict(az_connection, usersource, usertable)

__usermap = AzurePersitentDict(az_connection, usersource, userlist)
__userlog = AzurePersistentList(az_connection, usersource, userlog)
__regcodes = AzurePersistentList(az_connection, usersource, registration_list)

def logvisit(user, path):
    __userlog.append({
        "user": user["userID"],
        "path": path,
        "datetime": datetime.today().isoformat()
    })
    __userlog.commit()

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

    from .userdata import __diary
    if userID in __diary:
        if "profile" in __diary[userID]:
            dirty = True
            user.update(**__diary[userID]["profile"])

    if dirty:
        __userstore[userID] = encryptUser(user)
        __userstore.commit()

    # confirm this user's email is reverse-mapped to their userID
    if user['email'] not in __usermap:
        __usermap[user['email']] = userID
        __usermap.commit()
    
    userout = {}
    userout.update(user)
    userout["userID"] = userID
    del userout["password"]

    return userout

def validateUser(userID, password):
    
    userID = confirmUserID(userID)

    if userID is None:
        return False, None

    user = decryptUser(__userstore[userID])

    if "password" not in user:
        return False, None

    if password != user['password']:
        return False, None

    return True, getUser(userID)


def registerUser(userID, password, role, **add_fields):
    
    if userID in __userstore:
        return False, { 'message': 'User with this UserID already exists'}

    user = { 'password': password, 'role': role}
    user.update(add_fields)
    
    __userstore[userID] = encryptUser(user)
    __userstore.commit()

    if 'email' in add_fields:
        __usermap[add_fields['email']] = userID
        __usermap.commit()

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

        if email != userID and email in __userstore:
            return False, "Email in use as userID"
        
        if email in __usermap and __usermap[email] != userID:
            return False, "Email attached to another account"

        __usermap[kwargs["email"]] = userID
        __usermap.commit()

    user = decryptUser(__userstore[userID])
    user.update(**kwargs)
    __userstore[userID] = encryptUser(user)

    __userstore.commit()
        
    return True
    
def getAllUsers():
    return [getUser(user) for user in __userstore.keys()]

def checkRegistrationCode(code):
    return code in __regcodes

def useRegistrationCode(code):
    __regcodes.remove(code)
    __regcodes.commit()

def addRegistrationCode(code):
    if isinstance(code, list):
        __regcodes.extend(code)
    else:
        __regcodes.append(code)

    __regcodes.commit()