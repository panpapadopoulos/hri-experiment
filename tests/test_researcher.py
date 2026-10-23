"""Researcher controls tested against an isolated temporary database."""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from flask import Flask
import researcher as module
from custom import custom_code

class ResearcherTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.database = Path(self.tmp.name)/'participants.db'
        self.output = Path(self.tmp.name)/'exports'
        with sqlite3.connect(self.database) as db:
            db.execute('CREATE TABLE assignments (uniqueid TEXT, workerid TEXT, cond INTEGER, status INTEGER, datastring TEXT)')
            db.execute('INSERT INTO assignments VALUES (?,?,?,?,?)', ('p1','debugClassroom_1',0,4,json.dumps({'data':[{'trialdata':{'record_type':'completion','completed':True}}]})))
            db.execute('INSERT INTO assignments VALUES (?,?,?,?,?)', ('p2','debugClassroom_2',1,1,'{}'))
            db.execute('INSERT INTO assignments VALUES (?,?,?,?,?)', ('test','debugTest',2,1,'{}'))
        self.patches = [patch.object(module,'DATABASE',self.database),patch.object(module,'OUTPUT',self.output)]
        for p in self.patches: p.start()
        self.app=Flask(__name__,template_folder=str(Path(module.__file__).parent/'templates'))
        self.app.secret_key='isolated-test'
        self.app.testing=True
        self.app.register_blueprint(custom_code)
        self.client=self.app.test_client()
    def tearDown(self):
        for p in self.patches: p.stop()
        self.tmp.cleanup()
    def token(self):
        self.client.get('/researcher')
        with self.client.session_transaction() as session: return session['researcher_csrf']
    def count(self):
        with sqlite3.connect(self.database) as db:return db.execute('SELECT count(*) FROM assignments').fetchone()[0]
    def test_dashboard_and_export(self):
        response=self.client.get('/researcher')
        self.assertEqual(response.status_code,200)
        self.assertIn(b'Submitted participants',response.data)
        self.assertIn(b'<td>p1</td>',response.data)
        self.assertNotIn(b'<td>p2</td>',response.data)
        self.assertIn(b'1 rows',response.data)
        self.assertEqual(response.headers['Cache-Control'],'no-store')
        self.assertEqual(self.client.post('/researcher/export',data={'csrf':self.token()}).status_code,303)
        self.assertEqual(len(list(self.output.glob('*.csv'))),5)
        self.assertEqual(self.count(),3)
        for filename in module.SCHEMAS:
            self.assertEqual(self.client.get('/researcher?table='+filename).status_code,200)
            response = self.client.get('/researcher/download/'+filename)
            self.assertEqual(response.status_code,200)
            response.close()
        self.assertEqual(self.client.get('/researcher/download/participants.db').status_code,404)
    def test_reset_requires_token_and_confirmation(self):
        self.assertEqual(self.client.post('/researcher/reset',data={'confirmation':'RESET'}).status_code,403)
        token=self.token()
        self.client.post('/researcher/reset',data={'csrf':token,'confirmation':'no'})
        self.assertEqual(self.count(),3)
        self.client.post('/researcher/export',data={'csrf':token})
        self.client.post('/researcher/reset',data={'csrf':token,'confirmation':'RESET'})
        self.assertEqual(self.count(),0)
        self.assertEqual(list(self.output.glob('*.csv')),[])
        self.assertEqual(self.client.get('/researcher').status_code,200)
    def test_remote_access_denied(self):
        self.assertEqual(self.client.get('/researcher',environ_overrides={'REMOTE_ADDR':'192.168.1.20'}).status_code,403)
        self.assertEqual(self.client.get('/researcher/download/trial_data.csv',environ_overrides={'REMOTE_ADDR':'192.168.1.20'}).status_code,403)

if __name__ == '__main__': unittest.main()
