from ..secrets import firetext
import requests
from datetime import date

def _processResponse(text):
    code = text[:text.find(":")]
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

def send_reminder(user, send_time):
    msg = f"Hi {user['firstName']} {user['lastName']}, this is your daily reminder from HT & Me to take you hormone therapy tablets."
    return _send(user['mobile'], msg, schedule=f"{date.today().isoformat()} {send_time}")



