'use strict';
const STORAGE='new-general-kristina-perfect-day-off-v2';
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
Object.assign(PHOTO_URLS,{
 bed:[['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=960&q=82','https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=960']],
 cafe:[['https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=960&q=82','https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=960']],
 travel:[['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=960&q=82','https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=960']]
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
  bed:['#fbe9df','#f1d4d3','#ac7f91'],travel:['#e0f2ec','#c4e3d8','#679e8c'],cafe:['#ffeadc','#efd7ce','#bd8e81'],coffee:['#ffeadc','#efd7ce','#bd8e81'],general:['#eae5f5','#d8d0e9','#9383b1']
 };
 const [bg,shape,ink]=palettes[theme]||palettes.general;
 const details={
  bed:`<rect x="210" y="260" width="550" height="142" rx="34" fill="#fff" stroke="${ink}" stroke-width="13"/><rect x="245" y="217" width="170" height="84" rx="19" fill="#fff" stroke="${ink}" stroke-width="11"/><path d="M418 290Q540 231 719 278v113H414Z" fill="${shape}" stroke="${ink}" stroke-width="10"/><path d="M230 406v49M740 404v51" stroke="${ink}" stroke-width="16" stroke-linecap="round"/><circle cx="694" cy="164" r="48" fill="#fff" opacity=".65"/>`,
  travel:`<path d="M190 420Q330 300 470 398Q625 235 783 420Z" fill="#fff" stroke="${ink}" stroke-width="13"/><path d="M280 413L408 253L486 352L562 221L709 413Z" fill="${shape}" stroke="${ink}" stroke-width="10"/><circle cx="744" cy="146" r="57" fill="#ffe6a3"/><path d="M161 446H798" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>`,
  cafe:`<path d="M245 218H624V379Q624 432 555 432H312Q245 432 245 374Z" fill="#fff" stroke="${ink}" stroke-width="12"/><path d="M625 247H677Q745 247 734 315Q730 365 625 365" fill="none" stroke="${ink}" stroke-width="13"/><path d="M335 188Q308 150 341 111M447 188Q420 148 454 112M547 188Q520 146 553 112" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><path d="M212 449H758" stroke="${ink}" stroke-width="13" stroke-linecap="round"/>`,
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
// NEW GENERAL · KRISTINA EDITION · LESSON 02 · MY PERFECT DAY OFF
const photoTile=(source,title,description)=>`<div class="life-tile">${image(source,title)}<div class="life-tile-body"><strong>${title}</strong><span>${description}</span></div></div>`;
const questionList=(items)=>`<ol class="talk-list">${items.map(x=>`<li>${x}</li>`).join('')}</ol>`;
const yt=(id,title)=>`<div class="youtube"><iframe title="${esc(title)}" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="link-btn" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">↗ Open on YouTube</a>`;
const rule=(heading,description,example,cls='violet')=>`<div class="rule-card ${cls}"><div class="rule-title">${heading}</div><p>${description}</p><span>${example}</span></div>`;
const article=`<div class="magazine-reading life-magazine">
<div class="article-hero">${image('gaming','Video game controller and screen')}<span class="article-flag">PUSHING BUTTONS</span></div>
<div class="article-inner"><div class="article-overline">THE GUARDIAN · ADAPTED READING</div><h3>Too Busy to Play?</h3>
<p>For many adults, playing video games is a favourite hobby. But when there's work to finish and there are people who need your attention, finding enough time to play isn't easy.</p>
<p>Games journalist Keza MacDonald explains that she loves big games such as <i>Elden Ring</i>. However, she often has very little free time. Spending an entire weekend playing one game isn't realistic for her anymore.</p>
<p>Her advice is to <b>make the most of the time you actually have</b>. If there's half an hour before work, you can use it to play something. There are also plenty of shorter games that take only a few hours to finish.</p>
<p>Another idea is to play with friends or family. That way, you don't have to choose between your hobby and spending time with people you care about.</p>
<p>And if you love a huge game, there's no need to rush. It might take several months to finish, but that's fine. A little time spent doing something you enjoy is better than giving up on it completely.</p>
<p>The message? Hobbies aren't a waste of time. <b>It's okay to make room for the things you love.</b></p>
<div class="article-source">Educational adaptation of Keza MacDonald, <i>From Zelda to Elden Ring – how to make time for gaming when you have a busy life</i>, The Guardian, 15 March 2022. <a href="https://www.theguardian.com/games/2022/mar/15/pushing-buttons-long-games-time-elden-ring-zelda" target="_blank" rel="noopener noreferrer">Original article ↗</a></div>
</div></div>`;
const chat=`<div class="friends-chat">
<div class="chat-head"><span class="chat-people">M · K · K</span><div><strong>Weekend survival club</strong><small>Kristina, Masha, Kirill</small></div><span class="chat-dots">•••</span></div>
<div class="chat-message from-masha"><div class="chat-author">MASHA</div>Finally Saturday! I'm staying in. There are <b>a few</b> shows I want to catch up on, and I've got <b>some</b> leftover pizza. I don't want <b>any</b> plans.</div>
<div class="chat-message from-kirill"><div class="chat-author">KIRILL</div>Absolutely not 😭 There are <b>plenty of</b> places we haven't visited. We don't need <b>much</b> money, just <b>a little</b> energy. Who's up for going out?</div>
<div class="chat-message from-masha"><div class="chat-author">MASHA</div>There are <b>too many</b> people in every café on Saturdays. I need a low-key day to recharge.</div>
<div class="chat-message from-kirill"><div class="chat-author">KIRILL</div>Fine. A few hours outside, then we can stay in and binge-watch something. Deal?</div>
<div class="chat-message from-kristina"><div class="chat-author">KRISTINA</div>Hmm. Let me think... 👀</div>
</div>`;
const teacherMsg=`<div class="friends-chat"><div class="chat-head"><span class="chat-people">P</span><div><strong>Polina · Work chat</strong><small>Friday, 17:48</small></div></div><div class="chat-message from-masha"><div class="chat-author">POLINA</div>Quick question! Are there any plans for your weekend? I have a few café recommendations if you're up for going out. But I'm so tired after this week that I might just sleep in!</div></div>`;
const grammarMini=`<div class="rule-grid">
${rule('There is / There are','Singular and uncountable / plural. Use there to say something exists.','There’s a café nearby. · There are three parks.','blue')}
${rule('Some / Any / No','Some in positive statements and offers; any in most questions and negatives; no to mean zero.','There’s some pizza. · Any plans? · No tickets.','peach')}
${rule('Much / Many / A lot of','Much + uncountable; many + countable plural. A lot of works with both.','Not much time. · Not many people. · A lot of food.','mint')}
${rule('A few / Few','A few = some, enough to be positive. Few = almost none, negative emphasis. Countable plural.','We have a few hours. / We have few options.','violet')}
${rule('A little / Little','A little = some, enough. Little = almost none. Uncountable nouns.','A little money left. / Little hope of getting in.','pink')}
${rule('Enough / Too much / Plenty of','Enough = sufficient; too much/many = excessive; plenty of = more than enough.','Enough time · Too many plans · Plenty of snacks.','yellow')}
</div>`;

add('Your Perfect Saturday','Visual warm-up',2,
 S('01 · Lazy day or adventure?',intro('Look at the four options. Choose your ideal Saturday and explain why.')+
 `<div class="life-grid">${photoTile('bed','Sleep in','No alarm, no plans, no guilt')}${photoTile('cafe','Go out','Coffee, friends, somewhere new')}${photoTile('gaming','Play all day','One more quest. And another one.')}${photoTile('travel','Mini adventure','Explore somewhere unexpected')}</div>`+
 questionList(['Which option would help you unwind after a busy week?','Which activity would Masha choose? And Kirill?','Would your choice change if you only had €20?'])+
 input('off1note','','Speaking notes (optional)',null,2)),'Warm-up');

add('This or That?','Speaking',2,
 S('02 · Quick decisions',intro('Choose what you would rather do. Explain at least two choices.')+
 [
 ['Sleep in until noon','Wake up early and make the most of the day'],
 ['Binge-watch a whole season','Finish a story-driven game'],
 ['Spend €50 on a café day','Spend €50 on something for yourself'],
 ['Spend Saturday with Masha and Kirill','Have an entire day to yourself'],
 ['Plan everything','Go with the flow']
 ].map((x,i)=>mc('off2q'+i,`${i+1}. Which would you choose?`,x)).join(''))+
 S('One question',intro('What is one thing that would completely ruin your ideal day off?')+input('off2note','','My answer...',null,2)),'Warm-up');

add('Weekend Formula','Personal preferences',2,
 S('03 · Your five essentials',intro('Choose exactly five things your perfect day must include.')+
 `<div class="essentials" data-limit="5">${['A little quiet time','Some good food','A few hours of gaming','No work messages','A coffee with Masha','An adventure with Kirill','Plenty of sleep','A great TV show','Some fresh air','A new place to visit'].map((x,i)=>`<label class="essential-option"><input type="checkbox" class="essential-check" data-k="off3e${i}" ${vals['off3e'+i]?'checked':''}><span>${x}</span></label>`).join('')}</div><p class="small muted" id="essentialCount">Choose 5 of 10.</p>`)+
 S('Tell me why',questionList(['Which two are absolutely non-negotiable?','Could you enjoy a day off with no internet?'])),'Warm-up');

add('Unusual Hobbies','Before watching',4,
 S('04 · Could this be a hobby?',intro('Which of these activities do you think members of a real club enjoy? Select all you think are possible.')+
 checklist('off4c','Choose the hobbies you expect to see.',[
 'Collecting milk bottles','Taking photos of roundabouts','Following brown tourist signs','Finding old village water pumps','Collecting expensive sports cars','Training dolphins'],[0,1,2,3]))+
 S('Before you watch',questionList(['What makes a hobby exciting or boring?','Is there a strangely specific interest that you, Masha or Kirill have?'])),'Listening');

add('The Dull Men’s Club','Video · approx. 3 min',3,
 S('05 · Watch the story',intro('Watch the real short documentary. Choose its main idea.')+
 yt('EjGKk7bee_M','The Simple Joys of the Dull Men’s Club — Great Big Story')+
 mc('off5q1','What is the club really about?',['People who enjoy unusual, ordinary things.','People who want to win sports competitions.','People who dislike all hobbies.'],0))+
 S('Your reaction',intro('Which hobby surprised you most?')+input('off5n','','One sentence...',null,2)),'Listening');

add('Watch Closer','Video details',2,
 S('06 · What did you notice?',intro('Watch again if needed. Choose True or False.')+
 [
 ['Some club members collect milk bottles.',0],
 ['One hobby involves taking photographs of roundabouts.',0],
 ['The club is only for people who enjoy dangerous sports.',1],
 ['Some members are interested in village water pumps.',0],
 ['The club celebrates everyday interests.',0]
 ].map((x,i)=>mc('off6q'+i,`${i+1}. ${x[0]}`,['True','False'],x[1],false)).join(''))+
 S('Think about it',questionList(['Are these hobbies really boring, or are they just unusual?','Which hobby could become surprisingly interesting after a few hours?'])),'Listening');

add('Too Busy to Play?','Article · 4 min',4,
 S('07 · Read the article',intro('Read the adapted article about making time for video games.')+article)+
 S('Main idea',mc('off7q','What is the article mainly saying?',['Only people with lots of free time can enjoy gaming.','Small amounts of time are enough to enjoy a hobby.','Playing with friends is always a bad idea.'],1)),'Reading');

add('Read Between the Lines','Reading',2,
 S('08 · Read carefully',intro('Choose the answer that best matches the article.')+
 mc('off8q1','Why does the writer struggle to play long games?',['She no longer enjoys them.','Work and responsibilities take up her time.','She has no games to play.'],1)+
 mc('off8q2','What is one way to combine gaming with other parts of life?',['Play with friends or family.','Never play in the evening.','Buy every new game.'],0)+
 mc('off8q3','What does the writer suggest about finishing a huge game?',['Finish it in one weekend.','Stop if it takes more than a week.','Take your time and enjoy it.'],2))+
 S('Connect to your life',questionList(['Are you currently in the middle of any long game, book or fanfiction?','How much free time do you usually have after work?'])),'Reading');

add('Weekend Survival Club','Reading & grammar',3,
 S('09 · A weekend disagreement',intro('Read Masha and Kirill’s group chat. Who would you agree with?')+chat)+
 mc('off9q1','What does Masha want most?',['A packed schedule and a new city.','Quiet time at home.','An expensive dinner.'],1)+
 mc('off9q2','What compromise does Kirill suggest?',['Go out for a few hours, then stay in.','Spend the entire weekend outside.','Cancel every plan.'],0)+
 S('Your turn',intro('Send one short message to the group suggesting a plan everyone might enjoy.')+input('off9reply','','Kristina: I think we could...',null,3)),'Language in context');

add('Match the Meanings','Vocabulary',3,
 S('10 · Free-time expressions',intro('Select an expression, then its meaning. Correct matches move below.')+
 matches('off10m',['sleep in','have a lie-in','unwind','switch off','recharge','take it easy','stay in','grab a bite'],[
 'relax without doing anything demanding','eat something quick or casual','stay at home instead of going out','wake up later than usual','stay in bed longer in the morning','relax after stress','stop thinking about work and worries','get your energy back'],[3,4,5,6,7,0,2,1])),'Vocabulary');

add('More Useful Phrases','Vocabulary',2,
 S('11 · Another seven expressions',intro('Match each expression to its meaning.')+
 matches('off11m',['treat yourself','catch up on','binge-watch','have some downtime','make the most of','be up for something','a low-key day'],[
 'a quiet, relaxed day with little excitement','use an opportunity as well as possible','watch many episodes one after another','be willing to do something','do something nice for yourself','finally spend time on something you missed','have a period of free time for rest'],[4,5,2,6,1,3,0])),'Vocabulary');

add('Complete the Weekend','Vocabulary',2,
 S('12 · Choose the right expression',intro('Drag or tap the expressions into the sentences.')+
 bankGapset('off12g',[
 '1. Polina wants to ______ after a stressful week in the office.',
 '2. Masha plans to ______ a series she hasn’t watched in months.',
 '3. Kirill suggests they ______ before going to the cinema.',
 '4. Kristina has three new episodes, so she might ______ them tonight.',
 '5. There’s only one free day, so they should ______ it.',
 '6. After a long week, Kristina wants to ______ and wake up late.'
 ],['unwind','catch up on','grab a bite','binge-watch','make the most of','sleep in']))+
 S('Speak',intro('Which two of these expressions describe your weekends most accurately?')),'Vocabulary');

add('Spot the Grammar','Noticing',3,
 S('13 · Find the pattern',intro('Look at the expressions from the group chat. Match each one with its meaning.')+
 matches('off13m',['There are a few shows.','I don’t want any plans.','There are plenty of places.','We don’t need much money.','There are too many people.','We need a little energy.'],[
 'A positive small amount of something uncountable','More people than the speaker wants','A negative sentence meaning zero plans','More than enough places','A small positive number of shows','A limited amount of money is needed'],[4,2,3,5,1,0]))+
 S('Think',questionList(['Which nouns in these sentences can you count?','Which words mean “enough” and which mean “too much”?'])),'Grammar');

add('Your Grammar Toolkit','Grammar card',3,
 S('14 · Talking about what you have',intro('Read the examples. Pay attention to the meaning, not just the rule.')+grammarMini)+
 S('Quick check',mc('off14q','Which pair has a different meaning?',['A few friends / Few friends','A lot of friends / Many friends','There isn’t any food / There is no food'],0)),'Grammar');

add('Count It or Not?','Sorting',2,
 S('15 · Countable vs uncountable',intro('Drag or tap each noun into the correct category.')+
 sort('off15s',['advice','plans','money','friends','information','cafés','free time','activities','furniture','tickets','equipment','snacks'],[['COUNTABLE','A few / many'],['UNCOUNTABLE','A little / much']],[1,0,1,0,1,0,1,0,1,0,1,0]))+
 S('Check yourself',mc('off15q','Which sentence is correct?',['Masha gave me many advice.','Masha gave me a few suggestions.','Masha gave me a little suggestions.'],1)),'Grammar');

add('Is There Anything?','Grammar',3,
 S('16 · Choose the right form',intro('Complete each sentence with the correct form of there is / there are.')+
 [
 ['___ a cosy café near Polina’s office.',['There is','There are'],0],
 ['___ a few interesting games on sale today.',['There is','There are'],1],
 ['___ any milk left in the fridge?',['Is there','Are there'],0],
 ['___ any tickets available for Saturday?',['Is there','Are there'],1],
 ['___ enough space for all of us in this room.',['There isn’t','There aren’t'],0],
 ['___ no restaurants open this late.',['There is','There are'],1]
 ].map((x,i)=>inlineChoice('off16q'+i,`${i+1}. ${x[0]}`,x[1],x[2])).join('')),'Grammar');

add('Some, Any or No?','Grammar · conversation',3,
 S('17 · A message from Polina',intro('Complete the chat using some, any or no.')+
 `<div class="group-chat">${dialog('POLINA','Have you made ___ plans for the weekend?')}${inlineChoice('off17q0','Choose: ___',['some','any','no'],1)}${dialog('KRISTINA','Not yet. I have ___ idea what to do.')}${inlineChoice('off17q1','Choose: ___',['some','any','no'],2)}${dialog('POLINA','Would you like ___ recommendations?')}${inlineChoice('off17q2','Choose: ___',['some','any','no'],0)}${dialog('KRISTINA','Are there ___ quiet places near the park?')}${inlineChoice('off17q3','Choose: ___',['some','any','no'],1)}${dialog('POLINA','Yes! There are ___ great cafés there. We can bring ___ snacks, too.')}${inlineChoice('off17q4','Choose first blank: ___',['some','any','no'],0)}${inlineChoice('off17q5','Choose second blank: ___',['some','any','no'],0)}${dialog('KRISTINA','Perfect. I don’t want to spend ___ money.')}${inlineChoice('off17q6','Choose: ___',['some','any','no'],1)}</div>`)+
 S('Meaning check',mc('off17q7','Which sentence is a friendly offer?',['Have you got any money?','Would you like some coffee?','There is no coffee.'],1)),'Grammar');

add('How Much? How Many?','Grammar',3,
 S('18 · Choose the natural expression',intro('Select the correct expression in each sentence.')+
 [
 ['Polina doesn’t have ___ free time after work.',['many','much','a few'],1],
 ['There aren’t ___ cafés open after midnight.',['much','many','a little'],1],
 ['We’ve got ___ snacks for everyone.',['plenty of','many of','much'],0],
 ['Kirill bought ___ tickets and now has extras.',['too much','too many','not much'],1],
 ['Masha has ___ work to finish before Monday.',['a lot of','many','a few'],0],
 ['There is ___ noise here. Let’s find a quieter place.',['too many','too much','a few'],1]
 ].map((x,i)=>mc('off18q'+i,`${i+1}. ${x[0]}`,x[1],x[2],false)).join('')),'Grammar');

add('A Few or Few?','Meaning matters',3,
 S('19 · Small differences, big changes',intro('Choose the expression that best fits the meaning in bold.')+
 [
 ['Good news! We have ___ time before the cinema, so we can grab a coffee.',['a little','little'],0],
 ['Unfortunately, ___ friends can come, so we might cancel the party.',['a few','few'],1],
 ['We have ___ money left. We can still afford a snack.',['a little','little'],0],
 ['There is ___ hope of getting a table: everything is booked.',['a little','little'],1],
 ['Masha has ___ books to read this weekend. She’s happy about that.',['a few','few'],0],
 ['There are ___ activities nearby, so we will probably stay in.',['a few','few'],1]
 ].map((x,i)=>mc('off19q'+i,`${i+1}. ${x[0]}`,x[1],x[2],false)).join(''))+
 S('Explain',questionList(['What changes when you remove “a” from a few or a little?','Do you have a little time or little time to relax this week?'])),'Grammar');

add('Fix the Weekend','Error correction',3,
 S('20 · Correct one mistake in each sentence',intro('Rewrite the incorrect part of each sentence.')+
 gapset('off20g',[
 '1. There is many things to do in this city.',
 '2. I don’t have many free time this weekend.',
 '3. Are there some interesting games on sale?',
 '4. Masha has a little friends who like fanfiction.',
 '5. Kirill bought too much tickets for the concert.',
 '6. Polina gave me a few advice about the trip.'
 ],[
 ['There are many things to do in this city','There are many things to do in this city.'],
 ['I don’t have much free time this weekend','I do not have much free time this weekend'],
 ['Are there any interesting games on sale','Are there any interesting games on sale?'],
 ['Masha has a few friends who like fanfiction'],
 ['Kirill bought too many tickets for the concert'],
 ['Polina gave me a little advice about the trip','Polina gave me some advice about the trip']
 ])),'Grammar');

add('The Ultimate Grammar Mix','Mixed grammar',3,
 S('21 · No hints this time',intro('Choose the best answer. All today’s grammar is mixed together.')+
 [
 ['There ___ no cafés open at this hour.',['is','are','have'],1],
 ['We have ___ time to explore before our train.',['a few','a little','many'],1],
 ['I haven’t got ___ plans for Sunday.',['some','no','any'],2],
 ['There are ___ people here. It’s too crowded.',['too many','too much','a little'],0],
 ['Polina gave me ___ useful information.',['a few','some','many'],1],
 ['Only ___ friends came. It was disappointing.',['a few','few','many'],1],
 ['There’s ___ food for everyone. No need to order more.',['plenty of','many','a few'],0],
 ['We don’t have ___ money for an expensive restaurant.',['enough','many','a few'],0]
 ].map((x,i)=>mc('off21q'+i,`${i+1}. ${x[0]}`,x[1],x[2],false)).join('')),'Grammar');

add('My Weekend Essentials','Personalised practice',3,
 S('22 · Design your dream space',intro('Imagine you can spend Saturday anywhere. Add details using the prompts.')+
 `<div class="life-grid">${photoTile('bed','The cosy place','Somewhere you can recharge')}${photoTile('cafe','The social place','Somewhere to meet friends')}${photoTile('gaming','The gaming spot','Somewhere to lose track of time')}${photoTile('travel','The getaway','Somewhere completely new')}</div>`+
 `<div class="prompt-grid">${input('off22a','There is...','Describe one thing your place has...',null,2)}${input('off22b','There are a few...','Describe several things...',null,2)}${input('off22c','There isn’t any...','What does it not have?',null,2)}${input('off22d','There is plenty of...','What does it have enough of?',null,2)}</div>`)+
 S('Tell your teacher',intro('Which place would Masha like, and which would Kirill prefer?')),'Speaking');

add('Build Your Perfect Day Off','Final speaking',3,
 S('23 · Your conditions',intro('Choose your budget, company and energy level. Then plan the day.')+
 `<div class="condition-grid"><div class="condition-panel"><strong>01 / BUDGET</strong>${['€0','€50','€200'].map((x,i)=>`<label><input type="radio" name="offBudget" data-k="off23budget" value="${x}" ${String(vals.off23budget||'€50')===x?'checked':''}> ${x}</label>`).join('')}</div><div class="condition-panel"><strong>02 / COMPANY</strong>${['Just me','Masha and Kirill','My choice'].map(x=>`<label><input type="radio" name="offCompany" data-k="off23company" value="${esc(x)}" ${String(vals.off23company||'My choice')===x?'checked':''}> ${x}</label>`).join('')}</div><div class="condition-panel"><strong>03 / ENERGY</strong>${['Exhausted','Normal','Full of energy'].map(x=>`<label><input type="radio" name="offEnergy" data-k="off23energy" value="${esc(x)}" ${String(vals.off23energy||'Normal')===x?'checked':''}> ${x}</label>`).join('')}</div></div>`+
 `<div class="dayparts">${input('off23morning','MORNING','What will you do?',null,2)}${input('off23afternoon','AFTERNOON','Where will you go, and with whom?',null,2)}${input('off23evening','EVENING','How will you end the day?',null,2)}</div>`)+
 S('Language challenge',intro('Speak for 2–3 minutes. Use at least five expressions and six grammar examples.')+
 `<div class="checklist">${['There is / are','Some / any / no','Much / many / a lot of','A few / a little','Few / little','Plenty of / enough / too much / too many','At least five vocabulary expressions'].map((x,i)=>`<label><input type="checkbox" data-k="off23check${i}" ${vals['off23check'+i]?'checked':''}>${x}</label>`).join('')}</div>`),'Speaking');

add('One Little Plot Twist','Reflection',2,
 S('24 · Unexpected change',intro('Choose a plot twist and explain how you would change your plan.')+
 `<div class="plot-twist" id="plotTwist"><span>PLAN B</span><strong>Polina has just sent you an urgent work message, but you don’t want to lose your day off.</strong></div><button type="button" id="shufflePlot" class="outline-btn">↻ Another plot twist</button>`)+
 S('One-minute reflection',intro('Finish the three sentences.')+
 input('off24a','Today I learned to say...','My new expression...',null,1)+
 input('off24b','The grammar I still need to practise is...','Something to practise...',null,1)+
 input('off24c','My perfect day off would be...','In one sentence...',null,2)),'Reflection');

add('Homework','Homework · 25–35 min',0,
 S('01 · Grammar recall',intro('Complete the sentences with the correct expression.')+
 [
 ['There ___ three lovely parks near the hotel.',['is','are'],1],
 ['Polina doesn’t have ___ time this weekend.',['many','much'],1],
 ['Do you have ___ plans for Saturday?',['some','any'],1],
 ['There is ___ food left, so we can still have lunch.',['a little','a few'],0],
 ['I have ___ friends who enjoy the same games as me.',['a few','a little'],0],
 ['There are ___ people here. It’s too noisy.',['too much','too many'],1],
 ['There isn’t ___ information on the website.',['many','much'],1],
 ['We have ___ time to get to the train station. Let’s go!',['little','a little'],0],
 ['There is ___ money for tickets, so we can go.',['enough','many'],0],
 ['Would you like ___ tea?',['some','any'],0]
 ].map((x,i)=>inlineChoice('off25q'+i,`${i+1}. ${x[0]}`,x[1],x[2])).join(''))+
 S('02 · Vocabulary recall',intro('Match the phrase to its meaning.')+
 matches('off25m',['unwind','grab a bite','binge-watch','make the most of','a low-key day'],[
 'watch many episodes in one sitting','spend time as well as possible','eat something quickly','a calm day with very few plans','relax after stress'],[4,2,0,1,3]))+
 S('03 · Write your dream getaway',intro('Write 120–150 words: My Perfect Weekend Getaway. Imagine travelling with Masha and Kirill. Include what there is to do, how much money you need, a few activities, and what you want to avoid.')+
 input('off25writing','My Perfect Weekend Getaway','Our perfect trip starts...',null,8)+
 `<p class="small muted">Use at least four vocabulary expressions and six quantifiers.</p>`)+
 S('04 · Optional extra listening',intro('Rewatch the Dull Men’s Club video. Which unusual hobby would you recommend to Polina? Explain in 3–4 sentences.')+yt('EjGKk7bee_M','The Simple Joys of the Dull Men’s Club')+
 input('off25video','','My recommendation...',null,3)),'Homework');

// ───────────────────────────────────── APPLICATION ENGINE ─────────────────────────────────────
let pageIdx=Math.min(pages.length-1,Math.max(0,+(new URLSearchParams(location.search).get('page')||1)-1));let pendingSort=null;
function renderNav(){const nav=document.getElementById('chapterList');nav.innerHTML=pages.map((p,i)=>`<button class="chapter ${i===pageIdx?'active':''} ${state.visited[i]?'done':''}" type="button" data-page="${i}"><span class="no">${String(i+1).padStart(2,'0')}</span><span class="chapter-title">${esc(p.title)}</span></button>`).join('');nav.querySelector('.active')?.scrollIntoView({block:'nearest'});}
function updateResult4(){let ans=[0,1,2,3,4].map(i=>vals['p4q'+i]);let target=document.getElementById('p4result');if(!target)return;if(ans.some(v=>v===undefined||v==='')){target.innerHTML='<strong>Your result</strong><p>Choose all five answers to calculate your profile.</p>';return;}let table=[[0,1,2],[1,2,0],[2,0,1],[1,0,2],[0,2,1]];let names=['THE COLLECTOR','THE EXPLORER','THE SOCIAL CONNECTOR'];let scores=[0,0,0];ans.forEach((v,i)=>scores[table[i][+v]]++);let high=Math.max(...scores);let win=names.filter((x,i)=>scores[i]===high);target.innerHTML=`<strong>YOUR RESULT</strong><h3 style="margin:4px 0">${win.join(' + ')}</h3><p>${win.length>1?'You are a mixture of these types.':'This is your strongest scrolling style.'} Do you agree with the result?</p>`;}
function updateCounter23(){const el=document.getElementById('p23summary');if(!el)return;const arr=[0,1,2,3,4,5].map(i=>vals['p23p'+i]);let k=arr.filter(x=>x==='0').length,s=arr.filter(x=>x==='1').length,m=arr.filter(x=>x==='2').length;el.innerHTML=`<strong>Your decisions</strong><p>Keep: <b>${k} / 3</b> · Scroll past: <b>${s} / 2</b> · Maybe: <b>${m} / 1</b></p><p class="${k===3&&s===2&&m===1?'task-result good':'muted small'}">${k===3&&s===2&&m===1?'✓ Your six decisions are complete.':'Choose exactly three to keep, two to scroll past, and one maybe.'}</p>`;}
function updateLive(){
 const essential=document.getElementById('essentialCount');
 if(essential){const count=Array.from({length:10},(_,i)=>!!vals['off3e'+i]).filter(Boolean).length;
  essential.textContent=count===5?'✓ Your five essentials are ready.':`${count} / 5 selected`;
  document.querySelectorAll('.essential-option input').forEach(n=>{n.disabled=count>=5&&!n.checked;});
 }
 document.querySelectorAll('[data-rateout]').forEach(el=>el.textContent=(vals[el.dataset.rateout]||3)+'/5');}
function hydrateState(){
 document.querySelectorAll('#content [data-k]').forEach(node=>{
  const id=node.dataset.k,v=vals[id];if(v===undefined||v===null)return;
  if(node.type==='radio')node.checked=String(v)===String(node.value);
  else if(node.type==='checkbox')node.checked=Array.isArray(v)?v.includes(Number(node.value)):!!v;
  else node.value=v;
 });
 document.querySelectorAll('#content [data-chip]').forEach(b=>b.classList.toggle('selected',String(vals[b.dataset.chip])===String(b.dataset.val)));
 document.querySelectorAll('#content [data-sort]').forEach(widget=>{
  const values=Array.isArray(vals[widget.dataset.sort])?vals[widget.dataset.sort]:[];
  widget.querySelectorAll('[data-sortkey][data-item]').forEach(chip=>{
   const z=values[Number(chip.dataset.item)]??-1;
   const target=z===-1?widget.querySelector('.sort-pool'):widget.querySelector(`.sort-zone[data-zone="${z}"] .zone-chips`);
   target?.appendChild(chip);
  });
 });
}
function render(keepScroll=false){const oldY=window.scrollY;const p=pages[pageIdx];state.visited[pageIdx]=true;save();document.getElementById('intro').innerHTML=`<h1 class="page-heading">${esc(p.title)}</h1>`;document.getElementById('content').innerHTML=`<div class="content-surface">${p.html}</div>`;hydrateState();document.getElementById('progressNum').textContent=`${pageIdx+1} / ${pages.length}`;document.getElementById('prev').disabled=pageIdx===0;document.getElementById('next').textContent=pageIdx===pages.length-1?(state.finished?'Completed ✓':'Finish lesson ✓'):'Next →';renderNav();updateLive();paintAnswerStatuses();updateMatchLayouts();refreshReorders();drawConnections();document.getElementById('rail').classList.remove('open');if(keepScroll)window.scrollTo(0,oldY);else window.scrollTo({top:0,behavior:'instant'});}
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
document.addEventListener('change',e=>{const node=e.target,id=node.dataset?.k;if(!id)return;if(node.type==='checkbox'){if(id.startsWith('p24check')||id.startsWith('off23check')||id.startsWith('off3e'))vals[id]=node.checked;else{let a=Array.isArray(vals[id])?vals[id]:[];a=node.checked?[...new Set([...a,Number(node.value)])]:a.filter(x=>x!==Number(node.value));vals[id]=a}}else if(node.type==='range')vals[id]=+node.value;else vals[id]=node.value;save();updateLive();if(ANSWERS[id]){if(ANSWERS[id].type==='many'&&vals[id].length!==ANSWERS[id].ans.length){paintSingle(id)}else if(node.matches('.answer-input'))scheduleCheck(id,true);else {if(node.matches('.inline-select')){node.style.width='calc('+Math.min(40,Math.max(7,(node.options[node.selectedIndex]?.textContent||'Choose…').length))+'ch + 43px)';}checkOne(id);}}});
document.addEventListener('focusout',e=>{const node=e.target,id=node.dataset?.k;if(node.matches('.answer-input')&&ANSWERS[id])scheduleCheck(id,true)});
document.addEventListener('keydown',e=>{const node=e.target,id=node.dataset?.k;if(e.key==='Enter'&&node.matches('.answer-input')&&ANSWERS[id]){e.preventDefault();scheduleCheck(id,true)}if((e.key==='Enter'||e.key===' ')&&node.closest('.sort-zone')&&!node.closest('.sort-chip')){e.preventDefault();const z=node.closest('.sort-zone');if(pendingSort){doSortUpdate(pendingSort.id,pendingSort.item,+z.dataset.zone)}}});
document.addEventListener('click',e=>{const conn=e.target.closest('[data-connect-prefix]');if(conn){clickConnect(conn);return;}const chip=e.target.closest('[data-chip]');if(chip){const id=chip.dataset.chip;if(completed(id))return;vals[id]=chip.dataset.val;save();chip.parentElement.querySelectorAll('.small-choice').forEach(b=>b.classList.toggle('selected',b===chip));checkOne(id);return;}const item=e.target.closest('[data-sortkey][data-item]');if(item){if(ignoreNextSortClick)return;const id=item.dataset.sortkey,num=+item.dataset.item;if(item.closest('.sort-zone'))doSortUpdate(id,num,-1);else{pendingSort={id,item:num};document.querySelectorAll(`[data-sortkey="${id}"]`).forEach(b=>b.classList.toggle('chosen',b===item));document.querySelectorAll('.sort-zone').forEach(z=>z.classList.add('ready'));}return;}const zone=e.target.closest('.sort-zone[data-zone]');if(zone&&pendingSort){doSortUpdate(pendingSort.id,pendingSort.item,+zone.dataset.zone);return;}const speaking=e.target.closest('[data-speak]');if(speaking){if('speechSynthesis'in window){speechSynthesis.cancel();let phrase=new SpeechSynthesisUtterance(speaking.dataset.speak.replace(/^[AB]: /,''));phrase.lang='en-GB';phrase.rate=.88;let voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('en')&&v.name.toLowerCase().includes('natural'));if(voice)phrase.voice=voice;speechSynthesis.speak(phrase)}return;}const page=e.target.closest('[data-page]');if(page)navigate(+page.dataset.page);});
document.addEventListener('dragstart',e=>{const item=e.target.closest('[data-sortkey][data-item]');if(!item)return;pendingSort={id:item.dataset.sortkey,item:+item.dataset.item};e.dataTransfer.setData('text/plain',JSON.stringify(pendingSort));});document.addEventListener('dragover',e=>{const z=e.target.closest('.sort-zone,.sort-pool');if(z){e.preventDefault();z.classList.add('over')}});document.addEventListener('dragleave',e=>e.target.closest('.sort-zone,.sort-pool')?.classList.remove('over'));document.addEventListener('drop',e=>{const z=e.target.closest('.sort-zone,.sort-pool');if(!z)return;e.preventDefault();if(pendingSort){doSortUpdate(pendingSort.id,pendingSort.item,+z.dataset.zone);pendingSort=null;}});
window.addEventListener('resize',drawConnections);window.addEventListener('scroll',drawConnections,{passive:true});
document.getElementById('prev').onclick=()=>navigate(pageIdx-1);document.getElementById('next').onclick=()=>{if(pageIdx===pages.length-1){state.finished=true;save();document.getElementById('next').textContent='Lesson completed ✓';}else navigate(pageIdx+1)};document.getElementById('mobileMenu').onclick=()=>document.getElementById('rail').classList.toggle('open');document.getElementById('reset').onclick=()=>document.getElementById('confirmModal').classList.remove('hidden');document.getElementById('cancelReset').onclick=()=>document.getElementById('confirmModal').classList.add('hidden');document.getElementById('confirmReset').onclick=()=>{Object.keys(vals).forEach(x=>delete vals[x]);state.visited={};state.checked={};state.attempts={};state.solved={};state.lastTried={};state.finished=false;save();document.getElementById('confirmModal').classList.add('hidden');navigate(0)};document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('confirmModal').classList.add('hidden');document.getElementById('rail').classList.remove('open')}});
render();

// Lesson 02 · optional speaking plot-twist carousel
const WEEKEND_PLOT_TWISTS=[
 'Polina has just sent you an urgent work message, but you don’t want to lose your day off.',
 'Masha cancelled at the last minute, but Kirill still wants to go somewhere.',
 'You spent almost all your money before lunchtime.',
 'It started raining and every outdoor plan is impossible.',
 'There isn’t much time left — your day off ends in three hours.',
 'Your favourite game just got a huge update, but you already promised to meet friends.'
];
let plotTwistIndex=0;
document.addEventListener('click',e=>{
 if(!e.target.closest('#shufflePlot'))return;
 plotTwistIndex=(plotTwistIndex+1)%WEEKEND_PLOT_TWISTS.length;
 const target=document.querySelector('#plotTwist strong');if(target)target.textContent=WEEKEND_PLOT_TWISTS[plotTwistIndex];
});
