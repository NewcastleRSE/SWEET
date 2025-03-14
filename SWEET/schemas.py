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
            "activity": ["walking", "housework", "gardening", "strength exercises", "balance exercises", "swimming", "cycling", "pilates", "yoga", "tai chi", "dancing", "bowling", "running"],
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

def getSideEffectValueMappings():
    return {
        0: "Not at all",
        1: "Hardly",
        2: "A little",
        3: "Moderately",
        4: "Very",
        5: "Extremely",
    }

@bp.route("/sideeffects/<name>")
@login_required
def getSideEffectDetails(name):
    all = getSideEffectTypes()
    return next((t for t in all.items() if  t["name"] == name), {"status": "error", "message": f"Side effect schema not found for '{name}'"})

@bp.route("/tunnels")
@login_required
def getTunnels():
    return {
        '#home/healthy-living/being-active': [
            {'path': 'welcome', 'content': [{'type': 'paragraph', 'text': 'Click Next to read about the health benefits of being active.'}]}, 
            {'path': 'health-benefits', 'content': [{'type': 'paragraph', 'text': 'Click Next to find answers to questions about being active after having breast cancer.'}]}, 
            {'path': 'quest', 'content': [{'type': 'paragraph', 'text': 'Click Next to find out how you can stay safe while being active.'}]}, 
            {'path': 'safe', 'content': [{'type': 'paragraph', 'text': 'Click Next to see examples of activities you may want to try.'}]}, 
            {'path': 'activities', 'content': [{'type': 'paragraph', 'text': 'Once you have looked at the activities you could try, click Next to see how goal setting can help you get more active.'}]}, 
            {'path': 'goals', 'content': [{'type': 'paragraph', 'text': 'Click Next to set your activity goals.'}]}, 
            {'path': 'setgoals', 'content': []}, 
            {'path': 'find-out-more', 'content': []}
        ],
        '#home/healthy-living/healthy-eating': [
            {'path': 'welcome', 'content': [{'type': 'paragraph', 'text': 'Click Next to find out why eating a healthy diet is important.'}]}, 
            {'path': 'importance', 'content': [{'type': 'paragraph', 'text': 'Click Next to read more about what a healthy diet includes.'}]}, 
            {'path': 'healthy-diet', 'content': [{'type': 'paragraph', 'text': 'Click Next to see more specialist information regarding diet following a diagnosis of breast cancer and get answers to some questions that women with breast cancer sometimes have about their diet.'}]}, 
            {'path': 'faq', 'content': [{'type': 'paragraph', 'text': 'Click Next to see hints and tips for how you eat and plan meals.'}]}, 
            {'path': 'change', 'content': [{'type': 'paragraph', 'text': 'Click Next to find out how setting goals can help you eat more healthily.'}]}, 
            {'path': 'goal-setting', 'content': [{'type': 'paragraph', 'text': 'Click Next to set your healthy eating goals.'}]}, 
            {'path': 'goals', 'content': []}, 
            {'path': 'find-out-more', 'content': []}
        ]
    }

@bp.route("/thoughts")
@login_required
def getThoughtSchemas():
    path = request.args.get("path", "")

    schema = {
        "#home/dealing-se/hot-flushes/thoughts/hfactivity": {
            "title": "Change the way you think about hot flushes",
        },
        "#home/dealing-se/hot-flushes/thoughts/nsactivity": {
            "title": "Change the way you think about night sweats",
        },
        "#home/dealing-se/sleep/cbt/changesleep": {
            "title": "Change the way you think about sleep problems",
        },
        "#home/dealing-se/mood/managing-mood": {
            "title": "Do My Thoughts activity to manage mood changes",
        }
    }
    if path:
        return schema[unquote(path)]
    else:
        return { "thoughts": [ { "path": p, "title": schema[p]["title"] } for p in schema.keys() ]}