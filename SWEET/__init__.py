import json
from flask import Flask, render_template, request, session, redirect, flash
from flask.helpers import url_for
from . import data, secrets
from urllib.parse import unquote

def create_app():
    app = Flask(__name__)
    app.secret_key = secrets.key

    data.ensureDataSources()

    #auth
    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            pwd = request.form['password']
            uid = request.form['userID']

            success, token = data.validateUser(uid, pwd)
            if success:
                session['user'] = token
                return redirect(url_for("index"))

            flash('Incorrect username/password combination')
            flash('Your username is usually your email address')
            return redirect(url_for("login"))

        return render_template("login.html")

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            uid = request.form['userID']
            fname = request.form['fullName']
            role = 'user'
            pwd = request.form['password']

            data.registerUser(uid, pwd, fname, role)
            return redirect(url_for("login"))
        
        return render_template("register.html")

    @app.route("/logout")
    def logout():
        token = session.pop("user", None)
        if token is not None:
            data.logout(token)
        
        return redirect(url_for("login"))
    
    # content retrieval
    @app.route("/")
    def index():
        if 'user' in session:
            return render_template("index.html")
        
        return redirect(url_for("login"))


    @app.route("/app/structure")
    def structure():
        if 'user' in session:
            return data.getStructure()

        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/content")
    def getPageContent():
        if "user" in session:
            path = request.args.get("path", "")
            if path:
                path = unquote(path)
                return data.getPageContents(path)
            else:
                return data.getPages()

        return {"status": "error", "message": "Login required"}, 403


    # content management
    @app.route("/app/structure/", methods=["POST"])
    def updateStructure():
        if 'user' in session:
            if request.is_json:
                data.updateStructure(request.json)
                return { "status": "OK"}
            else:
                return { "status": "error", "message": "Update request sent without json data"}, 400

        return {"status": "error", "message": "Login required"}, 403
        
    @app.route("/app/content/", methods=["POST"])
    def updatePageContent():
        if "user" in session:
            if request.is_json:
                data.updatePageContent(request.json)
                return { "status": "OK"}
            else:
                return { "status": "error", "message": "Update request sent without json data"}, 400
        return {"status": "error", "message": "Login required"}, 403

    return app
