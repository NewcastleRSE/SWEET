from flask import Blueprint, request, render_template
from .auth import role_required
from .data.content import updateStructure as updateAppStructure, updatePageContent, saveResource
from .data.users import getAllUsers, createUser, getUser, updateUser
from .data.userdata import resetAll
from .automation.scheduling import running, start, stop, status

bp = Blueprint("admin", __name__, url_prefix="/admin")
admin_required = role_required(roles=["editor", "studyadmin", "sysadmin"])
staff_required = role_required(roles=["staff", "editor", "studyadmin", "sysadmin"])

@bp.route("/home")
@staff_required
def home():
    return render_template('admin.html')


@bp.route("/users")
@staff_required
def users():
    return render_template('admin.html')

@bp.route("/resources")
@admin_required
def resources():
    return render_template('admin.html')

@bp.route("/scheduling")
@admin_required
def scheduling():
    return render_template('admin.html')

# content management
@bp.route("/edit")
@role_required(roles=["editor", "admin", "sysadmin"])
def edit():
    return render_template("pages.html")

@bp.route("/edit/preview")
@admin_required
def previewEdit():
    return render_template("preview.html")

@bp.route("/structure/", methods=["POST"])
@admin_required
def updateStructure():
    if request.is_json:
        updateAppStructure(request.json)
        return { "status": "OK"}
    else:
        return { "status": "error", "message": "Update request sent without json data"}, 400

    
@bp.route("/content/", methods=["POST"])
@admin_required
def updatePage():
    if request.is_json:
        updatePageContent(request.json)
        return { "status": "OK"}
    else:
        return { "status": "error", "message": "Update request sent without json data"}, 400



@bp.route("/resources/", methods=["POST"])
@admin_required
def addResource():
    if request.is_json:
        saveResource(request.json)
        return { "status": "OK"}
    else:
        return { "status": "error", "message": "Update request sent without json data"}, 400

###
### user management
###
@bp.route("/data/createuser/", methods=["POST"])
@admin_required
def addUser():
    if request.is_json:
        user = request.json

        for field in ["userID", "email", "firstName", "lastName", "role"]:
            if field not in user:
                return { "status": "error", "message": f"Required field {field} not in  json data"}, 400

        createUser(user["userID"], user["email"], user["firstName"], user["lastName"], user["role"])
        return { "status": "OK"}
    else:
        return { "status": "error", "message": "Update request sent without json data"}, 400


@bp.route("/data/allusers")
@staff_required
def getAllUserDetails():
    return { "users": getAllUsers() }

@bp.get("/data/users/<userID>")
@staff_required
def getUserDetails(userID):
    return getUser(userID)

@bp.post("/data/users/<userID>")
@staff_required
def updateUserDetails(userID):
    if request.is_json:
        details = request.json

        result, message = updateUser(userID, **details)

        if result:
            return { 'status': 'OK', 'message': 'Update complete'}
        else:
            return { 'status': 'error', 'message': message }, 400

    return { "status": "error", "message": "Update request sent without json data"}, 400

@bp.route("/data/reset", methods=["POST"])
@staff_required
def resetUserData():
    if request.is_json:
        user = request.json['UserID']

        resetAll(user)
        return { "status": "OK"}
    else:
        return { "status": "error", "message": "Update request sent without json data"}, 400

###
# scheduling
###

@bp.route("/sched/status")
@admin_required
def getScheduleStatus():
    return {"status": status() }

@bp.route("/sched/running")
@admin_required
def getRunnningTasks():
    if status() == "running":
        ops = running()
        if len(ops):
            return { "operations": ops }

    return {}, 204 # No Content

@bp.route("/sched/start", methods=["POST"])
@admin_required
def startSchedule():
    if status() == "stopped":
        start()

    return '', 204

@bp.route("/sched/stop", methods=["POST"])
@admin_required
def stopSchedule():
    if status() == "running":
        stop()

    return '', 204


