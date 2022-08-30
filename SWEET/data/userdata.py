from .users import updateUser, getAllUsers, countAllUsers
from .az_persitent import AzurePersitentDict, AzurePersistentList, getInitDate
from ..secrets import connstr as az_connection, usersource, userdatastore
from . import getContainer
from .content import getProfilerResponses, getGoalMessage
from datetime import date, timedelta, MINYEAR, MAXYEAR
import json
from azure.core.exceptions import ResourceExistsError
from ..schemas import getSideEffectValueMappings

from sentry_sdk import capture_message

from flask import request
from .users import logvisit

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

            optionNumber = allocateNext21DayOption()
            udstore.upload_blob(f"{self.pathbase}meta", json.dumps({ '21dayoption': optionNumber}))
        except ResourceExistsError:
            # user data has previously been created
            pass
    def init(self):
        return getInitDate(az_connection, usersource, f"{self.pathbase}_init")
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
    def metadata(self):
        return AzurePersitentDict(az_connection, usersource, f"{self.pathbase}meta")

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

# get user number and allocate based on assigning user sin turn to option 1, 2 and 3
def allocateNext21DayOption():
    userNumber = countAllUsers()
    if userNumber % 3 == 0:
        return 3
    elif userNumber % 2 == 0:
        return 2
    else:
        return 1

def log(user, action, old=None, new=None):
    logvisit(user, request.user_agent.string, action=action, old=old, new=new)


def getGoals(user=None):
    if user is None:
        return None

    goals = UserData(user["userID"]).goals()

    return {
        "current": [g for g in goals if g['status'] == "active"],
        "complete": [g for g in goals if g['status'] == "complete"]
    }

def get21DayOptionNumber(user=None):
    if user is None:
        return None
    meta = UserData(user["userID"]).metadata()

    if '21dayoption' in meta.keys():
        return meta['21dayoption']
    else:

        # as a back up if user registered before 21 day option introduced, return option 1
        return 1

def getinit(user=None):
    if user is None:
        return None
    init = UserData(user["userID"]).init()
    return init

def updateGoals(user, goal):
    id = user['userID']

    ud = UserData(id)
    goals = ud.goals()

    if goal['status'] == "complete" or goal['status'] == "deleted":
        oldgoal = next(g for g in goals if g['goaltype'] == goal['goaltype'] and g['reviewDate'] == goal['reviewDate'] and g['detail'] == goal['detail'])
        if oldgoal is not None:
            goals.remove(oldgoal)
            
        goals.append(goal)
        goals.commit()

        log(user, "update", old=oldgoal.copy(), new=goal.copy())

        meta = ud.metadata()

        if "goalmsg" not in meta:
            meta['goalmsg'] = {
                'activity': {
                    'y': 0,
                    'p': 0,
                    'n': 0
                },
                'eating': {
                    'y': 0,
                    'p': 0,
                    'n': 0
                }
            }

        which = meta['goalmsg'][goal['goaltype']][goal['outcome']]
        message, nextmsg = getGoalMessage(goal, which)
        meta['goalmsg'][goal['goaltype']][goal['outcome']] = nextmsg
        meta.commit()

        return True, message

    if goal['status'] == "active":
        activegoals = [g for g in goals if g['status'] == "active" and g['goaltype'] == goal['goaltype']]
        if len([g for g in activegoals if g['detail'] == goal['detail']]) != 0:
            return False, "Existing active goal of this type"
        
        if len(activegoals) < 3:
            goals.append(goal)
            goals.commit()

            log(user, "add", new=goal.copy())

            return True, "New"
        
        return False, "3 active goals of this type already"

    return False, f"Unrecognised new goal status {goal['status']}"

def checkActiveGoal(user, goaltype, detail):
    id = user['userID']

    goals = UserData(id).goals()

    if len([g for g in goals if g['status'] == 'active' and g['goaltype'] == goaltype and g['detail'] == detail]) > 0:
        return True
    
    return False


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
        pd["days"] = 29 if int(period[:4]) % 4 == 0 else 28 # given the expected longevity of this system we'll ignore the century aspect of leap years!
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
            print([se for se in diary[sedate]])
            if hasattr([se for se in diary[sedate]], 'sideeffects'):
                return { "sideeffects": [se for se in diary[sedate]["sideeffects"]] }
            else:
                return { "sideeffects": [] }
        else:
            return next((se for se in diary[sedate]["sideeffects"] if se['type'] == type), None)

# Side effect can be array to support adding multiple in one go
def recordSideEffect(user, sideeffects):
    id = user['userID']

    diary = UserData(id).diary()

    for sideeffect in sideeffects:

        if sideeffect["date"] not in diary:
            diary[sideeffect["date"]] = { "sideeffects": [] }

        if "sideeffects" not in diary[sideeffect["date"]]:
            diary[sideeffect["date"]]["sideeffects"] = []

        existing = next((s for s in diary[sideeffect["date"]]["sideeffects"] if s["type"] == sideeffect["type"]), None)

        if existing:
            ex = existing.copy()
            existing.update(sideeffect)
            log(user, "update", old=ex, new=existing.copy())
        else:
            diary[sideeffect["date"]]["sideeffects"].append(sideeffect)
            log(user, "add", new=sideeffect.copy())

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
        log(user, "delete", old=existing)

    diary.commit()


def recordProfiler(user, profiler):
    id = user['userID']

    profilers = UserData(id).profilers()

    # check if we're updating a due profiler:
    # this will usually be the case: the UI logic retrieves the next due profiler, 
    # which is always created when a previous profiler is completed.
    existing = next((p for p in profilers if 'dueDate' in p and p["dueDate"] == profiler["dueDate"]), None)

    if existing:
        ex = existing.copy()
        existing.update(profiler)
        log(user, "update", old=ex, new=existing.copy())
    else:
        profilers.append(profiler)
        log(user, "add", new=profiler.copy())

    if profiler['result'] in ["complete", "refused"]:
        # remove dueDate as this profiler is no longer 'due'
        if existing:
            del existing['dueDate']
        else :
            del profiler['dueDate']

        # schedule the next profiler:
        # technically the schedule is 3 months, but since months are variable length
        # I have substituted 91days.
        nextdue = date.today() + timedelta(days=91)
        profilers.append({"dueDate": nextdue.isoformat() })


    # save any changes:
    profilers.commit()
    
    return True, { "result": profiler["result"] }

def getAllProfilerResults(user):
    id = user["userID"]

    profilers = UserData(id).profilers()

    responses = getProfilerResponses()
    return {"profilers": [{
        "result": profiler.get("result"),
        "reminderDate": profiler.get("reminderDate"),
        "dateComplete": profiler.get("dateComplete"),
        "refuseReason": profiler.get("reason"),
        "concernAreas": profiler.get("concernAreas"),
        "concernDetails": { "type": "accordion", "content": [responses[c] for c in profiler.get("concernSpecifics", [])]}
    } for profiler in profilers if "dateComplete" in profiler]}

def getLatestProfiler(user):
    id = user["userID"]

    profilers = UserData(id).profilers()

    if len(profilers) == 0:
        nextdue = date.today() + timedelta(days=7)
        profilers.append({ "dueDate": nextdue.isoformat() })
        profilers.commit()

    latest = sorted(profilers, key=lambda p: p.get('dueDate') or p.get("dateComplete"), reverse=True)[0]
    responses = getProfilerResponses()

    if "concernSpecifics" in latest:
        latest["concernDetails"] = { 
            "type": "accordion",
            "content": [responses[c] for c in latest["concernSpecifics"]]
        }
    
    return latest

def addDrug(user, drug):
    ### also updates drugs!!
    id = user["userID"]

    diary = UserData(id).diary()

    if drug["date"] not in diary:
        diary[drug["date"]] = {}

    if "drugs" not in diary[drug["date"]]:
        diary[drug["date"]]["drugs"] = drug
        log(user, "add", new=drug.copy())
    else:
        ex = diary[drug["date"]]["drugs"].copy()
        diary[drug["date"]]["drugs"].update(drug)
        log(user, "update", old=ex, new=diary[drug["date"]]["drugs"].copy())
    
    diary.commit()

def getDrugs(user, drugdate=None):
    id = user["userID"]
    diary = UserData(id).diary()

    if drugdate is None:
        return [diary[d]["drugs"] for d in diary.keys()]
    else:
        if drugdate not in diary or "drugs" not in diary[drugdate]:
            return {}
        
        drugs = diary[drugdate]["drugs"]

        return drugs

def deleteDrug(user, drug):
    id = user["userID"]

    diary = UserData(id).diary()
    drugdate = drug["date"]

    if drugdate not in diary:
        return False

    old=diary[drugdate].pop("drugs", None)

    if old is None:
        return False
    else:
        log(user, "delete", old=old)
        diary.commit()

    return True

def addNote(user, note):
    ### also updates notes!!
    id = user["userID"]

    diary = UserData(id).diary()

    if note["date"] not in diary:
        diary[note["date"]] = {}

    if "notes" not in diary[note["date"]]:
        diary[note["date"]]["notes"] = note
        log(user, "add", new=note.copy())
    else:
        ex = diary[note["date"]]["notes"].copy()
        diary[note["date"]]["notes"].update(note)
        log(user, "update", old=ex, new=diary[note["date"]]["notes"].copy())
    
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

        return notes

def deleteNote(user, note):
    id = user["userID"]

    diary = UserData(id).diary()
    notedate = note["date"]

    if notedate not in diary:
        return False

    old=diary[notedate].pop("notes", None)

    if old is None:
        return False
    else:
        log(user, "delete", old=old)
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
        diary[adh["date"]] = { 'adherence': False }

    ex = diary[adh["date"]].get("adherence", False)

    diary[adh["date"]]['adherence'] = True if adh["action"] == "record" else False

    diary.commit()
    log(user, "update", old=ex, new=adh.copy())

    
def saveFillin(user, fillin):
    id = user['userID']

    fillins = UserData(id).fillins()

    path = fillin['path']
    name = fillin['name']

    if path not in fillins:
        fillins[path] = {}

    ex =  fillins[path].get(name, "")
    fillins[path][name] = fillin['response']
    fillins.commit()

    log(user, "update", old=ex, new=fillins[path][name])

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

    return reminders.copy()

def setReminders(user, reminders):
    id = user['userID']

    savedreminders = UserData(id).reminders()
    ex=savedreminders.copy()
    savedreminders.update(reminders)
    savedreminders.commit()
    log(user, "update", old=ex, new=savedreminders.copy())


def getContacts(user):
    if user is None:
        return None
    
    id = user["userID"]

    return UserData(id).contacts().copy()

def addContact(user, contact):
    if user is None:
        return None
    
    contacts = UserData(user["userID"]).contacts()

    contacts.append(contact)
    contacts.commit()

    log(user, "add", new=contact.copy())

def deleteContact(user, contact):

    if user is None:
        return None
    
    id = user["userID"]

    contacts = UserData(id).contacts()    
    
    if contact in contacts:
        contacts.remove(contact)
        contacts.commit()
        log(user, "delete", old=contact)


def updateContact(user, old, new):
    if user is None:
        return None
    
    id = user["userID"]

    contacts = UserData(id).contacts()

    if old in contacts:
        contacts[contacts.index(old)] = new
        contacts.commit()

        log(user, "update", old=old, new=new.copy())

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

    ex = plans.get(plan["type"])

    plans[plan["type"]] = plan
    plans.commit()

    if ex:
        log(user, "update", old=ex.copy(), new=plan.copy())
    else:
        log(user, "add", new=plan.copy())

def saveThoughts(user, thoughts_in):
    if user is None:
        return None

    if "path" not in thoughts_in or "details" not in thoughts_in:
        return None

    id = user["userID"]
    thoughts = UserData(id).thoughts()
    path = thoughts_in["path"]

    if path in thoughts:
        log(user, "update", old={"path": path, "details": thoughts[path].copy()}, new=thoughts_in.copy())
    else:
        log(user, "add", new=thoughts_in.copy())

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
            lastrem = date.fromisoformat(m.get('lastSent', m.get('start', date.today().isoformat())))
            interval = 3 if m.get('frequency', "") == "three" else  1

            # if the reminder hasn't been sent before AND day == start (which is held in lastrem)
            # we want to send the reminder on lastrem - i.e. the start date.
            # This will deal with start dates set in the past:
            # # they will not be sent immediately and will wait for the appropriate interval
            target = lastrem if day == lastrem and 'lastSent' not in m else fixdate(lastrem.year, lastrem.month + interval, lastrem.day)
            if target <= day:
                rm = {'firstName': user['firstName'], 'lastName': user['lastName'], 'type': 'monthly'}
                rm.update(m)
                schedule.append(rm)

                m['lastSent'] = date.today().isoformat()
                ur.commit()

        p = getLatestProfiler(user)
        if "reminderDate" in p and p["reminderDate"] == day.isoformat():
                schedule.append({'firstName': user['firstName'], 'lastName': user['lastName'], 'type': 'profiler-reminder', 'method': 'email', 'to': user['email']})
        elif "dueDate" in p and p["dueDate"] == day.isoformat():
                schedule.append({'firstName': user['firstName'], 'lastName': user['lastName'], 'type': 'profiler-due', 'method': 'email', 'to': user['email']})


        # 10 day and 21 day reminder
        init_date = getinit(user)
        today = date.today()
        days_since_joining = today - init_date

        if (days_since_joining == 10):
            sched = {'firstName': user['firstName'], 'lastName': user['lastName'],'method': 'email', 'type': 'tendays'}
            schedule.append(sched)
        elif days_since_joining == 21:
            option = get21DayOptionNumber(user)
            if option == 1:
                sched21 = {'firstName': user['firstName'], 'lastName': user['lastName'],'method': 'email', 'type': 'op121days'}
                schedule.append(sched21)
            elif option == 2:
                sched21 = {'firstName': user['firstName'], 'lastName': user['lastName'],'method': 'email', 'type': 'op221days'}
                schedule.append(sched21)
            else:
                sched21 = {'firstName': user['firstName'], 'lastName': user['lastName'],'method': 'email', 'type': 'op321days'}
                schedule.append(sched21)

    

        gs = [g for g in ud.goals() if g['reviewDate'] == day.isoformat()]

        if len(gs):
            if len([g for g in gs if g['goaltype'] == 'activity']):
                schedule.append({
                    'firstName': user['firstName'], 
                    'lastName': user['lastName'], 
                    'type': 'goal-reminder', 
                    'method': 'email', 
                    'to': user['email'],
                    'shortType': 'activity',
                    'longType': 'being active'
                })
            if len([g for g in gs if g['goaltype'] == 'eating']):
                schedule.append({
                    'firstName': user['firstName'], 
                    'lastName': user['lastName'], 
                    'type': 'goal-reminder', 
                    'method': 'email', 
                    'to': user['email'],
                    'shortType': 'eating',
                    'longType': 'eating healthily'
                })



    return schedule
