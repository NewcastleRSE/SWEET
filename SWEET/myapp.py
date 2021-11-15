from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)

from .data import users
from .data.userdata import (
    getGoals, updateGoals, getSideEffects as getUserSideEffects, recordSideEffect, recordProfiler, 
    getDiary as getUserDiary, addNote, getNotes, recordAdherence, saveFillin as saveUserFillin, getFillin as getUserFillin,
    getPlans, getReminders, setReminders, getProfile, updateProfile,
    getContacts, addContact, deleteContact, updateContact
)

from .auth import login_required

from urllib.parse import unquote

bp = Blueprint('myapp', __name__, url_prefix='/myapp')

@bp.route("/mygoals")
@login_required
def getAllUserGoals():
    return getGoals(g.user)

@bp.route("/mygoals/<goaltype>")
@login_required
def getUserGoals(goaltype):
    goals = getGoals(g.user)
    return {
        "current": [goal for goal in goals['current'] if goal['goaltype'] == goaltype],
        "complete": [goal for goal in goals['complete'] if goal['goaltype'] == goaltype],
    }

@bp.route("/mygoals/", methods=["POST"])
@login_required
def addOrUpdateGoal():
    if request.is_json:
        goal = request.json
        result, message = updateGoals(g.user, goal)

        if result:
            return {"status": "OK", "message": message}
        
        return {"status": "error", "message": message}, 500

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/mydiary")
@login_required
def getDiary():
    return getUserDiary(g.user)

@bp.route("/mydiary/sideeffects/<setype>")
@login_required
def getSideEffects(setype):
    return getUserSideEffects(g.user, setype)


@bp.route("/mydiary/sideeffects/", methods=["POST"])
@login_required
def addOrUpdateSideEffect():
    if request.is_json:
        se = request.json
        recordSideEffect(g.user, se)

        return {"status": "OK", "message": "Update complete"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/profiler/", methods=["POST"])
@login_required
def profiler():
    if request.is_json:
        prof = request.json
        result, output = recordProfiler(g.user, prof)

        if result:
            return { "status": "OK", "details": output }

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/notes")
@login_required
def get_notes():
    return {"notes": getNotes(g.user) }

@bp.route("/notes/", methods=["POST"])
@login_required
def add_notes():
    if request.is_json:
        note = request.json
        addNote(g.user, note)
        return {"status": "OK", "message": "Note added"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/adherence/", methods=["POST"])
@login_required
def record_adherence():
    if request.is_json:
        adh = request.json
        recordAdherence(g.user, adh)
        return {"status": "OK", "message": "Adherence added"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/fillins/", methods=["POST"])
@login_required
def saveFillin():
    if request.is_json:
        fillin = request.json
        
        saveUserFillin(g.user, fillin)

        return {"status": "OK", "message": "Adherence added"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/fillins")
@login_required
def getFillin():
    path = request.args.get("path", "")
    name = request.args.get("name", "")

    if path and name:
        path = unquote(path)
        return { "response": getUserFillin(g.user, path, name) }

    return {"status": "error", "message": "Missing url parameters; 'path' and 'name' expected." }, 400

@bp.route("/myplans")
@login_required
def getMyPlans():
    return getPlans(g.user)

@bp.route("/myreminders")
@login_required
def getMyReminders():
    return getReminders(g.user)

@bp.route("/myreminders/", methods=["POST"])
@login_required
def setMyReminders():
    if request.is_json:
        reminders = request.json
        
        setReminders(g.user, reminders)

        return {"status": "OK", "message": "Reminders saved"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/mydetails")
@login_required
def getMyDetails():
    return getProfile(g.user)

@bp.route("/mydetails/", methods=["POST"])
@login_required
def updateMyProfile():
    if request.is_json:
        profile = request.json
        
        updateProfile(g.user, profile)

        return {"status": "OK", "message": "Profile updated"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/mycontacts")
@login_required
def getMyContacts():
    return { "contacts": getContacts(g.user)}

@bp.route("/mycontacts/add/", methods=["POST"])
@login_required
def addMyContact():
    if request.is_json:
        contact = request.json
        addContact(g.user, contact)
        return { "status": "OK", "message": "Contact Added"}
    
    return {"status": "error", "message": "Add contact request sent without json"}, 400

@bp.route("/mycontacts/delete/", methods=["POST"])
@login_required
def deleteMyContact():
    if request.is_json:
        contact = request.json
        deleteContact(g.user, contact)
        return {"status": "OK", "message": "Contact Deleted"}

    return {"status": "error", "message": "Delete request sent witout json"}, 400

@bp.route("/mycontacts/update/", methods=["POST"])
@login_required
def updateMyContact():
    if request.is_json:
        detail = request.json
        updateContact(g.user, detail['oldcontact'], detail['newcontact'])
        return {"status": "OK", "message": "Contact Updated"}

    return {"status": "error", "message": "Delete request sent witout json"}, 400
