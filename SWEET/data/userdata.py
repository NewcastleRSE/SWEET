from SWEET.data.users import confirmUserID
from .az_persitent import AzurePersitentDict, AzurePersistentList
from ..secrets import connstr as az_connection, usersource, usergoals, userdiary
from . import getContainer, getProfilerResponses
from datetime import date
import json

__diary = AzurePersitentDict(az_connection, usersource, userdiary)
__goals = AzurePersitentDict(az_connection, usersource, usergoals)

class UserData():
    
    def __init__(self, userID):
        udstore = getContainer(usersource)
        self.pathbase = f"/userdata/{userID}/"


        if not udstore.get_blob_client(f"{self.pathbase}__init__").exists():
            # create user data files:
            udstore.upload_blob(f"{self.pathbase}__init__", date.today().isoformat())

            for fname in ["diary", "plans", "fillins"]:
                udstore.upload_blob(f"{self.pathbase}{fname}", json.dumps({}))

            for fname in ["goals", "contacts", "profilers"]:
                udstore.upload_blob(f"{self.pathbase}{fname}", json.dumps([]))

            udstore.upload_blob(f"{self.pathbase}reminders", json.dumps({ 'daily': {'reminder': False}, 'monthly': {'reminder': False}}))
            
            if userID in __diary or userID in __goals:
                self.__importLegacy(userID)
    
    def diary(self):
        return AzurePersitentDict(az_connection, usersource, f"{self.pathbase}diary")
    def reminders(self):
        return AzurePersitentDict(az_connection, usersource, f"{self.pathbase}reminders")
    def goals(self):
        return AzurePersistentList(az_connection, usersource, f"{self.pathbase}goals")
    def contacts(self):
        return AzurePersistentList(az_connection, usersource, f"{self.pathbase}contacts")
    def plans(self):
        return AzurePersitentDict(az_connection, usersource, f"{self.pathbase}plans")
    def fillins(self):
        return AzurePersitentDict(az_connection, usersource, f"{self.pathbase}fillins")
    def profilers(self):
        return AzurePersistentList(az_connection, usersource, f"{self.pathbase}profilers")

    def __importLegacy(self, userID):
        legacyd = __diary.get(userID)
        if legacyd is not None:
            #import diary data
            diary = self.diary()

            for se in legacyd["sideeffects"]:
                if se["date"] not in diary:
                    diary[se["date"]] = {}

                if "sideeffects" not in diary[se["date"]]:
                    diary[se["date"]]["sideeffects"] = []
                diary[se["date"]]["sideeffects"].append(se)

            for adh in legacyd["adherence"]:
                if adh["date"] not in diary:
                    diary[adh["date"]] = {}
                
                diary[adh["date"]]["adherence"] = True

            for note in legacyd["notes"]:
                if note["date"] not in diary:
                    diary[note["date"]] = {}
                
                if "notes" not in diary[note["date"]]:
                    diary[note["date"]]["notes"] = []

                diary[note["date"]]["notes"].append[note]

            diary.commit()

            reminders = self.reminders()
            reminders.update(legacyd["reminders"])
            reminders.commit()

            profilers = self.profilers()
            profilers.extend(legacyd["profilers"])
            profilers.commit()

            contacts = self.contacts()
            contacts.extend(legacyd["contacts"])
            contacts.commit()

            fillins = self.fillins()
            fillins.update(legacyd["fillins"])
            fillins.commit()

            plans = self.plans()
            plans.update(legacyd["plans"])
            plans.commit()

        legacyg = __goals.get(userID)
        if legacyg is not None:
            #import goal data
            goals = self.goals()
            goals.extend(legacyg)
            goals.commit()


def getGoals(user=None):
    if user is None:
        return None

    goals = UserData(user["userID"]).goals()

    return {
        "current": [g for g in goals if g['status'] == "active"],
        "complete": [g for g in goals if g['status'] == "complete"]
    }

def updateGoals(user, goal):
    id = user['userID']

    goals = UserData(id).goals()

    if goal['status'] == "complete":
        oldgoal = next(g for g in goals if g['goaltype'] == goal['goaltype'] and g['reviewDate'] == goal['reviewDate'] and g['detail'] == goal['detail'])
        if oldgoal is not None:
            goals.remove(oldgoal)
            
        goals.append(goal)
        goals.commit()
        
        return True, "Update"

    if goal['status'] == "active":
        activegoals = [g for g in goals if g['status'] == "active" and g['goaltype'] == goal['goaltype']]
        if len([g for g in activegoals if g['detail'] == goal['detail']]) != 0:
            return False, "Existing active goal of this type"
        
        if len(activegoals) < 3:
            goals.append(goal)
            goals.commit()

            return True, "New"
        
        return False, "3 active goals of this type already"

    return False, f"Unrecognised new goal status {goal['status']}"

def getDiary(user=None, period=None):
    if user is None:
        return None

    diary = UserData(user["userID"]).diary()

    if period is None:
        return diary
    else:
        return { d: diary[d] for d in diary.keys() if d.startswith(period) }



def getSideEffects(user=None, sedate=None, type=None):
    if user is None:
        return None

    diary = getDiary(user)
    if sedate is None:
        if type is None:
            return { "sideeffects": [se for d in diary.keys() for se in diary[d]["sideeffects"]] }
        else:
            return { "sideeffects": [se for d in diary.keys() for se in diary[d]["sideeffects"] if se['type'] == type]}
    else:
        if type is None:
            return { "sideeffects": [se for se in diary[sedate]["sideeffects"]] }
        else:
            return next((se for se in diary[sedate]["sideeffects"] if se['type'] == type), None)

def recordSideEffect(user, sideeffect):
    id = user['userID']

    diary = UserData(id).diary()

    if sideeffect["date"] not in diary:
        diary[sideeffect["date"]] = {}

    if "sideeffects" not in diary[sideeffect["date"]]:
        diary[sideeffect["date"]]["sideeffects"] = []

    existing = next((s for s in diary[sideeffect["date"]]["sideeffects"] if s["type"] == sideeffect["type"]), None)

    if existing:
        existing.update(sideeffect)
    else:
        diary[sideeffect["date"]]["sideeffects"].append(sideeffect)

    diary.commit()

def deleteSideEffect(user, sideeffect):
    id = user['userID']

    diary = UserData(id).diary()

    if sideeffect["date"] not in diary:
        diary[sideeffect["date"]] = {}

    if "sideeffects" not in diary[sideeffect["date"]]:
        diary[sideeffect["date"]]["sideeffects"] = []

    existing = next((s for s in diary[sideeffect["date"]]["sideeffects"] if s["type"] == sideeffect["type"]), None)

    if existing:
        diary[sideeffect["date"]]["sideeffects"].remove(existing)

    diary.commit()


def recordProfiler(user, profiler):
    id = user['userID']

    profilers = UserData(id).profilers()

    existing = next((p for p in profilers if p["dueDate"] == profiler["dueDate"]), None)

    if existing:
        existing.update(profiler)
    else:
        profilers.append(profiler)

    profilers.commit()

    if profiler["result"] in ["postponed", "refused", "no-concerns"]:
        return True, { "result": profiler["result"] }
    else:
        # open profilerResponses.json
        profRes = getProfilerResponses()
        # filter appropriate response content
        output = { "content": [
            { "type": "markdown", "encoding": "raw", "text": "Based on your responses, we’ve selected a series of topics which are tailored to your concerns.\n\nYou can read these now or save them and come back to them later. We hope these will be helpful for you.\n\nWe’ll check in again in a few months. In the meantime, if you have any concerns or difficulties, you can find lots of useful information and helpful tips within the HT&amp;Me website. Alternatively you can speak to your breast cancer team or your GP.\n\nClick on any of the below links to find out more." },
            { "type": "accordion", "content": []}
        ]}

        for c in profiler["concernSpecifics"]:
            output["content"][1]["content"].append(profRes[c])

        # create page dictionary and return with result
        return True, output

def getAllProfilerResults(user):
    id = user["userID"]

    profilers = UserData(id).profilers()

    responses = getProfilerResponses()
    return [{
        "dueDate": profiler["dueDate"],
        "result": profiler["result"],
        "reminderDate": profiler.get("reminderDate"),
        "dateComplete": profiler.get("dateComplete"),
        "refuseReason": profiler.get("reason"),
        "concernAreas": profiler.get("concernAreas"),
        "concernDetails": { "type": "accordion", "content": [responses[c] for c in profiler.get(["concernSpecifics"], [])]}
    } for profiler in sorted(profilers, key=lambda p: p['dueDate']) if profiler['dueDate'] < date.today().isoformat()]

def getLatestProfiler(user):
    id = user["userID"]

    profilers = UserData(id).profilers()

    if len(profilers) == 0:
        profilers.append({ "dueDate": date.today().isoformat })
        profilers.commit()

    latest = sorted(profilers, key=lambda p: p['dueDate'], reverse=True)[0]
    responses = getProfilerResponses()

    if "concernSpecifics" in latest:
        latest["concernDetails"] = { 
            "type": "accordion",
            "content": [responses[c] for c in latest["concernSpecifics"]]
        }
    
    return latest

def addNote(user, note):
    ### also updates notes!!
    id = user["userID"]

    diary = UserData(id).diary()

    if note["date"] not in diary:
        diary[note["date"]] = {}

    if "notes" not in diary[note["date"]]:
        diary[note["date"]]["notes"] = []
    
    existing = next((n for n in diary[note["date"]]["notes"] if n["taken"]["date"] == note["taken"]["date"] and n["taken"]["time"] == note["taken"]["time"]), None)
    if existing:
        existing.update(note)
    else:
        diary[note["date"]]["notes"].append(note)
    
    diary.commit()

def getNotes(user, notedate=None):
    id = user["userID"]
    diary = UserData(id).diary()

    if notedate is None:
        return [note for d in diary.keys() for note in diary[d]["notes"]]
    else:
        return [note for note in diary[notedate]["notes"]]

def deleteNote(user, note):
    id = user["userID"]

    diary = UserData(id).diary()
    notedate = note["date"]
    if notedate not in diary:
        diary[notedate] = {}

    if "notes" not in diary[notedate]:
        diary[notedate]["notes"] = []
    
    existing = next((n for n in diary[notedate]["notes"] if n["taken"]["date"] == note["taken"]["date"] and n["taken"]["time"] == note["taken"]["time"]), None)

    if existing:
        diary[notedate]["notes"].remove(existing)

def recordAdherence(user, adh):
    id = user["userID"]

    diary = UserData(id).diary()

    if adh["date"] not in diary:
        diary[adh["date"]] = {}

    diary[adh["date"]]['adherence'] = True
    diary.commit()

def saveFillin(user, fillin):
    id = user['userID']

    fillins = UserData(id).fillins()

    path = fillin['path']
    name = fillin['name']

    if path not in fillins:
        fillins[path] = {}

    fillins[path][name] = fillin['response']
    fillins.commit()

    return True, "Update complete"

def getFillin(user, path, name):
    id = user['userID']

    fillins = UserData(id).fillins()

    if path not in fillins:
        return ""

    if name not in fillins[path]:
        return ""

    return fillins[path][name]

def getReminders(user):
    id = user['userID']

    reminders = UserData(id).reminders()

    return reminders

def setReminders(user, reminders):
    id = user['userID']

    savedreminders = UserData(id).reminders()
    savedreminders.update(reminders)
    reminders.commit()

def getContacts(user):
    if user is None:
        return None
    
    id = user["userID"]

    return UserData(id).contacts()

def addContact(user, contact):
    if user is None:
        return None
    
    contacts = UserData(id).contacts()

    contacts.append(contact)
    contacts.commit()

def deleteContact(user, contact):

    if user is None:
        return None
    
    id = user["userID"]

    contacts = UserData(id).contacts()    
    
    if contact in contacts:
        contacts.remove(contact)
        contacts.commit()


def  updateContact(user, old, new):
    if user is None:
        return None
    
    id = user["userID"]

    contacts = UserData(id).contacts()

    if old in contacts:
        contacts[contacts.index(old)] = new
        contacts.commit()

def getPlan(user, plan):
    if user is None:
        return None
    
    id = user["userID"]

    plans = UserData(id).plans()

    if plan not in plans:
        return None

    return plans[plan]

def savePlan(user, plan):
    if user is None:
        return None
    
    id = user["userID"]

    plans = UserData(id).plans()

    plans[plan["type"]] = plan
    plans.commit()
