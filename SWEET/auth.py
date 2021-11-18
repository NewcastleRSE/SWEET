import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)

from .data import users, getToken

bp = Blueprint('auth', __name__, url_prefix='/auth')

__logged_in_users = {}


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
            token = getToken(6)
            session['user'] = token
            __logged_in_users[token] = user

            return redirect(url_for("index", _anchor="welcome"))

        flash('Incorrect username/password combination')
        flash('Your username is usually your email address')
        return redirect(url_for("auth.login"))

    return render_template("login.html")

@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        uid = request.form['userID']
        fname = request.form['fullName']
        role = 'user'
        pwd = request.form['password']

        if not (uid.strip() or pwd.strip()):
            flash("You must enter an email address and password")
            return redirect(url_for("auth.register"))

        users.registerUser(uid, pwd, fname, role)
        return redirect(url_for("auth.login"))
    
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
