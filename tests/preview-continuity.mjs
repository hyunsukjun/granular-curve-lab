import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const current=readFileSync(new URL('../src/granular-worklet.js',import.meta.url),'utf8');
// Immutable release baseline, retained for regression comparisons after this commit.
const baseline=execFileSync('git',['show','e89a71976b8bf5638bd410f25d844ea61133cd9d:src/granular-worklet.js'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
const flat=y=>[{x:0,y},{x:1,y}];
function run(code,sr,size,density,{dc=false,limitChange=false,pitch=0,narrow=false}={}){
 let Processor;new Function('sampleRate','AudioWorkletProcessor','registerProcessor',code)(sr,class{constructor(){this.port={postMessage(){}}}},(_,c)=>Processor=c);
 const p=new Processor(),send=data=>p.port.onmessage({data});
 send({type:'buffer',mono:Float32Array.from({length:sr*2},(_,i)=>dc?.25:.25*Math.sin(2*Math.PI*55*i/sr+.37)),sampleRate:sr});
 send({type:'curves',curves:{position:flat(.5),spread:flat(0),size:flat(Math.log(size/5)/Math.log(200)),density:flat(Math.log(density)/Math.log(80)),pitchLow:flat((pitch+24)/48),pitchHigh:flat((pitch+24)/48)}});
 send({type:'settings',settings:{durationSeconds:3,maxPreviewGrains:limitChange?64:density*size>2600?32:64,rangeStart:0,rangeEnd:narrow?1/(sr*2):1}});send({type:'play'});
 let jump=0,peak=0,maxVoices=0,maxNormal=0,previous=[0,0],tails=0;
 for(let frame=0;frame<sr*2;frame+=128){
  if(limitChange&&frame>=sr*.8)p.settings.maxPreviewGrains=32;
  const n=Math.min(128,sr*2-frame),channels=[new Float32Array(n),new Float32Array(n)];p.process([],[channels]);
  maxVoices=Math.max(maxVoices,p.grains.length);maxNormal=Math.max(maxNormal,p.grains.filter(g=>g.releaseAge==null).length);
  tails+=p.grains.filter(g=>g.releaseAge!=null).length;
  for(let i=0;i<n;i++)for(let ch=0;ch<2;ch++){const x=channels[ch][i];assert(Number.isFinite(x));assert(Math.abs(x)<.892);peak=Math.max(peak,Math.abs(x));if(frame+i>=sr*.5)jump=Math.max(jump,Math.abs(x-previous[ch]));previous[ch]=x;}
 }
 send({type:'stop',reset:true});const out=[new Float32Array(128),new Float32Array(128)];p.process([],[out]);assert(out.every(c=>c.every(x=>x===0)));
 send({type:'seek',seconds:0});send({type:'play'});p.process([],[out]);assert(out.every(c=>c.every(Number.isFinite)));
 return {jump,peak,maxVoices,maxNormal,tails};
}
for(const sr of [44100,48000,96000])for(const [size,density] of [[80,40],[500,80]]){
 const old=run(baseline,sr,size,density),next=run(current,sr,size,density);
 assert(next.jump<old.jump*.25,JSON.stringify({sr,size,old,next}));
 assert(next.maxVoices<=33);assert(next.maxNormal<=32);
 if(size===500)assert(next.tails>0);
 console.log(JSON.stringify({sr,size,density,old,next}));
}
for(const sr of [44100,48000,96000]){
 const stress=run(current,sr,1000,80,{dc:true,limitChange:true});assert(stress.maxVoices<=65);
 run(current,sr,1000,80,{pitch:24,narrow:true});
}
console.log('PASS: continuity reduction, bounded tails, finite/headroom, 64→32 transition, narrow window, stop/restart; no WAV or playback.');
