// Synthetic input supplied verbatim to Kimi, not existing ZOWIBO game source.
export function createDragState(){let active=false;let id=null;let x=0;return {down(e){active=true;id=e.pointerId;x=e.clientX},move(e){if(active)x=e.clientX},up(e){active=false;id=null},snapshot(){return {active,id,x}}}}
