import React,{useRef,useEffect} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {OrbitControls,ContactShadows,RoundedBox} from '@react-three/drei'
import {EffectComposer,Bloom,Vignette} from '@react-three/postprocessing'
function Box({at,size,color,metal=0,rough=.7}){return <mesh position={at} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metal} roughness={rough}/></mesh>}
function Rod({at,size,material}){return <Box at={at} size={size} color={material} metal={.7} rough={.35}/>}
function Seat({x,z,angle,theme}){return <group position={[x,0,z]} rotation={[0,angle,0]}>
  <RoundedBox args={[1,.28,1]} position={[0,.78,0]} radius={.1} smoothness={3} castShadow><meshStandardMaterial color={theme.color} roughness={.87}/></RoundedBox>
  <RoundedBox args={[1,1,.2]} position={[0,1.3,-.36]} radius={.08} smoothness={3} castShadow><meshStandardMaterial color={theme.color} roughness={.82}/></RoundedBox>
  {[-.38,.38].flatMap(x=>[-.35,.35].map(z=><Rod key={x+'_'+z} at={[x,.36,z]} size={[.06,.7,.06]} material="#2d2b28"/>))}
</group>}
function Lamp({x,z,theme}){return <group position={[x,3.25,z]}>
  <Rod at={[0,-.18,0]} size={[.02,.7,.02]} material="#302b25"/>
  <mesh position={[0,-.6,0]} castShadow><cylinderGeometry args={[.46,.26,.53,36]}/><meshStandardMaterial color={theme.metal} metalness={.75} roughness={.29} side={2}/></mesh>
  <mesh position={[0,-.88,0]}><sphereGeometry args={[.11,18,16]}/><meshStandardMaterial emissive="#ffd0a0" emissiveIntensity={theme.light} color="#ffecbf"/></mesh>
  <pointLight position={[0,-.85,0]} color="#ffce87" intensity={theme.light} distance={5} decay={2}/>
</group>}
function Room({theme}){return <group>
  <Box at={[0,-.17,0]} size={[9,.34,7.2]} color="#aaa296"/>
  <Box at={[0,.01,0]} size={[8.88,.03,7]} color="#b7a591"/>
  {Array.from({length:12},(_,i)=><Box key={i} at={[-4.1+.7*i,.034,0]} size={[.009,.006,6.8]} color="#817567"/>)}
  <Box at={[-4.48,1.75,0]} size={[.19,3.5,7.12]} color="#b7a99a"/>
  <Box at={[0,1.75,-3.49]} size={[9,3.5,.19]} color="#b3a493"/>
  {[-3.1,-1.05,1,3.15].map((x,i)=><group key={i}><Box at={[x,1.84,-3.28]} size={[.18,3.38,.27]} color="#d2beab"/><Box at={[x,3.5,-3.27]} size={[.24,.23,.31]} color="#76695f"/></group>)}
  {[0,1,2].map(i=><group key={i}><Box at={[-4.32,2.3,-2.5+i*2.05]} size={[.025,1.8,1.45]} color="#363733"/><Box at={[-4.3,2.32,-2.5+i*2.05]} size={[.02,1.65,1.27]} color="#8eaaa9" metal={.2} rough={.15}/></group>)}
  <Box at={[0,.038,.3]} size={[4.6,.02,3.3]} color="#a38e7d"/><Box at={[0,.052,.3]} size={[4.38,.008,3.08]} color="#c9b6a0"/>
  <Box at={[0,1.06,-.24]} size={[2.9,.16,1.4]} color="#3e3430" rough={.35}/>
  {[-1.18,1.18].flatMap(x=>[-.76,.28].map(z=><Rod key={x+'_'+z} at={[x,.52,z]} size={[.1,.92,.1]} material="#33312e"/>))}
  <Seat x={-1.8} z={1.5} angle={-.28} theme={theme}/><Seat x={1.65} z={1.55} angle={.35} theme={theme}/>
  <Lamp x={-1.2} z={-.1} theme={theme}/><Lamp x={1.05} z={-.2} theme={theme}/>
  <Box at={[-.5,1.16,-.18]} size={[.7,.08,.48]} color="#d3c4a9"/><Box at={[-.5,1.26,-.18]} size={[.7,.06,.48]} color="#7d6450"/>
  <Box at={[3.0,.55,-1.8]} size={[1.75,.08,.72]} color="#493a31"/>
  {[-.75,.75].map(x=><Rod key={x} at={[3+x,.27,-1.8]} size={[.07,.53,.6]} material="#36332d"/>)}
  <mesh castShadow position={[3,.96,-1.8]} rotation={[.2,.1,0]}><torusGeometry args={[.36,.11,16,46]}/><meshStandardMaterial color={theme.metal} metalness={.83} roughness={.24}/></mesh>
  <Box at={[1.8,1.8,-3.28]} size={[1.1,1.4,.06]} color="#393a35"/><Box at={[1.8,1.8,-3.23]} size={[.84,1.13,.015]} color={theme.color}/>
  <mesh position={[-3,.65,2.2]} castShadow><dodecahedronGeometry args={[.55,1]}/><meshStandardMaterial color="#788b79" roughness={.84}/></mesh>
  <mesh position={[-3,1.45,2.2]} castShadow><icosahedronGeometry args={[.32,1]}/><meshStandardMaterial color="#d9b78a" metalness={.4} roughness={.46}/></mesh>
  <ContactShadows position={[0,.048,0]} opacity={.32} scale={10} blur={2.3} far={3}/>
</group>}
function CameraDirector({take,playing,controls}){const {camera}=useThree();const elapsed=useRef(0)
  useEffect(()=>{elapsed.current=0},[take])
  useFrame((_,dt)=>{if(!playing||elapsed.current>=5)return
    elapsed.current=Math.min(5,elapsed.current+dt);let k=1-Math.pow(1-elapsed.current/5,3)
    camera.position.set(7.8-1.15*k,5.35-.95*k,10.3-1.18*k)
    controls.current?.target.set(0,1.2,0);controls.current?.update()
  });return null}
export function Stage({theme,take,playing}){const controls=useRef();return <>
  <color attach="background" args={['#bab0a5']}/><fog attach="fog" args={['#bab0a5',10,23]}/>
  <ambientLight intensity={.65} color="#ffefe0"/><hemisphereLight args={['#fff2d9','#736b64',1.1]}/>
  <directionalLight position={[4,8,6]} intensity={2.6} color="#fff4dc" castShadow shadow-mapSize={[2048,2048]} shadow-bias={-.00016}/>
  <spotLight position={[-3,7,4]} angle={.54} penumbra={.85} intensity={38} color={theme.metal} distance={12}/>
  <Room theme={theme}/>
  <OrbitControls ref={controls} enableDamping dampingFactor={.055} minDistance={5} maxDistance={16} minPolarAngle={.33} maxPolarAngle={1.5} target={[0,1.2,0]}/>
  <CameraDirector take={take} playing={playing} controls={controls}/>
  <EffectComposer multisampling={0}><Bloom intensity={.23} luminanceThreshold={2.1} mipmapBlur/><Vignette offset={.13} darkness={.22}/></EffectComposer>
</>}
