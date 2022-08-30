import sentry_sdk
from flask import Flask, render_template
from datetime import datetime
from werkzeug.user_agent import UserAgent
from sentry_sdk.integrations.flask import FlaskIntegration
from . import data, secrets
from .auth import login_required
from .automation import scheduling
from os import environ
from sentry_sdk import capture_message

def create_app():

    sentry_sdk.init(
        dsn="https://44fb1b462eab4104bc0914e592660046@o1080315.ingest.sentry.io/6099137",
        integrations=[FlaskIntegration()],

        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production.
        traces_sample_rate=1.0,
        environment=environ.get('FLASK_ENV')
    )

    app = Flask(__name__)
    app.secret_key = secrets.key

    data.ensureDataSources()
    scheduling.start()

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
        return render_template("index.html", copyrightYear = str(datetime.now().year))

    return app
