'use strict';
const STORAGE='new-general-kristina-my-life-lately-v1';
let state={values:{},visited:{},attempts:{},solved:{},lastTried:{}};try{state={...state,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch(e){}
const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch(e){}};
const vals=state.values;const key=(s)=>String(s).replace(/[^a-z0-9_-]/ig,'_');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
const ANSWERS={};
const OPTION_ORDERS={};
const bind=(id,ans,type='one')=>{ANSWERS[id]={ans,type};return id};
// Stable per-question shuffling means answers never jump around between visits.
const stableShuffle=(id,source)=>{
  const arr=source.map((value,original)=>({value,original}));
  let seed=2166136261;
  for(const c of id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  for(let i=arr.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}
  // Prevent the original unshuffled question from occasionally appearing unchanged.
  if(arr.length>2&&arr.every((x,i)=>x.original===i))arr.push(arr.shift());
  // Deliberately non-sequential warm-up keys: C, A, B.
  const warmup={p1d1:[1,2,0],p1d2:[1,2,0],p1d3:[0,2,1]};
  if(warmup[id]&&arr.length===3)return warmup[id].map(i=>({value:source[i],original:i}));
  return arr;
};
const choicesFor=(id,opts,correct)=>{
  if(correct===null||correct===undefined)return {opts,correct};
  const order=stableShuffle(id,opts);
  OPTION_ORDERS[id]=order.map(x=>x.original);
  return {opts:order.map(x=>x.value),correct:Array.isArray(correct)?correct.map(i=>order.findIndex(x=>x.original===i)):order.findIndex(x=>x.original===correct)};
};
const S=(h,body)=>`<section class="section"><h2 class="section-title">${h}</h2>${body}</section>`;
const intro=(p)=>`<p class="intro">${p}</p>`;
const box=(c,cls='frame')=>`<div class="${cls}">${c}</div>`;
const tip=(title,arr)=>`<div class="callout"><strong>${esc(title)}</strong>${arr.map(x=>`<p>${x}</p>`).join('')}</div>`;
const divider=()=>'<div class="separator"></div>';
const note=(x)=>`<p class="muted small">${x}</p>`;
const input=(id,label='',placeholder='Your answer',answers=null,lines=1)=>{if(answers!==null)bind(id,answers,'text');let v=esc(vals[id]||'');return `<div class="input-row">${label?`<label class="input-label" for="${key(id)}">${label}</label>`:''}${lines>1?`<textarea class="text-input" id="${key(id)}" data-k="${id}" rows="${lines}" placeholder="${esc(placeholder)}">${v}</textarea>`:`<input class="answer-input" id="${key(id)}" data-k="${id}" value="${v}" placeholder="${esc(placeholder)}">`}<div class="correction" data-correction="${id}"></div></div>`};
const mc=(id,q,opts,correct=null,vertical=true)=>{({opts,correct}=choicesFor(id,opts,correct));if(correct!==null)bind(id,correct,'one');return `<div class="question" data-block="${id}"><div class="question-title">${q}</div><div class="opts ${vertical?'vertical':''}">${opts.map((o,j)=>`<label class="option"><input type="radio" name="${id}" data-k="${id}" value="${j}" ${String(vals[id])===String(j)?'checked':''}><span>${o}</span></label>`).join('')}</div><div class="correction" data-correction="${id}"></div></div>`};
const checklist=(id,q,opts,correct=null)=>{({opts,correct}=choicesFor(id,opts,correct));if(correct!==null)bind(id,correct,'many');const chosen=Array.isArray(vals[id])?vals[id]:[];return `<div class="question" data-block="${id}"><div class="question-title">${q}</div><div class="opts vertical">${opts.map((o,j)=>`<label class="option"><input type="checkbox" data-k="${id}" value="${j}" ${chosen.includes(j)?'checked':''}><span>${o}</span></label>`).join('')}</div><div class="correction" data-correction="${id}"></div></div>`};
const dropdown=(id,label,opts,ans=null)=>{({opts,correct:ans}=choicesFor(id,opts,ans));if(ans!==null)bind(id,ans,'one');let v=vals[id]??'';return `<div class="match-row" data-block="${id}"><span>${label}</span><div><select data-k="${id}" class="choice-select"><option value="">Choose...</option>${opts.map((o,i)=>`<option value="${i}" ${String(v)===String(i)?'selected':''}>${esc(o)}</option>`).join('')}</select><div class="correction" data-correction="${id}"></div></div></div>`};
const matches=(prefix,terms,defs,keyArr)=>{
 const ordered=stableShuffle(prefix+'-definitions',defs),d=ordered.map(x=>x.value);
 const answers=keyArr.map(i=>ordered.findIndex(x=>x.original===i));
 return `<div class="connect-widget" data-match-prefix="${prefix}"><div class="connect-help">Select a word and then its meaning. Correct pairs drop to the completed area below.</div><div class="connect-board"><svg class="connect-lines" aria-hidden="true"></svg><div class="connect-col connect-words">${terms.map((word,i)=>{const id=prefix+i;bind(id,answers[i],'one');return `<div class="connect-row" data-match-row="${id}"><button type="button" class="connect-card" data-connect-prefix="${prefix}" data-connect-side="left" data-connect-index="${i}"><span class="connect-letter">${i+1}</span>${word}</button><div class="correction" data-correction="${id}"></div></div>`}).join('')}</div><div class="connect-col connect-defs">${d.map((def,i)=>`<button type="button" class="connect-card" data-connect-prefix="${prefix}" data-connect-side="right" data-connect-index="${i}"><span class="connect-letter">${String.fromCharCode(65+i)}</span>${def}</button>`).join('')}</div></div><div class="matches-done" aria-label="Completed matches"><div class="matches-done-title">MATCHED PAIRS</div><div class="matched-pairs"></div></div></div>`;
};
const inlineGapset=(prefix,rows,answers)=>{
 const words=stableShuffle(prefix+'-word-bank',answers.map(a=>Array.isArray(a)?a[0]:a)).map(x=>x.value);
 return `<div class="word-bank drag-bank" data-bank="${prefix}"><span class="bank-instruction">DRAG OR TAP A WORD</span>${words.map(word=>`<button type="button" draggable="true" class="word-chip draggable-word" data-bank-prefix="${prefix}" data-bank-word="${esc(word)}">${esc(word)}</button>`).join('')}</div>`+
 rows.map((r,i)=>{const id=prefix+i;bind(id,answers[i],'text');const [before,after]=r.split('______');return `<div class="inline-sentence" data-block="${id}"><span>${before}</span> <input aria-label="Missing word for sentence ${i+1}" class="answer-input inline-answer bank-input" data-bank-slot="${prefix}" data-k="${id}" value="${esc(vals[id]||'')}" placeholder="Drop or type" autocomplete="off"> <span>${after||''}</span><div class="correction" data-correction="${id}"></div></div>`}).join('');
};
const gapset=(prefix,rows,answers)=>rows.map((r,i)=>input(prefix+i,r, 'Write the missing word(s)',answers?answers[i]:null)).join('');
const chipQuiz=(id,q,labels,correct=null)=>{({opts:labels,correct}=choicesFor(id,labels,correct));if(correct!==null)bind(id,correct,'one');return `<div class="question" data-block="${id}"><div class="question-title">${q}</div><div class="chip-options">${labels.map((x,i)=>`<button class="small-choice ${String(vals[id])===String(i)?'selected':''}" data-chip="${id}" data-val="${i}" type="button">${esc(x)}</button>`).join('')}</div><div class="correction" data-correction="${id}"></div></div>`};
const photoSequence={};
// Direct public-photo-CDN URLs: Unsplash and Pexels. Nothing needs to exist in assets/gallery.
const PHOTO_URLS={
 fashion:[['https://images.unsplash.com/photo-1483985988355-763728e1935b?w=960&q=82','https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=960'],['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=960&q=82'],['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=960&q=82','https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=960']],
 beauty:[['https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=960&q=82'],['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=960&q=82','https://images.pexels.com/photos/264794/pexels-photo-264794.jpeg?auto=compress&cs=tinysrgb&w=960']],
 cinema:[['https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=960&q=82','https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=960'],['https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=960&q=82'],['https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=960&q=82','https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=960']],
 cat:[['https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=960&q=82']],
 camera:[['https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=960&q=82','https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=960'],['https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=960&q=82']],
 coffee:[['https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=960&q=82']],
 room:[['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=960&q=82','https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=960'],['https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=960&q=82']],
 style:[['https://images.pexels.com/photos/994517/pexels-photo-994517.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=960&q=82'],['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=960&q=82','https://images.pexels.com/photos/994517/pexels-photo-994517.jpeg?auto=compress&cs=tinysrgb&w=960']],
 fun:[['https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=960&q=82','https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=960']],
 food:[['https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=960','https://images.unsplash.com/photo-1547592180-85f173990554?w=960&q=82']]
};
Object.assign(PHOTO_URLS,{
 office:[['https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=960&q=85','https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=960']],
 gaming:[['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=960&q=85','https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=960']],
 music:[['https://images.unsplash.com/photo-1516280440614-37939d9a51de?w=960&q=85','https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=960']],
 weekend:[['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=960&q=85','https://images.pexels.com/photos/347141/pexels-photo-347141.jpeg?auto=compress&cs=tinysrgb&w=960']]
});
const image=(id,alt,cls='')=>{
 const seq=photoSequence[id]||0;photoSequence[id]=seq+1;
 const [src,backup]=(PHOTO_URLS[id]||PHOTO_URLS.fashion)[seq%(PHOTO_URLS[id]||PHOTO_URLS.fashion).length];
 const placeholder=lessonIllustration(alt,id);
 return `<img class="photo ${cls}" style="background-image:url('${placeholder}');background-size:cover;background-position:center" src="${src}" data-image-key="${id}" data-backup="${backup}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" onerror="handleLessonImage(this)">`;
};
// Compact original illustrations used when remote photographs cannot be loaded.
const lessonIllustration=(alt,theme='general')=>{
 const palettes={
  office:['#dae8fa','#c4d6f7','#687bc6'],gaming:['#eee0fb','#dec2fa','#8665c9'],
  music:['#ffe6d4','#fad2bd','#e19b72'],weekend:['#e0f4e7','#bfebd3','#63aa8e'],
  coffee:['#ffeadc','#efd7ce','#bd8e81'],general:['#eae5f5','#d8d0e9','#9383b1']
 };
 const [bg,shape,ink]=palettes[theme]||palettes.general;
 const details={
 office:`<rect x="237" y="176" width="468" height="220" rx="19" fill="#ffffff" stroke="${ink}" stroke-width="12"/><rect x="264" y="198" width="414" height="169" rx="8" fill="${ink}" opacity=".16"/><path d="M207 406H737L699 440H248Z" fill="#fff" stroke="${ink}" stroke-width="11" stroke-linejoin="round"/><rect x="443" y="384" width="60" height="15" rx="5" fill="${ink}" opacity=".45"/><rect x="580" y="233" width="65" height="62" rx="7" fill="#ffccaa"/><circle cx="365" cy="280" r="34" fill="#bda8f1"/><rect x="405" y="266" width="139" height="12" rx="6" fill="${ink}" opacity=".55"/><rect x="405" y="294" width="99" height="12" rx="6" fill="${ink}" opacity=".32"/>`,
 gaming:`<path d="M303 225Q321 197 375 197H585Q639 197 657 225L739 366Q758 421 703 432Q682 436 649 413L582 363H377L310 413Q277 437 256 431Q202 420 221 366Z" fill="#fff" stroke="${ink}" stroke-width="12"/><path d="M331 258V333M292 295H370" stroke="${ink}" stroke-width="17" stroke-linecap="round"/><circle cx="607" cy="265" r="17" fill="#f0a8c4"/><circle cx="652" cy="309" r="17" fill="#ffd49e"/><circle cx="561" cy="309" r="17" fill="#9bcdbd"/><circle cx="458" cy="321" r="9" fill="${ink}"/><circle cx="496" cy="321" r="9" fill="${ink}"/>`,
 music:`<circle cx="486" cy="288" r="171" fill="#fff" stroke="${ink}" stroke-width="14"/><circle cx="486" cy="288" r="131" fill="${ink}" opacity=".20"/><circle cx="486" cy="288" r="95" fill="#fff" opacity=".7"/><circle cx="486" cy="288" r="55" fill="${ink}" opacity=".76"/><circle cx="486" cy="288" r="13" fill="#fff"/><path d="M668 129q82-20 107 66v120" fill="none" stroke="${ink}" stroke-width="14" stroke-linecap="round"/><rect x="729" y="278" width="67" height="108" rx="28" fill="#fff" stroke="${ink}" stroke-width="12"/>`,
 weekend:`<path d="M203 246Q352 193 480 261Q608 193 757 246V421Q618 377 480 439Q345 377 203 421Z" fill="#fff" stroke="${ink}" stroke-width="12" stroke-linejoin="round"/><path d="M480 264V438" stroke="${ink}" stroke-width="10"/><path d="M260 281q90-20 167 17M260 322q85-15 167 17M528 300q85-37 168-19M528 343q91-34 168-18" stroke="${ink}" opacity=".43" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M695 142q8-65 80-57" stroke="${ink}" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="790" cy="82" r="18" fill="#f6bdaa"/>`,
 coffee:`<rect x="201" y="135" width="480" height="277" rx="22" fill="#fff" stroke="${ink}" stroke-width="14"/><rect x="230" y="165" width="421" height="210" rx="9" fill="${ink}" opacity=".2"/><path d="M172 427H714L679 451H207Z" fill="#fff" stroke="${ink}" stroke-width="12"/><rect x="726" y="242" width="93" height="131" rx="16" fill="#fff" stroke="${ink}" stroke-width="12"/><path d="M819 278q65-3 40 52q-12 25-40 15" fill="none" stroke="${ink}" stroke-width="12"/><path d="M748 223q-17-19 0-40M782 219q17-22 0-40" stroke="${ink}" stroke-width="9" fill="none" stroke-linecap="round"/>`
 };
 const graphic=details[theme]||details.weekend;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${shape}"/></linearGradient></defs><rect width="960" height="540" fill="url(#bg)"/><circle cx="815" cy="78" r="160" fill="#fff" opacity=".27"/><circle cx="80" cy="474" r="165" fill="#fff" opacity=".25"/><path d="M70 125l45-28 45 28M770 458l32-20 33 20" stroke="${ink}" stroke-width="6" fill="none" opacity=".35" stroke-linecap="round"/>${graphic}</svg>`;
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
};

window.handleLessonImage=img=>{
 if(img.dataset.fallbackStage!=='secondary'){
  img.dataset.fallbackStage='secondary';img.src=img.dataset.backup;return;
 }
 img.onerror=null;img.dataset.fallbackStage='illustrated';
 img.src=lessonIllustration(img.alt,img.dataset.imageKey);
};
const inlineChoice=(id,sentence,options,answer)=>{
 const {opts,correct}=choicesFor(id,options,answer);bind(id,correct,'one');
 const pieces=sentence.split('___');const v=vals[id]??'';
 return `<div class="inline-question" data-block="${id}"><div class="inline-question-body"><span>${esc(pieces[0])}</span><select class="inline-select choice-select" aria-label="Choose the verb form" data-k="${id}" style="width:calc(${Math.min(40,Math.max(7,(v===''?'Choose…':opts[Number(v)]||'Choose…').length))}ch + 43px)"><option value="">Choose…</option>${opts.map((o,i)=>`<option value="${i}" ${String(v)===String(i)?'selected':''}>${esc(o)}</option>`).join('')}</select><span>${esc(pieces.slice(1).join('___'))}</span></div><div class="correction" data-correction="${id}"></div></div>`;
};
const bankGapset=(prefix,rows,answers)=>{
 const expanded=answers.map(a=>Array.isArray(a)?a[0]:a);
 const shuffled=stableShuffle(prefix+'-bank',expanded).map(x=>x.value);
 return `<div class="word-bank drag-bank" data-bank="${prefix}"><span class="bank-instruction">DRAG OR TAP A WORD</span>${shuffled.map((word,i)=>`<button type="button" draggable="true" class="word-chip draggable-word" data-bank-word="${esc(word)}" data-bank-prefix="${prefix}">${esc(word)}</button>`).join('')}</div>`+
 rows.map((r,i)=>{const id=prefix+i;bind(id,answers[i],'text');const pieces=r.split('______');return `<div class="bank-sentence" data-block="${id}"><span>${esc(pieces[0])}</span><input class="answer-input bank-input" data-k="${id}" data-bank-slot="${prefix}" aria-label="Missing phrase ${i+1}" placeholder="Drop or type" value="${esc(vals[id]||'')}"><span>${esc(pieces.slice(1).join('______'))}</span><div class="correction" data-correction="${id}"></div></div>`}).join('');
};
const reorderActivity=(prefix,rows,answers)=>rows.map((row,i)=>{
 const id=prefix+i;bind(id,answers[i],'reorder');
 const pieces=row.replace(/^\d+\.\s*/, '').split(' / ').map(x=>x.trim()),order=stableShuffle(id+'-tiles',pieces).map(x=>x.value);
 const picked=Array.isArray(vals[id])?vals[id]:[];
 return `<div class="reorder-question" data-reorder="${id}" data-block="${id}"><div class="reorder-title">${i+1}. Arrange the words</div><div class="reorder-tray">${order.map((w,j)=>`<button type="button" draggable="true" data-tile="${j}" data-reorder-id="${id}" class="reorder-tile ${picked.includes(j)?'in-answer':''}">${esc(w)}</button>`).join('')}</div><div class="reorder-target" data-reorder-target="${id}" aria-label="Drop words here in order">${picked.length?'':'Drop or tap the words here in the correct order'}</div><div class="reorder-actions"><button type="button" class="outline-btn" data-reorder-clear="${id}">CLEAR</button><button type="button" class="nav-button primary" data-reorder-check="${id}">CHECK</button></div><div class="correction" data-correction="${id}"></div></div>`;
}).join('');
const card=(title,txt,id,alt)=>`<div class="card">${image(id,alt)}<h3>${title}</h3><p>${txt}</p></div>`;
const feedPost=(handle,caption,id,alt)=>`<div class="post"><div class="post-head"><span class="avatar">${handle.slice(1,2).toUpperCase()}</span><div><div class="handle">${handle}</div><div class="dim">Suggested for you</div></div><span style="margin-left:auto">···</span></div>${image(id,alt)}<div class="post-body">${caption}</div><div class="post-icons">♡ &nbsp; ♧ &nbsp; ↗ <span style="margin-left:auto">♧</span></div></div>`;
const dialog=(who,text)=>`<div class="speech-bubble"><div class="bubble-speaker">${who}</div>${text}</div>`;
const speech=(text)=>`<div class="speakline"><span>${text}</span><button type="button" class="tool-btn" data-speak="${esc(text.replace(/<[^>]*>/g,''))}" aria-label="Listen">▶ Listen</button></div>`;
const sort=(id,items,zones,correct)=>{if(correct!==null)bind(id,correct,'sort');let v=vals[id]||items.map(()=>-1);if(!Array.isArray(v)||v.length!==items.length)v=items.map(()=>-1);let html=`<div class="sort-widget" data-sort="${id}"><div class="sort-pool" data-zone="-1">${items.map((x,i)=>v[i]===-1?`<button draggable="true" class="sort-chip" data-item="${i}" data-sortkey="${id}" type="button">${esc(x)}</button>`:'').join('')}</div><div class="grid3">`;zones.forEach((z,zi)=>{html+=`<div class="sort-zone" data-zone="${zi}" role="button" tabindex="0"><h4>${esc(z[0])}</h4><p>${esc(z[1]||'')}</p><div class="zone-chips">${items.map((x,i)=>v[i]===zi?`<button draggable="true" type="button" data-sortkey="${id}" data-item="${i}" class="sort-chip">${esc(x)}</button>`:'').join('')}</div></div>`});html+='</div><p class="sort-note">Drag a sentence into a category, or tap the sentence and then a category.</p><div class="correction" data-correction="${id}"></div></div>';return html};
const rating=(id,label)=>`<div class="slider-wrap"><div style="display:flex;justify-content:space-between;align-items:center;gap:9px"><strong style="font-size:12px">${label}</strong><span class="metric" data-rateout="${id}">${vals[id]??3}/5</span></div><input type="range" min="1" max="5" step="1" data-k="${id}" value="${vals[id]??3}"><div class="slider-mark"><span>Not me</span><span>Exactly me</span></div></div>`;
const audioYT=()=>`<div class="youtube"><iframe title="Social media algorithms explained — CBC Kids News" src="https://www.youtube-nocookie.com/embed/F5tz887wXCY?rel=0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="link-btn" href="https://www.youtube.com/watch?v=F5tz887wXCY" target="_blank" rel="noopener noreferrer">↗ Watch on YouTube if the embedded player is unavailable</a><p class="web-alert">The video is streamed directly from YouTube. An internet connection is required for playback.</p>`;

const pages=[];const add=(title,type,mins,html,sectionName)=>pages.push({title,type,mins,html,sectionName});
// ─────────────── NEW GENERAL · KRISTINA EDITION · MY LIFE LATELY ───────────────
const photoTile=(source,title,description)=>`<div class="life-tile">${image(source,title)}<div class="life-tile-body"><strong>${title}</strong><span>${description}</span></div></div>`;
const questionList=(items)=>`<ol class="talk-list">${items.map(x=>`<li>${x}</li>`).join('')}</ol>`;
const yt=(id,title)=>`<div class="youtube"><iframe title="${esc(title)}" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="link-btn" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">↗ Open on YouTube</a>`;
const rule=(heading,description,example,cls='violet')=>`<div class="rule-card ${cls}"><div class="rule-title">${heading}</div><p>${description}</p><span>${example}</span></div>`;
const lifeArticle=`<div class="magazine-reading life-magazine">
  <div class="article-hero">${image('coffee','Person using a laptop in a bright cafe')}<span class="article-flag">THE DAILY EDIT</span></div>
  <div class="article-inner"><div class="article-overline">ADAPTED ARTICLE</div><h3>Is All Screen Time Bad?</h3>
  <p>Most of us spend a significant part of the day looking at screens. We work on laptops, message friends, watch videos and play games. But does that mean we're wasting our time?</p>
  <p>Experts interviewed by <i>The Guardian</i> argue that <b>what we do online matters more than simply counting the hours</b>. People tend to pick up their phones without a particular reason. They keep scrolling, moving from one app to another, and eventually lose track of time.</p>
  <p>However, not every online activity is passive. Video games may encourage problem-solving and bring people together. Drawing, writing and editing videos let us create something rather than just watch other people's content.</p>
  <p>These days, some people are trying to replace mindless scrolling with activities they find more rewarding, such as word games or learning a language. This doesn't mean that every minute of free time has to be productive. Watching a funny video can be a perfectly enjoyable break, too.</p>
  <p>The important question is whether we're choosing our activities or simply following the next recommendation on the screen.</p>
  <div class="article-source">Adapted for English learners from Hannah Coates, <i>The Guardian</i>, 22 May 2026. <a target="_blank" rel="noopener noreferrer" href="https://www.theguardian.com/lifeandstyle/2026/may/22/how-to-quit-doomscrolling-without-quitting-your-phone">Original article ↗</a></div>
  </div></div>`;

add('This Is Me','Speaking',4,
 S('A little about me',intro('Look at the pictures. Which one feels most like your life these days?')+`<div class="life-grid">${photoTile('office','Work mode','Projects, meetings, messages')}${photoTile('gaming','Off the clock','Games, series, stories')}${photoTile('music','My soundtrack','Music for every mood')}${photoTile('weekend','Free time','Plans, people, nothing at all')}</div>`+
 questionList(['Which picture best describes a normal weekday for you?','Which one best describes your perfect evening?','What would you add to show another important part of your life?'])+
 input('l1open','','My thoughts...',null,3)),'Warm-up');

add('What’s New with Me?','Speaking',4,
 S('Five quick updates',intro('Finish the sentences so they are true for you. Explain your answers.')+
 gapset('l2open',["1. Something I'm really into lately is...","2. At work, I'm currently...","3. I usually spend my evenings...","4. Something I'm trying to get around to is...","5. This month, I'm spending more time..."]))+
 S('Let’s talk',questionList(['What has changed most in your life over the past few months?','What is one thing you wish you had more time for?'])),'Warm-up');

add('Creature of Habit','Personal habits',4,
 S('How much do you relate?',intro('Rate each statement from 1 (not me) to 5 (exactly me).')+
 rating('l3r1','I check my phone as soon as I wake up.')+rating('l3r2','I tend to do the same things every weekend.')+rating('l3r3','I often stay up later than I planned.')+rating('l3r4','I keep putting off things I want to do.')+rating('l3r5','I find it difficult to switch off after work.'))+
 S('Tell me more',questionList(['Which of these habits have you had for years?','Has any of them become stronger or weaker lately?'])),'Warm-up');

add('A Typical Tuesday','Everyday routines',4,
 S('Three versions of a weekday',intro('Read the three routines. Match each person to the description.')+
 `<div class="routine-grid"><div class="story-card peach"><span>01 / ANYA</span><h3>9:00 → 18:00</h3><p>Regular office hours, a gym session, dinner, and the same podcast before bed.</p></div><div class="story-card lilac"><span>02 / MAX</span><h3>Flexible hours</h3><p>Different shifts every week. Sometimes he works all evening and catches up on sleep the next day.</p></div><div class="story-card mint"><span>03 / LENA</span><h3>A new project</h3><p>Normally relaxed after work, but right now she's working late and missing her usual plans.</p></div></div>`+
 dropdown('l4d1','1. Whose usual routine changes every week?',['Anya','Max','Lena'],1)+dropdown('l4d2','2. Who seems to be a creature of habit?',['Anya','Max','Lena'],0)+dropdown('l4d3','3. Whose present situation is temporary?',['Anya','Max','Lena'],2))+
 S('Make it personal',intro('Whose life is most similar to yours? Explain why.')+input('l4open','','My routine is closer to...',null,2)),'Warm-up');

add('Before You Watch','Video',3,
 S('One more video...',intro('What makes it so difficult to stop scrolling? Choose TWO possible reasons.')+
 checklist('l5check','Choose two.', ['There is no natural end to a feed.','You always know which post is coming next.','An interesting post might appear at any moment.','All short videos are educational.'],[0,2]))+
 S('Make a prediction',intro('What do a laboratory mouse and someone scrolling through TikTok have in common?')+input('l5open','','Your prediction...',null,2)),'Listening');

add('Why We Can’t Stop Scrolling','Video · 2:44',5,
 S('Watch the video',intro('Watch once without subtitles. Choose the main idea.')+yt('uBkeKv_6U4c','Why We Can’t Stop Scrolling — LearnFree')+
 mc('l6q1','Why do people keep scrolling?',['The next reward is unpredictable.','Most people are trying to learn something new.','Phones need to be used for a minimum amount of time.'],0))+
 S('Talk about it',questionList(['Which idea in the video surprised you?','Do you recognise this behaviour in your own daily life?'])),'Listening');

add('Watch Closer','Video',5,
 S('True or false?',intro('Watch the same video again. Choose True or False.')+yt('uBkeKv_6U4c','Why We Can’t Stop Scrolling — LearnFree')+
 [
 ['The mouse receives food every time it presses the bar.',1],
 ['Both the mouse and the person scrolling keep looking for a reward.',0],
 ['The reward on social media might be a funny or entertaining post.',0],
 ['Infinite feeds eventually run out of new posts.',1],
 ['The video says that people should never use social media.',1]
 ].map((x,i)=>mc('l7q'+i,`${i+1}. ${x[0]}`,['True','False'],x[1],false)).join('')),
 'Listening');

add('The Scroll Confession','Speaking',3,
 S('Which one is you?',intro('Choose the option closest to your real experience.')+
 mc('l8c1','When I get a notification, I usually...',['check it immediately.','wait until I finish what I’m doing.','ignore it for a long time.'])+
 mc('l8c2','If I open an app for five minutes, I...',['usually stop after five minutes.','sometimes lose track of time.','rarely even notice the time.']))+
 S('Discuss',questionList(['Which online activity do you find hardest to stop?','Is spending three hours gaming the same as spending three hours scrolling?','When is screen time genuinely enjoyable rather than distracting?'])),'Listening');

add('Is All Screen Time Bad?','Reading',5,
 S('Read the article',intro('Read the adapted article. Find out what matters more than the number of hours we spend online.')+lifeArticle)+
 S('Choose the main message',mc('l9q1','What does the article mainly suggest?',['People should avoid digital devices in their free time.','Some digital activities can be meaningful, creative or enjoyable.','Gaming is always better than watching videos.'],1)),'Reading');

add('Read Between the Lines','Reading',4,
 S('Check your understanding',intro('Choose the answer that best matches the article.')+
 mc('l10q1','What is one difference between active and passive screen use?',['Active use always means learning a language.','Active use involves making choices, creating or engaging.','Passive use happens only on social media.'],1)+
 mc('l10q2','Why can gaming be a rewarding activity?',['It can encourage problem-solving and connection.','It always improves productivity.','It prevents people from staying up late.'],0)+
 mc('l10q3','What does the author suggest we should consider?',['Whether every minute online is productive.','Whether we consciously choose how to spend our screen time.','Whether we have enough apps installed.'],1))+
 S('Your opinion',questionList(['Which part of the article do you agree with most?','What is something you do on a screen that genuinely makes you happy?'])),'Reading');

add('Words in Context','Vocabulary',3,
 S('Find the meaning',intro('Match each phrase from the article to its meaning.')+
 matches('l11m',['tend to','keep scrolling','lose track of time','mindless scrolling','get around to'],[
 'finally find time to do something','usually behave in a particular way','continue moving through content','forget how much time has passed','scroll without much thought'],[1,2,3,4,0])),'Vocabulary');

add('Connect the Meanings','Vocabulary',4,
 S('Match the pairs',intro('Select an expression on the left, then its meaning on the right.')+
 matches('l12m',['be hooked on','catch up on','get sidetracked','zone out','switch off','have a lot on your plate','go through a phase'],[
 'stop paying attention for a while','become distracted from the original task','have many tasks or responsibilities','be extremely interested in something','spend time on things you have missed','relax and stop thinking about work','have a temporary interest or habit'],[3,4,1,0,5,2,6])),'Vocabulary');

add('Everyday Vocabulary','Vocabulary',4,
 S('Complete the sentences',intro('Drag or tap the words to fill in the gaps.')+
 bankGapset('l13g',[
 '1. I was meant to send an email, but I ______ and started watching a video.',
 '2. After a really long workday, I just want to ______.',
 '3. I have three deadlines this week, so I really ______.',
 '4. I stayed up until 2 a.m. and completely ______.',
 '5. I am ______ the middle of a new game, so no spoilers!',
 '6. I haven’t ______ watching the finale yet.'
 ],['got sidetracked','switch off','have a lot on my plate','lost track of time','in','got around to'])),'Vocabulary');

add('Sound More Natural','Vocabulary',4,
 S('Which sounds more conversational?',intro('Choose the more natural phrase for an informal conversation.')+
 mc('l14q0','1. I’m currently very interested in this game.',['I’m really into this game.','I’m very interested concerning this game.'],0,false)+
 mc('l14q1','2. I have been repeatedly forgetting to reply.',['I keep forgetting to reply.','I tend to forgetting to reply.'],0,false)+
 mc('l14q2','3. I still haven’t found time to start the book.',['I’m not getting any time onto it.','I haven’t got around to starting it.'],1,false)+
 mc('l14q3','4. At the end of work, I need to relax mentally.',['I need to switch off.','I need to shut my head down.'],0,false))+
 S('Use your own examples',intro('Choose three expressions from this page or the previous page. Make your own sentences.')+input('l14open','','Write three sentences...',null,3)),'Vocabulary');

add('Habits or Changes?','Grammar',4,
 S('Sort the sentences',intro('Drag each sentence into its category. You can also tap a sentence and then its category.')+
 sort('l15sort',[
 'I normally work from home.','I am working late this week.','I think the story is brilliant.','She tends to stay up late.','We are testing a new feature at work.','I love this soundtrack.'
 ],[['USUAL HABITS','What happens regularly'],['TEMPORARY NOW','What is happening around now'],['OPINIONS / STATES','What someone thinks or feels']],[0,1,2,0,1,2]))+
 S('One more question',intro('Can a temporary situation last for several weeks? Give an example.')+input('l15open','','Your example...',null,2)),'Grammar');

add('What’s the Difference?','Grammar',4,
 S('Compare the meanings',intro('Choose what the highlighted sentence expresses.')+
 mc('l16q0','“I always check my messages.”',['A regular habit.','Annoyance about a repeated action.'],0,false)+
 mc('l16q1','“You’re always checking your messages!”',['A neutral daily routine.','An emotional reaction to repeated behaviour.'],1,false)+
 mc('l16q2','“I think this game is incredible.”',['I have an opinion.','I am considering a plan.'],0,false)+
 mc('l16q3','“I’m thinking about replaying the game.”',['I am considering a plan.','I believe this is a fact.'],0,false)+
 mc('l16q4','“I keep losing track of time.”',['An action that repeatedly happens.','An action that only happened once.'],0,false)),'Grammar');

add('Your Grammar Toolkit','Grammar',4,
 S('Look at the patterns',intro('Read the examples. Then answer the questions below.')+
 `<div class="rule-grid">${rule('Present Simple','Habits, regular routines and opinions.','I usually work from home.','peach')}${rule('Present Continuous','Temporary situations and changes.','I’m working in the office this week.','blue')}${rule('tend to + verb','Something you are generally likely to do.','I tend to stay up late.','violet')}${rule('keep + -ing','Something repeated or continued.','I keep forgetting my password.','mint')}${rule('always + Continuous','Repeated behaviour with an emotional tone.','You’re always stealing my charger!','pink')}${rule('think / thinking','Opinion versus considering a plan.','I think it’s good. / I’m thinking about it.','yellow')}</div>`+
 mc('l17q0','Which sentence describes a temporary change?',['I work at an IT company.','I’m working on a demanding project this month.'],1,false)+
 mc('l17q1','Which form normally follows “tend to”?',['The base form of the verb.','The -ing form.'],0,false)),'Grammar');

add('Tend, Keep, Always','Grammar',4,
 S('Choose the right construction',intro('Select the expression that fits the meaning.')+
 [
 ['I ___ check my emails first thing in the morning. That’s my usual habit.',['tend to','keep to','am always'],0],
 ['He ___ leaving his headphones at work. It has happened four times this month.',['tends','keeps','is keep'],1],
 ['My neighbour ___ playing loud music when I’m trying to sleep!',['is always','tends','keep'],0],
 ['We ___ order the same thing whenever we visit that café.',['keep to','tend to','always are'],1],
 ['I ___ getting distracted by group chats during meetings.',['keep','tend','am always to'],0]
 ].map((x,i)=>mc('l18q'+i,`${i+1}. ${x[0]}`,x[1],x[2],false)).join('')),
 'Grammar');

add('Think or Thinking?','Grammar',3,
 S('Pick the right form',intro('Complete the sentences using the correct form of “think”.')+
 inlineChoice('l19q0','I ___ this series is worth watching.',['think','am thinking'],0)+
 inlineChoice('l19q1','I ___ about buying a new monitor.',['think','am thinking'],1)+
 inlineChoice('l19q2','What ___ about the ending?',['do you think','are you thinking'],0)+
 inlineChoice('l19q3','Right now, we ___ about ways to improve the project.',['think','are thinking'],1))+
 S('Make it personal',intro('Write one opinion and one plan you are considering.')+input('l19open','','I think… / I’m thinking about…',null,2)),'Grammar');

add('Choose the Right Form','Grammar',4,
 S('Complete the sentences',intro('Choose the correct verb form in each sentence.')+
 inlineChoice('l20q0','I normally ___ at nine.',['start work','am starting work'],0)+
 inlineChoice('l20q1','This month, we ___ a new system at work.',['test','are testing'],1)+
 inlineChoice('l20q2','I ___ long meetings.',['am not liking','don’t like'],1)+
 inlineChoice('l20q3','She ___ a difficult time with this project right now.',['has','is having'],1)+
 inlineChoice('l20q4','I ___ how this feature works.',['don’t understand','am not understanding'],0)+
 inlineChoice('l20q5','He ___ for a new job at the moment.',['looks','is looking'],1)),'Grammar');

add('Something’s Not Right','Grammar',4,
 S('Fix the mistakes',intro('Rewrite each sentence correctly.')+
 gapset('l21fix',[
 '1. I tend staying up late on weekends.',
 '2. I am usually liking science-fiction films.',
 '3. He keeps to interrupt me during meetings.',
 '4. I am thinking this is the best episode.',
 '5. She is work on a new project this week.'
 ],[
 ['I tend to stay up late on weekends'],
 ['I usually like science-fiction films'],
 ['He keeps interrupting me during meetings'],
 ['I think this is the best episode'],
 ['She is working on a new project this week']
 ])),'Grammar');

add('Put It Together','Grammar',4,
 S('Build the sentences',intro('Put the words in the correct order. Tap or drag the words, then select Check.')+
 reorderActivity('l22r',[
 '1. keep / I / getting / distracted / by notifications',
 '2. tend to / on weekends / stay up late / I',
 '3. at the moment / we / a new feature / are testing',
 '4. always / borrowing / my charger / you are',
 '5. generally / I / quiet evenings / prefer'
 ],[
 'I keep getting distracted by notifications',
 'I tend to stay up late on weekends',
 'We are testing a new feature at the moment',
 'You are always borrowing my charger',
 'I generally prefer quiet evenings'
 ])),'Grammar');

add('Normal Me vs Current Me','Speaking',5,
 S('Two sides of my life',intro('Fill in the two columns. Compare your usual routines with what is happening lately.')+
 `<div class="compare-grid"><div class="compare-column"><div class="compare-top peach"><span>01</span><h3>NORMAL ME</h3></div>${input('l23normal1','Work','I normally...',null,2)}${input('l23normal2','Evenings','I usually...',null,2)}${input('l23normal3','Interests','Most of the time...',null,2)}</div><div class="compare-column"><div class="compare-top violet"><span>02</span><h3>CURRENT ME</h3></div>${input('l23current1','Work','These days I’m...',null,2)}${input('l23current2','Evenings','At the moment...',null,2)}${input('l23current3','Interests','Lately I’ve been...',null,2)}</div></div>`)+
 S('Explain your answers',intro('Talk about three differences. Use “normally”, “whereas”, “lately” and “at the moment”.')),'Speaking');

add('A Little Life Update','Final speaking',6,
 S('Your final challenge',intro('Imagine you’re recording a 2–3 minute life update for your friends. Prepare some notes, then speak naturally.')+
 `<div class="final-prompt"><div class="final-prompt-art">${image('weekend','Weekend photograph')}</div><div><span class="final-eyebrow">YOUR VIDEO DIARY</span><h3>A Little Life Update</h3><p>What does your life normally look like? What is keeping you busy? What are you into lately? What habits would you change?</p></div></div>`+
 `<div class="prompt-grid">${input('l24notes1','01 · My usual week','How I usually spend my time...',null,2)}${input('l24notes2','02 · Right now','What is changing or keeping me busy...',null,2)}${input('l24notes3','03 · Things I’m into','Music, games, people, hobbies...',null,2)}${input('l24notes4','04 · One habit','Something I keep doing or tend to do...',null,2)}</div>`)+
 S('Speaking checklist',intro('Tick each item as you use it.')+`<div class="checklist">${[
 'At least 5 vocabulary expressions from this lesson',
 'At least 2 examples of Present Simple',
 'At least 2 examples of Present Continuous',
 'At least 2 of: tend to / keep + -ing / always + Continuous',
 'Specific examples from your own life'
 ].map((x,i)=>`<label><input type="checkbox" data-k="p24check${i}" ${vals['p24check'+i]?'checked':''}>${x}</label>`).join('')}</div>`),'Final production');

add('Take It With You','Homework',4,
 S('One last check',intro('Choose the expression you want to start using more often.')+
 mc('l25fav','Which one do you want to remember?',['tend to','get sidetracked','switch off','lose track of time','keep + -ing'])+
 input('l25open','Write one sentence about yourself using it.','My sentence...',null,2))+
 S('Homework · Grammar',intro('Complete the sentences with the correct forms.')+
 gapset('l25g',[
 '1. This week I ______ (work) in the office, although I normally work from home.',
 '2. She tends ______ (spend) weekends reading.',
 '3. I keep ______ (forget) to reply.',
 '4. I ______ (think) about starting a new series.',
 '5. I ______ (think) that ending was brilliant.'
 ],[
 ['am working'],
 ['to spend'],['forgetting'],['am thinking',"'m thinking"],['think']
 ]))+
 S('Homework · Video',intro('Watch the video (2:44). Then answer the questions.')+yt('_FSMLVY9vD8','Why We Can’t Just Pick a Movie — GCFGlobal')+
 mc('l25v1','What is “choice paralysis”?',['Being unable to choose because there are too many options.','Not having enough options.','Choosing a movie too quickly.'],0)+
 mc('l25v2','Which advice is given in the video?',['Always find the perfect movie.','Reduce your options and lower your expectations.','Watch every available trailer.'],1)+
 input('l25v3','Have you experienced this? Explain.','Your answer...',null,3))+
 S('Homework · Writing',intro('Write a 130–160 word post called “My Life Lately”. Mention your routine, current interests and one habit you want to change. Use at least six new expressions.')+
 input('l25writing','','Write your post here...',null,9)),'Homework');

// ───────────────────────────────────── APPLICATION ENGINE ─────────────────────────────────────
let pageIdx=Math.min(pages.length-1,Math.max(0,+(new URLSearchParams(location.search).get('page')||1)-1));let pendingSort=null;
function renderNav(){const nav=document.getElementById('chapterList');nav.innerHTML=pages.map((p,i)=>`<button class="chapter ${i===pageIdx?'active':''} ${state.visited[i]?'done':''}" type="button" data-page="${i}"><span class="no">${String(i+1).padStart(2,'0')}</span><span class="chapter-title">${esc(p.title)}</span></button>`).join('');nav.querySelector('.active')?.scrollIntoView({block:'nearest'});}
function updateResult4(){let ans=[0,1,2,3,4].map(i=>vals['p4q'+i]);let target=document.getElementById('p4result');if(!target)return;if(ans.some(v=>v===undefined||v==='')){target.innerHTML='<strong>Your result</strong><p>Choose all five answers to calculate your profile.</p>';return;}let table=[[0,1,2],[1,2,0],[2,0,1],[1,0,2],[0,2,1]];let names=['THE COLLECTOR','THE EXPLORER','THE SOCIAL CONNECTOR'];let scores=[0,0,0];ans.forEach((v,i)=>scores[table[i][+v]]++);let high=Math.max(...scores);let win=names.filter((x,i)=>scores[i]===high);target.innerHTML=`<strong>YOUR RESULT</strong><h3 style="margin:4px 0">${win.join(' + ')}</h3><p>${win.length>1?'You are a mixture of these types.':'This is your strongest scrolling style.'} Do you agree with the result?</p>`;}
function updateCounter23(){const el=document.getElementById('p23summary');if(!el)return;const arr=[0,1,2,3,4,5].map(i=>vals['p23p'+i]);let k=arr.filter(x=>x==='0').length,s=arr.filter(x=>x==='1').length,m=arr.filter(x=>x==='2').length;el.innerHTML=`<strong>Your decisions</strong><p>Keep: <b>${k} / 3</b> · Scroll past: <b>${s} / 2</b> · Maybe: <b>${m} / 1</b></p><p class="${k===3&&s===2&&m===1?'task-result good':'muted small'}">${k===3&&s===2&&m===1?'✓ Your six decisions are complete.':'Choose exactly three to keep, two to scroll past, and one maybe.'}</p>`;}
function updateLive(){updateResult4();updateCounter23();document.querySelectorAll('[data-rateout]').forEach(el=>el.textContent=(vals[el.dataset.rateout]||3)+'/5');}
function render(keepScroll=false){const oldY=window.scrollY;const p=pages[pageIdx];state.visited[pageIdx]=true;save();document.getElementById('intro').innerHTML=`<h1 class="page-heading">${esc(p.title)}</h1>`;document.getElementById('content').innerHTML=`<div class="content-surface">${p.html}</div>`;document.getElementById('progressNum').textContent=`${pageIdx+1} / ${pages.length}`;document.getElementById('prev').disabled=pageIdx===0;document.getElementById('next').textContent=pageIdx===pages.length-1?(state.finished?'Completed ✓':'Finish lesson ✓'):'Next →';renderNav();updateLive();paintAnswerStatuses();updateMatchLayouts();refreshReorders();drawConnections();document.getElementById('rail').classList.remove('open');if(keepScroll)window.scrollTo(0,oldY);else window.scrollTo({top:0,behavior:'instant'});}
function navigate(n){pageIdx=Math.max(0,Math.min(pages.length-1,n));try{history.replaceState(null,'',location.pathname+'?page='+(pageIdx+1))}catch(e){}render();}
function formatAnswer(el,ans,id){if(ans===null||ans===undefined)return '';const spec=ANSWERS[id];if(spec?.type==='one'){if(el?.matches('[data-match-row]')){const widget=el.closest('[data-match-prefix]');const b=widget?.querySelector(`[data-connect-side="right"][data-connect-index="${ans}"]`);return b?.innerText?.trim()||String(ans)}let opt=el?.querySelector(`input[value="${ans}"]`);if(opt)return opt.closest('label')?.innerText?.trim()||'';let sel=el?.querySelector('select');if(sel)return sel.options[Number(ans)+1]?.text||String(ans);let btn=el?.querySelectorAll('.small-choice')[Number(ans)];if(btn)return btn.textContent.trim();}if(spec?.type==='many')return ans.map(i=>el?.querySelector(`input[value="${i}"]`)?.closest('label')?.innerText?.trim()).filter(Boolean).join(' · ');if(Array.isArray(ans))return ans[0];return String(ans)}
function validate(id){const spec=ANSWERS[id];if(!spec||spec.ans===null)return null;const entered=vals[id];if(spec.type==='one')return String(entered)===String(spec.ans);if(spec.type==='many'){const a=Array.isArray(entered)?entered.map(Number).sort():[],b=spec.ans.map(Number).sort();return a.length===b.length&&a.every((v,i)=>v===b[i]);}if(spec.type==='text'){const aliases=Array.isArray(spec.ans)?spec.ans:[spec.ans];return aliases.some(a=>norm(entered)===norm(a));}if(spec.type==='reorder')return norm(entered)===norm(spec.ans);if(spec.type==='sort')return Array.isArray(entered)&&entered.length===spec.ans.length&&entered.every((v,i)=>v===spec.ans[i]);return false;}
const currentBlock=id=>{const root=document.getElementById('content');return root.querySelector(`[data-block="${id}"]`)||root.querySelector(`[data-match-row="${id}"]`)||root.querySelector(`[data-k="${id}"]`)?.closest('.input-row')||root.querySelector(`[data-sort="${id}"]`)||root.querySelector(`[data-reorder="${id}"]`)};
function completed(id){return state.solved?.[id]||((state.attempts?.[id]||0)>=3)}
let lessonAudio=null;
function playFeedback(correct){
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  lessonAudio=lessonAudio||new Audio();if(lessonAudio.state==='suspended')lessonAudio.resume();
  const now=lessonAudio.currentTime+0.01;
  const note=(freq,time,duration,volume,wave='sine')=>{
   const osc=lessonAudio.createOscillator(),gain=lessonAudio.createGain();osc.type=wave;osc.frequency.setValueAtTime(freq,time);
   gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+0.012);gain.gain.exponentialRampToValueAtTime(0.0001,time+duration);
   osc.connect(gain);gain.connect(lessonAudio.destination);osc.start(time);osc.stop(time+duration+0.02);
  };
  if(correct){note(784,now,0.15,0.065);note(1175,now+0.105,0.24,0.06);}
  else{note(215,now,0.11,0.024,'triangle');note(180,now+0.075,0.13,0.015,'triangle');}
 }catch(e){/* Audio is an optional enhancement; never break an answer */}
}
function refreshReorders(){document.querySelectorAll('[data-reorder]').forEach(widget=>{
 const id=widget.dataset.reorder,raw=Array.isArray(vals[id])?vals[id]:[],target=widget.querySelector('[data-reorder-target]');
 const chips=[...widget.querySelectorAll('[data-tile]')];
 target.innerHTML='';if(!raw.length)target.textContent='Drop or tap the words here in the correct order';
 raw.forEach(i=>{const source=chips.find(c=>+c.dataset.tile===+i);if(!source)return;const tile=document.createElement('button');tile.type='button';tile.className='reorder-tile in-answer';tile.textContent=source.textContent;tile.dataset.reorderRemove=id;tile.dataset.tile=i;tile.draggable=true;target.appendChild(tile)});
 chips.forEach(c=>c.classList.toggle('in-answer',raw.includes(+c.dataset.tile)));
 const disabled=completed(id);widget.querySelectorAll('.reorder-tile, [data-reorder-check]').forEach(n=>n.disabled=disabled);
 });}
function updateMatchLayouts(){document.querySelectorAll('[data-match-prefix]').forEach(widget=>{
 const prefix=widget.dataset.matchPrefix,done=widget.querySelector('.matched-pairs');if(!done)return;
 const board=widget.querySelector('.connect-board'),leftcol=widget.querySelector('.connect-words'),rightcol=widget.querySelector('.connect-defs');
 const before=new Map();widget.querySelectorAll('[data-connect-side]').forEach(el=>before.set(el,el.getBoundingClientRect()));
 [...widget.querySelectorAll('[data-connect-side="left"]')].sort((a,b)=>a.dataset.connectIndex-b.dataset.connectIndex).forEach(left=>{
  const id=prefix+left.dataset.connectIndex,row=left.closest('.connect-row')||left.closest('.match-complete-row'),finished=completed(id);
  if(finished){
   const correct=ANSWERS[id]?.ans;
   const right=widget.querySelector(`[data-connect-side="right"][data-connect-index="${correct}"]`);
   if(!right)return;
   const pair=done.querySelector(`[data-finished-id="${id}"]`)||document.createElement('div');
   pair.dataset.finishedId=id;pair.className='match-complete-row';
   if(!pair.isConnected)done.appendChild(pair);
   pair.appendChild(left);pair.appendChild(right);
   let status=pair.querySelector('.pair-status');if(!status){status=document.createElement('span');status.className='pair-status';pair.appendChild(status);}
   status.textContent=state.solved[id]?'✓ Matched':'✓ Answer revealed';
   left.disabled=true;right.disabled=true;
   if(row?.matches('.connect-row'))row.style.display='none';
  }else{const original=widget.querySelector(`[data-match-row="${id}"]`);if(original&&!original.contains(left))original.insertBefore(left,original.firstChild);}
 });
 widget.querySelector('.matches-done').classList.toggle('empty',!done.children.length);
 // Smooth FLIP transition as correctly matched cards travel below the remaining boxes.
 widget.querySelectorAll('[data-connect-side]').forEach(el=>{
  const initial=before.get(el),after=el.getBoundingClientRect();if(!initial||!after.width)return;
  const dx=initial.left-after.left,dy=initial.top-after.top;
  if((Math.abs(dx)+Math.abs(dy))>3&&el.animate){el.animate([{transform:`translate(${dx}px,${dy}px)`,opacity:.85},{transform:'translate(0,0)',opacity:1}],{duration:340,easing:'cubic-bezier(.2,.8,.2,1)'});}
 });
 });}
function paintSingle(id){const spec=ANSWERS[id];if(!spec||spec.ans===null)return;const container=currentBlock(id);if(!container)return;const wasTried=(state.attempts?.[id]||0)>0||!!state.solved?.[id];const ok=!!state.solved?.[id];const exhausted=(state.attempts?.[id]||0)>=3&&!ok;const cor=container.querySelector(`[data-correction="${id}"]`);const hasAnswer=vals[id]!==undefined&&vals[id]!=='';container.classList.toggle('answered-right',ok);container.classList.toggle('answered-wrong',!ok&&wasTried);container.querySelectorAll('.option,.small-choice,.answer-input,.choice-select,.connect-card').forEach(n=>{n.classList.remove('correct','incorrect');if(!wasTried)return;if(n.matches('.option')&&n.querySelector('input:checked'))n.classList.add(ok?'correct':'incorrect');if(n.matches('.small-choice')&&String(n.dataset.val)===String(vals[id]))n.classList.add(ok?'correct':'incorrect');if(n.matches('.answer-input,.choice-select,.connect-card'))n.classList.add(ok?'correct':'incorrect')});container.querySelectorAll('input,select,button[data-chip]').forEach(n=>{if(completed(id))n.disabled=true});if(cor){cor.style.display=wasTried?'block':'none';cor.className='correction '+(ok?'right':'wrong');cor.textContent=ok?'✓ Correct':exhausted?`✕ No attempts left. Correct answer: ${formatAnswer(container,spec.ans,id)}`:`✕ Try again · ${3-(state.attempts[id]||0)} ${3-state.attempts[id]===1?'attempt':'attempts'} left`;}}
function paintAnswerStatuses(){Object.keys(ANSWERS).forEach(id=>paintSingle(id));document.querySelectorAll('[data-match-prefix]').forEach(widget=>{const prefix=widget.dataset.matchPrefix;widget.querySelectorAll('[data-connect-side="left"]').forEach(button=>{const i=+button.dataset.connectIndex,id=prefix+i;button.classList.toggle('matched-right',!!state.solved[id]);button.classList.toggle('matched-wrong',!state.solved[id]&&(state.attempts[id]||0)>0);if(completed(id))button.disabled=true});widget.querySelectorAll('[data-connect-side="right"]').forEach(button=>{const idx=+button.dataset.connectIndex;const solved=Array.from(widget.querySelectorAll('[data-connect-side="left"]')).some(left=>state.solved[prefix+left.dataset.connectIndex]&&String(vals[prefix+left.dataset.connectIndex])===String(idx));button.classList.toggle('matched-right',solved);button.disabled=solved;});});}
function checkOne(id){const spec=ANSWERS[id];if(!spec||spec.ans==null||completed(id))return;const v=vals[id];if(v==null||v===''||(Array.isArray(v)&&!v.length))return;const signature=JSON.stringify(v);if(state.lastTried?.[id]===signature)return;state.lastTried[id]=signature;const right=validate(id);if(right){state.solved[id]=true}else{state.attempts[id]=(state.attempts[id]||0)+1;}playFeedback(right);save();paintSingle(id);paintAnswerStatuses();updateMatchLayouts();refreshReorders();drawConnections();}
let inputTimers={};function scheduleCheck(id,immediate=false){clearTimeout(inputTimers[id]);if(!ANSWERS[id])return;inputTimers[id]=setTimeout(()=>checkOne(id),immediate?0:1300)}
function drawConnections(){document.querySelectorAll('[data-match-prefix]').forEach(widget=>{const svg=widget.querySelector('.connect-lines');if(!svg)return;const board=widget.querySelector('.connect-board'),rect=board.getBoundingClientRect();if(!rect.width)return;svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);svg.innerHTML='';const prefix=widget.dataset.matchPrefix;widget.querySelectorAll('[data-connect-side="left"]').forEach(btn=>{const id=prefix+btn.dataset.connectIndex,to=vals[id];if(to===undefined||to==='')return;const target=widget.querySelector(`[data-connect-side="right"][data-connect-index="${to}"]`);if(!target)return;const a=btn.getBoundingClientRect(),b=target.getBoundingClientRect(),x1=a.right-rect.left+3,y1=a.top-rect.top+a.height/2,x2=b.left-rect.left-3,y2=b.top-rect.top+b.height/2;const color=state.solved[id]?'#368767':(state.attempts[id]>0?'#c46767':'#a3a6ad');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`);path.setAttribute('stroke',color);path.setAttribute('stroke-width','2.3');path.setAttribute('fill','none');path.setAttribute('opacity','.85');svg.appendChild(path);});});}
let selectedConnect=null;function clickConnect(button){const widget=button.closest('[data-match-prefix]'),prefix=button.dataset.connectPrefix,side=button.dataset.connectSide,i=+button.dataset.connectIndex;if(button.disabled)return;if(!selectedConnect){selectedConnect={prefix,side,i};button.classList.add('pair-selected');return;}if(selectedConnect.prefix!==prefix||selectedConnect.side===side){document.querySelectorAll('.pair-selected').forEach(b=>b.classList.remove('pair-selected'));selectedConnect={prefix,side,i};button.classList.add('pair-selected');return;}const left=side==='left'?i:selectedConnect.i,right=side==='right'?i:selectedConnect.i,id=prefix+left;document.querySelectorAll('.pair-selected').forEach(b=>b.classList.remove('pair-selected'));selectedConnect=null;if(completed(id))return;const other=widget.querySelectorAll('[data-connect-side="left"]');other.forEach(b=>{const otherid=prefix+b.dataset.connectIndex;if(otherid!==id&&!state.solved[otherid]&&String(vals[otherid])===String(right)){vals[otherid]='';state.lastTried[otherid]='';}});vals[id]=String(right);save();checkOne(id);paintAnswerStatuses();updateMatchLayouts();refreshReorders();drawConnections();}
function doSortUpdate(sortid,item,to){const widget=document.querySelector(`[data-sort="${sortid}"]`);if(!widget||completed(sortid))return;let items=widget.querySelectorAll('[data-sortkey][data-item]');const count=items.length;let old=vals[sortid]||Array(count).fill(-1);if(old.length!==count)old=Array(count).fill(-1);old[+item]=to;vals[sortid]=old;pendingSort=null;const chip=widget.querySelector(`[data-sortkey="${sortid}"][data-item="${item}"]`);const dest=to===-1?widget.querySelector('.sort-pool'):widget.querySelector(`.sort-zone[data-zone="${to}"] .zone-chips`);if(chip&&dest){const title=chip.textContent.replace(/\s*×\s*$/, '').trim();chip.textContent=title+(to===-1?'':' ×');chip.classList.remove('chosen');dest.appendChild(chip);}widget.querySelectorAll('.sort-zone').forEach(z=>z.classList.remove('ready','over'));save();if(ANSWERS[sortid]&&old.every(x=>x>=0))checkOne(sortid);}
let draggedPointer=null,dragGhost=null,ignoreNextSortClick=false;
document.addEventListener('pointerdown',e=>{const chip=e.target.closest('[data-sortkey][data-item]');if(!chip)return;draggedPointer={id:chip.dataset.sortkey,item:+chip.dataset.item,startX:e.clientX,startY:e.clientY,dragging:false};});
document.addEventListener('pointermove',e=>{if(!draggedPointer)return;const dx=e.clientX-draggedPointer.startX,dy=e.clientY-draggedPointer.startY;if(!draggedPointer.dragging&&Math.hypot(dx,dy)>9){draggedPointer.dragging=true;dragGhost=document.createElement('div');dragGhost.className='drag-ghost';dragGhost.textContent=document.querySelector(`[data-sortkey="${draggedPointer.id}"][data-item="${draggedPointer.item}"]`)?.textContent||'';document.body.appendChild(dragGhost);}if(draggedPointer.dragging){e.preventDefault();dragGhost.style.left=e.clientX+11+'px';dragGhost.style.top=e.clientY+9+'px';document.querySelectorAll('.sort-zone,.sort-pool').forEach(z=>z.classList.toggle('over',!!(document.elementFromPoint(e.clientX,e.clientY)?.closest('.sort-zone,.sort-pool')===z)));}}, {passive:false});
document.addEventListener('pointerup',e=>{if(!draggedPointer)return;const p=draggedPointer;draggedPointer=null;dragGhost?.remove();dragGhost=null;document.querySelectorAll('.sort-zone,.sort-pool').forEach(z=>z.classList.remove('over'));if(!p.dragging)return;ignoreNextSortClick=true;setTimeout(()=>ignoreNextSortClick=false,100);const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sort-zone,.sort-pool');if(dest)doSortUpdate(p.id,p.item,+dest.dataset.zone);});
let bankChosen=null,reorderDragged=null;
function setBankWord(word,slot){
 const node=slot||[...document.querySelectorAll('[data-bank-slot]')].find(n=>!n.disabled&&!n.value.trim());
 if(!node||node.disabled)return;
 node.value=word;node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));
 bankChosen=null;document.querySelectorAll('.draggable-word').forEach(x=>x.classList.remove('chosen'));
}
function reorderMutate(id,item,remove=false,insertAt=null){if(completed(id))return;
 const widget=document.querySelector(`[data-reorder="${id}"]`);if(!widget)return;
 let selected=Array.isArray(vals[id])?[...vals[id]]:[];selected=selected.filter(x=>x!==item);
 if(!remove){if(insertAt==null||insertAt>=selected.length)selected.push(item);else selected.splice(insertAt,0,item);}
 vals[id]=selected;state.lastTried[id]='';save();refreshReorders();paintSingle(id);
}
document.addEventListener('click',e=>{
 const bank=e.target.closest('[data-bank-word]');if(bank){bankChosen=bank.dataset.bankWord;const parent=bank.closest('[data-bank]'),prefix=parent?.dataset.bank;document.querySelectorAll('.draggable-word').forEach(x=>x.classList.toggle('chosen',x===bank));const input=[...document.querySelectorAll(`[data-bank-slot="${prefix}"]`)].find(n=>!n.disabled&&!n.value.trim());if(input)setBankWord(bankChosen,input);return;}
 const slot=e.target.closest('[data-bank-slot]');if(slot&&bankChosen){setBankWord(bankChosen,slot);return;}
 const tile=e.target.closest('[data-reorder-id][data-tile]');if(tile){reorderMutate(tile.dataset.reorderId,+tile.dataset.tile,false);return;}
 const placed=e.target.closest('[data-reorder-remove][data-tile]');if(placed){reorderMutate(placed.dataset.reorderRemove,+placed.dataset.tile,true);return;}
 const check=e.target.closest('[data-reorder-check]');if(check){const id=check.dataset.reorderCheck,widget=check.closest('[data-reorder]');const selected=Array.isArray(vals[id])?vals[id]:[];if(selected.length!==widget.querySelectorAll('.reorder-tray [data-tile]').length){const cor=widget.querySelector(`[data-correction="${id}"]`);cor.style.display='block';cor.className='correction wrong';cor.textContent='Place all the words before clicking CHECK.';return;}
 vals[id]=selected.map(i=>widget.querySelector(`.reorder-tray [data-tile="${i}"]`)?.textContent||'').join(' ');checkOne(id);vals[id]=selected;save();refreshReorders();return;}
 const clear=e.target.closest('[data-reorder-clear]');if(clear){vals[clear.dataset.reorderClear]=[];state.lastTried[clear.dataset.reorderClear]='';save();refreshReorders();const cor=clear.closest('[data-reorder]')?.querySelector('.correction');if(cor)cor.style.display='none';return;}
});
document.addEventListener('dragstart',e=>{const word=e.target.closest('[data-bank-word]');if(word){e.dataTransfer.setData('application/x-word-bank',word.dataset.bankWord);e.dataTransfer.effectAllowed='copy';return;}
 const tile=e.target.closest('[data-reorder-id][data-tile], [data-reorder-remove][data-tile]');if(tile){const id=tile.dataset.reorderId||tile.dataset.reorderRemove;reorderDragged={id,item:+tile.dataset.tile};e.dataTransfer.setData('application/x-reorder',JSON.stringify(reorderDragged));e.dataTransfer.effectAllowed='move';}});
document.addEventListener('dragover',e=>{if(e.target.closest('[data-bank-slot],[data-reorder-target]'))e.preventDefault();});
document.addEventListener('drop',e=>{const slot=e.target.closest('[data-bank-slot]');if(slot){e.preventDefault();const word=e.dataTransfer.getData('application/x-word-bank');if(word)setBankWord(word,slot);return;}
 const dest=e.target.closest('[data-reorder-target]');if(dest){e.preventDefault();const data=reorderDragged;if(!data||data.id!==dest.dataset.reorderTarget)return;
 const placed=[...dest.querySelectorAll('[data-reorder-remove]')];let position=placed.length;const hovered=e.target.closest('[data-reorder-remove]');if(hovered)position=placed.indexOf(hovered);
 reorderMutate(data.id,data.item,false,position);reorderDragged=null;}});
// Touch/pointer dragging also works where HTML5 drag-and-drop is unavailable.
let tilePointer=null;
document.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-reorder-id][data-tile], [data-reorder-remove][data-tile], [data-bank-word]');if(!el)return;tilePointer={el,startX:e.clientX,startY:e.clientY,dragging:false};});
document.addEventListener('pointermove',e=>{if(!tilePointer)return;const p=tilePointer;if(!p.dragging&&Math.hypot(e.clientX-p.startX,e.clientY-p.startY)>10)p.dragging=true;});
document.addEventListener('pointerup',e=>{if(!tilePointer)return;const p=tilePointer;tilePointer=null;if(!p.dragging)return;
 const dest=document.elementFromPoint(e.clientX,e.clientY);
 const slot=dest?.closest('[data-bank-slot]');if(p.el.matches('[data-bank-word]')&&slot){setBankWord(p.el.dataset.bankWord,slot);return;}
 const target=dest?.closest('[data-reorder-target]');if(target&&p.el.dataset.tile!=null){const id=p.el.dataset.reorderId||p.el.dataset.reorderRemove;if(id===target.dataset.reorderTarget)reorderMutate(id,+p.el.dataset.tile,false);}
});
document.addEventListener('input',e=>{const node=e.target,id=node.dataset?.k;if(!id)return;if(node.type==='radio'||node.type==='checkbox')return;vals[id]=node.type==='range'?Number(node.value):node.value;save();updateLive();if(node.matches('.answer-input')){const block=currentBlock(id);block?.classList.remove('answered-wrong');block?.querySelector('.answer-input')?.classList.remove('incorrect');if(vals[id].trim())scheduleCheck(id);}});
document.addEventListener('change',e=>{const node=e.target,id=node.dataset?.k;if(!id)return;if(node.type==='checkbox'){if(id.startsWith('p24check'))vals[id]=node.checked;else{let a=Array.isArray(vals[id])?vals[id]:[];a=node.checked?[...new Set([...a,Number(node.value)])]:a.filter(x=>x!==Number(node.value));vals[id]=a}}else if(node.type==='range')vals[id]=+node.value;else vals[id]=node.value;save();updateLive();if(ANSWERS[id]){if(ANSWERS[id].type==='many'&&vals[id].length!==ANSWERS[id].ans.length){paintSingle(id)}else if(node.matches('.answer-input'))scheduleCheck(id,true);else {if(node.matches('.inline-select')){node.style.width='calc('+Math.min(40,Math.max(7,(node.options[node.selectedIndex]?.textContent||'Choose…').length))+'ch + 43px)';}checkOne(id);}}});
document.addEventListener('focusout',e=>{const node=e.target,id=node.dataset?.k;if(node.matches('.answer-input')&&ANSWERS[id])scheduleCheck(id,true)});
document.addEventListener('keydown',e=>{const node=e.target,id=node.dataset?.k;if(e.key==='Enter'&&node.matches('.answer-input')&&ANSWERS[id]){e.preventDefault();scheduleCheck(id,true)}if((e.key==='Enter'||e.key===' ')&&node.closest('.sort-zone')&&!node.closest('.sort-chip')){e.preventDefault();const z=node.closest('.sort-zone');if(pendingSort){doSortUpdate(pendingSort.id,pendingSort.item,+z.dataset.zone)}}});
document.addEventListener('click',e=>{const conn=e.target.closest('[data-connect-prefix]');if(conn){clickConnect(conn);return;}const chip=e.target.closest('[data-chip]');if(chip){const id=chip.dataset.chip;if(completed(id))return;vals[id]=chip.dataset.val;save();chip.parentElement.querySelectorAll('.small-choice').forEach(b=>b.classList.toggle('selected',b===chip));checkOne(id);return;}const item=e.target.closest('[data-sortkey][data-item]');if(item){if(ignoreNextSortClick)return;const id=item.dataset.sortkey,num=+item.dataset.item;if(item.closest('.sort-zone'))doSortUpdate(id,num,-1);else{pendingSort={id,item:num};document.querySelectorAll(`[data-sortkey="${id}"]`).forEach(b=>b.classList.toggle('chosen',b===item));document.querySelectorAll('.sort-zone').forEach(z=>z.classList.add('ready'));}return;}const zone=e.target.closest('.sort-zone[data-zone]');if(zone&&pendingSort){doSortUpdate(pendingSort.id,pendingSort.item,+zone.dataset.zone);return;}const speaking=e.target.closest('[data-speak]');if(speaking){if('speechSynthesis'in window){speechSynthesis.cancel();let phrase=new SpeechSynthesisUtterance(speaking.dataset.speak.replace(/^[AB]: /,''));phrase.lang='en-GB';phrase.rate=.88;let voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('en')&&v.name.toLowerCase().includes('natural'));if(voice)phrase.voice=voice;speechSynthesis.speak(phrase)}return;}const page=e.target.closest('[data-page]');if(page)navigate(+page.dataset.page);});
document.addEventListener('dragstart',e=>{const item=e.target.closest('[data-sortkey][data-item]');if(!item)return;pendingSort={id:item.dataset.sortkey,item:+item.dataset.item};e.dataTransfer.setData('text/plain',JSON.stringify(pendingSort));});document.addEventListener('dragover',e=>{const z=e.target.closest('.sort-zone,.sort-pool');if(z){e.preventDefault();z.classList.add('over')}});document.addEventListener('dragleave',e=>e.target.closest('.sort-zone,.sort-pool')?.classList.remove('over'));document.addEventListener('drop',e=>{const z=e.target.closest('.sort-zone,.sort-pool');if(!z)return;e.preventDefault();if(pendingSort){doSortUpdate(pendingSort.id,pendingSort.item,+z.dataset.zone);pendingSort=null;}});
window.addEventListener('resize',drawConnections);window.addEventListener('scroll',drawConnections,{passive:true});
document.getElementById('prev').onclick=()=>navigate(pageIdx-1);document.getElementById('next').onclick=()=>{if(pageIdx===pages.length-1){state.finished=true;save();document.getElementById('next').textContent='Lesson completed ✓';}else navigate(pageIdx+1)};document.getElementById('mobileMenu').onclick=()=>document.getElementById('rail').classList.toggle('open');document.getElementById('reset').onclick=()=>document.getElementById('confirmModal').classList.remove('hidden');document.getElementById('cancelReset').onclick=()=>document.getElementById('confirmModal').classList.add('hidden');document.getElementById('confirmReset').onclick=()=>{Object.keys(vals).forEach(x=>delete vals[x]);state.visited={};state.checked={};state.attempts={};state.solved={};state.lastTried={};state.finished=false;save();document.getElementById('confirmModal').classList.add('hidden');navigate(0)};document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('confirmModal').classList.add('hidden');document.getElementById('rail').classList.remove('open')}});
render();
