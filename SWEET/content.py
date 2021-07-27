from flask import (
    Blueprint, request, abort
)

from data.content import (
    getStructure, getPageContents, getPageDetails, getResource, getResources, getPages
)

from .auth import login_required

from urllib.parse import unquote

bp = Blueprint('content', __name__, url_prefix='/app')

@bp.route("/structure")
@login_required
def structure():
    return getStructure()

@bp.route("/content")
@login_required
def getPageContent():
    path = request.args.get("path", "")
    if path:
        path = unquote(path)
        if path == "#":
            path = "#home"
        
        details = getPageDetails(path)
        details["content"] = getPageContents(path) 
        return details
    else:
        return getPages()

@bp.route("/resources")
@login_required
def resources():
    return getResources()

@bp.route("/resources/<name>")
@login_required
def getResource(name):
    res = getResource(name)
    if res is None:
        abort(404)

    return res
