import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const pick=name=>{const start=source.search(new RegExp(`(?:async )?function ${name}\\(`));assert.ok(start>=0);return source.slice(start,source.indexOf('\n}',start)+2)};
const revoked=[],messages=[],busy=[];
let resolveDecode,rejectDecode;
const c={buffer:{duration:1},downloadUrl:'blob:previous',isPlaying:true,playheadSeconds:1,playButton:{textContent:'Playing'},fileStatus:{textContent:''},readouts:{download:{textContent:''}},
 node:{port:{postMessage:m=>messages.push(m)}},URL:{revokeObjectURL:u=>revoked.push(u)},nextPlaybackToken:()=>7,draw(){},
 setBusy:x=>busy.push(x),ensureAudioContext:async()=>{},decodeAudioFile:()=>new Promise((resolve,reject)=>{resolveDecode=resolve;rejectDecode=reject}),
 buildWaveform(){},resetSourceWindowToMinimum(){},sendBufferToWorklet(){},sendSettings(){},console:{error(){}}};
vm.createContext(c);vm.runInContext(['clearDownload','stopAudio','loadAudioFile'].map(pick).join('\n'),c);
const file={name:'replacement.wav',arrayBuffer:async()=>new ArrayBuffer(8)};
await c.loadAudioFile(null);assert.equal(c.isPlaying,true);assert.equal(c.downloadUrl,'blob:previous');
const pending=c.loadAudioFile(file);await new Promise(r=>setImmediate(r));
assert.equal(c.isPlaying,false,'replacement must stop previous playback before decode');assert.equal(c.playheadSeconds,0);
assert.equal(messages.at(-1).type,'stop');assert.equal(c.downloadUrl,null);assert.deepEqual(revoked,['blob:previous']);
rejectDecode(new Error('bad WAV'));await pending;assert.equal(c.buffer,null);assert.deepEqual(busy,[true,false]);assert.equal(c.readouts.download.textContent,'not ready');
const next=c.loadAudioFile(file);await new Promise(r=>setImmediate(r));const decoded={duration:8};resolveDecode(decoded);await next;
assert.equal(c.buffer,decoded);assert.equal(c.readouts.download.textContent,'ready');assert.equal(c.isPlaying,false);assert.deepEqual(revoked,['blob:previous']);
console.log('PASS: chooser cancellation preserves source; replacement stops playback, revokes old WAV, fails safely and recovers');
