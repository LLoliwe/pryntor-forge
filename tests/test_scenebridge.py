import hashlib
import json
import py_compile
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scenebridge.core import SCHEMA, SceneBridgeError, main, make_plan, slug, validate_manifest


class SceneBridgeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'source'
        self.root.mkdir()
        (self.root / 'studio.fbx').write_bytes(b'FBX fixture, not a UE scene')
        (self.root / 'wall.png').write_bytes(b'PNG test fixture, not a render')
        self.manifest = {
            'schema': SCHEMA,
            'scene': 'TestOffice',
            'provenance': {'rights': 'original', 'authoring_tool': 'Blender'},
            'files': [
                {'path': n, 'role': role, 'sha256': hashlib.sha256((self.root / n).read_bytes()).hexdigest()}
                for n, role in [('studio.fbx', 'geometry'), ('wall.png', 'texture')]
            ],
            'materials': [{'name': 'Wall', 'base_color': [0.2, 0.3, 0.4, 1.0],
                           'metallic': 0, 'roughness': 0.7, 'textures': {'base_color': 'wall.png'}}],
        }
        self.path = self.root / 'manifest.json'
        self.save()

    def save(self):
        self.path.write_text(json.dumps(self.manifest), encoding='utf-8')

    def test_valid_manifest(self):
        manifest, path = validate_manifest(self.path)
        self.assertEqual('TestOffice', manifest['scene'])
        self.assertEqual(path, self.path)

    def test_plan_and_readme(self):
        dest = Path(self.tmp.name) / 'plan'
        generated = make_plan(self.path, dest)
        plan = json.loads(generated.read_text())
        self.assertEqual(plan['status'], 'PREFLIGHT_PASSED_ENGINE_IMPORT_UNVERIFIED')
        self.assertEqual(plan['destination'], '/Game/Pryntor/SceneBridge/TestOffice')
        self.assertEqual(plan['manifest_sha256'], hashlib.sha256(self.path.read_bytes()).hexdigest())
        self.assertIn('SCENEBRIDGE_JOB=', (dest / 'RUN_UNREAL.txt').read_text())

    def test_refuse_overwrite(self):
        dest = Path(self.tmp.name) / 'plan'
        make_plan(self.path, dest)
        with self.assertRaises(SceneBridgeError):
            make_plan(self.path, dest)

    def test_hash_tampering(self):
        (self.root / 'wall.png').write_bytes(b'tampered')
        with self.assertRaisesRegex(SceneBridgeError, 'Digest mismatch'):
            validate_manifest(self.path)

    def test_missing_asset(self):
        (self.root / 'studio.fbx').unlink()
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_traversal(self):
        self.manifest['files'][0]['path'] = '../studio.fbx'
        self.save()
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_absolute_asset_path(self):
        self.manifest['files'][0]['path'] = '/etc/passwd'
        self.save()
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_symlink(self):
        (self.root / 'studio.fbx').unlink()
        target = Path(self.tmp.name) / 'out.fbx'
        target.write_bytes(b'FBX fixture, not a UE scene')
        (self.root / 'studio.fbx').symlink_to(target)
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_unapproved_rights(self):
        self.manifest['provenance']['rights'] = 'unknown'
        self.save()
        with self.assertRaisesRegex(SceneBridgeError, 'rights'):
            validate_manifest(self.path)

    def test_licensed_requires_reference(self):
        self.manifest['provenance']['rights'] = 'licensed'
        self.save()
        with self.assertRaisesRegex(SceneBridgeError, 'license_reference'):
            validate_manifest(self.path)

    def test_texture_inventory(self):
        self.manifest['materials'][0]['textures']['normal'] = 'not-present.png'
        self.save()
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_material_name_collision(self):
        duplicated = dict(self.manifest['materials'][0])
        duplicated['name'] = 'Wall!'
        self.manifest['materials'].append(duplicated)
        self.save()
        with self.assertRaisesRegex(SceneBridgeError, 'Colliding'):
            validate_manifest(self.path)

    def test_transparency_rejected(self):
        self.manifest['materials'][0]['base_color'][3] = 0.6
        self.save()
        with self.assertRaisesRegex(SceneBridgeError, 'Alpha'):
            validate_manifest(self.path)

    def test_unsupported_emission_rejected(self):
        self.manifest['materials'][0]['textures']['emissive'] = 'wall.png'
        self.save()
        with self.assertRaisesRegex(SceneBridgeError, 'channels'):
            validate_manifest(self.path)

    def test_material_factor_range(self):
        self.manifest['materials'][0]['roughness'] = 2.0
        self.save()
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_extra_geometry(self):
        self.manifest['files'].append(self.manifest['files'][0].copy())
        self.save()
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_fbx_required(self):
        self.manifest['files'][0]['role'] = 'texture'
        self.save()
        with self.assertRaises(SceneBridgeError):
            validate_manifest(self.path)

    def test_empty_output_sibling_only(self):
        with self.assertRaises(SceneBridgeError):
            make_plan(self.path, self.root / 'output')

    def test_slug(self):
        self.assertEqual(slug('Room 12 / Study'), 'Room_12_Study')

    def test_compiles_blender_and_unreal_adapters(self):
        folder = Path(__file__).resolve().parents[1] / 'scenebridge'
        for filename in ('blender_export.py', 'ci_blender_smoke.py', 'unreal_import.py'):
            py_compile.compile(str(folder / filename), doraise=True)


if __name__ == '__main__':
    unittest.main()
