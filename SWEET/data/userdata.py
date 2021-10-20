from .az_persitent import AzurePersitentDict
from ..secrets import connstr as az_connection, usersource, usergoals, userdiary
from . import getProfilerResponses

__diary = AzurePersitentDict(az_connection, usersource, userdiary)
__goals = AzurePersitentDict(az_connection, usersource, usergoals)

def newdiary():
    return {"sideeffects": [], "reminders": { 'daily': {'reminder': False}, 'monthly': {'reminder': False}}, "adherence": [], "notes": [], "profilers": [], "fillins": {}}

def getGoals(user=None):
    if user is None:
        return __goals

    if user['userID'] not in __goals:
        return { "current": [], "complete": []}

    goals = __goals[user['userID']]

    return {
        "current": [g for g in goals if g['status'] == "active"],
        "complete": [g for g in goals if g['status'] == "complete"]
    }

def updateGoals(user, goal):
    id = user['userID']

    if id not in __goals:
        __goals[id] = []

    if goal['status'] == "complete":
        oldgoal = next(g for g in __goals[id] if g['goaltype'] == goal['goaltype'] and g['reviewDate'] == goal['reviewDate'] and g['detail'] == goal['detail'])
        if oldgoal is not None:
            __goals[id].remove(oldgoal)
            
        __goals[id].append(goal)
        __goals.commit()
        
        return True, "Update"

    if goal['status'] == "active":
        activegoals = [g for g in __goals[id] if g['status'] == "active" and g['goaltype'] == goal['goaltype']]
        if len([g for g in activegoals if g['detail'] == goal['detail']]) != 0:
            return False, "Existing active goal of this type"
        
        if len(activegoals) < 3:
            __goals[id].append(goal)
            __goals.commit()

            return True, "New"
        
        return False, "3 active goals of this type already"

    return False, f"Unrecognised new goal status {goal['status']}"

def getDiary(user=None):
    if user is None:
        return __diary

    if user['userID'] not in __diary:
        __diary[user["userID"]] = newdiary()
        __diary.commit()

    return __diary[user['userID']]


def getSideEffects(user=None, type=None):
    diary = getDiary(user)
    if user is None:
        return { "sideeffects": [ s for u in diary.values() for s in u["sideeffects"] ]}

    if type is None:
        return { "sideeffects": diary["sideeffects"] }
    else:
        return { "sideeffects": [s for s in diary['sideeffects'] if s['type'] == type]}

def recordSideEffect(user, sideeffect):
    id = user['userID']

    if id not in __diary:
       __diary[id] = newdiary()

    userse = __diary[id]['sideeffects']

    existing = next((s for s in userse if s['type'] == sideeffect['type'] and s['date'] == sideeffect['date']), False)

    if existing:
        existing.update(sideeffect)
    else:
        userse.append(sideeffect)

    __diary.commit()

def recordProfiler(user, profiler):
    id = user['userID']

    if id not in __diary:
        __diary[id] = {"sideeffects": [], "reminders": [], "adherence": [], "notes": [], "profilers": []}

    userdiary = __diary[id]
    if "profilers" not in userdiary:
        userdiary["profilers"] = []

    existing = next((p for p in userdiary["profilers"] if p["dueDate"] == profiler["dueDate"]), None)

    if existing:
        existing.update(profiler)
    else:
        userdiary["profilers"].append(profiler)

    __diary.commit()

    if profiler["result"] in ["postponed", "refused", "no-concerns"]:
        return True, { "result": profiler["result"] }
    else:
        # open profilerResponses.json
        profRes = getProfilerResponses()
        # filter appropriate response content
        output = { "content": [
            { "type": "markdown", "encoding": "raw", "text": "Based on your responses, we’ve selected a series of topics which are tailored to your concerns.\n\nYou can read these now or save them and come back to them later. We hope these will be helpful for you.\n\nWe’ll check in again in a few months. In the meantime, if you have any concerns or difficulties, you can find lots of useful information and helpful tips within the SWEET website. Alternatively you can speak to your breast cancer team or your GP.\n\nClick on any of the below links to find out more." },
            { "type": "accordion", "content": []}
        ]}

        for c in profiler["concernSpecifics"]:
            output["content"][1]["content"].append(profRes[c])

        # create page dictionary and return with result
        return True, output

def addNote(user, note):
    id = user["userID"]

    if id not in __diary:
       __diary[id] = newdiary

    usernotes = __diary[id]['notes']
    usernotes.append(note)
    __diary.commit()

def getNotes(user):
    id = user["userID"]
    if id not in __diary:
        __diary[id] = newdiary()

    return __diary[id]['notes']

def recordAdherence(user, adh):
    id = user["userID"]

    if id not in __diary:
       __diary[id] = newdiary

    __diary[id]['adherence'].append(adh)
    __diary.commit()

def saveFillin(user, fillin):
    id = user['userID']

    if id not in __diary:
        __diary[id] = newdiary()

    if "fillins" not in __diary[id]:
        __diary[id]['fillins'] = {}

    if fillin['path'] not in __diary[id]['fillins']:
        __diary[id]['fillins'][fillin['path']] = {}

    __diary[id]['fillins'][fillin['path']][fillin['name']] = fillin['response']
    __diary.commit()

    return True, "Update complete"

def getFillin(user, path, name):
    id = user['userID']

    if id not in __diary:
        __diary[id] = newdiary()
        __diary.commit()
        return ""

    if 'fillins' not in __diary[id]:
        __diary[id]['fillins'] = {}
        return ""

    if path not in __diary[id]['fillins']:
        return ""

    if name not in __diary[id]['fillins'][path]:
        return ""

    return __diary[id]['fillins'][path][name]

def getPlans(user):
    id = user['userID']

    if id not in __diary:
        __diary[id] = newdiary()
        __diary.commit()
        return ""

    if 'fillins' not in __diary[id]:
        __diary[id]['fillins'] = {}
        __diary.commit()
        return ""

    return __diary[id]['fillins']

def getReminders(user):
    id = user['userID']

    if id not in __diary:
        __diary[id] = newdiary()
        __diary.commit()

    if "reminders" not in __diary[id] or not isinstance(__diary[id]['reminders'], dict):
        __diary[id]['reminders'] = { 'daily': { 'reminder': False }, 'monthly': { 'reminder': False }}
        __diary.commit()

    return __diary[id]['reminders']

def setReminders(user, reminders):
    id = user['userID']

    if id not in __diary:
        __diary[id] = newdiary()

    __diary[id]['reminders'] = reminders
    __diary.commit()
