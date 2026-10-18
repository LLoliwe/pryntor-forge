"""Offline, dependency-free validation and planning for a Blender -> Unreal scene transfer.

No generation, network, or engine processes are executed by this module.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
from pathlib import Path

SCHEMA = 'pryntor.scenebridge/1'
ALLOWED_LICENSES = {'original', 'cc0', 'licensed'}
TEXTURE_CHANNELS = {'base_color', 'metallic', 'roughness', 'normal'}
MAX_FILES = 512
MAX_BYTES = 2 * 1024 * 1024 * 1024


class SceneBridgeError(ValueError):
    pass


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def slug(name):
    value = re.sub(r'[^a-zA-Z0-9_]+', '_', str(name)).strip('_')
    if not value or not value[0].isalpha():
        value = 'Asset_' + value
    return value[:48]


def _relpath(root, value):
    if not isinstance(value, str) or not value or '\\' in value or '\x00' in value:
        raise SceneBridgeError('Invalid portable asset path')
    rel = Path(value)
    if rel.is_absolute() or any(p in ('.', '..') for p in value.split('/')) or ':' in value:
        raise SceneBridgeError('Unsafe asset path: ' + value)
    candidate = root / rel
    if not candidate.is_file() or candidate.is_symlink() or not candidate.resolve().is_relative_to(root.resolve()):
        raise SceneBridgeError('Missing, symlinked, or escaped asset: ' + value)
    return candidate


def _num(n, low=0, high=1):
    return type(n) in (int, float) and low <= n <= high


def validate_manifest(path):
    manifest_path = Path(path).resolve(strict=True)
    root = manifest_path.parent
    if manifest_path.stat().st_size > 2 * 1024 * 1024:
        raise SceneBridgeError('Manifest too large')
    try:
        obj = json.loads(manifest_path.read_text(encoding='utf-8'))
    except (ValueError, UnicodeError) as e:
        raise SceneBridgeError('Invalid manifest JSON') from e
    if not isinstance(obj, dict) or obj.get('schema') != SCHEMA:
        raise SceneBridgeError('Unsupported schema')
    if not isinstance(obj.get('scene'), str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,47}', obj['scene']):
        raise SceneBridgeError('Invalid scene identifier')
    provenance = obj.get('provenance')
    if not isinstance(provenance, dict) or provenance.get('rights') not in ALLOWED_LICENSES:
        raise SceneBridgeError('Source rights must be approved and explicit')
    if provenance['rights'] == 'licensed' and not str(provenance.get('license_reference', '')).strip():
        raise SceneBridgeError('Licensed assets require a license_reference')
    files = obj.get('files')
    if not isinstance(files, list) or not 1 <= len(files) <= MAX_FILES:
        raise SceneBridgeError('Invalid asset count')
    seen, geometry, total_bytes = set(), [], 0
    for entry in files:
        if not isinstance(entry, dict) or entry.get('role') not in ('geometry', 'texture'):
            raise SceneBridgeError('Invalid file entry')
        filename, expected = entry.get('path'), entry.get('sha256')
        if not isinstance(filename, str) or not isinstance(expected, str) or not re.fullmatch(r'[a-f0-9]{64}', expected):
            raise SceneBridgeError('Invalid path or digest')
        if filename in seen:
            raise SceneBridgeError('Duplicate asset path')
        seen.add(filename)
        actual = _relpath(root, filename)
        if entry['role'] == 'geometry':
            if actual.suffix.lower() != '.fbx':
                raise SceneBridgeError('V1 geometry must be an FBX')
            geometry.append(filename)
        elif actual.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.tga', '.exr'):
            raise SceneBridgeError('Unsupported texture format')
        total_bytes += actual.stat().st_size
        if total_bytes > MAX_BYTES:
            raise SceneBridgeError('Asset size budget exceeded')
        if sha256(actual) != expected:
            raise SceneBridgeError('Digest mismatch: ' + filename)
    if len(geometry) != 1:
        raise SceneBridgeError('Exactly one FBX geometry entry required')
    materials = obj.get('materials')
    if not isinstance(materials, list) or not materials:
        raise SceneBridgeError('Materials must be declared')
    material_names = set()
    for material in materials:
        if not isinstance(material, dict) or not isinstance(material.get('name'), str) or not material['name']:
            raise SceneBridgeError('Invalid material')
        name = slug(material['name'])
        if name.lower() in material_names:
            raise SceneBridgeError('Colliding material names')
        material_names.add(name.lower())
        if not isinstance(material.get('base_color'), list) or len(material['base_color']) != 4 or not all(_num(v) for v in material['base_color']):
            raise SceneBridgeError('Invalid base color RGBA')
        if material['base_color'][3] != 1.0:
            raise SceneBridgeError('Alpha materials require artist-approved bake; transparent import unsupported')
        if not _num(material.get('roughness')) or not _num(material.get('metallic')):
            raise SceneBridgeError('Invalid metallic/roughness factors')
        textures = material.get('textures', {})
        if not isinstance(textures, dict) or not set(textures).issubset(TEXTURE_CHANNELS):
            raise SceneBridgeError('Invalid texture channels')
        for channel, filename in textures.items():
            if not isinstance(filename, str) or filename not in seen:
                raise SceneBridgeError('Texture not present in file inventory: ' + str(filename))
            if next(e for e in files if e['path'] == filename)['role'] != 'texture':
                raise SceneBridgeError('Non-texture referenced by material')
    return obj, manifest_path


def make_plan(manifest_path, output):
    manifest, source_path = validate_manifest(manifest_path)
    dest = Path(output).expanduser().resolve()
    if dest == source_path.parent or dest.is_relative_to(source_path.parent):
        raise SceneBridgeError('Output must be outside the source asset directory')
    if dest.exists() and any(dest.iterdir()):
        raise SceneBridgeError('Output directory must be empty, to prevent overwrite')
    dest.mkdir(parents=True, exist_ok=True)
    plan = {
        'schema': SCHEMA,
        'scene': manifest['scene'],
        'manifest_absolute_path': str(source_path),
        'manifest_sha256': sha256(source_path),
        'destination': '/Game/Pryntor/SceneBridge/' + slug(manifest['scene']),
        'source_rights': manifest['provenance'],
        'geometry': next(e['path'] for e in manifest['files'] if e['role'] == 'geometry'),
        'materials': manifest['materials'],
        'files': manifest['files'],
        'status': 'PREFLIGHT_PASSED_ENGINE_IMPORT_UNVERIFIED',
    }
    body = json.dumps(plan, sort_keys=True, indent=2) + '\n'
    (dest / 'import-plan.json').write_text(body, encoding='utf-8')
    (dest / 'RUN_UNREAL.txt').write_text(
        'SCENEBRIDGE_JOB=' + str(dest / 'import-plan.json') + '\n'
        'Set the environment variable above on a machine with Unreal Editor 5 and run:\n'
        'UnrealEditor-Cmd <PROJECT>.uproject -ExecutePythonScript=<REPO>/scenebridge/unreal_import.py -unattended\n'
        'Review the importer report in the same output folder. Do not release without independent QA.\n', encoding='utf-8')
    return dest / 'import-plan.json'


def main(argv=None):
    parser = argparse.ArgumentParser(description='Pryntor SceneBridge offline scene preflight')
    sub = parser.add_subparsers(dest='command', required=True)
    check = sub.add_parser('validate', help='Validate scene material and provenance manifest')
    check.add_argument('manifest')
    plan = sub.add_parser('plan', help='Validate then generate an Unreal import job')
    plan.add_argument('manifest')
    plan.add_argument('--out', required=True)
    args = parser.parse_args(argv)
    try:
        if args.command == 'validate':
            manifest, _ = validate_manifest(args.manifest)
            print('PASS:', manifest['scene'])
        else:
            print('PLAN:', make_plan(args.manifest, args.out))
    except (SceneBridgeError, OSError) as exc:
        parser.exit(2, 'FAIL: ' + str(exc) + '\n')


if __name__ == '__main__':
    main()
