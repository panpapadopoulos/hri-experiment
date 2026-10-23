"""Read-only PsiTurk export using Python's standard library."""
import argparse
import csv
import json
import math
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONDITIONS = ['acknowledgment', 'apology', 'apology_explanation']
POINTS = ['baseline', 'early_recovery', 'final']
CHECKPOINTS = {'baseline':'baseline', 'early_recovery':'early_recovery', 'end_phase_3':'final'}
PHASES = {'practice':'practice', 'build_trust':'build_trust', 'errors_recovery':'error_recovery', 'error_recovery':'error_recovery', 'continued_interaction':'continued_interaction'}
TLX = dict(zip(['mental_demand','physical_demand','temporal_demand','performance','effort','frustration'], ['tlx_mental','tlx_physical','tlx_temporal','tlx_performance','tlx_effort','tlx_frustration']))
BASE = ['participant_id','recovery_condition']
TRIAL = BASE + ['trial_number','practice','phase','target_item','correct_section','robot_suggestion','robot_correct','manual_check_used','manual_check_start_time','manual_check_duration_ms','participant_choice','followed_robot','participant_correct','response_time_ms','trial_duration_ms','timed_out']
PARTICIPANT = BASE + ['age_range','gender','robot_experience','hri_experience','ai_familiarity','psiturk_experience'] + list(TLX.values()) + ['tlx_mean','completed','psiturk_status','code_version','n_practice_trials','n_main_trials','expected_main_trials','main_trials_complete','n_trust_measurements']
TRUST = BASE + ['measurement_point','after_main_trial'] + [f'trust_q{i}' for i in range(1,5)] + ['trust_mean']
WIDE = BASE + [f'trust_{point}' for point in POINTS] + [f'trust_q{i}_{point}' for point in POINTS for i in range(1,5)]
METRICS = ['n_trials','reliance','manual_check_rate','accuracy','mean_rt','mean_manual_check_time','n_rt','n_manual_check_time']
BEHAVIOR = BASE + [f'{m}_{phase}' for phase in ['build','error_phase','recovery'] for m in METRICS] + [f'{m}_{window}' for window in ['before_errors','after_errors'] for m in ['n_trials','reliance','manual_check','rt','accuracy']]
SCHEMAS = {'trial_data.csv':TRIAL,'participant_data.csv':PARTICIPANT,'trust_long.csv':TRUST,'trust_wide.csv':WIDE,'behavior_summary.csv':BEHAVIOR}

def number(value, integer=False, low=None, high=None):
    if value is None or value == '': return None
    n = float(value)
    if not math.isfinite(n) or (integer and not n.is_integer()) or (low is not None and n < low) or (high is not None and n > high):
        raise ValueError('Invalid numeric value')
    return int(n) if integer else n

def binary(value):
    if value is None or value == '': return None
    if isinstance(value, str):
        value = {'true':1, 'false':0, 'yes':1, 'no':0, '1':1, '0':0}.get(value.strip().lower(), value)
    return number(value, integer=True, low=0, high=1)

def text(value):
    if value is None or value == '': return None
    if not isinstance(value, str): raise ValueError('Non-scalar text field')
    value = value.strip()
    if value.lower() in ['undefined','null','none','n/a','na','-','[object object]']: return None
    if any(c in value for c in '<>\r\n') or value.startswith(('=', '+', '@', '{', '[')):
        raise ValueError('Unsafe or structured text field')
    return value

def mean(values):
    values = [v for v in values if v is not None]
    return round(sum(values)/len(values), 6) if values else None

def complete_mean(values):
    return mean(values) if all(v is not None for v in values) else None

def only(records, kind):
    found = [r for r in records if r.get('record_type') == kind]
    if len(found) > 1: raise ValueError(f'Duplicate {kind} records')
    return found[0] if found else {}

def summarize(trials):
    checks = [t['manual_check_duration_ms'] for t in trials if t['manual_check_used'] == 1]
    return dict(n_trials=len(trials), reliance=mean([t['followed_robot'] for t in trials]), manual_check_rate=mean([t['manual_check_used'] for t in trials]), accuracy=mean([t['participant_correct'] for t in trials]), mean_rt=mean([t['response_time_ms'] for t in trials]), mean_manual_check_time=mean(checks), n_rt=sum(t['response_time_ms'] is not None for t in trials), n_manual_check_time=sum(v is not None for v in checks))

def transform(participants):
    output = {name:[] for name in SCHEMAS}
    seen_ids = set()
    for participant in participants:
        pid = participant['uniqueid']
        if pid in seen_ids: raise ValueError('Duplicate participant ID')
        seen_ids.add(pid)
        records = [r['trialdata'] for r in json.loads(participant['datastring'] or '{}').get('data', [])]
        cond = CONDITIONS[number(participant['cond'], integer=True, low=0, high=2)]
        for r in records:
            if r.get('participant_id', pid) != pid: raise ValueError('Participant ID mismatch')
            if r.get('recovery_condition',cond) != cond: raise ValueError('Condition changes within participant')
        base = dict(participant_id=pid, recovery_condition=cond)
        session = only(records,'session'); settings = session.get('settings', {})
        trials = []; trust = []; keys = set(); checkpoints = set(); last_main = 0
        for r in records:
            if r.get('record_type') == 'trial':
                phase = PHASES[r['phase']]; n = number(r['trial_number'], integer=True, low=1)
                key = (phase == 'practice', n)
                if key in keys: raise ValueError('Duplicate trial number')
                keys.add(key)
                row = dict(base, trial_number=n, practice=int(phase=='practice'), phase=phase)
                for field in ['target_item','correct_section','robot_suggestion','participant_choice']: row[field] = text(r.get(field))
                for field in ['correct_section','robot_suggestion','participant_choice']:
                    if row[field] not in ['A','B','C','D',None]: raise ValueError('Unknown section')
                for field in ['robot_correct','manual_check_used','followed_robot','participant_correct','timed_out']:
                    row[field] = binary(r.get(field))
                    if row[field] is None: raise ValueError('Missing required trial binary')
                for field in ['manual_check_start_time','manual_check_duration_ms','response_time_ms','trial_duration_ms']: row[field] = number(r.get(field), low=0)
                if row['robot_correct'] != int(row['robot_suggestion']==row['correct_section']): raise ValueError('Inconsistent robot correctness')
                if row['followed_robot'] != int(row['participant_choice']==row['robot_suggestion']): raise ValueError('Inconsistent following')
                if row['participant_correct'] != int(row['participant_choice']==row['correct_section']): raise ValueError('Inconsistent accuracy')
                if row['timed_out'] and (row['participant_choice'] is not None or row['response_time_ms'] is not None): raise ValueError('Invalid timeout answer')
                trials.append(row)
                if not row['practice']: last_main=n
            elif r.get('record_type') == 'trust':
                point = CHECKPOINTS[r['checkpoint']]
                if point in checkpoints: raise ValueError('Duplicate trust checkpoint')
                checkpoints.add(point)
                row = dict(base, measurement_point=point, after_main_trial=last_main)
                for i in range(1,5): row[f'trust_q{i}'] = number(r.get(f'trust_{i}'), integer=True, low=1, high=7)
                row['trust_mean'] = complete_mean([row[f'trust_q{i}'] for i in range(1,5)])
                trust.append(row)
        main = [t for t in trials if not t['practice']]; practice = [t for t in trials if t['practice']]
        for group in [main,practice]:
            if [t['trial_number'] for t in group] != list(range(1,len(group)+1)): raise ValueError('Trial sequence is not contiguous from 1')
        if all(k in settings for k in ['buildTrustTrials','errorPhaseTrials','recoveryTrials']):
            expected = sum(settings[k] for k in ['buildTrustTrials','errorPhaseTrials','recoveryTrials'])
            if len(main)>expected: raise ValueError('Too many main trials')
            for t in main:
                expected_phase='build_trust' if t['trial_number']<=settings['buildTrustTrials'] else 'error_recovery' if t['trial_number']<=settings['buildTrustTrials']+settings['errorPhaseTrials'] else 'continued_interaction'
                if t['phase']!=expected_phase: raise ValueError('Phase inconsistent with saved settings')
        else: expected=None
        demo = only(records,'demographics'); workload=only(records,'workload')
        age = number(demo.get('age'), integer=True, low=18, high=120)
        age_range = None if age is None else '18_24' if age<25 else '25_34' if age<35 else '35_44' if age<45 else '45_54' if age<55 else '55_64' if age<65 else '65_plus'
        row = dict(base, age_range=age_range, completed=int(any(r.get('record_type')=='completion' and binary(r.get('completed'))==1 for r in records)), psiturk_status=participant['status'],code_version=text(session.get('code_version')),n_practice_trials=len(practice),n_main_trials=len(main),expected_main_trials=expected,main_trials_complete=int(len(main)==expected) if expected is not None else None,n_trust_measurements=len(trust))
        for field in ['gender','robot_experience','hri_experience','ai_familiarity','psiturk_experience']:
            raw=demo.get(field)
            if field=='robot_experience' and isinstance(raw,str) and raw.strip().lower()=='none':
                row[field]='no_experience'
            else:
                value=text(raw); normalized=value.lower().replace('-', '_').replace(' ', '_') if value else None
                if field=='gender' and normalized not in [None,'male','female','non_binary','other','prefer_not_to_say']: normalized='other'
                row[field]=normalized
        for old,new in TLX.items(): row[new]=number(workload.get(old),integer=True,low=1,high=7)
        row['tlx_mean']=complete_mean([row[k] for k in TLX.values()])
        wide=dict(base)
        for t in trust:
            point=t['measurement_point'];wide[f'trust_{point}']=t['trust_mean']
            for i in range(1,5):wide[f'trust_q{i}_{point}']=t[f'trust_q{i}']
        behavior=dict(base)
        for phase,label in [('build_trust','build'),('error_recovery','error_phase'),('continued_interaction','recovery')]:
            for metric,value in summarize([t for t in main if t['phase']==phase]).items(): behavior[f'{metric}_{label}']=value
        errors=settings.get('errorTrials')
        for label,group in [('before_errors',[t for t in main if t['trial_number']<min(errors)] if errors else []),('after_errors',[t for t in main if t['trial_number']>max(errors)] if errors else [])]:
            stats=summarize(group)
            for target,source in [('n_trials','n_trials'),('reliance','reliance'),('manual_check','manual_check_rate'),('rt','mean_rt'),('accuracy','accuracy')]:behavior[f'{target}_{label}']=stats[source]
        output['trial_data.csv']+=trials;output['participant_data.csv'].append(row);output['trust_long.csv']+=trust;output['trust_wide.csv'].append(wide);output['behavior_summary.csv'].append(behavior)
    return output

def export(database, output):
    with sqlite3.connect(database.resolve().as_uri()+'?mode=ro', uri=True) as db:
        db.row_factory=sqlite3.Row
        participants=db.execute("SELECT uniqueid,cond,status,datastring FROM assignments WHERE instr(workerid, ?) = 1 ORDER BY uniqueid", ('debugClassroom_',)).fetchall()
    result=transform(participants)  # Validate everything before writing any CSV.
    submitted_ids = {row['participant_id'] for row in result['participant_data.csv'] if row['completed'] == 1}
    result = {name: [row for row in rows if row['participant_id'] in submitted_ids] for name, rows in result.items()}
    output.mkdir(parents=True,exist_ok=True)
    for filename,fields in SCHEMAS.items():
        with (output/filename).open('w',newline='',encoding='utf-8-sig') as stream:
            writer=csv.DictWriter(stream,fieldnames=fields,extrasaction='raise');writer.writeheader();writer.writerows(result[filename])
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database',type=Path,default=ROOT/'participants.db')
    parser.add_argument('--output',type=Path,default=ROOT/'analysis/exports')
    args=parser.parse_args()
    result=export(args.database,args.output)
    for name,rows in result.items():print(f'{name}: {len(rows)} rows')
    print(f'CSV files: {args.output.resolve()} (submitted classroom participants only)')
