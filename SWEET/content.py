from flask import (
    Blueprint, request, abort, send_file, g, url_for
)

from .data.content import (
    loadResourceBlob, getStructure, getPageContents, getPageDetails, getResource as getNamedResource, getResources, getPages
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
    all = getResources()
    for name in all:
        if 'source' not in all[name]:
            all[name]['source'] = url_for('getResourceFile', name=name)

    return all

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
    res = getNamedResource(name)
    if res is None:
        abort(404)

    blob = loadResourceBlob(name)
    if blob is None:
        abort(404)

    return send_file(blob, mimetype=res['content-type'], download_name=res['filename'])