# FORGE Gallery Edition | v0.4 UX contract

**A design refresh on top of the v0.3 research engine.** It is not a new geometry solver, CAD implementation, manufacturing system or physically certified tool.

## Product direction

FORGE is a local-first, open-source spatial sketchpad that makes it easy to describe, manipulate, inspect and export **bounded scene envelopes**. The scene source stays independent of rendering, so users can export JSON, draft cadgen model source and Pascal handoff intent without proprietary lock-in.

## What shipped in this design branch

- Distinctive editorial visual system: expressive large-scale typography, warm-mineral dark palette, lime signature accent, cohesive compact tooling.
- Genuine graphic improvements in Canvas 2D: improved camera framing, gradient lit faces, cast shadows, frame hints on workbenches/tables, drawing hierarchy, floor grid and readable object labels.
- 3D / plan camera toggle, toggled object labels, camera fit control and pointer-based pinch zoom on touchscreens.
- One-tap scene switching for five existing source-validated templates; scene source and inspect controls stay unchanged.
- Native mobile hierarchy: canvas first, useful shortcuts in the canvas, export tools second, generation and research controls later.
- Desktop workspace with tools and inspector remains available, including accessible object selection, keyboard actions and role-status notices.
- No network requests, telemetry, external image assets, dependencies or paid APIs added.

## Comparative targets, not competitive victory claims

| Reference | Demonstrated strength | FORGE bar / remaining gap |
|---|---|---|
| [Spline](https://docs.spline.design/) | Interactive visual publishing, collaboration and scene materials | Match first-use delight. FORGE has neither real-time collaboration nor Spline-class materials/3D geometry. |
| [Shapr3D](https://support.shapr3d.com/) | Direct spatial editing and professional CAD interoperability | Achieve obvious selection, editing and reliable file round trips. FORGE remains simplified envelopes only. |
| [Autodesk Forma](https://blogs.autodesk.com/forma/) | Spatial decisions, contextual analytics and serious handoffs | Keep engineering claims evidence-linked. FORGE's research planner remains a static bounded 2D model. |

## Measurable release acceptance criteria

1. Never break scene creation, import, object edits, 2D audit, route planning or downloads.
2. Pass existing Node test suite and local browser interaction suite at 390, 1024 and 1512 viewport widths, with no console exceptions.
3. No horizontal page overflow at 390px. Canvas is visible before the settings on mobile.
4. Camera mode toggles change both pressed states and pixels. The frame button resets zoom; quick scenes use valid core scene templates.
5. Keep a genuine status warning about simplified geometry and non-certified outputs.
6. Release only after independent review and real-device acceptance. GitHub passing tests do not prove ranking above competitors.

## Next true differentiation experiments

- Real source round-trip to parametric CAD, geometric comparison to original scene, visible failures and uncertainty.
- Side-by-side alternate layout options with objective trade-offs rather than a single opaque suggestion.
- Reproducible sample scenes, contributor onboarding and public benchmark harnesses with evidence and limitations.
- User research with CAD makers, robotics students and accessibility testing, including touch-first workflows and undo/redo.

**Governance:** R0 unapproved spend, no copied competitor UI or trademark elements, no private Pryntor venture art/source, no auto-merge and no automatic public-production switch.
