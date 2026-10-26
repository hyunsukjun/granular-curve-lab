import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const extract=name=>{const start=source.indexOf(`function ${name}(`);assert(start>=0);return source.slice(start,source.indexOf('\n}',start)+2)};
const node=()=>({textContent:'',hidden:false,value:''});
const readouts=Object.fromEntries(['mode','points','engine','position','spread','size','density','pitch'].map(k=>[k,node()]));
const context={buffer:null,sourceWindow:Object.freeze({start:0,end:.005}),sourceWindowReadout:node(),sourceCanvas:{},readouts,
 current:Object.freeze({position:.25,spread:.3,sizeMs:25,density:16,pitchLow:-3,pitchHigh:7}),
 settings:()=>({maxPreviewGrains:64,durationSeconds:20}),curveLabels:{position:'Read Position'},activeCurve:'position',curves:{position:[{x:0,y:.5},{x:1,y:.5}]},
 formatSourcePercent:x=>(x*100).toFixed(2),formatClock:x=>String(x),timeStatus:node(),playheadSeconds:5.25,isScrubbing:false,playbackScrubber:node(),
 seek(){throw Error('display must not seek')},sendSettings(){throw Error('display must not change settings')}};
vm.createContext(context);vm.runInContext(extract('sourceWindowRangeText')+'\n'+extract('updateReadouts'),context);
context.updateReadouts();assert.equal(context.sourceWindowReadout.hidden,true);assert.equal(context.sourceWindowReadout.textContent,'');
for(const [duration,start,end,expected] of [[8,0,.005,'Source window · 0.000–0.040 s · Length 0.040 s'],[8,.25,.75,'Source window · 2.000–6.000 s · Length 4.000 s'],[300,.99667,1,'Source window · 299.001–300.000 s · Length 0.999 s']]){
 context.buffer=Object.freeze({duration});context.sourceWindow=Object.freeze({start,end});context.updateReadouts();
 assert.equal(context.sourceWindowReadout.hidden,false);assert.equal(context.sourceWindowReadout.textContent,expected);
 assert.equal(readouts.position.textContent,'25% in window','Preview snapshot is not replaced with playhead/selection targets');
 assert.equal(readouts.size.textContent,'25 ms');assert.equal(readouts.pitch.textContent,'-3.0–7.0 st');
 assert.equal(context.playheadSeconds,5.25);assert.equal(context.playbackScrubber.value,String(5.25/20));
 assert.deepEqual(context.sourceWindow,{start,end});
}
console.log('PASS source window readout: no-file, minimum/full-edge ranges, source seconds, immutable bounds, unchanged Preview snapshot and output seek state');
