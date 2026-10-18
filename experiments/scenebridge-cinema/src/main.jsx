import React, {useState,useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {Canvas} from '@react-three/fiber'
import {SmoothScrollbar} from '@14islands/r3f-scroll-rig/scrollbar'
import {getProject} from '@theatre/core'
import {Stage} from './stage.jsx'
import './style.css'
const moods = [
  {name:'TUNGSTEN',color:'#b87642',metal:'#dbbd84',light:2.9},
  {name:'BLUE HOUR',color:'#476c77',metal:'#9baeb2',light:2.2},
  {name:'ATELIER',color:'#aaa090',metal:'#d4c3ae',light:3.6}
]
const sheet = getProject('SceneBridge Cinema R1').sheet('Opening')
function canRender(){try{let c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch{return false}}
function save(obj){let u=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));let a=document.createElement('a');a.href=u;a.download='scenebridge-study.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function App(){
  const [mood,setMood]=useState(0),[take,setTake]=useState(0),[playing,setPlaying]=useState(true)
  const [webgl]=useState(canRender),[reduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(()=>{sheet.project.ready.then(()=>{if(!reduced)sheet.sequence.play({iterationCount:1,range:[0,1]}).catch(()=>{})}).catch(()=>{})},[take,reduced])
  return <div className="site">
    {!reduced&&<SmoothScrollbar enabled disablePointerOnScroll={false}/>}
    <header><a href="#home" className="brand"><b>SB.</b><span>SCENEBRIDGE<small>BY PRYNTOR FORGE</small></span></a><a href="#method" className="nav">OUR PROCESS ↗</a></header>
    <main id="home">
      <section className="intro">
        <div className="eyebrow"><i/> INDEPENDENT PRODUCTION STUDY <span>VOL. 001 / 2026</span></div>
        <div className="heading"><div><h1>Make worlds<br/><em>real.</em></h1><p>Beyond the image. Into the scene. Original geometry, material studies and an art-directed real-time room.</p></div><aside>01<small>THE MATERIAL ROOM</small></aside></div>
        <div className="frame">
          <div className="frame-top"><span>SCENE 001 / ORIGINAL GEOMETRY</span><span>LIVE THREE-DIMENSIONAL STUDY</span></div>
          <div className="viewport" aria-label="Interactive scene with orbit and zoom">
            {webgl?<Canvas shadows dpr={[1,1.8]} camera={{position:[7,5,9],fov:35}} gl={{antialias:true,alpha:false}}><Stage theme={moods[mood]} take={take} playing={playing&&!reduced}/></Canvas>:<div className="fallback"><strong>SCENE / 001</strong><p>WebGL unavailable. Explore the production notes below.</p></div>}
            <div className="scene-mark">PRYNTOR FORGE <span>ROOM 001 / CINEMA R1</span></div>
            <div className="scene-buttons"><button type="button" onClick={()=>{setTake(x=>x+1);setPlaying(true)}}>↻ REPLAY</button><button type="button" onClick={()=>setPlaying(!playing)}>{playing?'Ⅱ PAUSE':'▷ PLAY'}</button></div>
          </div>
          <div className="frame-bottom"><span>Drag to orbit. Scroll to zoom. Built in real time.</span><span>NO PRE-RENDERED FOOTAGE</span></div>
        </div>
        <div className="controls"><div><small>01 / MOOD & MATERIAL</small><div className="moods">{moods.map((m,i)=><button key={m.name} aria-pressed={i===mood} onClick={()=>setMood(i)}><i style={{background:m.color}}/>{m.name}</button>)}</div></div><div><small>02 / SOURCE EVIDENCE</small><button className="save" onClick={()=>save({schema:'pryntor.scenebridge.cinema/1',scene:'The Material Room',mood:moods[mood].name,assets:'original procedural',blender_to_unreal:'NOT VERIFIED',browser3d:'WEBGL'})}>EXPORT STUDY ↗</button></div></div>
      </section>
      <section id="method" className="statement"><small>THE METHOD / WHY WE BUILD</small><div className="statement-layout"><h2>Less friction.<br/><em>More world.</em></h2><div><p>We believe artists should preserve intent as scenes move between tools. The materials, lighting and interaction deserve the same care as the first sketch.</p><p>This browser pilot is real-time Three.js. Native Blender to Unreal conversion remains a separate verification gate.</p><a href="https://github.com/LLoliwe/pryntor-forge" target="_blank" rel="noreferrer">EXPLORE THE ORIGINAL SOURCE ↗</a></div></div></section>
      <section className="steps">{[['01','DESIGN','Shapes, composition and original worlds.'],['02','DIRECT','A deliberate camera, not automatic movement.'],['03','VERIFY','Provenance, tests and independent release gates.']].map(x=><article key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><p>{x[2]}</p></article>)}</section>
    </main><footer><span>PRYNTOR / FORGE</span><span>SCENEBRIDGE CINEMA R1, EXPERIMENTAL ONLY</span></footer>
  </div>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
