from flask import Flask, render_template
from . import data, secrets
from .auth import login_required

def create_app():
    app = Flask(__name__)
    app.secret_key = secrets.key

    data.ensureDataSources()

    # import and register app blueprints
    from . import auth, myapp, content, schemas, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(myapp.bp)
    app.register_blueprint(content.bp)
    app.register_blueprint(schemas.bp)
    app.register_blueprint(admin.bp)

    @app.route("/")
    @login_required
    def index():
        return render_template("index.html")

    @app.route("/welcome")
    @login_required
    def welcome():
        return render_template("welcome.html")    

    return app

sweetapp = create_app()

