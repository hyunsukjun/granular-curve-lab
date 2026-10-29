import {PlaybackBoundary} from "../src/playback-boundary.js";
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {renderGranular} from '../src/offline-render.js';
import {curveDefaults} from '../src/granular-core.js';
let sr;const flat=y=>[{x:0,y},{x:1,y}];
const rows=[];
for (sr of [44100,48000,96000]) for (const outputRate of [44100,48000,96000]) for(const semitone of [-24,0,12,24]) for(const window of [[0,.005],[.1,.105],[.995,1],[.3,.3+1/sr]]) {
let Processor;
new Function('PlaybackBoundary','sampleRate','AudioWorkletProcessor','registerProcessor',readFileSync(new URL('../src/granular-worklet.js',import.meta.url),'utf8').replace(/^import .*$/gm,''))(PlaybackBoundary,outputRate,class{constructor(){this.port={postMessage(){}}}},(_,p)=>Processor=p);
 const curves=Object.fromEntries(Object.entries(curveDefaults).map(([k,v])=>[k,flat(v)]));
 curves.pitchLow=curves.pitchHigh=flat((semitone+24)/48);curves.spread=flat(0);curves.size=flat(1);curves.density=flat(0);
 const settings={durationSeconds:1,rangeStart:window[0],rangeEnd:window[1],envelope:'hann',format:'stereo',maxPreviewGrains:64,outputGain:.92};
 const signals=[new Float32Array(sr),Float32Array.from({length:sr},(_,i)=>i<Math.ceil(window[0]*sr)||i>=Math.ceil(window[1]*sr)?.25:0)]; // Only samples outside the selected window differ.
 const previews=[],renders=[];
 for(const mono of signals){
  const p=new Processor();for(const data of [{type:'buffer',mono,sampleRate:sr},{type:'curves',curves},{type:'settings',settings},{type:'play',token:1}])p.port.onmessage({data});
  const out=[new Float32Array(1024),new Float32Array(1024)];p.process([],[out]);previews.push(out.flatMap(c=>Array.from(c)));
  const r=await renderGranular({audioBuffer:{sampleRate:sr,duration:1,getChannelData:()=>mono},curves,settings});renders.push(new Uint8Array(await r.blob.arrayBuffer()));
 }
 const maxPreviewDifference=Math.max(...previews[0].map((v,i)=>Math.abs(v-previews[1][i])));
 const renderBytesDiffer=renders[0].some((v,i)=>v!==renders[1][i]);
 rows.push({sr,outputRate,window,semitone,maxPreviewDifference,renderBytesDiffer});
 assert.equal(maxPreviewDifference,0,JSON.stringify(rows.at(-1)));assert.equal(renderBytesDiffer,false,JSON.stringify(rows.at(-1)));
}
console.log('PASS selected-window isolation:',rows.length,'rate/pitch/window cases, Preview + 48k WAV');
await assert.rejects(renderGranular({audioBuffer:{sampleRate:48000,duration:1,getChannelData:()=>new Float32Array(48000)},curves:{},settings:{durationSeconds:0}}),RangeError);
console.log('PASS zero-duration render rejected');
// Non-vacuous check: selected audio remains audible and stereo input channel 0 is unchanged.
{
 const flat=y=>[{x:0,y},{x:1,y}],curves=Object.fromEntries(Object.entries(curveDefaults).map(([k,v])=>[k,flat(v)]));
 const source=Float32Array.from({length:48000},()=>.2);
 const result=await renderGranular({audioBuffer:{sampleRate:48000,duration:1,getChannelData:()=>source},curves,settings:{durationSeconds:1,rangeStart:.1,rangeEnd:.105,format:'octo',envelope:'hann'}});
 const bytes=new Uint8Array(await result.blob.arrayBuffer()),view=new DataView(bytes.buffer);
 assert.equal(view.getUint16(22,true),8);assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint16(34,true),24);assert.equal(view.getUint32(40,true),48000*8*3);
 let peak=0;for(let i=44;i<bytes.length;i+=3){let n=bytes[i]|bytes[i+1]<<8|bytes[i+2]<<16;if(n&0x800000)n-=0x1000000;peak=Math.max(peak,Math.abs(n)/8388608);}assert(peak>.01);assert(peak<1);
 assert(source.every(v=>v===Math.fround(.2)));console.log('PASS nonzero selected PCM / 8ch 48k 24bit 1s / source unchanged');
}

// Empty windows must remain finite and silent even if all source samples are nonzero.
{
 let Processor;new Function('PlaybackBoundary','sampleRate','AudioWorkletProcessor','registerProcessor',readFileSync(new URL('../src/granular-worklet.js',import.meta.url),'utf8').replace(/^import .*$/gm,''))(PlaybackBoundary,48000,class{constructor(){this.port={postMessage(){}}}},(_,p)=>Processor=p);
 const p=new Processor(),curves=Object.fromEntries(Object.entries(curveDefaults).map(([k,v])=>[k,flat(v)]));
 for(const data of [{type:'buffer',mono:new Float32Array(48000).fill(.5),sampleRate:48000},{type:'curves',curves},{type:'settings',settings:{durationSeconds:1,rangeStart:.5,rangeEnd:.5}},{type:'play'}])p.port.onmessage({data});
 const out=[new Float32Array(1024),new Float32Array(1024)];p.process([],[out]);assert(out.every(c=>c.every(v=>v===0)));console.log('PASS empty-window finite silence');
}
