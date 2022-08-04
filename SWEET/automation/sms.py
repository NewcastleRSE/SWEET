from ..secrets import firetext
from ..data.users import logvisit
import requests
from datetime import date

def _processResponse(text):
    code = int(text[:text.find(":")])
    message = text[text.find(" ")+1:]

    return code, message

def _send(to, msg, **kwargs):
    payload = {"apiKey": firetext['apikey'], "from": "HTandMe", "to": to, "message": msg}
    payload.update(kwargs) # for e.g. scheduled sending. for api parameters see https://www.firetext.co.uk/docs#sendingsms
    response = requests.post(firetext['endpoint'], params=payload)
    if response.status_code != 200:
        response.raise_for_status()
    else:
        code, message = _processResponse(response.text)
        if code == 0:
            return True, message
        else:
            return False, message

def send_daily_reminder(user, send_time):
    msg = f"Hi {user['firstName']}, remember your hormone therapy today."
    logvisit(user, "scheduler_sms", "send_daily_reminder")
    return _send(user['mobile'], msg, schedule=f"{date.today().isoformat()} {send_time}")

def send_monthly_reminder(user, send_time):
    msg = f"Hi {user['firstName']}, this is a reminder to order your next hormone therapy prescription."
    logvisit(user, "scheduler_sms", "send_monthly_reminder")
    return _send(user['mobile'], msg, schedule=f"{date.today().isoformat()} {send_time}")


