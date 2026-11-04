"""Static-demo packaging checks; never access participant data."""
import re
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEMO=ROOT/'demo'
class DemoTests(unittest.TestCase):
    def test_no_private_files(self):
        for file in DEMO.rglob('*'):
            if file.is_file():
                self.assertNotIn(file.suffix,['.db','.csv','.py','.key'])
                self.assertNotIn('researcher',file.name)
                self.assertNotIn('Zone.Identifier',file.name)
    def test_relative_page_assets(self):
        for file in DEMO.glob('*.html'):
            html=file.read_text()
            self.assertNotIn('{%',html)
            self.assertNotIn('{{',html)
            for attr,target in re.findall(r'(src|href|action)="([^"#]+)"',html):
                if target.startswith(('http:','https:','mailto:')):continue
                self.assertFalse(target.startswith('/'),target)
                self.assertTrue((DEMO/target.split('?')[0]).exists(),target)
    def test_no_response_transport(self):
        for filename in ['flow.js','task.js','demo-runtime.js']:
            text=(DEMO/'assets/js'/filename).read_text()
            for forbidden in ['$.ajax(', 'fetch(', 'sendBeacon(', 'localStorage', 'sessionStorage', 'document.cookie']:
                self.assertNotIn(forbidden,text)
        self.assertIn('this.recordTrialData = function() {};',(DEMO/'assets/js/demo-runtime.js').read_text())
        self.assertIn('not an actual experiment',(DEMO/'assets/js/task.js').read_text())
        self.assertIn('not an actual experiment',(DEMO/'complete.html').read_text())
    def test_assets_match_real(self):
        for filename in ['settings.js','stimuli.js','questionnaires.js','trial.js','viewport.js']:
            self.assertEqual((ROOT/'static/js'/filename).read_text().replace('/static/','assets/'),(DEMO/'assets/js'/filename).read_text())
        for filename in ['style.css','viewport.css','responsive.css']:
            self.assertEqual((ROOT/'static/css'/filename).read_text(),(DEMO/'assets/css'/filename).read_text())
if __name__=='__main__':unittest.main()
