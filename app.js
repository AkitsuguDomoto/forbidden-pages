'use strict';
const $=s=>document.querySelector(s);
const RANKS=[{name:'C',weight:42.9,color:'#a6ba99',title:'A WHISPER IN THE DARK'},{name:'B',weight:37.55,color:'#78c6bf',title:'SOMETHING STIRS'},{name:'A',weight:18,color:'#b4a0de',title:'BEYOND THE KNOWN'},{name:'S',weight:1,color:'#e8c57c',title:'AN ANCIENT PRESENCE'},{name:'SS',weight:.5,color:'#f19a87',title:'THE COSMOS TREMBLES'},{name:'Hidden',weight:.05,color:'#e3e9d0',title:'THAT WHICH HAS NO NAME'}];
const candidates=window.CANDIDATES;
const buckets=Object.fromEntries(RANKS.map(r=>[r.name,candidates.filter(c=>c.rarity===r.name)]));
const rankInfo=r=>RANKS.find(x=>x.name===r);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let owned={},pullCount=0;
try{const saved=JSON.parse(localStorage.getItem('forbidden-pages-v1')||'{}');owned=saved.owned&&typeof saved.owned==='object'?saved.owned:{};pullCount=Number(saved.pulls)||0;}catch{}
let soundOn=false,audioCtx=null,busy=false,lastCount=1,pending=[],isDemo=false,timers=[],runToken=0,activeRank='ALL',detailReturn=false,previousFocus=null,lastResults=[];
function random(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}
function drawCandidate(){let pick=random()*100;let rank=RANKS.at(-1);for(const r of RANKS){pick-=r.weight;if(pick<0){rank=r;break;}}const list=buckets[rank.name];return list[Math.floor(random()*list.length)];}
function save(){try{localStorage.setItem('forbidden-pages-v1',JSON.stringify({owned,pulls:pullCount}));}catch{toast('記録を保存できません。この回の召喚は続けられます。');}updateCount();}
function updateCount(){const totalLabel=$('#candidateTotal');if(totalLabel)totalLabel.textContent=candidates.length;$('#collectionCount').textContent=String(candidates.filter(c=>owned[c.id]).length).padStart(2,'0');$('#collectionProgress').textContent=`${candidates.filter(c=>owned[c.id]).length} / ${candidates.length}`;$('#resetCollectionBtn').disabled=Object.keys(owned).length===0&&pullCount===0;const complete=candidates.every(c=>owned[c.id]);$('#unlockAllBtn').disabled=complete;$('#unlockAllBtn').textContent=complete?'すべて解放済み':'すべての存在を解放';}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3000);}
const descriptions={G001:'海底の都ルルイエにて、永い夢を見つづけるもの。',G002:'千の顔を持つ、這い寄る混沌。今宵はどんな姿で現れるのか。',G003:'光の絶えた場所から、闇そのものがあなたを見つめる。',G004:'魔女たちが集う夜、異界への契約を携えて現れる。',G005:'時も形も届かぬ中心で、混沌は盲目のまま渦を巻く。',G006:'門にして鍵。過去も未来も、その内にひとつとなる。',G007:'森の奥から響く、千の仔を孕むものへの呼び声。',G008:'大いなる深淵の主。原初の海を越えて、その角笛が響く。',G009:'海の底に、忘れられた信仰がいまも息づいている。',G010:'深い水の向こうで、海の民がその母の名を呼ぶ。',G011:'湖面に映る月は、滅びた都の記憶を知っている。',G015:'夢の都セレファイス。その神殿に捧げられる、変わらぬ祈り。',G016:'夢と現実の境を越えた先で、眠りの神が微笑む。',G017:'霧の向こうから来た、三叉槍を携える海の神。',G018:'雲よりも高い峰で、地上の神々は月夜に踊る。',G019:'地上の神々さえ恐れる、世界の外側のものたち。',G020:'最後の門の前で、太古からの案内者があなたを待つ。',G022:'見ることさえ許されぬ姿が、沈んだ大陸の記憶に潜む。',G023:'古き蛇の神の名は、いまも禁じられた伝承に残る。',G026:'暗く形定まらぬ神を、人ならざる民は崇めた。',G030:'潮の匂いの向こうに、海の底へ続く道がある。',G031:'その町の人々には、海から受け継いだ面影がある。',G032:'星々のあいだを渡る、地上の生命とは異なる来訪者。',G033:'人類の誕生よりも前、氷の大陸に文明を築いたもの。',G034:'暗い坑道を満たす、形なき生命のうねり。',G035:'遠い宇宙から降り立った、太古の戦いの担い手。',G036:'時間を越える知性が、歴史の彼方からあなたを観察する。',G037:'地の底を吹き抜ける風には、姿のない敵意がある。',G038:'どんな絵具にも、どんな言葉にも還元できない「色」。',G039:'墓地の下には、人の知らないもうひとつの世界がある。',G040:'顔のない翼が音もなく広がり、あなたを夢の深部へ運ぶ。',G041:'人の知る鳥には似ぬ巨翼が、夜空を覆う。',G043:'地下の巨人の口は、見慣れた方向には開かない。',G045:'月へと続く航路に、触手を持つ異形が待ち受ける。',G048:'骨に覆われた深淵で、途方もないものが地を掘り進む。',G049:'この町では、何者も猫を殺すなかれ。',G050:'地球の猫たちが警戒する、遥か遠い星の猫。',G052:'異星の街にも、長い年月を生きる知性がある。',G054:'ウェイトリィ家に生まれた子には、隠しきれない秘密がある。',G056:'魔女とともにニャルラトホテプに仕え、異界へと誘う、人の顔を持つ使い魔。',G057:'暴かれた墓の向こうから、その遠吠えは近づいてくる。',G060:'砂漠の下の都市には、人類よりも古い住人の記憶が眠る。',G064:'暗闇の洞窟に足音が響く。それは救いか、それとも。',G066:'死の境界を越えた実験は、取り返しのつかない答えを生む。',G067:'その家では、人が衰弱してゆく。原因は、まだ地下にある。',G075:'老人は、小さな瓶に向かって名を呼びかける。',G076:'壁の内側から聞こえる音は、あなたにしか届かない。',G077:'禁じられた知識の中に、恐るべき猟犬の名が記されている。',G083:'失われた美しい都を求め、夢の世界を旅する人。',G084:'現実では失われたものを、夢の都で取り戻した王。',G085:'彼の描く怪物は、なぜこれほどまでに生々しいのか。',G086:'死は、克服できる。そう信じた医師の実験記録。',G087:'古い肖像画の男は、死者から秘密を聞き出そうとした。',G088:'幾何学の向こうにある道を、魔女は知っていた。',G091:'瓶に語りかける老人には、近づかないほうがよい。',G092:'窓の外の何かに抗うように、今夜も異様な旋律が響く。',G093:'神々を見に登った山の記憶を、老いた祭司は語る。',G094:'神々の顔を見たい。その願いは、禁じられた峰へと向かう。',G095:'禁じられた書に、その詩人の名は永遠に刻まれた。',G096:'ヤディスの魔術師。その生は、ひとりの夢見る者と交錯する。',G097:'恐るべき神に立ち向かった祭司の、時を越える記録。',G100:'書物の知識を手がかりに、ダンウィッチの怪異に挑む学者。',G102:'神々を造ったものは、いまも眠りつづけている。',G103:'世界がつづくあいだ、鼓手の腕が休まることはない。',G130:'始まりより前。世界を賭けた投擲の行方を、誰も知らない。',G131:'世界は、ひとつの偶然から始まったのかもしれない。',G149:'その戯曲の第二幕を、読んではいけない。',G153:'カルコサ、ハリの湖、そしてハスター。その名の意味は霧に包まれている。'};
Object.assign(descriptions,{"G044": "光の届かない地下で、飢えたものたちが跳ね回る。", "G046": "遥かな高原レン。人に似た住人には、隠しきれない特徴がある。", "G053": "薄明の海の底に、髭と鰭を持つ民の迷宮がある。", "G062": "雷鳴の夜、古い館の地下から何かが這い出す。", "G065": "暗い城を抜け、初めて外の世界へ。その先で出会うものは。", "G072": "湿原の夜に葦笛が響き、忘れられたものたちが踊る。", "G073": "眠りの壁を越え、遥かな光の存在が語りかける。", "G090": "異様に冷たい部屋で暮らす医師。その温度には理由がある。", "G098": "ある一族を襲う死の呪い。その背後には、錬金術師の執念がある。", "G099": "霧の上の家で、海と夢の物語を知る主が訪問者を迎える。"});
Object.assign(descriptions,{"G042": "夢の森の木陰から、小さな瞳が旅人の行方を見守っている。", "G055": "姿の見えない巨体が、ダンウィッチの野を踏み荒らす。", "G058": "名前も輪郭も与えられぬものが、古い墓地に潜んでいる。", "G070": "墓の底から、聞こえるはずのない声が応える。"});
Object.assign(descriptions,{G132:'神殿の静寂に、蜘蛛の神は宝石の光を抱いて待つ。'});
function kind(c){let n=Number(c.id.slice(1));if(['G049','G050'].includes(c.id))return 'cat';if(['G005','G006','G020','G019','G038','G102','G103','G130','G131','G015','G073'].includes(c.id))return 'cosmic';if(['G040','G041'].includes(c.id))return 'wing';if(n>=83&&n<=101||['G002','G003','G004','G016','G017','G149','G153'].includes(c.id))return 'human';return 'monster';}
function entityArt(c){const type=kind(c),seed=Number(c.id.slice(1));let shape='';
if(['G057','G077'].includes(c.id)){shape='<path d="M70 173L93 135L119 119L131 72L157 110L183 88L176 136L224 155L215 175L180 178L165 218L152 240L134 240L140 202L112 190L99 232L80 232L89 185L62 183L43 161L40 138L54 155Z" fill="currentColor" fill-opacity=".16"/><path d="M161 139L176 142M196 159L218 164" stroke-width="2"/><path d="M133 177L141 209M106 153L97 172" stroke-opacity=".5"/>';}
else if(['G056','G076'].includes(c.id)){shape='<path d="M84 194Q72 150 114 141Q105 104 127 99Q153 99 152 135Q180 128 206 167L232 178L209 191L180 193L162 222L97 220Z" fill="currentColor" fill-opacity=".17"/><circle cx="192" cy="164" r="2" fill="currentColor"/><path d="M91 208C32 245 29 159 61 179" stroke-width="4"/><path d="M205 181L240 171M207 187L241 190M120 219L112 230M163 216L180 230"/>';}
else if(c.id==='G033'){shape='<path d="M123 89Q104 155 121 214L178 214Q195 155 176 89Z" fill="currentColor" fill-opacity=".15"/><path d="M150 39L160 66L188 66L166 84L175 109L150 94L125 109L134 84L111 66L140 66Z"/><path d="M122 115C61 93 83 171 56 143M119 146C57 148 93 194 66 184M178 118C240 92 219 173 246 147M181 145C239 143 205 195 237 183M124 213L101 240M138 214L132 249M163 214L173 250M177 214L199 238M138 111V204M163 111V204"/>';}
else if(c.id==='G034'){shape='<path d="M69 206Q32 178 78 157Q43 109 93 105Q100 53 137 91Q170 45 192 102Q249 85 226 139Q270 182 221 204Q181 252 150 218Q94 252 69 206Z" fill="currentColor" fill-opacity=".17"/>';for(let i=0;i<13;i++)shape+=`<ellipse cx="${90+i*11%120}" cy="${105+i*29%100}" rx="8" ry="5"/><circle cx="${90+i*11%120}" cy="${105+i*29%100}" r="2" fill="currentColor"/>`;}
else if(type==='cosmic'){for(let i=0;i<7;i++){const a=(i*2.399+seed)*1.1,x=150+Math.cos(a)*65,y=140+Math.sin(a)*65,r=12+(i%3)*8;shape+=`<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".6"/>`;}shape+='<circle cx="150" cy="140" r="28" fill="currentColor" fill-opacity=".2"/><path d="M65 140Q150 80 235 140Q150 200 65 140Z"/><ellipse cx="150" cy="140" rx="9" ry="26" fill="currentColor"/>';}
else if(type==='cat'){shape='<path d="M113 137L104 83L139 105Q153 99 170 105L198 82L188 137Q204 163 187 181L184 225H118L115 181Q97 163 113 137Z" fill="currentColor" fill-opacity=".17"/><path d="M122 142L139 147M164 147L180 140" stroke-width="3"/><path d="M127 228C65 239 70 182 96 186C108 188 105 205 94 201" stroke-width="7"/><path d="M147 163L156 163L151 168Z" fill="currentColor"/>';}
else if(type==='wing'){shape='<path d="M144 123Q90 74 39 87Q82 114 62 163Q89 133 125 159L134 211L150 230L166 209L174 159Q211 128 238 160Q220 114 264 86Q201 72 158 123L155 100L171 79L157 85L149 75L141 86L128 79L141 101Z" fill="currentColor" fill-opacity=".14"/><path d="M150 130L150 214M46 91L129 151M254 91L173 151" stroke-opacity=".55"/>';}
else if(type==='human'){shape='<path d="M111 122Q107 73 150 60Q195 80 190 122L178 151L210 231Q152 257 89 231L122 151Z" fill="currentColor" fill-opacity=".14"/><path d="M112 119Q150 98 188 119L173 157H127Z" fill="#061310"/><path d="M135 126L143 129M158 129L166 126M123 162L109 222M176 161L192 222M150 170V236" stroke-opacity=".65"/><circle cx="150" cy="94" r="58" stroke-dasharray="1 7" stroke-opacity=".55"/><path d="M139 84L150 72L161 84L150 96Z" fill="currentColor" fill-opacity=".5"/>';}
else{shape='<path d="M109 111Q103 66 150 61Q199 66 193 111L184 155Q171 177 150 176Q125 176 114 153Z" fill="currentColor" fill-opacity=".18"/><path d="M120 114L140 121L128 123M160 121L181 114L175 123" stroke-width="3"/><path d="M126 147C110 190 75 162 73 194S106 226 109 207M140 151C126 178 148 199 127 218S86 246 77 226M153 153C178 182 142 212 158 239M167 149C195 179 175 202 196 215S227 193 209 189M179 142C201 152 224 139 229 163S206 183 216 211" stroke-width="6"/><path d="M112 139Q78 146 72 120Q45 157 91 183M189 139Q224 146 230 120Q256 157 211 183" fill="currentColor" fill-opacity=".08"/>';}
const stars=Array.from({length:14},(_,i)=>{const x=30+((i*71+seed*13)%240),y=30+((i*43+seed*7)%230);return `<circle cx="${x}" cy="${y}" r="${i%4===0?1.6:.7}" fill="currentColor" opacity=".5"/>`;}).join('');return `<svg class="entity-svg" viewBox="0 0 300 290" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".8"><circle cx="150" cy="140" r="110" stroke-opacity=".15"/><path d="M150 16V39M150 244V267M25 140H46M254 140H277" stroke-opacity=".5"/>${stars}${shape}</g></svg>`;}
function audioTone(freq,duration=.3,delay=0,type='sine',gain=.06){if(!soundOn)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const osc=audioCtx.createOscillator(),vol=audioCtx.createGain(),at=audioCtx.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(freq,at);vol.gain.setValueAtTime(0,at);vol.gain.linearRampToValueAtTime(gain,at+.03);vol.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(vol);vol.connect(audioCtx.destination);osc.start(at);osc.stop(at+duration);}catch{}}
function stopAudio(){if(audioCtx)audioCtx.suspend().catch(()=>{});}
const RITUAL_PROFILES={
 C:{className:'rank-c',duration:3500,charge:2,peak:5,count:170,eye:'◈',chargeText:'何かが、こちらを見る。',hint:'もう、引き返すことはできない。',finalText:'その名を、呼べ。'},
 B:{className:'rank-b',duration:3500,charge:2,peak:5,count:190,eye:'◈',chargeText:'何かが、こちらを見る。',hint:'もう、引き返すことはできない。',finalText:'その名を、呼べ。'},
 A:{className:'rank-a',duration:4300,charge:4,peak:8,count:260,eye:'✧',chargeText:'紫の光が、花ひらく。',hint:'幾重もの光片が、異界への道を照らす。',finalText:'煌めきの向こうに、邂逅。'},
 S:{className:'rank-s',duration:5500,charge:5,peak:9,count:340,eye:'✦',chargeText:'黄金の門が、ひらく。',hint:'荘厳な響きとともに、古き存在が降り立つ。',finalText:'その威光に、目を凝らせ。'},
 SS:{className:'rank-ss',duration:6800,charge:7,peak:14,count:430,eye:'◉',chargeText:'世界が、耐えきれない。',hint:'星々が沈み、空間そのものが裂けてゆく。',finalText:'宇宙が、軋む。'},
 Hidden:{className:'secret',duration:6500,charge:4,peak:7,count:190,eye:'◈',chargeText:'……音が、消えた。',hint:'この頁は、存在しないはずだった。',finalText:'記録にない、邂逅。'}
};
function startSummon(count=1,previewRank=null){
 if(busy)return;
 busy=true;previousFocus=document.activeElement;lastCount=count;isDemo=!!previewRank;detailReturn=false;
 $('#infoDialog').close();$('#results').classList.add('hidden');document.body.style.overflow='hidden';
 pending=Array.from({length:count},()=>previewRank?buckets[previewRank][Math.floor(random()*buckets[previewRank].length)]:drawCandidate());
 const highest=pending.reduce((a,b)=>RANKS.findIndex(r=>r.name===a.rarity)>=RANKS.findIndex(r=>r.name===b.rarity)?a:b);
 const r=rankInfo(highest.rarity),profile=RITUAL_PROFILES[r.name],scene=$('#summoning');
 scene.className='summoning '+profile.className;scene.style.setProperty('--rank',r.color);
 $('.ritual-eye').textContent=profile.eye;
 $('#ritualEnglish').textContent='BREAKING THE SEAL';$('#ritualText').textContent='封印を、解く。';
 $('#ritualHint').textContent='名もなき深淵に、あなたの声が届く。';$('#skipBtn').disabled=true;scene.setAttribute('tabindex','-1');scene.focus();
 runToken++;const token=runToken;
 ritualState={start:performance.now(),color:r.color,intensity:1,tier:r.name,count:profile.count,phase:'gather'};
 const total=reduced?650:profile.duration;
 const schedule=(fn,ms)=>timers.push(setTimeout(()=>{if(token===runToken)fn();},ms));
 schedule(()=>{$('#skipBtn').disabled=false;if(document.activeElement===scene)$('#skipBtn').focus();},500);
 audioTone(55,1.4,0,'sine',.12);audioTone(82.4,1.3,.15,'triangle',.03);
 schedule(()=>{
  $('#ritualEnglish').textContent=r.name==='S'?'THE GOLDEN GATE':r.name==='SS'?'COSMIC RUPTURE':r.name==='A'?'A VIOLET AWAKENING':r.name==='Hidden'?'THE SEAL IS BREAKING':'A PRESENCE APPROACHES';
  $('#ritualText').textContent=profile.chargeText;$('#ritualHint').textContent=profile.hint;
  scene.classList.add('charged');ritualState.intensity=profile.charge;ritualState.phase='charge';
  if(r.name==='Hidden'){stopAudio();}
  else if(r.name==='A'){[220,277.18,329.63,440,554.37].forEach((f,i)=>audioTone(f,.8,i*.1,'sine',.035));}
  else if(r.name==='S'){[130.81,196,261.63,329.63,392,523.25].forEach((f,i)=>audioTone(f,1.7,i*.14,'sine',.035));}
  else if(r.name==='SS'){audioTone(36.7,2.5,0,'sawtooth',.035);audioTone(55,2.3,0,'sine',.12);audioTone(58.27,2.2,0,'sine',.07);}
  else{audioTone(110,.9,0,'triangle',.05);audioTone(164.8,.8,.15,'sine',.04);}
 },total*.36);
 schedule(()=>{
  scene.classList.add('ascended');ritualState.phase='ascend';ritualState.intensity=profile.charge+1;
  if(r.name==='SS'){audioTone(42,.9,0,'triangle',.12);audioTone(63,.8,.1,'sawtooth',.025);}
 },total*.65);
 schedule(()=>{
  $('#ritualEnglish').textContent=r.title;$('#ritualText').textContent=profile.finalText;
  ritualState.intensity=profile.peak;ritualState.phase='burst';ritualState.burstAt=performance.now();
  scene.classList.add('reveal');
  if(r.name==='S'){[261.63,329.63,392,523.25].forEach((f,i)=>audioTone(f,1.3,i*.08,'sine',.045));}
  if(r.name==='SS'){audioTone(32.7,1.8,0,'triangle',.13);audioTone(65.4,1.6,.05,'sine',.08);audioTone(261.63,1.2,.12,'sawtooth',.02);}
 },total-(r.name==='SS'?1000:r.name==='A'?850:750));
 schedule(finishSummon,total);
}
function finishSummon(){if(!busy)return;timers.forEach(clearTimeout);timers=[];runToken++;busy=false;ritualState=null;$('#summoning').classList.add('hidden');const seen=new Set(Object.keys(owned));const results=pending.map(c=>{const entry={...c,isNew:!seen.has(c.id)};seen.add(c.id);if(!isDemo)owned[c.id]=(Number(owned[c.id])||0)+1;return entry;});if(!isDemo){pullCount+=results.length;save();}lastResults=results;showResults(results,isDemo);audioTone(261.63,1.5,0,'sine',.05);audioTone(392,1.5,.1,'sine',.035);}
function showResults(items,preview=false){$('#results').classList.remove('hidden');$('#resultKicker').textContent=preview?'AN ILLUSION — 演出プレビュー（記録されません）':items.length>1?'TEN PAGES / TEN ENCOUNTERS':'THE ENCOUNTER — あなたを訪れた存在';$('#resultContent').innerHTML=items.length===1?((detailReturn&&lastResults.length>1&&pending.length>1?'<button class="text-button" id="backToBatch">← 十頁の結果に戻る</button>':'')+singleCard(items[0],preview)):`<div class="ten-grid">${items.map((c,i)=>miniCard(c,i,preview)).join('')}</div><p class="section-note" style="text-align:center">存在を選ぶと、登場作品と翻訳版をご覧いただけます。</p>`;$('#againBtn').textContent=preview?'もう一度、演出を試す ↗':lastCount===10?'もう一度、十頁をひらく ↗':'もう一度、頁をひらく ↗';$('#closeResult').focus();}
function singleCard(c,preview=false){const r=rankInfo(c.rarity);const works=c.works;const links=Array.from(new Map(works.filter(w=>w.translation_url).map(w=>[w.translation_url,w])).values());return `<article class="single-result ${c.isNew&&!preview?'is-new':''}" style="--rank:${r.color}"><div class="result-art">${entityArt(c)}<span class="art-id">${c.id} · THE ARCHIVE OF THE UNKNOWN</span></div><div class="result-info"><div class="rank-label">${escapeHTML(c.rarity)}<small>${c.rarity==='Hidden'?'UNRECORDED':'ENCOUNTER'}</small>${c.isNew&&!preview?'<span class="new-label"><span class="new-spark" aria-hidden="true">✦</span> NEW <span class="new-ja">初発見</span></span>':''}</div><h3>${escapeHTML(c.name)}</h3><p class="entity-desc">${escapeHTML(descriptions[c.id]||'禁じられた物語に、その名が記されている。')}</p><div class="source-block"><small>この存在が登場・言及される物語</small><div class="source-title">${works.map(w=>'『'+escapeHTML(w.title)+'』').join(' / ')}</div><div class="book-source-list">${links.map((w,i)=>`<a class="read-link" href="${escapeHTML(w.translation_url)}" target="_blank" rel="noopener noreferrer">${links.length>1?escapeHTML(w.translation_volume)+' — ':''}翻訳版を見る ↗</a>`).join('')}</div><small style="margin-top:12px;margin-bottom:0;font-size:8px">書籍の紹介・購入ページが開きます。</small></div></div></article>`;}
function miniCard(c,i=0,preview=false,collection=false){const r=rankInfo(c.rarity);return `<button class="mini-card ${c.isNew&&!preview?'is-new':''}" data-entity="${c.id}" style="--rank:${r.color};--i:${i}"><span class="mini-rank">${escapeHTML(c.rarity)}</span>${c.isNew&&!preview?'<span class="mini-new"><span aria-hidden="true">✦</span> NEW<small>初発見</small></span>':''}${entityArt(c)}<h3>${escapeHTML(c.name)}</h3>${collection?`<small>邂逅 ${Number(owned[c.id])||0} 回</small>`:''}</button>`;}
function closeResults(){$('#results').classList.add('hidden');document.body.style.overflow='';if(!$('#collection').classList.contains('hidden'))renderCollection();if(previousFocus?.isConnected)previousFocus.focus();}
function selectTab(collection){$('#home').classList.toggle('hidden',collection);$('#collection').classList.toggle('hidden',!collection);$('#homeBtn').classList.toggle('active',!collection);$('#collectionBtn').classList.toggle('active',collection);if(collection)renderCollection();window.scrollTo({top:0,behavior:reduced?'instant':'smooth'});}
function renderCollection(){const mine=candidates.filter(c=>owned[c.id]&&(activeRank==='ALL'||c.rarity===activeRank));$('#collectionFilters').innerHTML=['ALL',...RANKS.map(r=>r.name)].map(r=>{const entries=r==='ALL'?candidates:buckets[r];const found=entries.filter(c=>owned[c.id]).length;return `<button class="filter ${r===activeRank?'active':''}" data-filter="${r}" aria-pressed="${r===activeRank}" aria-label="${r==='ALL'?'すべて':r}：発見済み${found}種、収録${entries.length}種"><span>${r}</span><span class="filter-count">${found}<span class="filter-count-divider"> / </span>${entries.length}</span></button>`;}).join('');$('#collectionGrid').innerHTML=mine.map((c,i)=>miniCard(c,Math.min(i,8),false,true)).join('');$('#emptyCollection').classList.toggle('hidden',mine.length>0);$('#emptyCollection').innerHTML=Object.keys(owned).length?'このランクとの邂逅は、まだ記されていない。':'禁書は、まだ静かに眠っている。<br><button class="text-button" id="firstSummon">最初の一頁をひらく ↗</button>';updateCount();}
function openCollectionReset(){if(busy||$('#resetCollectionBtn').disabled)return;$('#resetError').textContent='';$('#resetError').classList.add('hidden');$('#resetDialog').showModal();$('#cancelResetBtn').focus();}
function cancelCollectionReset(){$('#resetDialog').close();$('#resetCollectionBtn').focus();}
function resetCollection(){
 if(busy)return;
 try{localStorage.removeItem('forbidden-pages-v1');}
 catch{$('#resetError').textContent='記録を消去できませんでした。ブラウザの保存設定を確認して、もう一度お試しください。';$('#resetError').classList.remove('hidden');return;}
 owned={};pullCount=0;pending=[];lastResults=[];lastCount=1;detailReturn=false;isDemo=false;activeRank='ALL';
 renderCollection();$('#resetDialog').close();$('#collectionBtn').focus();toast('蒐集の記録をリセットしました。新しい一頁から始めましょう。');
}
let apocalypseState=null,apocalypseTimers=[];
function openUnlockAll(){if(busy||candidates.every(c=>owned[c.id]))return;$('#unlockTotal').textContent=candidates.length;$('#unlockError').textContent='';$('#unlockError').classList.add('hidden');$('#unlockDialog').showModal();$('#cancelUnlockBtn').focus();}
function cancelUnlockAll(){$('#unlockDialog').close();$('#unlockAllBtn').focus();}
function unlockAll(){
 if(busy||candidates.every(c=>owned[c.id]))return;
 const nextOwned={...owned};for(const c of candidates)if(!nextOwned[c.id])nextOwned[c.id]=1;
 try{localStorage.setItem('forbidden-pages-v1',JSON.stringify({owned:nextOwned,pulls:pullCount}));}
 catch{$('#unlockError').textContent='全解放を保存できませんでした。ブラウザの保存設定を確認して、もう一度お試しください。';$('#unlockError').classList.remove('hidden');return;}
 owned=nextOwned;$('#unlockDialog').close();renderCollection();startApocalypse();
}
function apocalypseStage(phase,en,text,hint){const scene=$('#apocalypse');scene.className='apocalypse '+phase;$('#apocalypseEnglish').textContent=en;$('#apocalypseText').textContent=text;$('#apocalypseHint').textContent=hint;if(apocalypseState)apocalypseState.phase=phase;}
function startApocalypse(){
 busy=true;document.body.style.overflow='hidden';$('#apocalypseCompletion').classList.add('hidden');$('#apocalypseSkip').disabled=true;$('#apocalypseSkip').classList.remove('hidden');
 $('#doomPages').innerHTML=Array.from({length:24},(_,i)=>`<i style="--i:${i};--hue:${i*37}"><span>ᚷ ᛟ ᚾ<br>ᛉ ᚷ ᛟ<br>ᚾ ᛉ ᚷ</span></i>`).join('');
 const icons=RANKS.flatMap(r=>buckets[r.name].slice(0,3));$('#chaosOrbits').innerHTML=icons.map((c,i)=>`<div class="chaos-entity" style="--i:${i};--angle:${i*360/icons.length}deg;--rank:${rankInfo(c.rarity).color}">${entityArt(c)}</div>`).join('');
 apocalypseState={start:performance.now(),phase:'awakening'};apocalypseStage('awakening','THE LAST FORBIDDEN PAGE','一頁では、足りない。','今宵、すべてをひらく。');
 const after=(ms,fn)=>apocalypseTimers.push(setTimeout(fn,ms));
 after(500,()=>{$('#apocalypseSkip').disabled=false;$('#apocalypseSkip').focus();});
 if(reduced){after(1100,finishApocalypse);return;}
 audioTone(36.7,2,0,'sine',.1);audioTone(55,2,.2,'triangle',.04);
 after(1400,()=>{apocalypseStage('unbinding','ALL SIX SEALS / BROKEN','六つの封印が、砕ける。','神々も、怪物も、名を持たぬものも。');[65.4,98,130.8,196,261.6,392].forEach((f,i)=>audioTone(f,2,i*.13,'triangle',.025));});
 after(3300,()=>{apocalypseStage('rupture','THE WORLD IS COMING UNDONE','世界の綴じ目が、裂ける。','頁は嵐となり、すべての境界を呑み込む。');audioTone(30,3,0,'sine',.12);audioTone(43.65,2.8,.1,'sawtooth',.018);});
 after(5500,()=>{apocalypseStage('annihilation','BEYOND EVERY NAME / BEYOND EVERY GOD','秩序よ、終われ。','星も、時も、運命も。この一冊へ。');[32.7,49,65.4,98].forEach((f,i)=>audioTone(f,2,i*.12,'triangle',.04));});
 after(7400,()=>{apocalypseStage('revelation','THE INFINITE ARCHIVE','すべてが、ここに。','最後の禁忌が、いま解き放たれる。');[130.8,196,261.6,329.6,392,523.25].forEach((f,i)=>audioTone(f,2,i*.08,'sine',.025));});
 after(9200,finishApocalypse);
}
function finishApocalypse(){if(!apocalypseState)return;apocalypseTimers.forEach(clearTimeout);apocalypseTimers=[];apocalypseState=null;busy=false;$('#apocalypse').className='apocalypse complete';$('#apocalypseSkip').classList.add('hidden');$('#apocalypseCompletion').classList.remove('hidden');$('#apocalypseTotal').textContent=`${candidates.length} / ${candidates.length}`;$('#apocalypseArchiveBtn').focus();}
function closeApocalypse(){if(apocalypseState)finishApocalypse();$('#apocalypse').classList.add('hidden');document.body.style.overflow='';selectTab(true);$('#collectionBtn').focus();}
function openInfo(demo=false){$('#dialogEyebrow').textContent=demo?'RITUAL PREVIEW':'SUMMONING RATES';$('#dialogBody').innerHTML=demo?`<h2>異界の気配を、選ぶ。</h2><p>各ランクの演出をお試しいただけます。<br>プレビューの結果は蒐集の書に記録されません。</p><div class="demo-options">${RANKS.map(r=>`<button data-demo="${r.name}" style="--rank:${r.color}">${r.name}</button>`).join('')}</div>`:`<h2>邂逅の確率</h2>${RANKS.map(r=>`<div class="rate-row" style="--rank:${r.color}"><span>${r.name}</span><div class="rate-bar"><i style="width:${r.weight*2}%"></i></div><span>${r.weight}%</span></div>`).join('')}<p>最初にランクを抽選し、そのランク内では各存在を等しい確率で選びます。毎回独立した抽選で、10連の確定枠や回数による保証はありません。</p><p>無料・回数制限なし。全${candidates.length}候補。Hiddenは${buckets.Hidden.length}候補あり、特定の1候補が出る確率は${Number((rankInfo('Hidden').weight/buckets.Hidden.length).toPrecision(8))}%です。</p>`;$('#infoDialog').showModal();}
$('#unlockAllBtn').onclick=openUnlockAll;$('#cancelUnlockBtn').onclick=cancelUnlockAll;$('#confirmUnlockBtn').onclick=unlockAll;$('#unlockDialog').addEventListener('cancel',()=>$('#unlockAllBtn').focus());$('#apocalypseSkip').onclick=()=>{if(!$('#apocalypseSkip').disabled)finishApocalypse();};$('#apocalypseArchiveBtn').onclick=closeApocalypse;
$('#resetCollectionBtn').onclick=openCollectionReset;$('#cancelResetBtn').onclick=cancelCollectionReset;$('#confirmResetBtn').onclick=resetCollection;$('#resetDialog').addEventListener('cancel',()=>$('#resetCollectionBtn').focus());
$('#summonOne').onclick=()=>startSummon(1);$('#summonTen').onclick=()=>startSummon(10);$('#skipBtn').onclick=()=>{if(!$('#skipBtn').disabled)finishSummon();};$('#againBtn').onclick=()=>isDemo?startSummon(1,pending[0].rarity):startSummon(lastCount);$('#backBtn').onclick=()=>{closeResults();selectTab(false);};$('#closeResult').onclick=closeResults;$('#homeBtn').onclick=()=>selectTab(false);$('#collectionBtn').onclick=()=>selectTab(true);$('.brand').onclick=e=>{e.preventDefault();selectTab(false);};$('#ratesBtn').onclick=()=>openInfo(false);$('#closeDialog').onclick=()=>$('#infoDialog').close();$('#infoDialog').addEventListener('click',e=>{if(e.target===$('#infoDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#soundBtn').onclick=()=>{soundOn=!soundOn;$('#soundBtn').setAttribute('aria-pressed',String(soundOn));$('#soundBtn').setAttribute('aria-label',soundOn?'音をオフにする':'音をオンにする');$('#soundLabel').textContent=soundOn?'SOUND ON':'SOUND OFF';$('#soundIcon').textContent=soundOn?'◉':'◌';if(soundOn)audioTone(220,.3);else stopAudio();};
document.addEventListener('click',e=>{if(e.target.closest('#backToBatch')){detailReturn=false;showResults(lastResults,isDemo);return;}const demo=e.target.closest('[data-demo]');if(demo){startSummon(1,demo.dataset.demo);return;}const f=e.target.closest('[data-filter]');if(f){activeRank=f.dataset.filter;renderCollection();return;}if(e.target.closest('#firstSummon')){startSummon(1);return;}const card=e.target.closest('[data-entity]');if(card){const c=candidates.find(c=>c.id===card.dataset.entity);if(!c)return;if($('#results').classList.contains('hidden')){previousFocus=card;lastCount=1;isDemo=false;pending=[c];document.body.style.overflow='hidden';}detailReturn=true;showResults([c],isDemo);}});
document.addEventListener('keydown',e=>{if(!$('#apocalypse').classList.contains('hidden')){if(e.key==='Escape'){e.preventDefault();if(apocalypseState){if(!$('#apocalypseSkip').disabled)finishApocalypse();}else closeApocalypse();}if(e.key==='Tab'){e.preventDefault();(apocalypseState?$('#apocalypseSkip'):$('#apocalypseArchiveBtn')).focus();}return;}if(e.key==='Escape'){if(busy){e.preventDefault();if(!$('#skipBtn').disabled)finishSummon();}else if(!$('#results').classList.contains('hidden'))closeResults();}if(e.key==='Tab'){const modal=!$('#summoning').classList.contains('hidden')?$('#summoning'):!$('#results').classList.contains('hidden')?$('#results'):null;if(!modal)return;const focusable=[...modal.querySelectorAll('button,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
/* Ambient stars and the summoning particle field are drawn without external assets. */
const canvas=$('#cosmos'),ctx=canvas.getContext('2d'),ritual=$('#ritualCanvas'),rctx=ritual.getContext('2d');let width=0,height=0,dpr=1,stars=[],ritualState=null,lastFrame=0;
function resize(){dpr=Math.min(devicePixelRatio||1,2);width=innerWidth;height=innerHeight;for(const c of [canvas,ritual]){c.width=width*dpr;c.height=height*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);rctx.setTransform(dpr,0,0,dpr,0,0);stars=Array.from({length:Math.min(140,Math.floor(width/9))},()=>({x:random()*width,y:random()*height,r:random()*1.1+.2,t:random()*6.28,s:random()*.15+.04}));}
function paintRitual(now){
 const state=ritualState;if(!state)return;
 rctx.clearRect(0,0,width,height);
 const elapsed=(now-state.start)/1000,cx=width*.5,cy=height*(width<=680?.38:.43),intensity=state.intensity;
 rctx.strokeStyle=state.color;rctx.fillStyle=state.color;
 const rank=state.tier,burst=state.phase==='burst',ss=rank==='SS',gold=rank==='S',violet=rank==='A';
 if(gold&&state.phase!=='gather'){
  const haze=rctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(width,height)*.65);
  haze.addColorStop(0,'#e8c57c28');haze.addColorStop(.45,'#b58a2114');haze.addColorStop(1,'#0000');
  rctx.fillStyle=haze;rctx.fillRect(0,0,width,height);rctx.fillStyle=state.color;
 }
 if(ss&&state.phase!=='gather'){
  rctx.fillStyle='#8b1b1210';rctx.fillRect(0,0,width,height);rctx.fillStyle=state.color;
  rctx.save();rctx.translate(cx,cy);rctx.rotate(-elapsed*.12);
  for(let j=0;j<3;j++){rctx.beginPath();rctx.ellipse(0,0,115+j*39,30+j*10,j*.75,0,Math.PI*2);rctx.globalAlpha=.23;rctx.stroke();}rctx.restore();
 }
 for(let i=0;i<state.count;i++){
  const angle=i*2.399+elapsed*(ss?-.12:.09),phase=(i*.137+elapsed*(intensity*.07+.12))%1;
  let dist=Math.pow(phase,1.8)*Math.max(width,height)*.75;
  if(ss&&state.phase==='ascend')dist=(1-phase)*Math.max(width,height)*.65;
  const x=gold?cx+Math.sin(i*9.13)*width*.6:cx+Math.cos(angle)*dist;
  const y=gold?((i*137+elapsed*(burst?300:95))%(height+80))-40:cy+Math.sin(angle)*dist;
  rctx.globalAlpha=(gold?.3:phase)*.75;rctx.beginPath();
  if(violet&&state.phase!=='gather'){
   const size=2+phase*(burst?10:5);rctx.moveTo(x,y-size*2);rctx.lineTo(x+size,y);rctx.lineTo(x,y+size*2);rctx.lineTo(x-size,y);rctx.closePath();rctx.fill();
  }else if(gold){
   const size=i%9===0?4:1.3;rctx.moveTo(x-size,y);rctx.lineTo(x+size,y);rctx.moveTo(x,y-size*3);rctx.lineTo(x,y+size*3);rctx.stroke();
  }else if(intensity>3){
   const direction=ss&&state.phase==='ascend'?-1:1;rctx.moveTo(x,y);rctx.lineTo(cx+Math.cos(angle)*(dist+phase*intensity*5*direction),cy+Math.sin(angle)*(dist+phase*intensity*5*direction));rctx.stroke();
  }else{rctx.arc(x,y,phase*1.7,0,Math.PI*2);rctx.fill();}
 }
 if(burst&&(violet||gold||ss)){
  const age=(now-state.burstAt)/1000,reach=Math.max(width,height)*.8;
  for(let n=0;n<(ss?3:violet?2:1);n++){
   const p=Math.max(0,age-n*.15);if(!p)continue;rctx.globalAlpha=Math.max(0,1-p*1.2);rctx.lineWidth=ss?4:2;
   rctx.beginPath();rctx.arc(cx,cy,p*reach,0,Math.PI*2);rctx.stroke();
  }
 }
 rctx.lineWidth=1;rctx.globalAlpha=1;
}
function paintApocalypse(now){
 const c=$('#apocalypseCanvas'),g=c.getContext('2d');if(c.width!==width*dpr||c.height!==height*dpr){c.width=width*dpr;c.height=height*dpr;}g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,width,height);
 const t=(now-apocalypseState.start)/1000,cx=width/2,cy=height*(width<=680?.39:.44),unit=Math.min(width,height),stage=apocalypseState.phase,force=stage==='awakening'?.2:stage==='unbinding'?.6:stage==='rupture'?1.4:stage==='annihilation'?2:1.1;
 if(reduced)return;
 const colors=['#b9d397','#78c6bf','#b4a0de','#e8c57c','#f19a87','#e3e9d0'];g.lineWidth=1;
 const haze=g.createRadialGradient(cx,cy,0,cx,cy,unit*.75);haze.addColorStop(0,stage==='annihilation'?'#ee603124':'#754aa530');haze.addColorStop(.4,'#30539118');haze.addColorStop(1,'#0000');g.fillStyle=haze;g.fillRect(0,0,width,height);
 for(let i=0;i<(width<680?180:420);i++){
  const k=(i*.618+t*.08*force)%1,a=i*2.399+t*(i%2?1:-1)*.15*force,r=(stage==='annihilation'?1-k:k)*Math.max(width,height)*.85;
  g.strokeStyle=colors[i%6];g.globalAlpha=.16+k*.6;g.beginPath();g.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8);g.lineTo(cx+Math.cos(a+.013*force)*(r+5+k*force*65),cy+Math.sin(a+.013*force)*(r+5+k*force*65)*.8);g.stroke();
 }
 if(stage!=='awakening'){
  g.save();g.translate(cx,cy);g.rotate(t*.025);
  for(let i=0;i<14;i++){const a=i*Math.PI*2/14,r=unit*.3;g.strokeStyle=colors[i%6];g.globalAlpha=.45;g.lineWidth=i%3?1:2;g.beginPath();g.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);for(let j=1;j<7;j++){const rr=r*(j*.38),aa=a+Math.sin(i*7+j*3)*.11;g.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);}g.stroke();}g.restore();
 }
 if(stage==='rupture'||stage==='annihilation'||stage==='revelation'){
  for(let i=0;i<6;i++){const k=(t*.28+i/6)%1;g.globalAlpha=(1-k)*.45;g.strokeStyle=colors[i];g.lineWidth=2;g.beginPath();g.ellipse(cx,cy,k*unit*1.4,k*unit*.85,i*.4,0,Math.PI*2);g.stroke();}
 }
 g.globalAlpha=1;g.lineWidth=1;
}
function animate(now){
 requestAnimationFrame(animate);if(document.hidden||now-lastFrame<(reduced?150:30))return;lastFrame=now;
 const t=now*.00015;ctx.clearRect(0,0,width,height);
 for(const s of stars){const y=(s.y-now*.002*s.s+height*100)%height;ctx.beginPath();ctx.arc(s.x,y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(180,209,154,${.13+(Math.sin(t+s.t)+1)*.17})`;ctx.fill();}
 paintRitual(now);if(apocalypseState)paintApocalypse(now);
}
window.addEventListener('resize',resize);resize();requestAnimationFrame(animate);updateCount();
