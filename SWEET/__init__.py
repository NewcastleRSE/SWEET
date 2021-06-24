from flask import Flask, render_template, request, session, redirect, flash, abort
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
                hash = request.form.get('fragment', None)
                return redirect(url_for("index", _anchor=hash))

            flash('Incorrect username/password combination')
            flash('Your username is usually your email address')
            return redirect(url_for("login"))

        return render_template("login.html")

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            uid = request.form['userID']
            fname = request.form['fullName']
            role = 'editor'
            pwd = request.form['password']

            if not (uid.strip() or pwd.strip()):
                flash("You must enter an email address and password")
                return redirect(url_for("register"))

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
            user = data.getLoggedInUser(session['user'])
            if user is None:
                return redirect(url_for("logout"))

            return render_template("index.html", user=user)
        
        return render_template("login.html", save_fragment=True)


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
                if path == "#":
                    path = "#home"
                
                details = data.getPageDetails(path)
                details["content"] = data.getPageContents(path) 
                return details
            else:
                return data.getPages()

        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/resources")
    def resources():
        if "user" in session:
            return data.getResources()

        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/resources/<name>")
    def getResource(name):
        if "user" in session:
            res = data.getResource(name)
            if res is None:
                abort(404)

            return res
        
        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/schemas/goals/activity")
    def getActivityGoalSchema():
        if "user" in session:
            return {
                "activity": ["walking", "housework", "gardening", "strength exercises", "balance exercises", "swimming", "cycling", "pilates", "yoga", "thai chi", "dancing", "bowling", "running"],
                "frequency": [1,2,3,4,5,6,7],
                "duration": [10, 20, 30, 40, 50, 60]
            }

        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/mygoals")
    def getAllUserGoals():
        if 'user' in session:
            user = data.getLoggedInUser(session['user'])
            if user is None:
                return redirect(url_for("logout"))
            
            return data.getGoals(user)

        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/mygoals/<goaltype>")
    def getUserGoals(goaltype):
        if 'user' in session:
            user = data.getLoggedInUser(session['user'])
            if user is None:
                return redirect(url_for("logout"))
            
            goals = data.getGoals(user)
            return {
                "current": [g for g in goals['current'] if g['goaltype'] == goaltype],
                "complete": [g for g in goals['complete'] if g['goaltype'] == goaltype],
            }
        
        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/mygoals/", methods=["POST"])
    def addOrUpdateGoal():
        if "user"in session:
            user = data.getLoggedInUser(session['user'])
            if user is None:
                return redirect(url_for("logout"))

            if request.is_json:
                goal = request.json
                result, message = data.updateGoals(user, goal)

                if result:
                    return {"status": "OK", "action": message}
                
                return {"status": "error", "message": message}, 500

            return {"status": "error", "message": "Update request sent without json"}, 400

        return {"status": "error", "message": "Login required"}, 403
    
    # content management
    @app.route("/edit")
    def edit():
        if "user" in session:
            return render_template("pages.html")

        return redirect(url_for("login"))

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

    @app.route("/app/resources/", methods=["POST"])
    def addResource():
        if "user" in session:
            if request.is_json:
                data.saveResource(request.json)
                return { "status": "OK"}
            else:
                return { "status": "error", "message": "Update request sent without json data"}, 400
        return {"status": "error", "message": "Login required"}, 403

    @app.route("/app/profiler/", methods=["POST"])
    def profiler():
        if "user" in session:
            if request.is_json:
                data = request.json
                if 'page' in data:
                    template = f'partial/profiler-p{data["page"] + 1}.html'
                    return render_template(template, data=data)

            return { 'status': "OK" }
        
        return redirect(url_for("login"))

    return app

sweetapp = create_app()

