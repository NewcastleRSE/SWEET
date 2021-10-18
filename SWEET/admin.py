from flask import Blueprint, request, render_template
from .auth import role_required
from .data.content import updateStructure as updateAppStructure, updatePageContent, saveResource

bp = Blueprint("admin", __name__, url_prefix="/admin")
admin_required = role_required(roles=["editor", "sysadmin"])

@bp.route("/home")
@admin_required
def home():
    return render_template('admin.html')


@bp.route("/users")
@admin_required
def home():
    return render_template('admin.html')

@bp.route("/resources")
@admin_required
def home():
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
