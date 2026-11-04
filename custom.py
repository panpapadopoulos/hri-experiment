"""Local classroom entry routes."""
from uuid import uuid4
from flask import Blueprint, redirect, url_for, render_template, request, abort

custom_code = Blueprint("custom_code", __name__,
                        template_folder="templates", static_folder="static")

@custom_code.route('/new-participant', methods=['POST'])
def new_participant():
    # Use PsiTurk's supported local mode; distinguish classroom IDs from tests.
    token = 'debugClassroom_' + uuid4().hex
    response = redirect(url_for('advertisement', hitId=token,
                            assignmentId=token, workerId=token, mode='debug'), code=303)
    response.headers['Cache-Control'] = 'no-store'
    return response

@custom_code.route('/introduction', methods=['GET'])
def introduction():
    required = ('hitId', 'assignmentId', 'workerId', 'mode')
    if any(not request.args.get(key) for key in required):
        abort(400)
    consent_url = url_for('give_consent', **{key: request.args[key] for key in required})
    return redirect(consent_url, code=303)  # Video now follows consent inside /exp.

# Register local researcher routes alongside the experiment routes.
from researcher import researcher
@custom_code.record_once
def register_researcher(state):
    # Persist the signing key across PsiTurk workers and server restarts.
    if not state.app.secret_key:
        import os
        import secrets
        from pathlib import Path
        key_path = Path(__file__).resolve().parent / '.researcher-secret'
        try:
            fd = os.open(str(key_path), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            pass
        else:
            with os.fdopen(fd, 'w') as stream:
                stream.write(secrets.token_hex(32))
        state.app.secret_key = key_path.read_text().strip()
    state.app.register_blueprint(researcher)

@custom_code.before_app_request
def direct_study_entry():
    if request.path == '/' and request.method == 'GET':
        return new_participant()
