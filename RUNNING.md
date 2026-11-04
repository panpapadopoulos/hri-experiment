# Run the experiment or the demo

The repository contains two independent versions:

- **Real study:** the root config.txt, custom.py, researcher.py, templates/, static/ and analysis/. Requires PsiTurk/Python; saves data when participants submit.
- **Demo:** demo/. Static browser-only preview; no participant responses are saved. See demo/README.md for GitHub Pages.

Downloading or cloning this repository preserves both versions. No participant database, collected CSVs, virtual environment, or local signing secret is included.

## Existing WSL setup

```bash
pyenv shell 3.10.18
source ~/psiturk_env/bin/activate
cd ~/hri-experiment
psiturk server on
```

Open http://localhost:22363/ for the study, or http://localhost:22363/researcher for local administration and submitted-only JASP exports. Run `psiturk server off` to stop it.

## Fresh clone on Linux / WSL Ubuntu

Use Python 3.10 (the development environment uses 3.10.18). From the downloaded repository directory:

```bash
python3.10 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-experiment.txt
psiturk server on
```

Open http://localhost:22363/. PsiTurk initializes its configured SQLite database for participant sessions. Run from the repository root, not demo/. Port 22363 must be available. The local researcher session-signing key is generated on first app startup and must not be committed.

The requirements file pins the dependency versions in the working environment. A fresh-machine installation has not been independently tested. On WSL, the installed pyperclip/cmd2 combination may fail when the Windows clipboard is empty; copy ordinary text to the Windows clipboard and retry if the traceback mentions Get-Clipboard/GetBytes.

Never commit participants.db, analysis/exports, .researcher-secret or your virtual environment. GitHub Pages cannot run the real Python experiment; only the separate demo is published there.
