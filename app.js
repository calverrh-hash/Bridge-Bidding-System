// Page: home screen, bidding box, feedback and results.
const KEY='bidtrainer.v2';
const store={get(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}},set(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}};
let DB=store.get();DB.seed=DB.seed||{};DB.best=DB.best||{};DB.prog=DB.prog||{};
const save=()=>store.set(DB);
const REF={A:'Chart A · Responses to 1NT',B:'Chart B · Responses to 1♥/♠',C:'Chart C · Responses to 1♣/♦',D:"Chart D · Opener's rebid",E:'Chart E · 2NT, 2♣, weak twos, pre-empts',F:'Chart F · Competitive auctions',G:'Chart G · Slam tools',OB:'Chart · Opening bids'};
const SEATS=['W','N','E','S'];
const app=document.getElementById('app');
const cache={};
let S={view:'home'};

const rich=t=>t.replace(/[♥♦]/g,m=>`<span class="r">${m}</span>`).replace(/[♠♣]/g,m=>`<span class="k">${m}</span>`);
function fmt(b){if(b==='P')return 'Pass';if(b==='X'||b==='XX')return b;const s=ST.indexOf(b[1]);return b[0]+(s===4?'NT':`<span class="${s===1||s===2?'r':'k'}">${SY[s]}</span>`)}
function getSet(id){const seed=DB.seed[id]||1;const k=id+'#'+seed;if(!cache[k])cache[k]=buildSet(SETS.find(d=>d.id===id),seed);return cache[k]}

function handHTML(h,showStats,label){
  const rows=[3,2,1,0].map(s=>`<div class="row"><span class="s ${s===1||s===2?'r':'k'}">${SY[s]}</span><span class="cards">${h[s].length?h[s].map(r=>RANK[r]||r).join(' '):'<span class="void">—</span>'}</span></div>`).join('');
  return `<div class="hand">${label?`<span class="eyebrow">${label}</span>`:''}${rows}${showStats?`<div class="stats"><span>${hcp(h)} HCP</span><span>Shape ${shapeStr(h)} (♠-♥-♦-♣)</span></div>`:''}</div>`;
}
// you: undefined = no extra cell, '?' = your turn, bid = your call
function auctionHTML(dealer,calls,you){
  const st=SEATS.indexOf(dealer);let c='';
  for(let i=0;i<st;i++)c+='<div class="ac"></div>';
  calls.forEach(b=>c+=`<div class="ac">${fmt(b)}</div>`);
  if(you)c+=`<div class="ac you ${you==='?'?'ask':''}">${you==='?'?'?':fmt(you)}</div>`;
  return `<div class="table"><div class="auc"><div class="hd">W<small>LHO</small></div><div class="hd">N<small>Partner</small></div><div class="hd">E<small>RHO</small></div><div class="hd">S<small>You</small></div>${c}</div></div>`;
}
function legal(dealer,calls){
  const st=SEATS.indexOf(dealer);let last=null,li=-1;calls.forEach((c,i)=>{if(c!=='P'){last=c;li=i}});
  const seat=li>=0?SEATS[(st+li)%4]:null,opp=seat==='E'||seat==='W';
  const lb=[...calls].reverse().find(c=>/^\d/.test(c));
  return{min:lb?bv(lb):-1,x:!!last&&/^\d/.test(last)&&opp,xx:last==='X'&&opp};
}
const outcome=q=>q.contract?`Final contract: ${fmt(q.contract)}.`:'The chart stops here, so the drill ends.';

function home(){
  const cards=SETS.map(d=>{
    const pr=DB.prog[d.id],done=pr&&pr.seed===(DB.seed[d.id]||1)?pr.res.filter(Boolean).length:0,best=DB.best[d.id];
    return `<button class="set" data-set="${d.id}"><div class="set-top"><h3>${rich(d.name)}</h3><span class="chip">${rich(d.refs)}</span></div><p>${rich(d.blurb)}</p>
    <div class="meter"><i style="width:${done/25*100}%"></i></div><div class="set-foot"><span>${done?`${done} / 25 played`:'25 hands'}</span><span>${best!=null?`Best ${best}/25`:'Not finished yet'}</span></div></button>`}).join('');
  app.innerHTML=`<div class="intro"><span class="eyebrow">5-card majors · strong NT</span><h1>Bidding drills</h1><p class="muted">You sit South and bid the whole auction. After each call, partner bids on from a real hand by the same chart, and you make your next call. A hand counts as correct only when every call matches the chart.</p></div><div class="sets">${cards}</div>`;
  app.querySelectorAll('.set').forEach(b=>b.onclick=()=>start(b.dataset.set));
}

function start(id,order){
  const qs=getSet(id),seed=DB.seed[id]||1;
  let pr=DB.prog[id];if(!pr||pr.seed!==seed||pr.res.length!==25){pr={seed,res:Array(25).fill(null)};DB.prog[id]=pr}
  const ord=order||[...Array(25).keys()];
  const pos=order?0:ord.findIndex(i=>!pr.res[i]);
  if(pos<0){S={view:'done',id,qs,order:ord,res:pr.res,retry:false};return render()}
  S={view:'play',id,qs,order:ord,pos,step:0,cur:[],res:order?Array(25).fill(null):pr.res,retry:!!order,level:null,answered:null};
  render();
}

function play(){
  const i=S.order[S.pos],q=S.qs[i],d=SETS.find(x=>x.id===S.id),st=q.steps[S.step],last=S.step===q.steps.length-1;
  const ok=S.order.filter(j=>S.res[j]&&S.res[j].ok).length;
  const dots=S.retry?'':`<div class="dots">${S.qs.map((_,j)=>`<i class="${j===i?'cur':S.res[j]?(S.res[j].ok?'ok':'no'):''}"></i>`).join('')}</div>`;
  const multi=q.steps.length>1;
  const pips=multi?`<div class="pips">${q.steps.map((_,k)=>`<i class="${k<S.step?(S.cur[k]===q.steps[k].ans.bid?'ok':'no'):k===S.step?(S.answered?(S.answered===st.ans.bid?'ok':'no'):'cur'):''}"></i>`).join('')}<span>Call ${S.step+1} of ${q.steps.length}</span></div>`:'';
  const prevWrong=S.step>0&&S.cur[S.step-1]!==q.steps[S.step-1].ans.bid;
  let lower;
  if(S.answered){
    const a=st.ans,good=S.answered===a.bid;
    let fin='';
    if(last){
      const pc=q.pn.filter(x=>!x.auto);
      fin=`<div class="reveal"><span class="eyebrow">The whole hand</span>${auctionHTML(q.dealer,q.calls)}<p class="out">${outcome(q)}</p>
        ${q.partner?handHTML(q.partner,true,"Partner's hand"):''}
        ${pc.length?`<div class="pcalls"><span class="eyebrow">Partner's calls</span>${pc.map(x=>`<p><b>${fmt(x.call)}</b> ${rich(x.why)}</p>`).join('')}</div>`:''}</div>`;
    }
    lower=`<div class="fb ${good?'ok':'no'}"><div class="verdict">${good?'Correct':`Chart says ${fmt(a.bid)}`}</div>
      ${good?'':`<p>You bid ${fmt(S.answered)}.${last?'':' The auction continues with the chart call.'}</p>`}<p>${rich(a.why)}</p><span class="ref">${rich(REF[a.ref]||'')}</span></div>
      ${fin}<div class="actions"><button class="primary" id="next">${!last?'Continue the auction →':S.pos===S.order.length-1?'See results':'Next hand →'}</button></div>`;
  }else{
    const lg=legal(q.dealer,st.calls),lv=S.level;
    const lvB=[1,2,3,4,5,6,7].map(n=>`<button class="bc ${lv===n?'on':''}" data-lv="${n}" ${bv(n+'N')<=lg.min?'disabled':''}>${n}</button>`).join('');
    const stB=[0,1,2,3,4].map(s=>{const dis=!lv||bv(lv+ST[s])<=lg.min;return `<button class="bc" data-st="${s}" ${dis?'disabled':''}>${s===4?'NT':`<span class="${s===1||s===2?'r':'k'}">${SY[s]}</span>`}</button>`}).join('');
    lower=`<div class="box"><div class="brow lv">${lvB}</div><div class="brow st">${stB}</div>
      <div class="brow ac3"><button class="bc p" data-call="P">Pass</button><button class="bc x" data-call="X" ${lg.x?'':'disabled'}>X</button><button class="bc xx" data-call="XX" ${lg.xx?'':'disabled'}>XX</button></div>
      <p class="hint">${lv?`Now pick a strain for level ${lv}.`:'Pick a level, then a strain.'}</p></div>`;
  }
  app.innerHTML=`<div class="bar"><button class="back" id="back">‹ All drills</button><span class="count">Hand ${S.pos+1} / ${S.order.length} · ${ok} correct</span></div>
    ${dots}<div class="lead"><span class="eyebrow">${S.retry?'Retrying misses · ':''}${rich(d.name)}</span>${pips}<p class="note">${rich(st.note)}${prevWrong?' <span class="muted">(The auction went on with the chart call.)</span>':''}</p></div>
    ${auctionHTML(q.dealer,st.calls,S.answered||'?')}${handHTML(q.hand,!!S.answered)}${lower}`;
  document.getElementById('back').onclick=()=>{S={view:'home'};render()};
  app.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{S.level=+b.dataset.lv;render()});
  app.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>answer(S.level+ST[+b.dataset.st]));
  app.querySelectorAll('[data-call]').forEach(b=>b.onclick=()=>answer(b.dataset.call));
  const nx=document.getElementById('next');if(nx){nx.onclick=next;nx.focus({preventScroll:true})}
}
function answer(b){
  const i=S.order[S.pos],q=S.qs[i];S.answered=b;S.cur[S.step]=b;
  if(S.step===q.steps.length-1){const n=q.steps.filter((st,k)=>S.cur[k]===st.ans.bid).length;S.res[i]={bids:S.cur.slice(),n,ok:n===q.steps.length};if(!S.retry)save()}
  render();
}
function next(){
  const q=S.qs[S.order[S.pos]];S.answered=null;S.level=null;
  if(S.step<q.steps.length-1){S.step++;render();return}
  S.step=0;S.cur=[];
  if(S.pos<S.order.length-1){S.pos++;render();window.scrollTo({top:0})}
  else{if(!S.retry){const sc=S.res.filter(r=>r&&r.ok).length;DB.best[S.id]=Math.max(DB.best[S.id]||0,sc);save()}S.view='done';render();window.scrollTo({top:0})}
}
function done(){
  const d=SETS.find(x=>x.id===S.id),sc=S.order.filter(j=>S.res[j]&&S.res[j].ok).length,miss=S.order.filter(j=>!(S.res[j]&&S.res[j].ok));
  let calls=0,callsOk=0;S.order.forEach(j=>{calls+=S.qs[j].steps.length;if(S.res[j])callsOk+=S.res[j].n});
  const rows=S.order.map(j=>{const q=S.qs[j],r=S.res[j],ok=r&&r.ok;
    const stepRows=q.steps.map((st,k)=>{const yb=r&&r.bids[k],g=yb===st.ans.bid;return `<div class="srow"><span class="mk ${g?'ok':'no'}">${g?'✓':'✗'}</span><div><b>${fmt(st.ans.bid)}</b>${g?'':` <span class="muted">(you: ${yb?fmt(yb):'—'})</span>`} ${rich(st.ans.why)}</div></div>`}).join('');
    return `<details><summary><span class="mk ${ok?'ok':'no'}">${ok?'✓':'✗'}</span><span class="sm">${rich(q.steps[0].note)}</span><span class="cmp">${r?r.n:0}/${q.steps.length} calls</span></summary>
    <div class="det">${auctionHTML(q.dealer,q.calls)}<p class="out">${outcome(q)}</p><div class="pair">${handHTML(q.hand,true,'Your hand')}${q.partner?handHTML(q.partner,true,"Partner's hand"):''}</div>${stepRows}</div></details>`}).join('');
  app.innerHTML=`<div class="bar"><button class="back" id="back">‹ All drills</button><span class="count">${S.retry?'Retry':'Best '+(DB.best[S.id]??sc)+'/25'}</span></div>
    <div class="intro"><span class="eyebrow">${rich(d.name)}</span><div class="score">${sc}<span class="muted" style="font-size:24px"> / ${S.order.length} hands</span></div>
    <p class="muted">${callsOk} of ${calls} calls matched the chart. ${miss.length?`${miss.length} hands to review. Tap one to see both hands and every call.`:'Every hand was bid perfectly.'}</p></div>
    <div class="actions">${miss.length?'<button class="primary" id="retry">Retry the hands I missed</button>':''}<button class="ghost" id="fresh">Deal 25 new hands</button></div>
    <div class="review">${rows}</div>`;
  document.getElementById('back').onclick=()=>{S={view:'home'};render()};
  const rt=document.getElementById('retry');if(rt)rt.onclick=()=>start(S.id,miss);
  document.getElementById('fresh').onclick=()=>{DB.seed[S.id]=(DB.seed[S.id]||1)+1;delete DB.prog[S.id];save();start(S.id)};
}
function render(){S.view==='home'?home():S.view==='play'?play():done()}
render();
