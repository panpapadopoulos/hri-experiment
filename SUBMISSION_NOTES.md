# Implementation-phase submission

This package delivers the implemented study and a separate no-recording demo. Data gathering, empirical analysis, and the results report are planned for phase two. The original project proposal has not been edited. No participant records or derived participant CSVs are included.

Start with RUNNING.md. A grader can preview demo/ using a static server without installing PsiTurk. To collect real data, run the root experiment with Python 3.10 and the pinned requirements, not demo/. The experiment saves only when Submit is pressed. The demo never saves answers.

## Implemented design

- Three between-participant conditions: acknowledgment, apology, apology plus explanation. Real PsiTurk balances assignments among eligible sessions for the current code version; the static demo chooses randomly without cross-visitor balancing.
- Fifteen trials: build 1?4, errors/recovery 5?11, continued interaction 12?15. Pepper errors occur on trials 5, 8 and 11.
- Twelve seconds per trial; a ten-minute overall maximum includes manual checking, trial feedback and interim surveys. Final surveys remain available after timeout.
- Original MDMT v1 Capacity items (Reliable and Capable), 0?7 with Does Not Fit. Investigator-written explanations are displayed alongside original labels; this is an administration adaptation, not a new validation of the scale.
- Trust after trial 4 (pre-error), trial 7 (early recovery), and task end. Workload is a final six-item, 1?7 TLX-style questionnaire; it is not standard weighted NASA-TLX.
- Submitted-only CSV exports are generated at /researcher, with exact age, named item scores, missing-value handling and a data dictionary.

## How the data address the research question

Question: How does a robot's response after errors affect trust, reliance, workload and task performance?

| Construct / proposal hypothesis | Recorded evidence | Phase-two use |
| --- | --- | --- |
| Trust loss/recovery (H1?H3) | Eight item ratings, Reliability/Capability/Capacity means and valid-item counts at three occasions | Plot participant trajectories and compare change across conditions |
| Reliance (H1?H3) | Recommendation, choice, followed_robot, correctness and timeout on each trial | Compare pre-error, error-phase and later reliance; inspect responses following error trials |
| Verification / response time (H4) | manual_check_used, start and duration; response time | Compare checking and decision time by phase and condition |
| Performance | Trial accuracy, timeout, count completed, task end reason and duration | Compare accuracy, successful trial counts and completion |
| Workload (H4) | Six final workload ratings and their mean | Compare overall workload between conditions |
| Experience and explanation | Age, gender, robot/PsiTurk experience, final written feedback | Describe the sample and interpret behavior |

## Boundaries on conclusions

These measures support an exploratory answer, not a guarantee of statistically significant findings or confirmation of every hypothesis.

- Trial 7 follows both the first error and its recovery message. It cannot separate their immediate effects or measure trust after every error.
- Trial 4 is a pre-error measure after interaction; there is no pre-task trust measure to quantify initial trust building.
- Condition-specific videos and instruction examples expose the recovery style before the task. Conditions therefore compare the complete presentation plus repeated responses, not an isolated post-error wording manipulation.
- Final-only workload cannot establish an increase in workload after errors within the same person. H4's checking/response-time component is observable over time; its workload-increase claim is not directly tested.
- About 17 participants yields roughly 5?6 per condition, so condition estimates will be imprecise. Multiple trials are repeated observations, not independent additional participants.
- The task is screen-based, with a fixed rack and scripted errors. Practice/learning, repeated exposure and time pressure can influence behavior. Do not interpret reliance alone as trust or causal mediation through trust/workload.
- Time-limit endings may yield missing occasions and fewer than 15 trials. Check completion and valid-item counts; do not fill missing trust scores with zero.

## Analysis handoff (no results claimed)

Use trust_wide.csv for participant-level trust trajectories, trust_long.csv for measurement timing and item checks, behavior_summary.csv for phase summaries, trial_data.csv for trial-level checks, and participant_data.csv for demographics/workload/completion/comments. In JASP set participant/condition labels to nominal and numeric scores to scale. Preserve participant-level dependence. Document exclusions and missing-data choices before collecting the final sample.

## Validation and collection boundary

Automated checks cover export scoring, missing values, submitted-only filtering, database nonmutation, researcher controls and demo isolation. Browser checks cover the full trial/feedback flow, single-page surveys, deadlines, final-only saving and responsive layouts. Final collection should use a short end-to-end pilot on the actual classroom device; physical-phone keyboard/touch behavior is not certified by browser emulation. Do not count pilot sessions as final research participants.

The ZIP includes both runnable source and the static demo, setup instructions, pinned dependencies, tests and export documentation. It excludes databases, exports, logs, caches, local secrets, environments and Git history.
