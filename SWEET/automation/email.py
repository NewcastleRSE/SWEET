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
        <body>
            {body}
            <p>If you have any problems at all accessing the website please contact htandmesupport@warwick.ac.uk</p>
            <p>The HT&amp;Me Team</p>
            <p>
               -----------------------------------------------------------<br>
               This is an automatic email. Please DO NOT reply to this email as any reply will not be received.
            </p>
        </body>
        </html>
    """

    msg = EmailMessage()
    msg["To"] = to
    msg["From"] = settings["from"]

    subject = messages[template]["subject"].format(**kwargs)

    if hostname == "sweet.ncldata.dev":
        subject = f"[STAGING] {subject}"
    
    msg["Subject"] = subject
    msg.set_content(messages[template]["plain"].format(**kwargs))
    msg.add_alternative(htmltemplate.format(body=messages[template]["html"].format(**kwargs)), subtype="html")

    _send(msg)

def send_welcome(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "welcome", fullname=user['firstName'])
    # User doesn't exist yet so can't log visit
    # logvisit(user, "scheduler_email", action="send_welcome")

def send_notify_register(user):
    print('notify register')
    print(user)
    _send_message(settings['notify'], "notify_register", regcode=user['userID'])
    logvisit(user, "scheduler_email", action="send_notify_register")

def email_daily_reminder(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "daily_reminder", fullname=user['firstName'])
    logvisit(user, "scheduler_email", action="email_daily_reminder")

def email_monthly_reminder(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "monthly_reminder", fullname=user['firstName'])
    logvisit(user, "scheduler_email", action="email_monthly_reminder")

def send_password_reset(user, token):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "password_reset", fullname=user['firstName'], token=token, uid=user['userID'], hostname=hostname)
    logvisit(user, "scheduler_email", action="send_password_reset")

def send_profiler_reminder(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "profiler_reminder", fullname=user['firstName'], hostname=hostname)
    logvisit(user, "scheduler_email", action="send_profiler_reminder")

def send_profiler_due(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "profiler_reminder", fullname=user['firstName'], hostname=hostname)
    logvisit(user, "scheduler_email", action="send_profiler_due")

def send_goal_reminder(detail):
    fullname = f"{detail['firstName']} {detail['lastName']}"
    _send_message(f"{fullname} <{detail['email']}>", "goal_reminder", fullname=detail['firstName'], hostname=hostname, shorttype=detail['shortType'], longtype=detail['longType'])
    logvisit(detail, "scheduler_email", action="send_goal_reminder")

def send_welcome_email(user):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", "welcome", fullname=user['firstName'], hostname=hostname)
    # User doesn't exist yet so can't log visit
    # logvisit(user, "scheduler_email", action="send_welcome_email")

def send_nudge(user, type="2_week"):
    fullname = f"{user['firstName']} {user['lastName']}"
    _send_message(f"{fullname} <{user['email']}>", type, fullname=user['firstName'], hostname=hostname)
    logvisit(user, "scheduler_email", action="send_{type}_nudge")
