"""Build the static, non-recording demo from the real participant templates/assets.
Run from any directory: python scripts/build_demo.py (requires Jinja2).
Only writes inside demo/. Never imports PsiTurk or opens a database.
"""
from pathlib import Path
import configparser
import re
import shutil
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'demo'
NOTICE = 'This was a demo run, not an actual experiment. Your answers will not be recorded.'

def build():
    DEST.mkdir(exist_ok=True)
    assets = DEST / 'assets'
    assets.mkdir(exist_ok=True)
    # Explicit public-asset allowlist. No databases, exports, secrets or admin routes.
    files = ['favicon.ico']
    files += ['css/' + n for n in ['bootstrap.min.css','style.css','viewport.css','responsive.css']]
    files += ['js/' + n for n in ['settings.js','stimuli.js','questionnaires.js','trial.js','task.js','flow.js','viewport.js']]
    files += ['lib/' + n for n in ['jquery-3.4.1.min.js','underscore-min.js','backbone-min.js']]
    files += ['images/' + n for n in ['purduelogo.svg','pnw.png','manual-rack.jpg','Suggestion1.png','Suggestion2.png','Suggestion3.png','error.png','apology.png']]
    files += ['images/instructions/' + n for n in ['correct.png','participant-incorrect.png','acknowledgment.png','apology.png','apology_explanation.png']]
    files += ['videos/' + n for n in ['Acknowledge.mp4','Apology.mp4','ApologyExplanation.mp4']]
    files += ['fonts/' + f.name for f in (ROOT/'static/fonts').iterdir() if f.is_file() and 'Zone.Identifier' not in f.name]
    for name in files:
        source, target = ROOT/'static'/name, assets/name
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix in ('.js','.css'):
            content = source.read_text().replace('/static/', 'assets/')
            if name == 'js/flow.js':
                old = " $.ajax({url:'/inexp',type:'POST',data:{uniqueId:uniqueId}});"
                if old not in content: raise RuntimeError('Task lifecycle call changed; review demo adapter.')
                content = content.replace(old, ' // Static demo: no session lifecycle request.')
            if name == 'js/task.js':
                content = content.replace('Your responses have not been saved yet.', NOTICE)
                content = content.replace('Click Submit to send your responses and complete the study. Keep this page open until submission is confirmed.', 'Click Submit to finish this demo.')
                content = content.replace(" HRI.screen('<h1>Saving</h1><p>Please wait.</p>');", " HRI.screen('<h1>Finishing demo</h1><p>Please wait.</p>');")
            target.write_text(content)
        else:
            shutil.copyfile(source, target)
            if target.suffix == '.svg':
                target.write_text('\n'.join(line.rstrip() for line in target.read_text().splitlines()) + '\n')
    shim = """'use strict';
// No answers are stored, sent, written to cookies, or kept in browser storage.
var demoRandom = new Uint32Array(2);crypto.getRandomValues(demoRandom);
uniqueId = 'demo_' + demoRandom[0].toString(16);
condition = demoRandom[1] % 3;
mode = 'demo';
function PsiTurk() {
 this.recordTrialData = function() {};
 this.getTrialData = function() { return []; };
 this.saveData = function(callbacks) { callbacks.success(); };
 this.completeHIT = function() { window.location.replace('complete.html'); };
}
"""
    (assets/'js/demo-runtime.js').write_text(shim)
    env = Environment(loader=FileSystemLoader(str(ROOT/'templates')), autoescape=select_autoescape(['html']))
    config = configparser.ConfigParser();config.read(ROOT/'config.txt')
    values = dict(hitid='demo',assignmentid='demo',workerid='demo',server_location='',uniqueId='demo',condition=0,counterbalance=0,codeversion=config.get('Task Parameters','experiment_code_version'),contact_address='',adServerLoc='',mode='demo')
    for template, output in [('ad.html','index.html'),('consent.html','consent.html'),('exp.html','experiment.html'),('complete.html','complete.html')]:
        html = env.get_template(template).render(**values).replace('/static/', 'assets/')
        if output == 'index.html':
            html = re.sub(r'href="/consent\?[^"]*"', 'href="consent.html"', html)
        if output == 'consent.html':
            html = re.sub(r'action="/exp\?[^"]*"', 'action="experiment.html"', html)
        if output == 'experiment.html':
            html = re.sub(r'<script src="assets/js/utils.js"[^>]*>.*?</script>', '', html, flags=re.S)
            html = html.replace('assets/js/psiturk.js','assets/js/demo-runtime.js')
        if output == 'complete.html':
            html = html.replace('Your responses have been saved. Please let the researcher know you have finished.', NOTICE)
            html = html.replace('action="/new-participant" method="post"', 'action="index.html" method="get"')
        # Static assets/media still load; scripts cannot submit data over the network.
        html = html.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; form-action \'self\'; base-uri \'self\'">')
        (DEST/output).write_text('\n'.join(line.expandtabs(4).rstrip() for line in html.splitlines()) + '\n')
    (DEST/'.nojekyll').write_text('')
    print('Built demo/ (public assets only; no response recording).')

if __name__ == '__main__':
    build()
