from .users import updateUser, getAllUsers
from .az_persitent import AzurePersitentDict, AzurePersistentList
from ..secrets import connstr as az_connection, usersource, usergoals, userdiary, userdatastore
from . import getContainer, getProfilerResponses
from datetime import date, timedelta, MINYEAR, MAXYEAR
import json
from azure.core.exceptions import ResourceExistsError
from ..schemas import getSideEffectValueMappings
from ..data.content import getGoalMessage

__diary = AzurePersitentDict(az_connection, usersource, userdiary)
__goals = AzurePersitentDict(az_connection, usersource, usergoals)

def transferLegacy(ud, userID):
        legacyd = __diary.get(userID)
        if legacyd is not None:
            #import diary data
            diary = ud.diary()

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
                
                diary[note["date"]]["notes"] = note

            diary.commit()

            reminders = ud.reminders()
            reminders.update(legacyd["reminders"])
            reminders.commit()

            profilers = ud.profilers()
            profilers.extend(legacyd["profilers"])
            profilers.commit()

            contacts = ud.contacts()
            contacts.extend(legacyd["contacts"])
            contacts.commit()

            fillins = ud.fillins()
            fillins.update(legacyd["fillins"])
            fillins.commit()

            plans = ud.plans()
            plans.update(legacyd["plans"])
            plans.commit()

        legacyg = __goals.get(userID)
        if legacyg is not None:
            #import goal data
            goals = ud.goals()
            goals.extend(legacyg)
            goals.commit()

class UserData():
    
    def __init__(self, userID):
        udstore = getContainer(usersource)
        self.pathbase = f"{userdatastore}/{userID}/"
        self.user = userID

        try:
            # create user data files:
            udstore.upload_blob(f"{self.pathbase}_init", date.today().isoformat())

            for fname in ["diary", "plans", "fillins", "thoughts"]:
                udstore.upload_blob(f"{self.pathbase}{fname}", json.dumps({}))

            for fname in ["goals", "contacts", "profilers"]:
                udstore.upload_blob(f"{self.pathbase}{fname}", json.dumps([]))

            udstore.upload_blob(f"{self.pathbase}reminders", json.dumps({ 'daily': {'reminder': False}, 'monthly': {'reminder': False}}))

            #transferLegacy(self, userID)
        except ResourceExistsError:
            # user data has previously been created
            pass
    
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
    def thoughts(self):
        return AzurePersitentDict(az_connection, usersource, f"{self.pathbase}thoughts")

    def reset(self):
        udstore = getContainer(usersource)

        # re-create user data files:
        udstore.upload_blob(f"{self.pathbase}_init", date.today().isoformat(), overwrite=True)

        for fname in ["diary", "plans", "fillins", "thoughts"]:
            udstore.upload_blob(f"{self.pathbase}{fname}", json.dumps({}), overwrite=True)

        for fname in ["goals", "contacts", "profilers"]:
            udstore.upload_blob(f"{self.pathbase}{fname}", json.dumps([]), overwrite=True)

        udstore.upload_blob(f"{self.pathbase}reminders", json.dumps({ 'daily': {'reminder': False}, 'monthly': {'reminder': False}}), overwrite=True)

        updateUser(self.user, tunnelsComplete=[])




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
        
        message, which = getGoalMessage(goal)
        return True, message

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


def getPrintDiary(user, period):
    if user is None or period is None:
        return None

    pd = {}
    pd["period"] = period

    if period[6:] in ["09", "04", "06", "11"]:
        pd["days"] = 30
    elif period[6:] == "02":
        pd["days"] = 28
    else:
        pd["days"] = 31

    pd["prettyperiod"] = date.fromisoformat(f"{period}-14").strftime("%B %Y") # use a mid-month date to avoid time zone & dst issues with 0 time

    pd["fulldiary"] = { d: i for d, i in dict(sorted(UserData(user["userID"]).diary().items())).items() if d.startswith(period) }
    
    for d, i in pd["fulldiary"].items():
        i.update(prettydate=date.fromisoformat(d).strftime("%d %B %Y"))

    if len(pd["fulldiary"]) == 0:
        return pd

    seschema = getSideEffectValueMappings()

    for d, i in pd["fulldiary"].items():
        if "sideeffects" in i:
            if "sideeffects" not in pd:
                pd["sideeffects"] = {}

            for se in i["sideeffects"]:
                if se["type"] not in pd["sideeffects"]:
                    pd["sideeffects"][se["type"]] = []
                
                if "date" not in se:
                    se["date"] = d

                if isinstance(se["severity"], str) and se["severity"] in seschema:
                    se["severity"] = seschema[se["severity"]]

                if isinstance(se["impact"], str) and se["impact"] in seschema:
                    se["impact"] = seschema[se["impact"]]

                se["sevdesc"] = seschema[round(float(se["severity"]))]
                se["impdesc"] = seschema[round(float(se["impact"]))]

                pd["sideeffects"][se["type"]].append(se)

    return pd
            


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
        if sedate not in diary:
            return None
        if type is None:
            return { "sideeffects": [se for se in diary[sedate]["sideeffects"]] }
        else:
            return next((se for se in diary[sedate]["sideeffects"] if se['type'] == type), None)

def recordSideEffect(user, sideeffect):
    id = user['userID']

    diary = UserData(id).diary()

    if sideeffect["date"] not in diary:
        diary[sideeffect["date"]] = { "sideeffects": [], "notes": {}}

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
        return

    if "sideeffects" not in diary[sideeffect["date"]]:
        return

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
    
    return True, { "result": profiler["result"] }

    # ref gh issue #183: this code is throwing an error, but is no longer required following refactor to profiler logic.
    # commented out for now in case it needs reinstating: to be removed in future update.

    # if profiler["result"] in ["postponed", "refused", "no-concerns"]:
    #     return True, { "result": profiler["result"] }
    # else:
    #     # open profilerResponses.json
    #     profRes = getProfilerResponses()
    #     # filter appropriate response content
    #     output = { "content": [
    #         { "type": "markdown", "encoding": "raw", "text": "Based on your responses, we’ve selected a series of topics which are tailored to your concerns.\n\nYou can read these now or save them and come back to them later. We hope these will be helpful for you.\n\nWe’ll check in again in a few months. In the meantime, if you have any concerns or difficulties, you can find lots of useful information and helpful tips within the HT&amp;Me website. Alternatively you can speak to your breast cancer team or your GP.\n\nClick on any of the below links to find out more." },
    #         { "type": "accordion", "content": []}
    #     ]}

    #     for c in profiler["concernSpecifics"]:
    #         output["content"][1]["content"].append(profRes[c])

    #     # create page dictionary and return with result
    #     return True, output

def getAllProfilerResults(user):
    id = user["userID"]

    profilers = UserData(id).profilers()

    responses = getProfilerResponses()
    return {"profilers": [{
        "dueDate": profiler["dueDate"],
        "result": profiler["result"],
        "reminderDate": profiler.get("reminderDate"),
        "dateComplete": profiler.get("dateComplete"),
        "refuseReason": profiler.get("reason"),
        "concernAreas": profiler.get("concernAreas"),
        "concernDetails": { "type": "accordion", "content": [responses[c] for c in profiler.get("concernSpecifics", [])]}
    } for profiler in sorted(profilers, key=lambda p: p['dueDate']) if profiler['dueDate'] <= date.today().isoformat()]}

def getLatestProfiler(user):
    id = user["userID"]

    profilers = UserData(id).profilers()

    if len(profilers) == 0:
        profilers.append({ "dueDate": date.today().isoformat() })
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
        diary[note["date"]] = { "sideeffects": [], "notes": {}}

    if "notes" not in diary[note["date"]]:
        diary[note["date"]]["notes"] = note
    else:
        notes = diary[note["date"]]["notes"]
        if isinstance(notes, list):
            diary[note["date"]]["notes"] = note
        else:
            diary[note["date"]]["notes"].update(note)
    
    diary.commit()

def getNotes(user, notedate=None):
    id = user["userID"]
    diary = UserData(id).diary()

    if notedate is None:
        return [diary[d]["notes"] for d in diary.keys()]
    else:
        if notedate not in diary or "notes" not in diary[notedate]:
            return {}
        
        notes = diary[notedate]["notes"]
        if isinstance(notes, list):
            notes = notes[0]

        return notes

def deleteNote(user, note):
    id = user["userID"]

    diary = UserData(id).diary()
    notedate = note["date"]

    if notedate not in diary:
        return False
    else:
        diary[notedate]["notes"] = {}
        diary.commit()
        return True

def recordAdherence(user, adh):
    if "action" not in adh or "date" not in adh:
        return

    if adh["action"] not in ["record", "remove"]:
        return

    id = user["userID"]

    diary = UserData(id).diary()

    if adh["date"] not in diary:
        diary[adh["date"]] = { "sideeffects": [], "notes": {}}


    diary[adh["date"]]['adherence'] = True if adh["action"] == "record" else False
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
    savedreminders.commit()

def getContacts(user):
    if user is None:
        return None
    
    id = user["userID"]

    return UserData(id).contacts()

def addContact(user, contact):
    if user is None:
        return None
    
    contacts = UserData(user["userID"]).contacts()

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

def saveThoughts(user, thoughts_in):
    if user is None:
        return None

    if "path" not in thoughts_in or "details" not in thoughts_in:
        return None

    id = user["userID"]
    thoughts = UserData(id).thoughts()
    path = thoughts_in["path"]

    thoughts[path] = thoughts_in["details"]
    thoughts.commit()

def getThoughts(user, path=None):
    if user is None:
        return

    id = user["userID"]
    thoughts = UserData(id).thoughts()

    if path is None:
        return thoughts

    if path not in thoughts:
        return None

    return thoughts[path]

def resetAll(UserID=None):
    if UserID is None:
        return

    UserData(UserID).reset()

def get_schedule(day):
    schedule = []

    def fixdate(yr, mth, dy):
        if mth > 12:
            yr +=1
            mth -= 12

        try:
            tgdate = date(yr, mth, dy)
        except ValueError:
            # we've fixed months > 12, so either yr is outside max/min, or dy is outside mth.
            # in the former case: re-raise the ValueError. In the latter case, try to construct the first of the following month.
            # we do this recursively so this function can fix the month if this logic causes it to exceed 12.
            if MINYEAR > yr > MAXYEAR:
                raise
            else:
                tgdate = fixdate(yr, mth+1, 1)

        return tgdate


    for user in getAllUsers():
        ud = UserData(user['userID'])
        ur = ud.reminders()

        d, m = ur['daily'], ur['monthly']

        if d.get('reminder', False):
            rd = {'firstName': user['firstName'], 'lastName': user['lastName'], 'type': 'daily'}
            rd.update(d)
            schedule.append(rd)

        if m.get('reminder', False):
            lastrem = date.fromisoformat(m.get('lastSent', m.get('start', date.today().isoformat()))) # if there's no start date this will never get sent
            interval = 3 if m.get('frequency', "") == "three" else 1

            target = fixdate(lastrem.year, lastrem.month + interval, lastrem.day)
            if target <= day:
                rm = {'firstName': user['firstName'], 'lastName': user['lastName'], 'type': 'monthly'}
                rm.update(m)
                schedule.append(rm)

                m['lastSent'] = date.today().isoformat()
                ur.commit()
    
    return schedule