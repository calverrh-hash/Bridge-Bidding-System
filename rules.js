// Single-call rules from the flowchart: openings, responses, rebids, competitive, slam tools.
// ===== Bidding engine: rules follow the corrected 5-card majors / strong NT chart =====
const SY=['♣','♦','♥','♠'], SN=['clubs','diamonds','hearts','spades'], ST='CDHSN';
const BAL=[[4,3,3,3],[4,4,3,2],[5,3,3,2]];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(rng,a,b)=>a+Math.floor(rng()*(b-a+1));
const pick=(rng,arr)=>arr[Math.floor(rng()*arr.length)];
function shuffle(rng,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const B=(l,s)=>l+ST[s];
const bv=b=>(+b[0]-1)*5+ST.indexOf(b[1]);
const R=(bid,why,ref)=>({bid,why,ref});
const hcp=h=>h.reduce((a,s)=>a+s.reduce((b,r)=>b+(r>10?r-10:0),0),0);
const L=h=>h.map(s=>s.length);
const isBal=h=>{const k=L(h).slice().sort((a,b)=>b-a).join('');return k==='4333'||k==='4432'||k==='5332'};
const has=(h,s,r)=>h[s].includes(r);
const plain=b=>b==='P'?'Pass':b==='X'||b==='XX'?b:(b[1]==='N'?b[0]+'NT':b[0]+SY[ST.indexOf(b[1])]);
const shapeStr=h=>[3,2,1,0].map(s=>h[s].length).join('-');
const RANK={14:'A',13:'K',12:'Q',11:'J',10:'10'};
const cardName=(s,r)=>SY[s]+(RANK[r]||String(r));

function rl(rng,spec){for(let t=0;t<20000;t++){let sum=0;const l=spec.map(([a,b])=>{const v=ri(rng,a,b);sum+=v;return v});if(sum===13)return l}return null}
function sp(o,def){def=def||[0,6];const a=[0,1,2,3].map(()=>def.slice());for(const k in o)a[k]=o[k];return a}
const balL=(rng,pats)=>shuffle(rng,pick(rng,pats||BAL).slice());
function deal(rng,lens,lo,hi){
  if(!lens)return null;
  for(let t=0;t<20000;t++){
    const h=[[],[],[],[]];let p=0;
    for(let s=0;s<4;s++){const pool=[14,13,12,11,10,9,8,7,6,5,4,3,2];
      for(let i=0;i<lens[s];i++){const j=i+Math.floor(rng()*(13-i));const x=pool[i];pool[i]=pool[j];pool[j]=x}
      h[s]=pool.slice(0,lens[s]).sort((a,b)=>b-a);for(const r of h[s])if(r>10)p+=r-10}
    if(p>=lo&&p<=hi)return h}
  return null}
const stop=(h,s)=>{const n=h[s].length;return has(h,s,14)||(has(h,s,13)&&n>=2)||(has(h,s,12)&&n>=3)||(has(h,s,11)&&n>=4)};
const good=(h,s)=>[14,13,12,11].filter(r=>has(h,s,r)).length>=2;
function cheapest(s,after){const al=+after[0],as=ST.indexOf(after[1]);return s>as?al:al+1}

// ---------- Opening ----------
function minorOpen(l){return l[0]>l[1]?'1C':l[1]>l[0]?'1D':(l[0]>=4?'1D':'1C')}
function minorWhy(l){return l[0]>l[1]?'Clubs are the longer minor: 1♣.':l[1]>l[0]?'Diamonds are the longer minor: 1♦.':l[0]>=4?'4-4 in the minors opens 1♦.':'3-3 in the minors opens 1♣.'}
function openingBid(h){
  const p=hcp(h),l=L(h),bal=isBal(h),fiveM=l[2]>=5||l[3]>=5;
  if(p>=23)return R('2C',`${p} HCP. 23+ opens 2♣ with any shape. It is game forcing.`,'E');
  if(bal&&!fiveM){
    if(p<=11)return R('P',`${p} HCP balanced. A balanced 1♣/1♦ opening shows 12-14, so pass.`,'OB');
    if(p<=14)return R(minorOpen(l),`${p} HCP balanced with no 5-card major: open a minor (balanced 12-14). ${minorWhy(l)}`,'OB');
    if(p<=17)return R('1N',`${p} HCP balanced: open 1NT (15-17).`,'A');
    if(p<=19)return R(minorOpen(l),`${p} HCP balanced: 18-19 opens a minor, planning to rebid 2NT. ${minorWhy(l)}`,'OB');
    return R('2N',`${p} HCP balanced: open 2NT (20-22).`,'E');
  }
  if(bal&&fiveM){
    if((p>=15&&p<=17)||p>=20)return null;
    const M=l[3]>=5?3:2;
    if(p<=10)return R('P',`${p} HCP: a 1-level opening needs 11+, and a 5-card suit is too short for a weak two. Pass.`,'OB');
    return R(B(1,M),`${p} HCP with five ${SN[M]}: open 1${SY[M]} (5-card major, 11-22).`,'OB');
  }
  if(p>=11){
    if(fiveM){const M=l[3]>l[2]?3:2;return R(B(1,M),`${p} HCP, unbalanced, with a 5+ card major: open 1${SY[M]}. ${l[2]===l[3]?'Equal-length majors open 1♥.':'Open the longer major.'}`,'OB')}
    if(l[0]>=5&&l[0]===l[1])return null;
    return R(minorOpen(l),`${p} HCP, unbalanced, no 5-card major: open a minor. ${minorWhy(l)}`,'OB');
  }
  const mx=Math.max(...l),longs=[0,1,2,3].filter(s=>l[s]===mx);
  if(mx>=6&&longs.length>1)return null;
  if(mx>=9)return null;
  const s=longs[0];
  if(mx===8)return R(B(4,s),`${p} HCP with eight ${SN[s]}: pre-empt at the 4-level (8-card suit, 0-10 HCP).`,'E');
  if(mx===7)return R(B(3,s),`${p} HCP with seven ${SN[s]}: pre-empt at the 3-level (7-card suit, 0-10 HCP).`,'E');
  if(mx===6&&s>0&&p>=5)return R(B(2,s),`${p} HCP with six ${SN[s]}: weak two (5-10 HCP, 6-card suit).`,'E');
  if(mx===6&&s===0)return R('P',`${p} HCP is too weak to open 1♣, and 2♣ is the strong opening, so there is no weak two in clubs. Pass.`,'E');
  if(mx===6)return R('P',`${p} HCP is below the 5-10 range for a weak two. Pass.`,'E');
  return R('P',`${p} HCP and no long suit: a 1-level opening needs 11+. Pass.`,'OB');
}

// ---------- A: responses to 1NT ----------
function r1NT(h){
  const p=hcp(h),l=L(h),H=l[2],S=l[3];
  if(H>=5&&S>=5)return null;
  if((H>=6||S>=6)&&Math.min(H,S)>=4)return null;
  if(H>=6||S>=6){const M=S>=6?3:2;if(p>=16)return null;
    if(p>=10)return R(M===2?'4D':'4H',`Six+ ${SN[M]} and ${p} HCP: Texas transfer, ${M===2?'4♦ → 4♥':'4♥ → 4♠'} (6+ major, 10+, to play).`,'A');
    return R(M===2?'2D':'2H',`Six ${SN[M]}, ${p} HCP: transfer with ${M===2?'2♦':'2♥'}. ${p<=7?'Then pass the completion.':`Then 3${SY[M]} invites (6+ cards, 8-9).`}`,'A')}
  if((H===5&&S===4)||(S===5&&H===4)){const f=H===5?2:3,o=f===3?2:3;
    return R('2C',`5-4 in the majors: start with 2♣ Stayman. ${p<=7?`Weak (0-7): over 2♦ bid 2${SY[f]} to play; over 2${SY[o]} pass the fit.`:p<=9?'With 8-9 you invite after opener replies.':`Game forcing: over 2♦ use Smolen, 3${SY[o]} = five ${SN[f]} + four ${SN[o]}.`}`,'A')}
  if(H===5||S===5){const M=S===5?3:2;if(p>=15)return null;
    return R(M===2?'2D':'2H',`Five ${SN[M]}: transfer with ${M===2?'2♦':'2♥'} (5+ major, any strength). ${p<=7?'Weak: pass the completion.':p<=9?'Then 2NT invites (8-9).':'Then 3NT (10-14) lets opener choose.'}`,'A')}
  if(H===4||S===4){
    if(p>=8)return R('2C',`${p} HCP with a 4-card major: 2♣ Stayman (8+).`,'A');
    if(l[0]>=6||l[1]>=6){const m=l[0]>=6?0:1;return R('2S',`Weak with six ${SN[m]}: 2♠, then 3${SY[m]} to play.`,'A')}
    return R('P',`${p} HCP: Stayman needs 8+. With 0-7, pass 1NT.`,'A')}
  if(p<=7){if(l[0]>=6||l[1]>=6){const m=l[0]>=6?0:1;return R('2S',`Weak (${p}) with six ${SN[m]}: 2♠ (range-ask or weak long minor). Over opener's reply, ${m===0?'pass 3♣ or bid 3♣ over 2NT':'bid 3♦'} to play.`,'A')}
    return R('P',`${p} HCP with no long suit: 0-7 passes 1NT.`,'A')}
  if(Math.min(...l)<=1)return null;
  if(p===8)return R('2S','8 HCP, no 4-card major: 2♠ McKendrick range-ask. Opener shows 15-16 (2NT) or 17 (3♣).','A');
  if(p===9)return R('2N','9 HCP, no major: 2NT invites. Opener passes with 15, bids 3NT with 16-17.','A');
  if(p<=15)return R('3N',`${p} HCP balanced, no 4-card major: 3NT (10-15).`,'A');
  if(p<=17)return R('4N',`${p} HCP balanced: 4NT quantitative (16-17). Opener passes with 15, bids 6NT with 16-17.`,'A');
  return null;
}

// ---------- B: responses to 1♥/1♠ ----------
function newSuitM(h,M){const l=L(h);if(M===2&&l[3]>=4)return '1S';const c=M===2?[0,1]:[0,1,2];let b=c[0];for(const s of c)if(l[s]>l[b])b=s;return B(2,b)}
function r1M(h,M){
  const p=hcp(h),l=L(h),t=l[M];
  if(t>=5&&p<=6)return R(B(4,M),`${t} trumps and only ${p} HCP: jump to 4${SY[M]}, the weak raise (5+ trumps, to play).`,'B');
  if(t>=4){
    if(p<=5)return R('P',`${p} HCP is too weak to respond. Pass.`,'B');
    if(p===6)return null;
    if(p<=9)return R('3D',`${t}-card support and ${p} HCP: 3♦ shows 4+ trumps, 7-9.`,'B');
    if(p<=12)return R('3C',`${t}-card support and ${p} HCP: 3♣ shows 4+ trumps, 10-12.`,'B');
    return R('2N',`${t}-card support and ${p} HCP: Jacoby 2NT (4+ trumps, 13+, game forcing).`,'B')}
  if(t===3){
    if(p<=5)return R('P',`${p} HCP is too weak to respond. Pass.`,'B');
    if(p<=9)return R(B(2,M),`3-card support, ${p} HCP: simple raise to 2${SY[M]} (6-9).`,'B');
    if(p<=12)return R(B(3,M),`3-card support, ${p} HCP: limit raise to 3${SY[M]} (10-12).`,'B');
    const n=newSuitM(h,M);return R(n,`3-card support with ${p} HCP: bid a new suit first (${plain(n)}, forcing), then support. It leaves room for slam.`,'B')}
  if(p<=5)return R('P',`${p} HCP is too weak to respond. Pass.`,'B');
  if(M===2&&l[3]>=4)return R('1S',`Fewer than 3 hearts and ${l[3]} spades: 1♠ (4+ spades, 6+, forcing).`,'B');
  if(p<=8)return R('1N',`Fewer than 3 ${SN[M]} and ${p} HCP: 1NT (6-10, any shape, not forcing).`,'B');
  if(p<=10)return null;
  const n=newSuitM(h,M);return R(n,`Fewer than 3 ${SN[M]} and ${p} HCP: new suit at the 2-level (9+, forcing). Bid the longest; with equal length, the lower.`,'B');
}

// ---------- C: responses to 1♣/1♦ ----------
function r1m(h,m){
  const p=hcp(h),l=L(h),bal=isBal(h),maj=l[2]>=4||l[3]>=4;
  if(p<=5)return R('P',`${p} HCP: a response needs 6+. Pass.`,'C');
  let pre='';
  if(bal&&!maj){
    if(p<=10)return R('1N',`${p} HCP balanced with no 4-card major: 1NT (6-10).`,'C');
    if(p<=12)return R('2N',`${p} HCP balanced with no major: 2NT (11-12).`,'C');
    if(p<=15)return R('3N',`${p} HCP balanced with no major: 3NT (13-15).`,'C');
    pre=`With 16+ balanced, bid a new suit first, then 4NT quantitative. `}
  const c=[0,1,2,3].filter(s=>s!==m);let b=c[0];for(const s of c)if(l[s]>l[b])b=s;
  if(l[m]>l[b])return null;
  const lv=b>m?1:2;
  if(lv===2&&p<9)return null;
  const tie=c.filter(s=>l[s]===l[b]).length>1;
  return R(B(lv,b),`${pre}${pre?'':`${p} HCP: `}new suit, longest first${tie?' (equal length: bid the lower)':''}: ${plain(B(lv,b))}. ${lv===1?'1-level needs 6+':'2-level needs 9+'}; forcing.`,'C');
}

// ---------- D: opener's rebid ----------
function rebid(h,o,r,lvl){
  const p=hcp(h),l=L(h),bal=isBal(h),resp=B(lvl,r),bar=B(2,o),others=[0,1,2,3].filter(s=>s!==o&&s!==r);
  if(bal){
    if(r>=2&&l[r]>=4)return null;
    if(lvl===1&&others.some(s=>s>=2&&s>r&&l[s]>=4))return null;
    if(p>=12&&p<=14)return R(lvl===1?'1N':'2N',`Balanced 12-14: rebid ${lvl===1?'1NT':'2NT (after a 2-level response)'}.`,'D');
    if(p>=18&&p<=19)return R(lvl===1?'2N':'3N',`Balanced 18-19: rebid ${lvl===1?'2NT':'3NT (after a 2-level response)'}.`,'D');
    return null}
  if(p<=14){
    if(l[r]>=4)return R(B(lvl+1,r),`Unbalanced 11-14 with ${l[r]} ${SN[r]}: simple raise to ${plain(B(lvl+1,r))}.`,'D');
    if(l[o]>=6)return R(B(2,o),`Unbalanced 11-14 with six ${SN[o]}: simple rebid of 2${SY[o]}.`,'D');
    const below=others.filter(s=>l[s]>=4&&bv(B(cheapest(s,resp),s))<=bv(bar));
    if(below.length>1)return null;
    if(below.length===1){const s=below[0],b=B(cheapest(s,resp),s);return R(b,`Unbalanced 11-14: show the 4-card ${SN[s]} suit with ${plain(b)}. It sits below the barrier (2${SY[o]}), so it shows no extra strength.`,'D')}
    if(l[o]>=5)return R(B(2,o),`Unbalanced 11-14 with nothing else to show: simple rebid of your 5-card suit, 2${SY[o]}.`,'D');
    return null}
  if(lvl!==1)return null;
  if(p<=19){
    if(l[r]>=4)return R(B(3,r),`Unbalanced 15-19 with ${l[r]} ${SN[r]}: double raise to 3${SY[r]}.`,'D');
    const opts=[];
    if(l[o]>=6)opts.push([B(3,o),`Unbalanced 15-19 with six ${SN[o]}: jump rebid to 3${SY[o]}.`]);
    for(const s of others){if(l[s]>=4&&l[o]>l[s]){const b=B(cheapest(s,resp),s);if(bv(b)>bv(bar))opts.push([b,`Unbalanced 15-19: reverse with ${plain(b)}. It is above the barrier (2${SY[o]}), so it shows extra strength.`])}}
    if(opts.length!==1)return null;return R(opts[0][0],opts[0][1],'D')}
  if(p<=22){
    if(l[r]>=4)return null;
    const js=others.filter(s=>l[s]>=4);if(js.length!==1)return null;
    const s=js[0],b=B(cheapest(s,resp)+1,s);return R(b,`Unbalanced 20-22: jump shift to ${plain(b)}, game forcing.`,'D')}
  return null;
}

// ---------- F: competitive ----------
function overcall(h,x){
  const p=hcp(h),l=L(h),bal=isBal(h),un=[0,1,2,3].filter(s=>s!==x),five=un.filter(s=>l[s]>=5);
  const two=(p>=6&&p<=10)||p>=16;
  let mich,om=null;
  if(x<=1)mich=l[2]>=5&&l[3]>=5;else{om=x===2?3:2;mich=l[om]>=5&&(l[0]>=5||l[1]>=5)}
  const low=un.slice(0,2),unus=l[low[0]]>=5&&l[low[1]]>=5;
  if(mich||unus){if(!two)return null;
    if(mich)return R(B(2,x),`5-5 with ${x<=1?'both majors':`${SN[om]} and a minor`} and ${p} HCP (6-10 or 16+): Michaels cue bid 2${SY[x]}.`,'F');
    return R('2N',`5-5 in the two lowest unbid suits (${SN[low[0]]} and ${SN[low[1]]}), ${p} HCP: Unusual 2NT.`,'F')}
  if(five.length>=2)return null;
  if(bal&&p>=15&&p<=18){if(stop(h,x))return R('1N',`${p} HCP balanced with a ${SN[x]} stopper: 1NT overcall (15-18).`,'F');return null}
  if(p>=12&&five.length===0&&un.every(s=>l[s]>=3))return R('X',`${p} HCP with 3+ cards in every unbid suit: takeout double.`,'F');
  if(five.length===1){const s=five[0],n=l[s],lv=s>x?1:2;
    if(lv===1){
      if(n>=6&&p>=6&&p<=7)return R(B(2,s),`Six ${SN[s]} and ${p} HCP: weak jump overcall 2${SY[s]} (6+ suit, 6-10).`,'F');
      if(n>=6&&p>=8&&p<=10)return null;
      if(p>=8&&p<=15&&good(h,s))return R(B(1,s),`${n} good ${SN[s]} and ${p} HCP: 1${SY[s]} overcall (5+ good suit, 8+).`,'F');
      return null}
    if(n>=6&&p>=6&&p<=9)return R(B(3,s),`Six ${SN[s]} and ${p} HCP: weak jump overcall 3${SY[s]} (6+ suit, 6-10).`,'F');
    if(n>=6&&p>=11&&p<=15&&good(h,s))return R(B(2,s),`Six good ${SN[s]}, ${p} HCP: 2-level overcall 2${SY[s]} (6+ suit, 10+).`,'F');
    return null}
  if(p<=9)return R('P',`${p} HCP with no 5-card suit of your own and not enough to double: pass.`,'F');
  return null;
}
function negDbl(h,o,v){
  const p=hcp(h),l=L(h);let need,show;
  if(o===0&&v===1){need=l[2]===4&&l[3]===4;show='4-4 in the majors'}
  else if(o<=1&&v===2){need=l[3]===4;show='four spades'}
  else if(o<=1&&v===3){need=l[2]===4;show='four hearts'}
  else{need=l[0]>=4&&l[1]>=4;show='both minors'}
  if(need&&p>=6)return R('X',`Negative double: shows ${show} and 6+ (the overcall was at the 1-level).`,'F');
  if(p<=5)return R('P',`Only ${p} HCP: a negative double over a 1-level overcall needs 6+. Pass.`,'F');
  return null;
}
function advance(h,x){
  const p=hcp(h),l=L(h),un=[0,1,2,3].filter(s=>s!==x);
  const mx=Math.max(...un.map(s=>l[s])),longs=un.filter(s=>l[s]===mx);
  if(longs.length>1||p>15)return null;
  const s=longs[0],lv=s>x?1:2;
  if(p<=8)return R(B(lv,s),`${p} HCP (0-8): bid your longest suit at the lowest level, ${plain(B(lv,s))}. Never pass a takeout double.`,'F');
  if(p<=11)return R(B(lv+1,s),`${p} HCP (9-11): jump in your longest suit, ${plain(B(lv+1,s))}.`,'F');
  const g=s>=2?B(4,s):B(5,s);return R(g,`${p} HCP (12+): bid game in your longest suit, ${plain(g)}.`,'F');
}
function vs1NT(h){
  const p=hcp(h),l=L(h),[C,D,H,S]=l;
  if(p<8)return R('P',`${p} HCP: Cappelletti actions need 8+. Pass.`,'F');
  if(p>=16){if(isBal(h))return R('X',`${p} HCP balanced: double is penalty (16+).`,'F');return null}
  if(H>=4&&S>=4&&(H>=5||S>=5))return R('2D',`${H} hearts and ${S} spades: 2♦ shows both majors.`,'F');
  if(H>=5&&S<=3&&(C>=4||D>=4))return R('2H',`Hearts plus a 4+ minor: 2♥ (hearts and a minor).`,'F');
  if(S>=5&&H<=3&&(C>=4||D>=4))return R('2S',`Spades plus a 4+ minor: 2♠ (spades and a minor).`,'F');
  if(C>=5&&D>=5)return R('2N',`5-5 in the minors: 2NT.`,'F');
  const six=[0,1,2,3].filter(s=>l[s]>=6);
  if(six.length===1&&l.filter(n=>n>=4).length===1)return R('2C',`One long suit (${l[six[0]]} ${SN[six[0]]}): 2♣ shows any one-suiter. Partner relays 2♦${six[0]===1?' and you pass':` and you bid ${SN[six[0]]}`}.`,'F');
  if(isBal(h))return R('P',`Balanced ${p} HCP with no two-suiter: pass. Double needs 16+.`,'F');
  return null;
}

// ---------- B / G: Jacoby and slam ----------
function jac(h,M){
  const p=hcp(h),l=L(h);
  const short=[0,1,2,3].filter(s=>s!==M&&l[s]<=1);
  const g5=[0,1,2,3].filter(s=>s!==M&&l[s]>=5&&[14,13,12].filter(r=>has(h,s,r)).length>=2);
  if(short.length>1||(short.length&&g5.length)||g5.length>1)return null;
  if(short.length){const s=short[0];return R(B(3,s),`${l[s]===0?'Void':'Singleton'} in ${SN[s]}: show it with 3${SY[s]}.`,'B')}
  if(g5.length){const s=g5[0];if(M===2&&s===3)return null;return R(B(4,s),`Good 5-card ${SN[s]} suit: 4${SY[s]}.`,'B')}
  if(p<=14)return R(B(4,M),`Flat minimum (${p}): 4${SY[M]} shows 11-14 with no shortness.`,'B');
  if(p<=17)return R('3N',`Flat ${p}: 3NT shows 15-17 with no shortness.`,'B');
  return R(B(3,M),`Flat ${p}: 3${SY[M]} shows 18+ with no shortness.`,'B');
}
const kcList=(h,M)=>[0,1,2,3].filter(s=>has(h,s,14)).map(s=>cardName(s,14)).concat(has(h,M,13)?[cardName(M,13)]:[]);
function rkReply(h,M){
  const k=kcList(h,M),n=k.length,q=has(h,M,12);
  const list=n?`Key cards: ${k.join(', ')} = ${n}.`:'No key cards.';
  if(n===0||n===3)return R('5C',`${list} 5♣ shows 0 or 3.`,'G');
  if(n===1||n===4)return R('5D',`${list} 5♦ shows 1 or 4.`,'G');
  if(n===2)return q?R('5S',`${list} You hold the ${SY[M]}Q: 5♠ = 2 with the queen.`,'G'):R('5H',`${list} No trump queen: 5♥ = 2 without the queen.`,'G');
  return R('5D',`${list} 5♦ shows 1 or 4.`,'G');
}
function replyFor(pk,pq){return pk===0||pk===3?'5C':pk===1||pk===4?'5D':pq?'5S':'5H'}
function askDecide(h,M,reply){
  const k=kcList(h,M).length;let poss=reply==='5C'?[0,3]:reply==='5D'?[1,4]:[2];
  poss=poss.filter(v=>v+k<=5);if(poss.length!==1)return null;
  const pk=poss[0],tot=k+pk,miss=5-tot,rv=bv(reply),five=bv(B(5,M));
  const head=`You hold ${k}, partner's ${plain(reply)} shows ${reply==='5C'?'0 or 3':reply==='5D'?'1 or 4':'2'} so ${pk} here: ${tot} of 5.`;
  if(miss>=2){if(rv<five)return R(B(5,M),`${head} Missing two: sign off in 5${SY[M]}.`,'G');if(rv===five)return R('P',`${head} Missing two, and partner's reply is already 5${SY[M]}: pass.`,'G');return null}
  if(miss===1)return R(B(6,M),`${head} Missing one: bid 6${SY[M]}.`,'G');
  return R('5N',`${head} All five key cards: 5NT asks for kings.`,'G');
}

// ---------- E: 2NT, 2♣, weak twos ----------
function over2N(h){
  const p=hcp(h),l=L(h),H=l[2],S=l[3];
  if((H>=5&&S>=4)||(S>=5&&H>=4))return null;
  if((H>=6||S>=6)&&p>=4){const M=S>=6?3:2;return R(M===2?'4D':'4H',`Six ${SN[M]} with game values: Texas ${M===2?'4♦ → 4♥':'4♥ → 4♠'}.`,'E')}
  if(H>=5||S>=5){const M=S>=5?3:2;return R(M===2?'3D':'3H',`${l[M]} ${SN[M]}: transfer with ${M===2?'3♦':'3♥'}. ${p<=3?'Pass the completion with 0-3.':'Then 4'+SY[M]+'.'}`,'E')}
  if(p<=3)return R('P',`${p} HCP: 0-3 passes 2NT.`,'E');
  if(H===4||S===4)return R('3C',`${p} HCP with a 4-card major: 3♣ Stayman.`,'E');
  return R('3N',`${p} HCP, no major: 3NT (4+).`,'E');
}
function over2C(h){
  const p=hcp(h),l=L(h),bal=isBal(h);
  if(p<=7)return R('2D',`${p} HCP: 2♦ negative (0-7).`,'E');
  if(p>12)return null;
  const five=l.some(n=>n>=5);
  if(bal&&!five){if(l[2]===4||l[3]===4)return null;
    if(p<=9)return R('2N',`Balanced ${p}: 2NT positive (8-9).`,'E');return R('3N',`Balanced ${p}: 3NT positive (10-12).`,'E')}
  const c=[2,3].filter(s=>l[s]>=4).concat([0,1].filter(s=>l[s]>=5));if(!c.length)return null;
  const mx=Math.max(...c.map(s=>l[s])),t=c.filter(s=>l[s]===mx);if(t.length>1)return null;
  const s=t[0];return s>=2?R(B(2,s),`${p} HCP positive with ${l[s]} ${SN[s]}: 2${SY[s]} (4+ major).`,'E'):R(B(3,s),`${p} HCP positive with ${l[s]} ${SN[s]}: 3${SY[s]} (5+ minor).`,'E');
}
function twoClubRebid(h){
  const p=hcp(h),l=L(h),bal=isBal(h);if(p>27)return null;
  if(bal){if(l[2]>=5||l[3]>=5)return null;if(p<=24)return R('2N',`Balanced ${p}: 2NT shows 23-24.`,'E');return R('3N',`Balanced ${p}: 3NT shows 25-27.`,'E')}
  const c=[0,1,2,3].filter(s=>l[s]>=5);if(!c.length)return null;
  const mx=Math.max(...c.map(s=>l[s])),t=c.filter(s=>l[s]===mx);if(t.length>1)return null;
  const s=t[0];return s>=2?R(B(2,s),`Unbalanced with ${l[s]} ${SN[s]}: 2${SY[s]} (5+ suit).`,'E'):R(B(3,s),`Unbalanced with ${l[s]} ${SN[s]}: 3${SY[s]} (5+ minor).`,'E');
}
function wtResp(h,M){
  const p=hcp(h),t=L(h)[M];
  if(p>=14){if(t>=4)return null;return R('2N',`${p} HCP: 2NT asks (14+). Opener shows a feature or a minimum.`,'E')}
  if(t>=4)return R(B(4,M),`${t} trumps: raise to 4${SY[M]}.`,'E');
  if(t===3)return R(B(3,M),`3 trumps: raise to 3${SY[M]}.`,'E');
  return R('P',`${t} ${SN[M]} and under 14 HCP: pass.`,'E');
}
function wtAns(h,M){
  const p=hcp(h);
  if(has(h,M,14)&&has(h,M,13)&&has(h,M,12))return R('3N',`Solid AKQ in ${SN[M]}: 3NT.`,'E');
  const f=[0,1,2,3].filter(s=>s!==M&&(has(h,s,14)||has(h,s,13)));
  if(p<=7)return R(B(3,M),`${p} HCP is a minimum (5-7): 3${SY[M]}.`,'E');
  if(!f.length)return R(B(3,M),`${p} HCP but no outside ace or king: 3${SY[M]} (no feature).`,'E');
  if(f.length>1)return null;
  const s=f[0];return R(B(3,s),`${p} HCP (8-10) with an outside ${has(h,s,14)?'ace':'king'} in ${SN[s]}: show the feature with 3${SY[s]}.`,'E');
}

// ---------- A: 1NT continuations ----------
function stayAns(h){const l=L(h);if(l[2]>=4)return R('2H',`Four hearts: 2♥${l[3]>=4?' (you may also hold four spades)':''}.`,'A');if(l[3]>=4)return R('2S','Four spades, at most three hearts: 2♠.','A');return R('2D','No 4-card major: 2♦.','A')}
function afterStay(h,rep){
  const p=hcp(h),l=L(h),H=l[2],S=l[3],f54=(H===5&&S===4)?2:(S===5&&H===4)?3:-1;
  if(p>15)return null;
  if(rep==='2D'){
    if(f54>=0){const o=f54===3?2:3;
      if(p<=7)return R(B(2,f54),`Weak 5-4 (0-7): 2${SY[f54]} to play.`,'A');
      if(p<=9)return R('2N',`8-9 HCP: 2NT invites.`,'A');
      return R(B(3,o),`Game force with five ${SN[f54]} and four ${SN[o]}: Smolen 3${SY[o]}. Opener bids 4${SY[f54]} with 3+, else 3NT.`,'A')}
    if(p<=9)return R('2N',`No fit, 8-9 HCP: 2NT invites.`,'A');
    return R('3N',`No fit, ${p} HCP: 3NT (10+).`,'A')}
  const M=rep==='2H'?2:3,o=M===2?3:2;
  if(l[M]>=4){if(p<=7)return R('P',`Weak 5-4 and a ${SN[M]} fit: pass.`,'A');if(p<=9)return R(B(3,M),`Fit, 8-9 HCP: 3${SY[M]} invites.`,'A');return R(B(4,M),`Fit, ${p} HCP: 4${SY[M]}.`,'A')}
  if(p<=7)return null;
  if(p<=9)return R('2N',`No fit, 8-9 HCP: 2NT invites.`,'A');
  if(M===2)return R('2S',`Four spades, no heart fit, ${p} HCP: 2♠ is game forcing. Opener bids 4♠ with four, else 3NT.`,'A');
  return R('3N',`No fit, ${p} HCP: 3NT.`,'A');
}
function afterXfer(h,M){
  const p=hcp(h),t=L(h)[M];
  if(p<=7)return R('P',`${p} HCP (0-7): pass the completion.`,'A');
  if(p<=9)return t>=6?R(B(3,M),`Six ${SN[M]}, 8-9 HCP: 3${SY[M]} invites.`,'A'):R('2N',`Five ${SN[M]}, 8-9 HCP: 2NT invites.`,'A');
  if(t===5&&p<=14)return R('3N',`Five ${SN[M]}, ${p} HCP: 3NT. Opener passes or corrects to 4${SY[M]} with 3+.`,'A');
  return null;
}

