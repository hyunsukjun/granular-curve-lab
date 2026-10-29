import {createSourceLoadGate} from "../src/default-source.js";
import {readAudioFile,validateAudioBuffer} from "../src/audio-import.js";
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const pick=name=>{const start=source.search(new RegExp(`(?:async )?function ${name}\\(`));assert.ok(start>=0);return source.slice(start,source.indexOf('\n}',start)+2)};
const revoked=[],messages=[],busy=[];
let resolveDecode,rejectDecode;
const c={validateAudioBuffer,sourceFileLabel:"previous.wav",readAudioFile,audioContext:{sampleRate:48000},buffer:{duration:1},downloadUrl:'blob:previous',isPlaying:true,playheadSeconds:1,playButton:{textContent:'Playing'},fileStatus:{textContent:''},readouts:{download:{textContent:''}},
 node:{port:{postMessage:m=>messages.push(m)}},URL:{revokeObjectURL:u=>revoked.push(u)},nextPlaybackToken:()=>7,draw(){},
 setBusy:x=>busy.push(x),ensureAudioContext:async()=>{},decodeAudioFile:()=>new Promise((resolve,reject)=>{resolveDecode=resolve;rejectDecode=reject}),
 buildWaveform(){},resetSourceWindowToMinimum(){},sendBufferToWorklet(){},sendSettings(){},console:{error(){}}};
// Export status moved into a UI helper; preserve the fixture readout contract.
 c.setExportStatus = message => { c.readouts.download.textContent = message; };
 c.sourceLoadGate = createSourceLoadGate();
 vm.createContext(c);vm.runInContext(['clearDownload','stopAudio','loadAudioFile'].map(pick).join('\n'),c);
const file={name:'replacement.wav',slice:()=>new Blob([new ArrayBuffer(8)]),arrayBuffer:async()=>new ArrayBuffer(8)};
await c.loadAudioFile(null);assert.equal(c.isPlaying,true);assert.equal(c.downloadUrl,'blob:previous');
const pending=c.loadAudioFile(file);await new Promise(r=>setImmediate(r));
assert.equal(c.isPlaying,false,'replacement must stop previous playback before decode');assert.equal(c.playheadSeconds,0);
assert.equal(messages.at(-1).type,'stop');assert.equal(c.downloadUrl,'blob:previous');assert.deepEqual(revoked,[]);
const previous=c.buffer;rejectDecode(new Error('bad WAV'));await pending;assert.equal(c.buffer,previous);assert.deepEqual(busy,[true,false]);assert.equal(c.readouts.download.textContent,'');
const next=c.loadAudioFile(file);await new Promise(r=>setImmediate(r));const decoded={duration:8,length:384000,sampleRate:48000,numberOfChannels:2,getChannelData:()=>new Float32Array(384000),copyFromChannel:out=>out.fill(0)};resolveDecode(decoded);await next;
assert.equal(c.buffer,decoded);assert.equal(c.readouts.download.textContent,'ready');assert.equal(c.isPlaying,false);assert.deepEqual(revoked,['blob:previous']);
console.log('PASS: chooser cancellation preserves source; replacement stops playback, retains old source/WAV on rejection and commits a valid retry');
