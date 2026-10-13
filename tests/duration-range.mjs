import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const pick=name=>{const start=app.indexOf(`function ${name}(`);return app.slice(start,app.indexOf('\n}',start)+2)};
const c={durationInput:{value:'0'},sourceWindow:{start:0,end:1},formatSelect:{value:'mono'},previewGrainLimit:()=>64,buffer:{},isPlaying:false,playButton:{},stopButton:{},downloadButton:{},fileInput:{},playbackScrubber:{},stopAudio(){},updateDurationDisplay(){},sendSettings(){},playheadSeconds:17};
vm.createContext(c);vm.runInContext(['settings','setBusy','applyDuration','playAudio'].map(pick).join('\n'),c);
for(const value of [0,1,59,60,61,600]){c.durationInput.value=String(value);c.applyDuration();assert.equal(c.settings().durationSeconds,value);assert.equal(c.playButton.disabled,value===0);assert.equal(c.downloadButton.disabled,value===0);assert.equal(c.playheadSeconds,0);}
c.durationInput.value='0';c.playAudio(); // Must not attempt ensureAudio.
assert(!html.includes('durationRange'));assert.match(html,/id="durationInput"[^>]*min="0" max="600" step="1"/);
console.log('PASS single duration range: 0,1,59,60,61,600 seconds; zero guards and playhead reset');
