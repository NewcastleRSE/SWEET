from flask import (
    Blueprint
)

from .auth import login_required

bp = Blueprint('schemas', __name__, url_prefix='/app/schemas')

## SCHEMAS:
@bp.route("/goals/activity")
@login_required
def getActivityGoalSchema():
    return {
        "activity": ["walking", "housework", "gardening", "strength exercises", "balance exercises", "swimming", "cycling", "pilates", "yoga", "thai chi", "dancing", "bowling", "running"],
        "frequency": [1,2,3,4,5,6,7],
        "duration": [10, 20, 30, 40, 50, 60]
    }

@bp.route("/sideeffects")
@login_required
def getSideEffectTypes():
    return {
        "types": [
            { "name": "hf", "description": "Hot Flush"},
            { "name": "arth", "description": "Arthralgia (joint pain)"},
            { "name": "ftg", "description": "Fatigue"}
        ]
    }

@bp.route("/sideeffects/<name>")
@login_required
def getSideEffectDetails(name):
    return {
        "hf": {
            "title": "Hot Flushes",
            "embedtext": "hot flushes",
            "frequency": "day"
        },
        "arth": {
            "title": "Arthralgia (Joint Pain)",
            "embedtext": "joint pains",
            "frequency": "week"
        }
    }[name]

