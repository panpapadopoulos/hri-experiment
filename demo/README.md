# Browser-only demo

This directory is self-contained. It reproduces the participant UI without a Python server or database. Responses are never recorded or submitted: the PsiTurk adapter drops records and finishes locally. Current answers exist only in live page controls while needed for navigation. No cookies, localStorage, sessionStorage or analytics are used to store answers. Normal hosting access logs are outside the demo's control.

The final submission screen and completion page explain: "This was a demo run, not an actual experiment. Your answers will not be recorded."

Each run chooses one of the three conditions automatically in the browser. Unlike the real experiment, this cannot balance assignments across visitors without a backend. Trial timing, errors, questionnaires, validation, and responsive layouts match the experiment. The researcher dashboard is deliberately not included.

## Run locally

From the repository root:

```bash
python3 -m http.server 8000 --directory demo
```

Open http://localhost:8000/. Use an HTTP server rather than double-clicking HTML files.

## Publish on GitHub Pages

1. Commit and push demo/ and .github/workflows/deploy-demo.yml to main.
2. Open the repository on GitHub. Go to Settings > Pages.
3. Under Build and deployment, select GitHub Actions as the Source.
4. Open Actions > Publish demo to GitHub Pages > Run workflow > main > Run workflow.
5. After it succeeds, open the URL shown by the deployment. For this repository it is normally https://panpapadopoulos.github.io/hri-experiment/.

Only demo/ is uploaded. There is no automatic deployment on push; run the workflow again to publish updates. Do not publish the repository root.

## Refresh after changing the real experiment

With Jinja2 available (already installed in the experiment environment):

```bash
python scripts/build_demo.py
```

Review and commit the regenerated demo before running the publishing workflow. Templates and UI scripts remain the source of truth. The builder never opens the experiment database.
