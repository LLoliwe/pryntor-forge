"""Unreal Editor Python adapter, run ONLY in an authorised local UE5 Editor.

Requires the editor Python Scripting plugin and SCENEBRIDGE_JOB env var.
Fails closed if the destination already contains assets. Produces a local report.
"""
import hashlib
import json
import os
from pathlib import Path

import unreal


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as fh:
        for part in iter(lambda: fh.read(1048576), b''):
            h.update(part)
    return h.hexdigest()


def name(value):
    import re
    v = re.sub(r'[^A-Za-z0-9_]+', '_', value).strip('_')
    return (v if v and v[0].isalpha() else 'Asset_' + v)[:48]


def run():
    job_file = Path(os.environ['SCENEBRIDGE_JOB']).resolve(strict=True)
    job = json.loads(job_file.read_text(encoding='utf-8'))
    source_path = Path(job['manifest_absolute_path']).resolve(strict=True)
    if digest(source_path) != job['manifest_sha256']:
        raise RuntimeError('Source manifest changed after offline preflight')
    manifest = json.loads(source_path.read_text(encoding='utf-8'))
    if manifest['schema'] != 'pryntor.scenebridge/1' or manifest['scene'] != job['scene']:
        raise RuntimeError('Invalid job schema/scene')
    if manifest['files'] != job['files'] or manifest['materials'] != job['materials']:
        raise RuntimeError('Plan/source mismatch; run offline preflight again')
    if job['destination'] != '/Game/Pryntor/SceneBridge/' + name(job['scene']):
        raise RuntimeError('Unsafe destination namespace')
    root = source_path.parent
    for record in job['files']:
        if record not in manifest['files']:
            raise RuntimeError('Plan/source inventory differs')
        p = (root / record['path']).resolve(strict=True)
        if not p.is_relative_to(root) or digest(p) != record['sha256']:
            raise RuntimeError('Source asset changed: ' + record['path'])
    dest = job['destination']
    library = unreal.EditorAssetLibrary
    if library.does_directory_exist(dest) and library.list_assets(dest, recursive=True, include_folder=False):
        raise RuntimeError('Destination is not empty. Refusing to overwrite existing assets: ' + dest)
    library.make_directory(dest)
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    results = {'status': 'IMPORT_ATTEMPTED', 'imported': [], 'materials': [], 'unmatched_slots': []}

    def import_file(path, directory, new_name=None, options=None):
        task = unreal.AssetImportTask()
        task.filename = str(root / path)
        task.destination_path = directory
        if new_name:
            task.destination_name = new_name
        task.automated = True
        task.save = True
        task.replace_existing = False
        if options is not None:
            task.options = options
        asset_tools.import_asset_tasks([task])
        imported = [str(x) for x in task.imported_object_paths]
        if not imported:
            raise RuntimeError('Asset import returned no assets: ' + path)
        results['imported'].extend(imported)
        return imported

    texture_assets = {}
    for record in job['files']:
        if record['role'] != 'texture':
            continue
        p = record['path']
        unreal_name = 'T_' + name(Path(p).stem)
        imported = import_file(p, dest, unreal_name)
        texture = library.load_asset(imported[0])
        if not isinstance(texture, unreal.Texture):
            raise RuntimeError('Texture import produced the wrong asset type: ' + p)
        texture_assets[p] = texture

    graph = unreal.MaterialEditingLibrary
    material_assets = {}
    for material in job['materials']:
        asset_name = 'M_' + name(material['name'])
        new_material = asset_tools.create_asset(asset_name, dest, unreal.Material, unreal.MaterialFactoryNew())
        if not new_material:
            raise RuntimeError('Could not create material: ' + asset_name)
        channels = [('base_color', unreal.MaterialProperty.MP_BASE_COLOR),
                    ('metallic', unreal.MaterialProperty.MP_METALLIC),
                    ('roughness', unreal.MaterialProperty.MP_ROUGHNESS),
                    ('normal', unreal.MaterialProperty.MP_NORMAL)]
        for index, (channel, material_property) in enumerate(channels):
            p = material.get('textures', {}).get(channel)
            if p:
                texture = texture_assets[p]
                if channel in ('normal', 'metallic', 'roughness'):
                    texture.set_editor_property('srgb', False)
                    if channel == 'normal':
                        texture.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_NORMALMAP)
                    texture.post_edit_change()
                    library.save_loaded_asset(texture)
                expr = graph.create_material_expression(new_material, unreal.MaterialExpressionTextureSample, -440, 150 * index)
                expr.set_editor_property('texture', texture)
                output_pin = 'R' if channel in ('metallic', 'roughness') else 'RGB'
                graph.connect_material_property(expr, output_pin, material_property)
            elif channel != 'normal':
                if channel == 'base_color':
                    expr = graph.create_material_expression(new_material, unreal.MaterialExpressionConstant3Vector, -440, 150 * index)
                    c = material['base_color']
                    expr.set_editor_property('constant', unreal.LinearColor(c[0], c[1], c[2], c[3]))
                else:
                    expr = graph.create_material_expression(new_material, unreal.MaterialExpressionConstant, -440, 150 * index)
                    expr.set_editor_property('r', material[channel])
                graph.connect_material_property(expr, '', material_property)
        graph.recompile_material(new_material)
        library.save_loaded_asset(new_material)
        material_assets[name(material['name'])] = new_material
        results['materials'].append(asset_name)

    fbx = job['geometry']
    options = unreal.FbxImportUI()
    options.set_editor_property('import_mesh', True)
    options.set_editor_property('import_materials', False)
    options.set_editor_property('import_textures', False)
    geometry_assets = import_file(fbx, dest, options=options)
    slot_count = 0
    for asset_path in geometry_assets:
        mesh = library.load_asset(asset_path)
        if not isinstance(mesh, unreal.StaticMesh):
            continue
        for i, slot in enumerate(mesh.get_editor_property('static_materials')):
            slot_name = name(str(slot.get_editor_property('material_slot_name')))
            mat = material_assets.get(slot_name)
            if not mat:
                results['unmatched_slots'].append(str(slot_name))
                continue
            mesh.set_material(i, mat)
            slot_count += 1
        library.save_loaded_asset(mesh)
    results['assigned_material_slots'] = slot_count
    results['status'] = 'IMPORTED_REQUIRES_VISUAL_AND_GAMEPLAY_QA' if not results['unmatched_slots'] else 'PARTIAL_MATERIAL_ASSIGNMENT'
    (job_file.parent / 'unreal-import-report.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
    if results['unmatched_slots']:
        raise RuntimeError('Some material slots were not matched. See local import report.')
    unreal.log('SceneBridge import completed; independent visual review remains required')


if __name__ == '__main__':
    run()
