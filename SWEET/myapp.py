from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)

from .data import users
from .data.userdata import (
    getGoals, updateGoals, getSideEffects as getUserSideEffects, recordSideEffect, recordProfiler, getDiary as getUserDiary
)

from .auth import login_required

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
