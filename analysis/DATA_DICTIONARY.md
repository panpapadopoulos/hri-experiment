# Data dictionary

## Export and missing-data rules

Run `~/psiturk_env/bin/python analysis/export_for_jasp.py` from the project. Output: `analysis/exports/`. Classroom IDs only (workerid starts with debugClassroom_). Only submitted sessions are exported. Use main_trials_complete to identify whether all 15 main trials were completed before the overall timeout. Existing raw records and earlier CSV exports are never modified; these five derived CSVs are regenerated.

CSV is UTF-8 with BOM for Excel, fixed snake_case headers, decimal numeric values, binary 0/1, and blank missing cells. Exact numeric age and the Other gender self-description are exported. No JSON, email, student ID or IP fields are exported. Optional feedback comments are exported as text. Participant ID is the existing pseudonymous session identifier. Current demographic options are normalized; unrecognized legacy free-form gender is exported as other, not verbatim.

Current trust occasions are pre_error (after main trial 4), early_recovery (after main trial 7), final (after trial 15). Exports contain only these three current measurement occasions. after_main_trial documents actual timing. Trust uses original MDMT v1 Capacity Trust; workload ratings remain provisional.

Behavior summaries exclude practice. Rates include timeouts as non-following/incorrect according to raw coding. Mean RT excludes missing/timeout responses. Mean inspection time includes only used checks. Empty groups give counts 0 and blank means/rates. Incomplete sessions summarize observed trials only. No imputation or zero-filling of missing questionnaires.

Pre/post windows use each saved session errorTrials schedule: before_errors is strictly before its first scheduled error; after_errors is strictly after its last scheduled error. They exclude all intervening trials, not merely the three error trials. For the current schedule these are trials 1-4 and 12-15. Missing schedule means unavailable windows (counts 0; means blank). These are descriptive summaries, not estimates of causal effects.

Exporter validates conditions, contiguous numbering, unique trials/checkpoints, value ranges and correctness consistency. It fails before writing any CSV if validation fails. It does not silently deduplicate or repair contradictory records.

## trial_data.csv

| Column | Type / values | Meaning / coding |
|---|---|---|
| participant_id | Text | Pseudonymous PsiTurk session identifier; unique per classroom session, not proof of a unique person. |
| recovery_condition | Categorical | acknowledgment, apology, apology_explanation; from server condition 0, 1, 2; checked against all records. |
| trial_number | Integer | One-based main task number; use participant_id + trial_number as row key. |
| phase | Categorical | build_trust, error_recovery, continued_interaction. Raw errors_recovery normalized to error_recovery. |
| target_item | Text | Rack object name as recorded. |
| correct_section | Categorical | A, B, C, D; recorded correct rack row. |
| robot_suggestion | Categorical | A, B, C, D; robot recommended row. |
| robot_correct | Binary | 1 robot suggestion equals correct section; 0 otherwise. |
| manual_check_used | Binary | 1 opened whole-rack inspection at least once; 0 never opened. |
| manual_check_start_time | Numeric milliseconds | First inspection opening as Unix epoch milliseconds; blank if never opened. |
| manual_check_duration_ms | Numeric milliseconds | Cumulative inspection duration across openings, including timeout during inspection; 0 if unused. |
| participant_choice | Categorical | A, B, C, D; blank on timeout. |
| followed_robot | Binary | 1 final choice equals suggestion; 0 different choice OR no answer (timeout). Independent of manual checking. |
| participant_correct | Binary | 1 final choice equals correct section; 0 incorrect OR timeout. |
| response_time_ms | Numeric milliseconds | Trial onset to choice, including inspection; blank on timeout. |
| trial_duration_ms | Numeric milliseconds | Elapsed trial time to answer or timeout, including inspection, excluding feedback/save; browser delays can exceed deadline. |
| timed_out | Binary | 1 deadline passed without a valid final answer; 0 answered in time. |

## participant_data.csv

| Column | Type / values | Meaning / coding |
|---|---|---|
| participant_id | Text | Pseudonymous PsiTurk session identifier; unique per classroom session, not proof of a unique person. |
| recovery_condition | Categorical | acknowledgment, apology, apology_explanation; from server condition 0, 1, 2; checked against all records. |
| age | Integer | Exact age in years. New sessions accept 18?80. |
| gender | Categorical | male, female, non_binary, other, prefer_not_to_say; unrecognized legacy free-text is mapped to other. |
| gender_other | Text | Self-description supplied when gender is Other; blank otherwise. |
| robot_experience | Categorical | no_experience, a_little, moderate, extensive, prefer_not_to_say. Blank if not recorded. |
| psiturk_experience | Categorical | Not currently collected; blank. |
| tlx_mental | Integer 1-7 | Mental demand. 1 very low, 7 very high. |
| tlx_physical | Integer 1-7 | Physical demand. 1 very low, 7 very high. |
| tlx_temporal | Integer 1-7 | Temporal demand. 1 very low, 7 very high. |
| tlx_performance | Integer 1-7 | Performance. 1 perfect, 7 failure; higher is worse. |
| tlx_effort | Integer 1-7 | Effort. 1 very low, 7 very high. |
| tlx_frustration | Integer 1-7 | Frustration. 1 very low, 7 very high. |
| tlx_mean | Numeric 1-7 | Unweighted mean of all six workload items; blank unless all six exist. Not weighted NASA-TLX. |
| completed | Binary | 1 saved completion record exists, 0 otherwise. Does not imply platform payment or submission. |
| psiturk_status | Integer | Unmodified PsiTurk lifecycle status code; use completed for this exporter completion filtering. |
| code_version | Text | Recorded experiment code version; blank if no saved session record. |
| n_main_trials | Integer count | Number of saved main trials. |
| expected_main_trials | Integer count | Sum of block counts in that participant saved settings; blank if unavailable. |
| main_trials_complete | Binary | 1 main trial count matches saved settings; 0 does not; blank if expected count unknown. |
| n_trust_measurements | Integer count | Number of saved trust occasions. |

## trust_long.csv

One row per submitted MDMT measurement. instrument is mdmt_capacity_v1. measurement_point is pre_error (trial 4), early_recovery (trial 7), or final (task end). after_main_trial gives the actual completed trial number.

The eight item columns are mdmt_reliable, mdmt_predictable, mdmt_count_on, mdmt_consistent, mdmt_capable, mdmt_skilled, mdmt_competent, mdmt_meticulous. Each is integer 0?7; blank means Does Not Fit or missing. Zero is a valid lowest rating.

mdmt_reliability_mean and mdmt_capability_mean average available items in their respective four-item subscales. mdmt_capacity_mean averages available ratings across the eight items, following original MDMT v1 scoring; it is blank if either subscale has no valid items. The corresponding mdmt_reliability_n, mdmt_capability_n and mdmt_capacity_n report valid-item counts. Inspect counts when interpreting partial scores.

## trust_wide.csv

One row per submitted participant. Each item, score and valid-item count above has a _pre_error, _early_recovery, or _final suffix. Missing occasions are blank. Older provisional questionnaires are never converted to MDMT ratings.

## behavior_summary.csv

| Column | Type / values | Meaning / coding |
|---|---|---|
| participant_id | Text | Pseudonymous PsiTurk session identifier; unique per classroom session, not proof of a unique person. |
| recovery_condition | Categorical | acknowledgment, apology, apology_explanation; from server condition 0, 1, 2; checked against all records. |
| n_trials_build | Integer count | Saved non-practice trial count. Block: build. |
| reliance_build | Numeric proportion 0-1 | Proportion followed_robot=1; denominator all saved phase trials including timeouts. Block: build. |
| manual_check_rate_build | Numeric proportion 0-1 | Proportion manual_check_used=1; denominator all saved phase trials. Block: build. |
| accuracy_build | Numeric proportion 0-1 | Proportion participant_correct=1; denominator all saved phase trials including timeouts. Block: build. |
| mean_rt_build | Numeric milliseconds | Mean nonmissing response_time_ms; excludes timeouts. Block: build. |
| mean_manual_check_time_build | Numeric milliseconds | Mean inspection duration only among trials with manual_check_used=1 and nonmissing duration; excludes unused checks, includes timed-out inspections. Block: build. |
| n_rt_build | Integer count | Count of nonmissing response times used in mean_rt. Block: build. |
| n_manual_check_time_build | Integer count | Count of used-check trials with duration used in mean_manual_check_time. Block: build. |
| n_trials_error_phase | Integer count | Saved non-practice trial count. Block: error_phase. |
| reliance_error_phase | Numeric proportion 0-1 | Proportion followed_robot=1; denominator all saved phase trials including timeouts. Block: error_phase. |
| manual_check_rate_error_phase | Numeric proportion 0-1 | Proportion manual_check_used=1; denominator all saved phase trials. Block: error_phase. |
| accuracy_error_phase | Numeric proportion 0-1 | Proportion participant_correct=1; denominator all saved phase trials including timeouts. Block: error_phase. |
| mean_rt_error_phase | Numeric milliseconds | Mean nonmissing response_time_ms; excludes timeouts. Block: error_phase. |
| mean_manual_check_time_error_phase | Numeric milliseconds | Mean inspection duration only among trials with manual_check_used=1 and nonmissing duration; excludes unused checks, includes timed-out inspections. Block: error_phase. |
| n_rt_error_phase | Integer count | Count of nonmissing response times used in mean_rt. Block: error_phase. |
| n_manual_check_time_error_phase | Integer count | Count of used-check trials with duration used in mean_manual_check_time. Block: error_phase. |
| n_trials_recovery | Integer count | Saved non-practice trial count. Block: recovery. |
| reliance_recovery | Numeric proportion 0-1 | Proportion followed_robot=1; denominator all saved phase trials including timeouts. Block: recovery. |
| manual_check_rate_recovery | Numeric proportion 0-1 | Proportion manual_check_used=1; denominator all saved phase trials. Block: recovery. |
| accuracy_recovery | Numeric proportion 0-1 | Proportion participant_correct=1; denominator all saved phase trials including timeouts. Block: recovery. |
| mean_rt_recovery | Numeric milliseconds | Mean nonmissing response_time_ms; excludes timeouts. Block: recovery. |
| mean_manual_check_time_recovery | Numeric milliseconds | Mean inspection duration only among trials with manual_check_used=1 and nonmissing duration; excludes unused checks, includes timed-out inspections. Block: recovery. |
| n_rt_recovery | Integer count | Count of nonmissing response times used in mean_rt. Block: recovery. |
| n_manual_check_time_recovery | Integer count | Count of used-check trials with duration used in mean_manual_check_time. Block: recovery. |
| n_trials_before_errors | Integer count | Saved trial count in before_errors window; see window definitions below. |
| reliance_before_errors | Numeric proportion 0-1 | Mean followed_robot in before_errors window; see window definitions below. |
| manual_check_before_errors | Numeric proportion 0-1 | Mean manual_check_used in before_errors window; see window definitions below. |
| rt_before_errors | Numeric milliseconds | Mean nonmissing response_time_ms (timeouts excluded) in before_errors window; see window definitions below. |
| accuracy_before_errors | Numeric proportion 0-1 | Mean participant_correct in before_errors window; see window definitions below. |
| n_trials_after_errors | Integer count | Saved trial count in after_errors window; see window definitions below. |
| reliance_after_errors | Numeric proportion 0-1 | Mean followed_robot in after_errors window; see window definitions below. |
| manual_check_after_errors | Numeric proportion 0-1 | Mean manual_check_used in after_errors window; see window definitions below. |
| rt_after_errors | Numeric milliseconds | Mean nonmissing response_time_ms (timeouts excluded) in after_errors window; see window definitions below. |
| accuracy_after_errors | Numeric proportion 0-1 | Mean participant_correct in after_errors window; see window definitions below. |

Current protocol: exact numeric age (18?80 for new sessions), gender_other contains the required self-description when Other is selected. psiturk_experience and robot_experience use None, A little, Moderate, Extensive (normalized in exports). No practice trials. Main trials last 12 seconds, with a 600-second overall task limit. A timeout may produce fewer than 15 trials; inspect main_trials_complete. Old after-practice baseline records are omitted rather than relabeled as pre-error trust; end_phase_3 still maps to final.

## Completion and qualitative context

participant_data.csv also includes task_end_reason (completed_trials or time_limit), task_elapsed_ms (elapsed timed-task duration), and feedback_comments (optional final written response). These fields are actually recorded by the current task. Trust long rows include explanation_version to identify the plain-language item explanations. Written text beginning with =, +, - or @ is prefixed with an apostrophe for spreadsheet safety. Keep written feedback out of numeric JASP analyses.
