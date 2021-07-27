from flask import Blueprint, request, render_template
from .auth import role_required
from .data.content import updateStructure, updatePageContent, saveResource

bp = Blueprint("admin", __name__, url_prefix="/admin")
admin_required = role_required(roles=["editor", "admin"])

# content management
@bp.route("/edit")
@role_required(roles=["editor", "admin", "sysadmin"])
def edit():
    return render_template("pages.html")

@bp.route("/structure/", methods=["POST"])
@admin_required
def updateStructure():
    if request.is_json:
        updateStructure(request.json)
        return { "status": "OK"}
    else:
        return { "status": "error", "message": "Update request sent without json data"}, 400

    
@bp.route("/content/", methods=["POST"])
@admin_required
def updatePageContent():
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


