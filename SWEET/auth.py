import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)

from .data import users, getToken

from .automation.email import send_notify_register, send_password_reset

bp = Blueprint('auth', __name__, url_prefix='/auth')

__logged_in_users = {}

def _login(user):
    token = getToken(6)
    session['user'] = token
    __logged_in_users[token] = user

    anchor = "home" #if "skipWelcome" in user and user["skipWelcome"] else "welcome"

    return redirect(url_for("index", _anchor=anchor))

def _logout(token):
    if token in __logged_in_users:
        del __logged_in_users[token]


#auth
@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        pwd = request.form['password']
        uid = request.form['userID']

        success, user = users.validateUser(uid, pwd)

        if success:
            return _login(user)

        flash('Incorrect username/password combination')
        flash('Your username is usually your email address')
        return redirect(url_for("auth.login"))

    return render_template("login.html")



@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        uid = request.form['regCode']
        fname = request.form['fullName']
        email = request.form['email']
        mobile = request.form['mobile']
        role = 'staff' if uid[:2] == "RT" else 'user'
        pwd = request.form['password']

        if not (uid.strip() or pwd.strip()):
            flash("You must enter a registration code and password")
            return redirect(url_for("auth.register"))

        # check reg code in case client-side validation has been bypassed:
        if not users.checkRegistrationCode(uid):
            flash("Registration failed: the submitted registration code is invalid or has previously been used.")
            return redirect(url_for('auth.register'))

        result, detail = users.registerUser(uid, pwd, role, fullName=fname, email=email, mobile=mobile)
        # if registration works detail is the user, otherwise it's a dict containing error info:

        if result:
            users.useRegistrationCode(uid)
            
            # SEND EMAIL TO OXFORD & NEWCASTLE TEAMS WITH DETAILS FROM user
            send_notify_register(detail)

            return _login(detail)

        # if registration fails a reason message is returned in the details:
        # flash message and return user to reg page.
        flash(detail['message'])
        return redirect(url_for('auth.register'))
    
    return render_template("login.html")

@bp.route("/logout")
def logout():
    token = session.pop("user", None)
    if token is not None:
        _logout(token)
    
    return redirect(url_for("auth.login"))

@bp.route("/confirm")
def confirmEmail():
    email = request.args.get("email", None)
    if email is None:
        return { "message": "This route requires the 'email' parameter"}, 400

    if users.confirmUserID(email) is None:
        return { "result": "failed", "message": "Email address not associated with any account"}

    if users.checkActiveUser(email):
        return {"result": "failed", "message": "Account for this emal address has already been activated"}

    return {"result": "OK", "user": users.getUser(email)}

@bp.route("/activate/", methods=["POST"])
def activateAccount():
    if request.is_json:
        details = request.json
        users.updateUser(details['userID'], password=details["password"])

        return {"status": "OK"}

    return {"status": "error", "message": "Update request sent without json"}, 400

@bp.route("check")
def checkRegCode():
    code = request.args.get("code")
    if users.checkRegistrationCode(code):
        return {"message": "code available" }
    else:
        return {"message": "Registration code not available"}, 404

# password resetting:
@bp.route("resetpassword")
def resetPassword():
    email = request.args.get("email")
    resettoken = getToken(10)

    result, user = users.unsetPassword(email, resettoken)
    if result:
        #send reset email:
        send_password_reset(user, resettoken)
        # return appropriate response
        return {"result": "OK"}
    else:
        return {"result": "No such user" }, 404

@bp.route("passwordreset", methods=["GET", "POST"])
def passwordReset():
    if request.method == "GET":
        uid = request.args.get("id")
        token = request.args.get("token")
        valid = users.validateResetToken(uid, token)
        return render_template("resetpwd.html", valid=valid, user=uid, token=token)
    else:
        uid = request.form.get("id")
        token = request.form.get("token")
        if users.validateResetToken(uid, token):
            # reset user password
            password = request.form.get("password")
            # should we be validating the password confirmation on the server-side?
            users.updateUser(uid, password=password)
            return _login(users.getUser(uid))
        else:
            return render_template("resetpwd.html", valid=False, user=uid, token=token)

@bp.before_app_request
def load_logged_in_user():
    token = session.get('user')

    if token is None or token not in __logged_in_users:
        g.user = None
    else:
        g.user = __logged_in_users[token]

def login_required(view):
    @functools.wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return redirect(url_for('auth.login'))

        return view(*args, **kwargs)

    return wrapped_view

def role_required(roles=[]):
    def decorator(view):
        @functools.wraps(view)
        def wrapped_view(*args, **kwargs):
            if g.user is None:
                return redirect(url_for('auth.login'))
            elif g.user['role'] not in roles:
                flash(f"You do not have the correct permissions to access {request.url}.")
                return redirect(url_for("index"))

            return view(*args, **kwargs)

        return wrapped_view
    
    return decorator
