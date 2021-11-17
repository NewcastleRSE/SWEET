from urllib.parse import unquote
from flask import (
    Blueprint, request
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
            { "name": "hf", "description": "Hot Flushes", "embedtext": "hot flushes", "embedplural": True, "questions": ["frequency", "severity", "impact", "notes"]},
            { "name": "arth", "description": "Joint Pain", "embedtext": "joint pain", "questions": ["severity", "impact", "notes"]},
            { "name": "ftg", "description": "Fatigue", "embedtext": "fatigue", "questions": ["severity", "impact", "notes"]},
            { "name": "mood", "description": "Mood Changes", "embedtext": "mood", "questions": ["severity", "impact", "notes"]},
            { "name": "ns", "description": "Night Sweats", "embedtext": "night sweats", "embedplural": True, "questions": ["severity", "impact", "notes"]},
            { "name": "sleep", "description": "Sleep Problems", "embedtext": "sleep problems", "embedplural": True, "questions": ["severity", "impact", "notes"]},
            { "name": "other", "description": "Other Side effects", "embedtext": "other side effect", "questions": ["severity", "impact", "notes"]}
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

@bp.route("/tunnels")
@login_required
def getTunnels():
    return {
        '#home/taking-ht': [
            {'path': 'welcome', 'content': []}, 
            {'path': 'animation', 'content': []}, 
            {'path': 'can-help', 'content': []},
            {'path': 'important', 'content': []},
            {'path': 'build', 'content': []},
            {'path': 'my-plan', 'content': []},
            {'path': 'tips', 'content': []},
            {'path': 'questions', 'content': []},
            {'path': 'more-questions', 'content': []},
            {'path': 'more', 'content': []}
        ],
        '#home/healthy-living/being-active': [
            {'path': 'welcome', 'content': []}, 
            {'path': 'health-benefits', 'content': []}, 
            {'path': 'quest', 'content': []}, 
            {'path': 'safe', 'content': []}, 
            {'path': 'activities', 'content': []}, 
            {'path': 'goals', 'content': []}, 
            {'path': 'setgoals', 'content': []}, 
            {'path': 'find-out-more', 'content': []}
        ],
        '#home/healthy-living/healthy-eating': [
            {'path': 'welcome', 'content': []}, 
            {'path': 'importance', 'content': []}, 
            {'path': 'healthy-diet', 'content': []}, 
            {'path': 'faq', 'content': []}, 
            {'path': 'change', 'content': []}, 
            {'path': 'goal-setting', 'content': []}, 
            {'path': 'goals', 'content': []}, 
            {'path': 'find-out-more', 'content': []}
        ]
    }

@bp.route("/thoughts")
@login_required
def getThoughtSchemas():
    path = request.args.get("path", "")

    schema = {
        "#home/dealing-se/hot-flushes/cbt/change-think-hf": {
            "title": "Changing the way you think about hot flushes",
            "negfillin": "hotflushestochange",
            "neglabel": "These are the thoughts I want to change about Hot Flushes:",
            "posfillin": "hotflusheschanged",
            "poslabel": "Alternative self-supportive response:"
        },
        "#home/dealing-se/hot-flushes/cbt/change-think-ns": {
            "title": "Changing the way you think about night sweats",
            "negfillin": "nightsweatstochange",
            "neglabel": "These are the thoughts I want to change about night sweats:",
            "posfillin": "nightsweatschanged",
            "poslabel": "Alternative self-supportive response:"
        },
        "#home/dealing-se/sleep/cbt": {
            "title": "Changing the way you think about sleep problems",
            "negfillin": "sleeptochange",
            "neglabel": "There are the thoughts I want to change about sleep problems:",
            "posfillin": "sleepchanged",
            "poslabel": "Alternative self-supportive response:"
        }
    }
    if path:
        return schema[unquote(path)]
    else:
        return { "thoughts": [ { "path": p, "title": schema[p]["title"] } for p in schema.keys() ]}