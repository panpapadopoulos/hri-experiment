"""Local researcher controls. No participant responses are changed by viewing/exporting."""
import secrets
import sqlite3
from pathlib import Path
from flask import Blueprint, abort, request, session, render_template, redirect, url_for, flash, send_file
from analysis.export_for_jasp import SCHEMAS, CONDITIONS, transform, export

ROOT = Path(__file__).resolve().parent
DATABASE = ROOT / 'participants.db'
OUTPUT = ROOT / 'analysis' / 'exports'
researcher = Blueprint('researcher', __name__)

@researcher.before_request
def local_access():
    # Do not trust forwarded headers: these controls are for the classroom computer.
    if request.remote_addr not in ('127.0.0.1', '::1'):
        abort(403)
    if 'researcher_csrf' not in session:
        session['researcher_csrf'] = secrets.token_hex(32)
    if request.method == 'POST' and not secrets.compare_digest(
            session['researcher_csrf'], request.form.get('csrf', '')):
        abort(403)

@researcher.after_request
def private_response(response):
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Frame-Options'] = 'DENY'
    return response

def read_data():
    if not DATABASE.exists():
        return 0, transform([])
    with sqlite3.connect(DATABASE.resolve().as_uri() + '?mode=ro', uri=True) as db:
        db.row_factory = sqlite3.Row
        total = db.execute('SELECT count(*) FROM assignments').fetchone()[0]
        rows = db.execute("SELECT uniqueid,cond,status,datastring FROM assignments WHERE instr(workerid, ?) = 1 ORDER BY uniqueid", ('debugClassroom_',)).fetchall()
    return total, transform(rows)

@researcher.route('/researcher')
def dashboard():
    selected = request.args.get('table', 'participant_data.csv')
    if selected not in SCHEMAS:
        abort(404)
    try:
        total, data = read_data()
    except (ValueError, KeyError, TypeError, sqlite3.Error) as exc:
        return render_template('researcher.html', error='Unable to validate the saved data: ' + str(exc), schemas=SCHEMAS, output=str(OUTPUT)), 500
    participants = data['participant_data.csv']
    submitted = [p for p in participants if p['completed'] == 1]
    counts = [(c, sum(p['recovery_condition'] == c for p in participants), sum(p['recovery_condition'] == c for p in submitted)) for c in CONDITIONS]
    try:
        page = max(1, int(request.args.get('page', 1)))
    except ValueError:
        page = 1
    submitted_ids = {p['participant_id'] for p in submitted}
    rows = [row for row in data[selected] if row['participant_id'] in submitted_ids]
    pages = max(1, (len(rows) + 49) // 50)
    page = min(page, pages)
    return render_template('researcher.html', error=None, total=total,
        started=len(participants), submitted=len(submitted), counts=counts,
        schemas=SCHEMAS, selected=selected, fields=SCHEMAS[selected],
        rows=rows[(page-1)*50:page*50], row_count=len(rows), page=page, pages=pages,
        output=str(OUTPUT), available=[name for name in SCHEMAS if (OUTPUT/name).is_file()])

@researcher.route('/researcher/export', methods=['POST'])
def export_data():
    try:
        result = export(DATABASE, OUTPUT)
        flash('Export complete. ' + ', '.join(f'{name}: {len(rows)} rows' for name, rows in result.items()))
    except (ValueError, KeyError, TypeError, sqlite3.Error, OSError) as exc:
        flash('Export failed: ' + str(exc))
    return redirect(url_for('researcher.dashboard'), code=303)

@researcher.route('/researcher/download/<filename>')
def download(filename):
    if filename not in SCHEMAS or not (OUTPUT / filename).is_file():
        abort(404)
    return send_file(str(OUTPUT / filename), as_attachment=True)

@researcher.route('/researcher/reset', methods=['POST'])
def reset_data():
    if request.form.get('confirmation') != 'RESET':
        flash('Nothing was deleted. Type RESET to confirm.')
        return redirect(url_for('researcher.dashboard'), code=303)
    try:
        if DATABASE.exists():
            with sqlite3.connect(DATABASE.resolve().as_uri() + '?mode=rw', uri=True, timeout=5) as db:
                db.execute('DELETE FROM assignments')
        for filename in SCHEMAS:
            (OUTPUT / filename).unlink(missing_ok=True)
        flash('Reset complete. All session records and the five JASP CSVs were removed. No backup was created.')
    except (sqlite3.Error, OSError) as exc:
        flash('Reset could not fully finish. Check the counts and export files: ' + str(exc))
    return redirect(url_for('researcher.dashboard'), code=303)
