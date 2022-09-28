from ..secrets import email as settings, hostname
from ..data.content import getEmailMessages
from ..data.users import logvisit
from smtplib import SMTP
from email.message import EmailMessage


def _send(msg):
    client = SMTP(settings["server"], settings["port"])
    client.starttls()
    client.login(settings["user"], settings["password"])
    client.send_message(msg)
    client.quit()

def _send_message(to, template="welcome", **kwargs):
    messages = getEmailMessages()
    htmltemplate = """\
<html>
  <head>
    <style>

    </style>
  </head>
  <body>{body}</body>
</html>"""

    msg = EmailMessage()
    msg["To"] = to
    msg["From"] = settings["from"]
    
    msg["Subject"] = messages[template]["subject"].format(**kwargs)
    msg.set_content(messages[template]["plain"].format(**kwargs))
    msg.add_alternative(htmltemplate.format(body=messages[template]["html"].format(**kwargs)), subtype="html")

    _send(msg)

def send_welcome(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "welcome", fullname=fullname)
    # User doesn't exist yet so can't log visit
    # logvisit(user, "scheduler_email", action="send_welcome")

def send_notify_register(user):
    print('notify register')
    print(user)
    _send_message(settings['notify'], "notify_register", regcode=user['userID'])
    logvisit(user, "scheduler_email", action="send_notify_register")

def email_daily_reminder(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "daily_reminder", fullname=fullname)
    logvisit(user, "scheduler_email", action="email_daily_reminder")

def email_monthly_reminder(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "monthly_reminder", fullname=fullname)
    logvisit(user, "scheduler_email", action="email_monthly_reminder")

def send_password_reset(user, token):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "password_reset", fullname=fullname, token=token, uid=user['userID'], hostname=hostname)
    logvisit(user, "scheduler_email", action="send_password_reset")

def send_profiler_reminder(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "profiler_reminder", fullname=fullname, hostname=hostname)
    logvisit(user, "scheduler_email", action="send_profiler_reminder")

def send_profiler_due(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "profiler_reminder", fullname=fullname, hostname=hostname)
    logvisit(user, "scheduler_email", action="send_profiler_due")

def send_goal_reminder(detail):
    fullname = f"{detail['firstName']} {detail['lastName']}"
    _send_message(f"{fullname} <{detail['email']}>", "goal_reminder", fullname=fullname, hostname=hostname, shorttype=detail['shortType'], longtype=detail['longType'])
    logvisit(detail, "scheduler_email", action="send_goal_reminder")

def send_welcome_email(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "welcome", fullname=fullname, hostname=hostname)
    # User doesn't exist yet so can't log visit
    # logvisit(user, "scheduler_email", action="send_welcome_email")

def send_10day_email(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "ten_days", fullname=fullname, hostname=hostname)
    logvisit(user, "scheduler_email", action="send_10day_email")

def send_21dayop1_email(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "option_1_21_days", fullname=fullname, hostname=hostname)
    logvisit(user, "scheduler_email", action="send_21dayop1_email")

def send_21dayop2_email(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "option_2_21_days", fullname=fullname, hostname=hostname)
    logvisit(user, "scheduler_email", action="send_21dayop2_email")

def send_21dayop3_email(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "option_3_21_days", fullname=fullname, hostname=hostname)
    logvisit(user, "scheduler_email", action="send_21dayop3_email")
