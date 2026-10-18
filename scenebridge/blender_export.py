"""Blender-host-only exporter. Invoke using Blender's --python command.

Exports only simple Principled BSDF PBR inputs. Complex node graphs must be baked
by an artist first, with cleared rights. Never calls a paid or remote service.
"""
import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

import bpy


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as fh:
        for part in iter(lambda: fh.read(1048576), b''):
            h.update(part)
    return h.hexdigest()


def safe_name(value):
    result = re.sub(r'[^A-Za-z0-9_]+', '_', value).strip('_')
    return (result if result and result[0].isalpha() else 'Asset_' + result)[:48]


def input_image(shader_input, normal=False):
    if not shader_input.is_linked:
        return None
    node = shader_input.links[0].from_node
    if normal:
        if node.type != 'NORMAL_MAP' or not node.inputs['Color'].is_linked:
            raise ValueError('Normal must use a Normal Map node connected to an Image Texture')
        node = node.inputs['Color'].links[0].from_node
    if node.type != 'TEX_IMAGE' or not node.image or node.image.source != 'FILE':
        raise ValueError('Only direct file Image Texture nodes supported; bake complex shaders first')
    return node.image


def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True)
    parser.add_argument('--scene', required=True)
    parser.add_argument('--rights', choices=['original', 'cc0', 'licensed'], required=True)
    parser.add_argument('--license-reference', default='')
    args = parser.parse_args(argv)
    if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,47}', args.scene):
        parser.error('Scene ID must be 1-48 portable letters, digits, hyphen or underscore')
    if args.rights == 'licensed' and not args.license_reference.strip():
        parser.error('Licensed source requires license reference')
    out = Path(args.out).expanduser().resolve()
    if out.exists() and any(out.iterdir()):
        parser.error('Use an empty output folder; no destructive overwrites')
    out.mkdir(parents=True, exist_ok=True)
    texture_root = out / 'textures'
    texture_root.mkdir()
    used_materials = {}
    for ob in bpy.context.scene.objects:
        if ob.type == 'MESH':
            for slot in ob.material_slots:
                if slot.material:
                    used_materials[slot.material.name] = slot.material
    if not used_materials:
        parser.error('No mesh materials in current scene')
    files, materials, copied = [], [], {}
    for name, mat in sorted(used_materials.items()):
        if not mat.use_nodes or not mat.node_tree:
            raise ValueError(name + ': material must use a Principled BSDF')
        output = next((n for n in mat.node_tree.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output), None)
        if not output or not output.inputs['Surface'].is_linked:
            raise ValueError(name + ': missing active surface output')
        shader = output.inputs['Surface'].links[0].from_node
        if shader.type != 'BSDF_PRINCIPLED':
            raise ValueError(name + ': unsupported shader output, bake first')
        alpha = shader.inputs.get('Alpha')
        if alpha and (alpha.is_linked or float(alpha.default_value) != 1.0):
            raise ValueError(name + ': alpha/translucency requires a separate approved bake')
        strength = shader.inputs.get('Emission Strength')
        if strength and (strength.is_linked or float(strength.default_value) != 0.0):
            raise ValueError(name + ': emission is not yet supported')
        entry = {
            'name': name,
            'base_color': [float(n) for n in shader.inputs['Base Color'].default_value],
            'metallic': float(shader.inputs['Metallic'].default_value),
            'roughness': float(shader.inputs['Roughness'].default_value),
            'textures': {},
        }
        for channel, socket, normal in [
            ('base_color', 'Base Color', False), ('metallic', 'Metallic', False),
            ('roughness', 'Roughness', False), ('normal', 'Normal', True),
        ]:
            picture = input_image(shader.inputs[socket], normal=normal)
            if picture is None:
                continue
            source = Path(bpy.path.abspath(picture.filepath, library=picture.library)).resolve()
            if not source.is_file():
                raise ValueError(name + ': missing texture; unpack packed images first: ' + picture.name)
            if source.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.tga', '.exr'}:
                raise ValueError('Unsupported image format: ' + source.suffix)
            key = str(source)
            if key not in copied:
                dest = texture_root / (safe_name(source.stem) + '_' + digest(source)[:12] + source.suffix.lower())
                shutil.copyfile(source, dest)
                copied[key] = dest.relative_to(out).as_posix()
                files.append({'path': copied[key], 'sha256': digest(dest), 'role': 'texture'})
            entry['textures'][channel] = copied[key]
        materials.append(entry)
    fbx = out / (args.scene + '.fbx')
    bpy.ops.export_scene.fbx(filepath=str(fbx), use_selection=False,
                             path_mode='STRIP', embed_textures=False, apply_unit_scale=True)
    if not fbx.is_file() or not fbx.stat().st_size:
        raise RuntimeError('Blender FBX export did not produce a geometry file')
    files.insert(0, {'path': fbx.name, 'sha256': digest(fbx), 'role': 'geometry'})
    manifest = {
        'schema': 'pryntor.scenebridge/1', 'scene': args.scene,
        'provenance': {'rights': args.rights,
                       'license_reference': args.license_reference if args.rights == 'licensed' else '',
                       'authoring_tool': 'Blender', 'blender_version': bpy.app.version_string},
        'files': files, 'materials': materials,
    }
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print('SceneBridge Blender export:', out / 'manifest.json')


if __name__ == '__main__':
    cli_args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    run(cli_args)
