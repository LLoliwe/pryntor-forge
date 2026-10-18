"""Deterministic fully original mesh-material room, for real Blender CI export only."""
import argparse
import sys
from pathlib import Path

import bpy

from scenebridge.blender_export import run


def colored_material(name, rgb, metal=0.0, rough=0.6):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (*rgb, 1.0)
    shader.inputs['Metallic'].default_value = metal
    shader.inputs['Roughness'].default_value = rough
    return mat


def cube(name, loc, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    floor = colored_material('SlateFloor', (0.18, 0.22, 0.25), rough=0.83)
    paint = colored_material('WarmWhite', (0.79, 0.72, 0.60), rough=0.72)
    wood = colored_material('DeskWood', (0.30, 0.14, 0.07), rough=0.53)
    metal = colored_material('Steel', (0.25, 0.28, 0.30), metal=0.75, rough=0.37)
    cube('Floor', (0, 0, -0.12), (5.0, 4.0, 0.24), floor)
    cube('RearWall', (0, 2, 1.4), (5.0, 0.16, 2.8), paint)
    cube('DeskTop', (0, -0.5, 0.76), (1.6, 0.75, 0.1), wood)
    for x in (-0.68, 0.68):
        for y in (-0.75, -0.25):
            cube('DeskLeg', (x, y, 0.36), (0.07, 0.07, 0.72), metal)
    run(['--out', str(Path(args.out).resolve()), '--scene', 'OriginalOfficeCI', '--rights', 'original'])


if __name__ == '__main__':
    main()
