"""Local classroom entry routes."""
from uuid import uuid4
from flask import Blueprint, redirect, url_for

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
