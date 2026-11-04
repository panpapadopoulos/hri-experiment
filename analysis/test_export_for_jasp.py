"""Synthetic-data tests; never write to the live database."""
import copy
import csv
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
import export_for_jasp as e

def fixture():
    records=[{'record_type':'session','settings':{'buildTrustTrials':1,'errorPhaseTrials':1,'recoveryTrials':1,'errorTrials':[2]},'code_version':'test'}, {'record_type':'demographics','age':'25','gender':'Female','robot_experience':'None'}, {'record_type':'trust','checkpoint':'pre_error','instrument':'mdmt_capacity_v1',**{key:4 for key in e.MDMT_ITEMS}}]
    for n,phase in enumerate(['practice','build_trust','errors_recovery','continued_interaction']):
        timeout=n==3;correct=n!=2
        records.append(dict(record_type='trial',trial_number=max(1,n),phase=phase,target_item='Gear',correct_section='A',robot_suggestion='A' if correct else 'B',robot_correct=correct,manual_check_used=n==1,manual_check_duration_ms=100 if n==1 else 0,participant_choice=None if timeout else 'A',followed_robot=not timeout and correct,participant_correct=not timeout,response_time_ms=None if timeout else 500,trial_duration_ms=25000 if timeout else 500,timed_out=timeout))
    records += [{'record_type':'trust','checkpoint':'final','instrument':'mdmt_capacity_v1',**{key:7 for key in e.MDMT_ITEMS}},{'record_type':'workload',**{k:4 for k in e.TLX}},{'record_type':'completion','completed':True}]
    return dict(uniqueid='debugClassroom_test:debugClassroom_test',cond=0,status=3,datastring=json.dumps({'data':[{'trialdata':r} for r in records]}))

def alter(p, change):
    data=json.loads(p['datastring']);change(data['data']);p['datastring']=json.dumps(data);return p

class ExportTests(unittest.TestCase):
    def test_values(self):
        out=e.transform([fixture()]);person=out['participant_data.csv'][0];self.assertEqual(person['age'],25);self.assertEqual(person['robot_experience'],'no_experience');self.assertEqual(person['tlx_mean'],4);self.assertNotIn('hri_experience',person);self.assertNotIn('ai_familiarity',person);self.assertNotIn('n_practice_trials',person)
        b=out['behavior_summary.csv'][0];self.assertEqual(b['n_trials_build'],1);self.assertEqual(b['reliance_build'],1);self.assertEqual(b['mean_manual_check_time_build'],100);self.assertIsNone(b['mean_manual_check_time_error_phase']);self.assertEqual(b['accuracy_after_errors'],0);self.assertIsNone(b['rt_after_errors'])
        self.assertEqual(out['trust_wide.csv'][0]['mdmt_capacity_mean_pre_error'],4);self.assertNotIn('mdmt_capacity_mean_early_recovery',out['trust_wide.csv'][0]);self.assertEqual(out['trust_long.csv'][-1]['after_main_trial'],3)
        for row in out['trial_data.csv']:
            for field in ['robot_correct','manual_check_used','followed_robot','participant_correct','timed_out']:self.assertIn(row[field],[0,1]);self.assertIs(type(row[field]),int)
    def test_current_trust_schema(self):
        self.assertEqual(e.POINTS, ['pre_error', 'early_recovery', 'final'])
        self.assertEqual(len(e.WIDE), 44)  # IDs, three means and twelve item scores.
        self.assertFalse(any('post_' in field for field in e.WIDE))

    def test_empty_session(self):
        p=fixture();p['datastring']=None;out=e.transform([p]);self.assertEqual(out['participant_data.csv'][0]['completed'],0);self.assertIsNone(out['participant_data.csv'][0]['tlx_mean']);self.assertEqual(out['trial_data.csv'],[])
    def test_reject_duplicates_and_conditions(self):
        for change in [lambda rows:rows.append(copy.deepcopy(rows[3])),lambda rows:rows[0]['trialdata'].update(recovery_condition='apology'),lambda rows:rows.append(copy.deepcopy(rows[2]))]:
            with self.assertRaises(ValueError):e.transform([alter(fixture(),change)])
    def test_missing_item_mean(self):
        out=e.transform([alter(fixture(),lambda rows:rows[2]['trialdata'].update(mdmt_reliable=None))]);self.assertEqual(out['trust_long.csv'][0]['mdmt_capacity_mean'],4);self.assertEqual(out['trust_long.csv'][0]['mdmt_capacity_n'],7)
    def test_private_legacy_gender(self):
        out=e.transform([alter(fixture(),lambda rows:rows[1]['trialdata'].update(gender='A personal name'))]);self.assertEqual(out['participant_data.csv'][0]['gender'],'other')
    def test_binary_variants(self):
        for value in [True,'true','TRUE','Yes',1,'1']:self.assertEqual(e.binary(value),1)
        for value in [False,'false','FALSE','No',0,'0']:self.assertEqual(e.binary(value),0)
        with self.assertRaises(ValueError):e.binary('maybe')
    def test_csv_and_read_only(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);dbpath=root/'raw.db';p=fixture()
            with sqlite3.connect(dbpath) as db:
                db.execute('CREATE TABLE assignments (uniqueid TEXT,workerid TEXT,cond INTEGER,status INTEGER,datastring TEXT)')
                db.execute('INSERT INTO assignments VALUES (?,?,?,?,?)',(p['uniqueid'],'debugClassroom_test',p['cond'],p['status'],p['datastring']))
                db.execute('INSERT INTO assignments VALUES (?,?,?,?,?)',('old_debug','debugTest',0,3,p['datastring']))
                unfinished=alter(fixture(),lambda rows:rows.pop())
                db.execute('INSERT INTO assignments VALUES (?,?,?,?,?)',('unfinished','debugClassroom_unfinished',0,1,unfinished['datastring']))
            before=dbpath.read_bytes();out=e.export(dbpath,root/'out');self.assertEqual(before,dbpath.read_bytes());self.assertEqual(len(out['participant_data.csv']),1)
            for name,fields in e.SCHEMAS.items():
                self.assertTrue(all(row['participant_id']==p['uniqueid'] for row in out[name]))
                with (root/'out'/name).open(encoding='utf-8-sig',newline='') as f:
                    reader=csv.DictReader(f);self.assertEqual(reader.fieldnames,fields)
                    for row in reader:
                        self.assertNotIn(None,row)
                        for value in row.values():
                            self.assertNotIn(value.lower(),['undefined','null','none','n/a','[object object]']);self.assertFalse(value.startswith(('{','[')));self.assertNotIn('<',value)
            with (root/'out/trust_wide.csv').open(encoding='utf-8-sig') as f:self.assertEqual(next(csv.DictReader(f))['mdmt_capacity_mean_early_recovery'],'')
class MDMTTests(unittest.TestCase):
    def test_zero_and_all_missing(self):
        p=alter(fixture(),lambda rows:rows[2]['trialdata'].update(**{key:0 for key in e.MDMT_ITEMS}))
        self.assertEqual(e.transform([p])['trust_long.csv'][0]['mdmt_capacity_mean'],0)
        p=alter(fixture(),lambda rows:rows[2]['trialdata'].update(**{key:None for key in e.MDMT_ITEMS}))
        self.assertIsNone(e.transform([p])['trust_long.csv'][0]['mdmt_capacity_mean'])
    def test_old_scale_not_relabelled(self):
        p=alter(fixture(),lambda rows:rows[2]['trialdata'].pop('instrument'))
        self.assertEqual(len(e.transform([p])['trust_long.csv']),1)

if __name__=='__main__':unittest.main()
