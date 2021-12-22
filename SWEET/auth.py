import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)

from .data import users, getToken

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
        role = 'user'
        pwd = request.form['password']

        if not (uid.strip() or pwd.strip()):
            flash("You must enter a registration code and password")
            return redirect(url_for("auth.login"))

        # check reg code in case client-side validation has been bypassed:
        if not users.checkRegistrationCode(uid):
            flash("Registration failed: the submitted registration code is invalid or has previously been used.")
            return redirect(url_for('auth.login'))

        result, detail = users.registerUser(uid, pwd, role, fullName=fname, email=email, mobile=mobile)
        # if registration works detail is the user, otherwise it's a dict containing error info:

        if result:
            users.useRegistrationCode(uid)
            # SEND EMAIL TO OXFORD & NEWCASTLE TEAMS WITH DETAILS FROM user
            return _login(detail)

        return detail, 400 # we assume login failed due to an error in the request data
    
    return render_template("register.html")

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
