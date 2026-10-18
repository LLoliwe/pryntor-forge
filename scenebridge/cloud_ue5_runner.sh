#!/usr/bin/env bash
# Run SceneBridge on an explicitly provisioned, authorised cloud Linux worker.
# Requires: Unreal Engine 5 Editor with Python scripting, Python 3.10+, optionally Blender.
# This script NEVER provisions cloud resources or downloads paid images.
set -Eeuo pipefail
umask 077

fail() { echo "SCENEBRIDGE BLOCKED: $*" >&2; exit 2; }
[[ $# -eq 3 ]] || fail "Usage: bash scenebridge/cloud_ue5_runner.sh <source_manifest.json> <work_dir> <UnrealEditor-Cmd binary>"
MANIFEST="$(realpath "$1")"
mkdir -p "$2"
WORK="$(realpath "$2")"
UE_CMD="$(realpath "$3")"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ -f "$MANIFEST" ]] || fail "Source manifest missing"
[[ -x "$UE_CMD" ]] || fail "UnrealEditor-Cmd executable unavailable"
[[ "$WORK" != "$REPO" ]] || fail "Refusing to place generated data in repository root"
[[ ! -e "$WORK/SceneBridgeQA.uproject" ]] || fail "QA project already exists; use a fresh work directory"
[[ ! -e "$WORK/import-plan.json" ]] || fail "Import plan already exists; use a fresh work directory"

cd "$REPO"
python3 -m scenebridge validate "$MANIFEST"
python3 -m scenebridge plan "$MANIFEST" --out "$WORK"

# No existing project assets are touched. The UE plugin declaration makes Python available.
cat > "$WORK/SceneBridgeQA.uproject" <<'PROJECT'
{
  "FileVersion": 3,
  "Category": "QA",
  "Description": "Isolated SceneBridge import verification",
  "Plugins": [{"Name": "PythonScriptPlugin", "Enabled": true}]
}
PROJECT

export SCENEBRIDGE_JOB="$WORK/import-plan.json"
set +e
"$UE_CMD" "$WORK/SceneBridgeQA.uproject" \
  "-ExecutePythonScript=$REPO/scenebridge/unreal_import.py" \
  -unattended -nop4 -nosplash -stdout -FullStdOutLogOutput -nullrhi \
  > "$WORK/unreal-editor.log" 2>&1
rc=$?
set -e

python3 - "$WORK" "$rc" <<'PY'
import json, pathlib, sys
work, rc = pathlib.Path(sys.argv[1]), int(sys.argv[2])
report = work / 'unreal-import-report.json'
status = {'exit_code': rc, 'report_exists': report.is_file(),
          'native_unreal_success': False,
          'visual_parity_verified': False,
          'gameplay_qa_verified': False}
if report.is_file():
    try:
        data = json.loads(report.read_text())
        status['native_unreal_success'] = (
            rc == 0 and data.get('status') == 'IMPORTED_REQUIRES_VISUAL_AND_GAMEPLAY_QA'
            and len(data.get('imported', [])) > 0
            and not data.get('unmatched_slots'))
        status['unreal_report'] = data
    except (ValueError, OSError) as exc:
        status['parse_error'] = str(exc)
(work / 'cloud-validation.json').write_text(json.dumps(status, indent=2) + '\n')
print(json.dumps(status, indent=2))
if not status['native_unreal_success']:
    sys.exit(3)
PY
echo "Native import reported success, but visual/gameplay/rights review remains pending."
