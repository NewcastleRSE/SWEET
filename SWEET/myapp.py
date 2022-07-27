from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
)

from .data.users import updateUser, validateUser

from .data.userdata import (
    checkActiveGoal, getGoals, updateGoals, getSideEffects as getUserSideEffects, recordSideEffect, recordProfiler, 
    getDiary as getUserDiary, getPrintDiary,
    addDrug, getDrugs, addNote, getNotes, recordAdherence, saveFillin as saveUserFillin, getFillin as getUserFillin,
    getReminders, setReminders, 
    getContacts, addContact, deleteContact, updateContact,
    getAllProfilerResults, getLatestProfiler,
    getPlan, savePlan, deleteDrug, deleteNote, deleteSideEffect, getThoughts, saveThoughts
)

from .auth import login, login_required

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
        "complete": [goal for goal in goals['complete'] if goal['goaltype'] == goaltype]
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

@bp.route("/checkgoal")
@login_required
def checkGoalExists():
    goaltype = request.args.get("goaltype")
    detail = request.args.get("detail")

    if goaltype is None or detail is None:
        return {"status": "error", "message": "Checking for active goals requires both goaltype and detail aparameters in the querystring" }, 400
    
    return { "status": "OK", "result": checkActiveGoal(g.user, goaltype, detail) }

@bp.route("/mydiary")
@login_required
def getDiary():
    period = request.args.get("period")
    return getUserDiary(g.user, period=period)

@bp.route("/mydiary/print")
@login_required
def renderPrintDiary():
    period = request.args.get("period")
    diary=getPrintDiary(g.user, period=period)
    rendergraph = "sideeffects" in diary and len(diary["sideeffects"]) > 0
    renderdetails = rendergraph or any([True if ("notes" in d and len(d["notes"]["note"]) > 0) else False for d in diary["fulldiary"].values()])

    return render_template("printdiary.html", diary=diary, graph=rendergraph, details=renderdetails)

@bp.route("/mydiary/sideeffects")
@login_required
def getSideEffects():
    setype = request.args.get("type")
    sedate = request.args.get("date")

    output = getUserSideEffects(g.user, sedate=sedate, type=setype)
    if output is None:
        return "", 204

    return output

@bp.route("/mydiary/sideeffects/", methods=["POST"])
@login_required
def addOrUpdateSideEffect():
    if request.is_json:
        se = request.json
        recordSideEffect(g.user, se)

        return {"status": "OK", "message": "Update complete"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/mydiary/sideeffects/delete/", methods=["POST"])
@login_required
def deleteASideEffect():
    if request.is_json:
        se = request.json
        deleteSideEffect(g.user, se)

        return {"status": "OK", "message": "Update complete"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/profiler/", methods=["POST"])
@login_required
def profiler():
    if request.is_json:
        prof = request.json
        result, output = recordProfiler(g.user, prof)

        if result:
            l = getLatestProfiler(g.user)
            l.update(status="OK")
            return l
            

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/profiler/responses")
@login_required
def profilerResponses():
    return getAllProfilerResults(g.user)

@bp.route("/profiler/latest")
@login_required
def latestProfilerResult():
    return getLatestProfiler(g.user)

@bp.route("/mydiary/drugs")
@login_required
def get_drugs():
    drugdate = request.args.get("date")
    return {"drugs": getDrugs(g.user, drugdate=drugdate) }

@bp.route("/drugs/", methods=["POST"])
@login_required
def add_drugs():
    if request.is_json:
        drug = request.json
        addDrug(g.user, drug)
        return {"status": "OK", "message": "Drug added"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/drugs/delete/", methods=["POST"])
@login_required
def delete_drug():
    if request.is_json:
        drug = request.json
        deleteDrug(g.user, drug)

        return { "status": "OK", "message": "Drug deleted" }

@bp.route("/mydiary/notes")
@login_required
def get_notes():
    notedate = request.args.get("date")
    return {"notes": getNotes(g.user, notedate=notedate) }

@bp.route("/notes/", methods=["POST"])
@login_required
def add_notes():
    if request.is_json:
        note = request.json
        addNote(g.user, note)
        return {"status": "OK", "message": "Note added"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("/notes/delete/", methods=["POST"])
@login_required
def delete_note():
    if request.is_json:
        note = request.json
        deleteNote(g.user, note)

        return { "status": "OK", "message": "Note deleted" }

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
    return g.user

@bp.route("/mydetails/", methods=["POST"])
@login_required
def updateMyProfile():
    if request.is_json:
        profile = request.json
        if "userID" in profile:
            del profile["userID"]

        if "password" in profile:
            # if password is in the profile this is a password change request
            # we need to validate the user's old password before updating,
            # and send ONLY the password to update as all other values should be unchanged.
            success = validateUser(g.user['userID'], profile["oldpass"])[0]

            if not success:
                return {"status": "error", "message": "Old password was provided incorrectly; please retype then try again."}, 409

            profile = {"password": profile["password"]}
            
        updateUser(g.user['userID'], **profile)

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

@bp.route("/myplans/<plan>")
@login_required
def fetchPlan(plan):
    myplan = getPlan(g.user, plan)
    if myplan is None:
        return { "result": "not made" }
    else:
        return myplan

@bp.route("/myplans/", methods = ["POST"])
@login_required
def setPlan():
    if request.is_json:
        plan = request.json
        savePlan(g.user, plan)
        return {"status": "OK", "message": "Plan Updated"}

    return {"status": "error", "message": "Update request sent witout json"}, 400

@bp.route("mynotes/<notedate>")
@login_required
def getDateNotes(notedate):
    return getNotes(g.user, notedate)

@bp.route("/mythoughts")
@login_required
def thoughts():
    path = request.args.get("path", None)

    return jsonify(getThoughts(g.user, path))

@bp.route("/mythoughts/", methods=["POST"])
@login_required
def post_thoughts():
    if request.is_json:
        thought = request.json
        saveThoughts(g.user, thought)
        return {"status": "OK", "message": "Thoughts Updated"}

    return {"status": "error", "message": "Update request sent witout json"}, 400

