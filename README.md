## Current protocol (October 29, 2026)

Flow: landing ? consent ? required demographics ? condition-specific video ? paged instructions with Previous ? 15 main trials (no practice) ? final questionnaires ? Submit. Videos are Acknowledge.mp4, Apology.mp4, and ApologyExplanation.mp4. Instruction examples use the corresponding supplied recovery screenshot. Exposing the assigned recovery style before the task is part of this protocol, so the pre-error measure is not a naive baseline.

Each trial has 12 seconds. A visible 10-minute overall clock starts at Begin Task and continues through manual checks, feedback and interim trust questions. It stops after trial 15 feedback or at the overall deadline, whichever comes first. At expiry an active trial becomes a timeout; unfinished interim questionnaire answers are not recorded. Final trust, workload and submission remain available outside the timer. Data still saves only on final Submit.

Trust measurements: pre_error after trial 4, early_recovery after trial 7, final after trial 15 or overall expiry. Errors remain trials 5, 8 and 11. Protocol/code version is 0.2.0. The old after-practice baseline is not relabeled as pre-error trust; existing end-of-task scores retain their final label; filter code_version when analyzing mixed collections.

Age is required (18?80) and exported as exact numeric age. Robot/PsiTurk experience use four radio choices. Other gender requires a self-description. Continue buttons are disabled until required fields are valid. Questionnaire items and instructions are paged to avoid scrolling; compact layouts fit the viewport with scaling as a fallback for unusually small windows. The researcher dashboard retains its scrollable data tables.

# Response submission

Responses are kept in page memory until the participant presses Submit on the
final thank-you screen, after debrief. No intermediate response saves occur.
Refreshing or closing before submission loses unsaved responses. A failed final
save can be retried without appending another completion record. The saved
confirmation page and next-participant button follow successful submission.
PsiTurk still creates a participant/session row at entry and updates lifecycle
status when practice begins; these are metadata, not submitted study responses.
Existing data is unchanged. This supersedes earlier incremental-saving notes.

# Current introduction and timing

Each practice and main trial allows 15 seconds, including Manual Check.
The entry flow is landing, consent, required demographics, About the Study,
How to Do the Task, then practice. Consent, study overview, and task instructions
are separate pages. Instructions explain rack rows, final answers, manual checking,
and timeout behavior. Existing trial counts, errors, conditions and trust timing
are unchanged. This supersedes older 25-second/instruction descriptions below.

# JASP analysis export

```bash
cd ~/hri-experiment
~/psiturk_env/bin/python analysis/export_for_jasp.py
explorer.exe analysis/exports
```

Read `analysis/DATA_DICTIONARY.md` for variables, coding and denominators.
Outputs: trial_data.csv, participant_data.csv, trust_long.csv, trust_wide.csv,
behavior_summary.csv. The source database is opened read-only. Exports include
classroom sessions only, including incomplete sessions. Filter using completed
and main_trials_complete as appropriate. Re-running regenerates these derived
files, never raw data or earlier exports. No experiment changes were made.

Tests: `~/psiturk_env/bin/python analysis/test_export_for_jasp.py`.

# Classroom operation

```bash
pyenv shell 3.10.18
source ~/psiturk_env/bin/activate
cd ~/hri-experiment
psiturk server on
```

Open http://localhost:22363 and select **Start New Participant**. The landing
page and consent follow. After completion, the same button creates a fresh session
for the next person. Each POST creates new UUID-based worker, assignment and HIT
identifiers; it never reuses the last participant. Existing records are preserved.

Classroom records have IDs beginning `debugClassroom_` and the session record has
`collection_source: classroom`. Earlier tests are not classroom data. These sessions
still use PsiTurk's supported local `debug` mode; the prefix and collection_source
are the explicit analysis filters, not the mode column. This does not establish
that a record came from a different person; the researcher manages one run per person.

The database is participants.db in this project. Back it up after collection.
Stop with `psiturk server off`. Keep each session open through completion;
refresh/resume is not supported. Complete consent/protocol review before collection.

# Current trust measurement schedule

Three trust questionnaires: after practice (baseline), after main trial 7
(early_recovery), and after main trial 15 (end_phase_3). Each retains the four
existing trust items. The early checkpoint is configured by
`earlyRecoveryTrustTrial: 7` in static/js/settings.js. It follows the first error
on trial 5 by two correct trials. There are no questionnaires immediately after
robot errors on trials 5, 8 or 11. Workload and open feedback remain at the end.
Trial counts, error schedule, condition assignment and behavioral data fields
are unchanged. This schedule measures baseline, early recovery and final trust;
it does not directly measure immediate trust loss. Data adequacy depends on the
sample size and planned analysis. This supersedes all older schedules below.

# Latest feedback and questionnaire update

Trust is now measured after practice (baseline), and after main trials 5, 11,
and 15. The trial-4 trust check has been removed to avoid consecutive-trial
questionnaires. This means there is no longer a separate post-build/pre-error
trust measure. Workload and written feedback remain at the end.

Manual checking followed by a correct recommendation gets the neutral response
"Your check confirmed the item location." with Suggestion1.png. No told-you-so
image or blame wording is used. Disagreeing with a correct recommendation receives
normal answer feedback, without an extra robot response. Assigned recovery
messages for robot errors are unchanged. The rack mapping, 2 practice + 15 main
trials, and errors on main trials 5, 8, 11 are unchanged.

This update supersedes older feedback and checkpoint descriptions below.

# Current configuration update

The task now has 2 practice + 15 main trials (17 total). Robot errors occur only
on main trials 5, 8 and 11. Internal blocks have 4, 7 and 4 trials. Trust checks
occur after practice and main trials 4, 5 (after error feedback), 11 and 15.
Workload and written feedback follow the final trust check.

After Manual Check, choosing the robot's CORRECT recommendation shows toldyouso.png
with: "I told you it was there. You didn't trust me!" Incorrect robot recommendations
still use the assigned recovery response, even if manually checked and followed.
The separate existing response for rejecting a correct recommendation remains.

Landing page: purduelogo.svg as a wide wordmark plus pnw.png as the lab logo.
Completion/thank-you templates also use pnw.png. All supplied images are unchanged.
Browser regression checks passed for the shorter schedule and all three conditions.
The historical counts below are superseded by this current configuration.

# Building, Losing, and Recovering Trust in HRI

## Launch in WSL Ubuntu

```bash
pyenv shell 3.10.18
source ~/psiturk_env/bin/activate
cd ~/hri-experiment
psiturk server on
psiturk debug -p
```

Open the printed URL in your Windows browser (localhost:22363).
Stop with `psiturk server off`. Plain `psiturk` currently exits because of existing
AWS credentials; these non-AWS commands work. Start a fresh debug session per run.
No additional environment or dependencies are required.

## Participant experience

Consent, demographics, instructions, exactly two practice trials, Practice Complete
with Begin Task, and the main task. The existing five trust checkpoints remain:
after practice/baseline, after main trial 6, after the first scheduled error,
after main trial 18, and after main trial 24. Workload, feedback and debrief follow.
Internal phases remain in data but have no visible transition screens or labels.
Main trials have no visible trial number. Recovery messages appear in Pepper's
speech bubble with the existing assigned wording. Ratings and trial feedback still
interrupt trials as required by the existing study protocol.

## Settings and conditions

`static/js/settings.js`: counts, 25-second time limit, recovery messages and
controlled errors. Defaults: 2 practice + 24 main trials. Errors are main trial
numbers 8, 11, 14 and 17, excluding practice. All other recommendations are correct.
Wrong suggestions are sampled from the three other sections. `config.txt` keeps
three PsiTurk conditions: 0 acknowledgment, 1 apology, 2 apology_explanation.
A participant retains their server-assigned condition for the entire run.

## Fixed rack mapping

`static/js/stimuli.js` contains the central `HRI.items` mapping, read directly from
`static/images/manual-rack.jpg`. A-D are horizontal rows, top to bottom, not columns.

| Section | Image bin labels / target names |
| --- | --- |
| A | A1 Gear; A2 Sensor; A3 Motor; A4 Battery |
| B | B1 Circuit Board; B2 Cable; B3 Camera; B4 Bracket |
| C | C1 Wheel; C2 Connector; C3 Screw; C4 Belt |
| D | D1 Fan; D2 Heat Sink; D3 Switch; D4 Valve |

All 16 labels and their sections were visually identifiable. No manual mappings
remain unresolved. Targets are sampled deterministically by participant, internal
phase and trial number. Correct answers always come from this fixed mapping.
`rack_items` retains the names in row-major order. The old synthetic/color targets
and generated SVG rack have been removed. No rack image modification was needed.

## Pepper and inspection

Optional Pepper image: `/home/panos/hri-experiment/static/images/pepper.png`.
Browser URL: `/static/images/pepper.png`. The supplied image is present and used, with a speech bubble headed Pepper. A local vector robot remains as a load-failure fallback. A missing image
may produce an expected 404 resource message but does not break the task.
Add a suitable image at that path to replace the fallback. CSS speaking motion runs for 1.4 seconds, followed by subtle 4px idle movement
on a 2.8-second cycle; reduced-motion preferences disable it.

Manual Check opens a full-viewport overlay showing only the target, complete
rack image and Back control. Escape also returns. The underlying interface is
hidden and keyboard focus stays on Back. The image uses object-fit:contain.
Image URL: `/static/images/manual-rack.jpg`. Timer and recommendation are never
reset. Timeouts still finish the current trial even during inspection.

## Data and saving

Existing record fields, PsiTurk saves and condition assignment are preserved.
`followed_robot` is choice equality with robot suggestion, separate from checking.
Manual start is the first opening's Unix timestamp (ms), null if never opened.
Manual duration sums every inspection. Response time is onset to answer, null
on timeout; trial duration includes inspection but excludes feedback and saving.
Browser throttling can make actual elapsed time exceed the nominal deadline.

Saves block advancement, with retry on failure. Completion follows a successful
final save. Refresh/resume is not supported; saved sessions are protected from
accidental overwrite. Existing project participant data is retained.
Trust items and workload ratings remain provisional; the six workload dimensions
are separate 1-7 NASA-TLX-style ratings, not weighted NASA-TLX scores. Performance
uses 1 perfect to 7 failure. Complete the consent/protocol review before recruitment.

## Checks

`tests/browser-check.html` uses mock PsiTurk persistence to exercise all three full
flows. Temporarily copy it to `static/browser-check.html` and open that URL with
the server running to repeat checks; remove the static copy afterward.

Passed in Chrome at 1366x768: 2,400 generated main trials, image mapping, controlled
errors, two practice trials, all 24 main trial numbers, stable conditions, recovery
speech bubbles, five trust checks, workload, save retry, full-screen inspection,
hidden trial UI, live timer, cumulative inspection duration, timeout, and return
to the same target/recommendation. No uncaught JavaScript errors detected.
Real PsiTurk saving/readback passed separately; verification records were removed.
Server running state was restored after testing.

## Entry and feedback UI update

The normal `psiturk debug -p` URL still uses PsiTurk's validated ad route, whose
successful template immediately replaces itself with the consent URL. All session
parameters and mode are retained. No recruitment page is displayed during debug.
An unaccepted platform assignment still requires acceptance before proceeding.
Gender is now an optional dropdown (Male, Female, Non-binary, Other, Prefer not to
say), without an additional free-text field. Targets are large and bold above the
recommendation and in the fixed inspection header. Every answer receives green
Correct or red Incorrect feedback with the mapped correct section; timeouts are
Incorrect with an explanation. Feedback waits for Continue. Robot-error responses
use the same assigned recovery message. Existing research settings, mappings,
questionnaires and trial data/save logic are unchanged.

Browser checks passed for direct consent entry, dropdown, target sizes, speaking
and idle CSS animation, correct/incorrect feedback, recovery messages, inspection
timing, and existing three-condition flow checks. No uncaught JavaScript errors.
The supplied Pepper PNG served successfully. Real session initialization and
PsiTurk save/readback passed separately. Verification records were removed.

## Landing page restored

The standard debug URL opens the study title/welcome landing page in
`templates/ad.html`, followed by Continue to Consent. There is no automatic
redirect. PsiTurk calls this route /ad and may print "Begin by viewing the ad
page" in its launcher; this name does not determine the participant-facing page.
Institution/lab logo assets are pending their supplied file locations.

Current question checkpoints (main-task numbering excludes 2 practice trials):
demographics after consent; baseline trust after practice/Begin Task; trust after
main trials 6, 8 (after feedback/recovery), 18 and 24; then workload and optional
written feedback. Robot errors occur only on main trials 8, 11, 14 and 17.
All other main trials and both practice trials have correct robot suggestions.

## Required demographics and Pepper poses

Age, gender and robot experience now require responses; Prefer not to say remains
available for gender and robot experience. Native form validation also guards
submission. Consent wording reflects the required responses.

Pepper uses the uploaded images, unchanged: Suggestion1.png and Suggestion2.png
alternate on successive recommendations: one image stays visible for each trial.
error.png accompanies acknowledgment; apology.png accompanies both apology
conditions. toldyouso.png appears only after a non-timeout answer that disagreed
with a correct recommendation, with a neutral statement of the correct section.
The assigned error recovery wording and all trial data fields remain unchanged.
Browser checks passed for required fields, pose conditions, timeout exclusion,
all three full flows, timing and saving mocks. All five image URLs returned 200.


## Researcher dashboard

With the server running, open http://localhost:22363/researcher on the classroom computer. This local-only page shows submitted and unsubmitted classroom sessions, test-session counts, condition balance, and paginated previews of all five analysis tables. Generate / refresh exports before downloading: CSV snapshots are stored in `/home/panos/hri-experiment/analysis/exports`. All five exports include only submitted classroom participants (completed = 1); unfinished sessions remain included in dashboard counts, but are excluded from data previews.

Reset requires typing RESET and accepting a confirmation. It deletes all rows from the assignments table (including tests) and the five generated JASP CSVs, without a backup. Close participant tabs and reset only between sessions. Other files and downloaded copies are not deleted. The dashboard is intended for a trusted, shared classroom computer, not an authenticated remote administration service.
