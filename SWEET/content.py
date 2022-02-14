from flask import (
    Blueprint, request, abort, send_file, g
)

from .data.content import (
    getResourceBlob, getStructure, getPageContents, getPageDetails, getResource as getNamedResource, getResources, getPages
)

from.data.users import logvisit

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

        if details is None:
            logvisit(g.user, request.user_agent.string, action="navigate", page=path, referrer=request.headers.get("X-SWEET-referrer"), status="404")
            abort(404)
            
        logvisit(g.user, request.user_agent.string, action="navigate", page=path, referrer=request.headers.get("X-SWEET-referrer"), status="200")
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
    res = getNamedResource(name)
    if res is None:
        abort(404)

    return res

@bp.route("/resources/files/<name>")
@login_required
def getResourceFile(name):
    res = getResourceBlob(name)
    if res is None:
        abort(404)
    
    return send_file(res['file'], mimetype=res['content-type'], download_name=res['downloadName'])