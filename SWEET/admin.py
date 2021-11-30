from flask import Blueprint, request, render_template
from .auth import role_required
from .data.content import updateStructure as updateAppStructure, updatePageContent, saveResource
from .data.users import getAllUsers, createUser

bp = Blueprint("admin", __name__, url_prefix="/admin")
admin_required = role_required(roles=["editor", "sysadmin"])
staff_required = role_required(roles=["staff", "editor", "sysadmin"])

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
@admin_required
def getAllUserDetails():
    return { "users": getAllUsers() }