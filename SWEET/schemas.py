from flask import (
    Blueprint
)

from .auth import login_required

bp = Blueprint('schemas', __name__, url_prefix='/app/schemas')

## SCHEMAS:
@bp.route("/goals/<name>")
@login_required
def getGoalSchema(name):
    return {
        'activity': {
            "activity": ["walking", "housework", "gardening", "strength exercises", "balance exercises", "swimming", "cycling", "pilates", "yoga", "thai chi", "dancing", "bowling", "running"],
            "frequency": [1,2,3,4,5,6,7],
            "duration": [10, 20, 30, 40, 50, 60],
            "displayName": "Activity"
        },
        'eating': {
            "activity": [
                "Make a meal plan",
                "Use a meal plan to write a weekly shopping list",
                "Bulk-cook some healthy meals",
                "Choose a low-calorie alcoholic drink",
                "Have 5 portions of fruit and vegetables in a day",
                "Add an extra portion of vegetables with dinner",
                "Swap sugary cereal for breakfast for a fruit smoothie with oats",
                "Swap a snack of crisps for carrot sticks with hummus",
                "Make a fake-away at home instead of ordering a take-away"
            ],
            "frequency": [1,2,3,4,5,6,7],
            "displayName": "Healthy Eating"
        }
    }[name]

@bp.route("/sideeffects")
@login_required
def getSideEffectTypes():
    return {
        "types": [
            { "name": "hf", "description": "Hot Flush", "embedtext": "hot flushes", "embedplural": True, "questions": ["frequency", "severity", "impact", "notes"]},
            { "name": "arth", "description": "Joint Pain", "embedtext": "joint pain", "questions": ["severity", "impact", "notes"]},
            { "name": "ftg", "description": "Fatigue", "embedtext": "fatigue", "questions": ["severity", "impact", "notes"]},
            { "name": "mood", "description": "Mood Changes", "embedtext": "mood", "questions": ["severity", "impact", "notes"]},
            { "name": "sleep", "description": "Sleep Disruption", "embedtext": "sleep disruption", "questions": ["severity", "impact", "notes"]},
            { "name": "other", "description": "Other Side-effects", "embedtext": "other side-effect", "questions": ["severity", "impact", "notes"]}
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

