// Full-auction bidder: both partners follow the chart, opponents pass.
// ================== Full-auction bidder (both partners follow the chart; opponents pass) ==================
const AP=why=>({bid:'P',why,ref:'',auto:true});
function inv(h){const p=hcp(h);return p<=15?R('P',`${p} HCP is a minimum (15): pass the invitation.`,'A'):R('3N',`${p} HCP is a maximum (16-17): accept with 3NT.`,'A')}
function inv4(h,M){const p=hcp(h);return p<=15?R('P',`${p} HCP is a minimum (15): pass 3${SY[M]}.`,'A'):R(B(4,M),`${p} HCP is a maximum (16-17): accept with 4${SY[M]}.`,'A')}
function smolenAns(h,f){const t=L(h)[f];return t>=3?R(B(4,f),`Smolen shows five ${SN[f]}. With ${t} ${SN[f]}, bid 4${SY[f]}.`,'A'):R('3N',`Smolen shows five ${SN[f]}. With only ${t}, bid 3NT.`,'A')}
function rangeAns(h){const p=hcp(h);return p<=16?R('2N',`Answering the 2♠ range-ask: ${p} HCP, so 2NT (15-16).`,'A'):R('3C','Answering the 2♠ range-ask: 17 HCP, so 3♣ (maximum).','A')}
function rangeResp(h,rep){const l=L(h),p=hcp(h),wm=l[0]>=6?0:l[1]>=6?1:-1;
  if(wm<0){if(p!==8)return null;return rep==='2N'?R('P','You have 8 and opener showed 15-16 with 2NT: pass.','A'):R('3N','You have 8 and opener showed 17 with 3♣: bid 3NT.','A')}
  if(rep==='2N')return R(B(3,wm),`Weak with long ${SN[wm]}: 3${SY[wm]} to play.`,'A');
  return wm===0?R('P','Weak with long clubs: pass 3♣.','A'):R('3D','Weak with long diamonds: 3♦ to play.','A')}
function over2Nx(h,pm){
  const p=hcp(h),l=L(h),H=l[2],S=l[3];
  if(p>10)return null;
  if((H>=5&&S>=4)||(S>=5&&H>=4))return null;
  if((H>=6||S>=6)&&p>pm){const M=S>=6?3:2;return R(M===2?'4D':'4H',`Six ${SN[M]} with enough to play game: Texas ${M===2?'4♦ → 4♥':'4♥ → 4♠'}.`,'E')}
  if(H>=5||S>=5){const M=S>=5?3:2;if(p>5)return null;return R(M===2?'3D':'3H',`${l[M]} ${SN[M]}: transfer with ${M===2?'3♦':'3♥'}. ${p<=pm?`Then pass with 0-${pm}.`:`Then 4${SY[M]}.`}`,'E')}
  if(p<=pm)return R('P',`${p} HCP: ${pm===3?'0-3 passes 2NT':'0-1 passes 2NT here'}.`,'E');
  if(H===4||S===4)return R('3C',`${p} HCP with a 4-card major: 3♣ Stayman.`,'E');
  return R('3N',`${p} HCP, no major: 3NT.`,'E');
}
function nt2(seq,h,pm){
  const n=seq.length,r=seq[1],l=L(h),p=hcp(h);
  if(n===1)return over2Nx(h,pm);
  if(n===2){
    if(r==='3C')return l[2]>=4?R('3H','Answering 3♣ Stayman: four hearts, 3♥.','E'):l[3]>=4?R('3S','Answering 3♣ Stayman: four spades, 3♠.','E'):R('3D','Answering 3♣ Stayman: no 4-card major, 3♦.','E');
    if(r==='3D')return R('3H','3♦ is a transfer: complete it with 3♥.','E');
    if(r==='3H')return R('3S','3♥ is a transfer: complete it with 3♠.','E');
    if(r==='4D')return R('4H','Texas: complete to 4♥.','E');
    if(r==='4H')return R('4S','Texas: complete to 4♠.','E');
    if(r==='3N')return AP('Partner bid game.');
    return null}
  if(n===3){
    if(r==='3C'){const a=seq[2];if(a==='3H')return l[2]>=4?R('4H','Opener has four hearts and so do you: 4♥.','E'):R('3N','No heart fit: 3NT.','E');
      if(a==='3S')return l[3]>=4?R('4S','Opener has four spades and so do you: 4♠.','E'):R('3N','No spade fit: 3NT.','E');return R('3N','Opener has no 4-card major: 3NT.','E')}
    if(r==='3D'||r==='3H'){const M=r==='3D'?2:3;if(p<=pm)return R('P',`${p} HCP: pass the completion.`,'E');return R(B(4,M),`${p} HCP: raise to 4${SY[M]}.`,'E')}
    if(r==='4D'||r==='4H')return R('P','Texas was a sign-off: pass.','E');
    return null}
  if(n===4){const a=seq[3];if(a==='P')return null;if(a==='3N'||/^4[HS]$/.test(a))return AP('Partner chose the contract.');}
  return null;
}
function jacCont(h,M,x){
  const p=hcp(h),G=' (Trainer guide: about 31+ combined points with a fit is enough to ask for key cards.)';
  if(x===B(4,M)){if(p<=16)return R('P',`Opener's 4${SY[M]} shows a flat 11-14. With ${p} you have at most ${p+14} combined: pass.`,'B');if(p>=20)return R('4N',`Opener has 11-14. With ${p} you have at least ${p+11} combined and a fit: 4NT RKCB.${G}`,'G');return null}
  if(x==='3N'){if(p<=13)return R(B(4,M),`Opener's 3NT shows a flat 15-17. With ${p}, settle for 4${SY[M]}.`,'B');if(p>=16)return R('4N',`Opener has 15-17. With ${p} you have at least ${p+15} combined: 4NT RKCB.${G}`,'G');return null}
  if(x===B(3,M))return R('4N',`Opener's 3${SY[M]} shows a flat 18+. With ${p} you have at least ${p+18} combined: 4NT RKCB.${G}`,'G');
  return null;
}
function respAfterRebid(h,seq){
  const p=hcp(h),l=L(h),r=seq[1],x=seq[2];if(x==='P'||!/^\d/.test(x))return null;
  const rs=ST.indexOf(r[1]),rl=+r[0],xs=ST.indexOf(x[1]),xl=+x[0];
  if(xs===rs){if(rs<2)return null;
    if(xl===rl+1){if(p>=13)return R(B(4,rs),`Opener's simple raise shows 11-14. With ${p}, bid game: 4${SY[rs]}.`,'D');
      if(p>=11){if(xl>=3)return null;return R(B(3,rs),`Opener's simple raise shows 11-14. With ${p} (11-12), invite with 3${SY[rs]}.`,'D')}
      return R('P',`Opener's simple raise shows 11-14. With ${p} (10 or less), pass.`,'D')}
    if(xl===3&&rl===1){if(p>=10)return R(B(4,rs),`Opener's double raise shows 15-19. With ${p} (10+), bid 4${SY[rs]}.`,'D');return R('P',`Opener's double raise shows 15-19. With ${p} (6-9), pass.`,'D')}
    return null}
  if(x==='1N'){if(l[rs]>=5||p>15)return null;if(p<=10)return R('P',`Opener's 1NT shows 12-14 balanced. With ${p} (10 or less), pass.`,'D');if(p<=12)return R('2N',`Opener's 1NT shows 12-14. With ${p} (11-12), invite with 2NT.`,'D');return R('3N',`Opener's 1NT shows 12-14. With ${p} (13+), bid 3NT.`,'D')}
  if(x==='2N'&&rl===1){if(rs>=2&&l[rs]>=5)return null;if(p>=7)return R('3N',`Opener's 2NT shows 18-19 balanced. With ${p} (7+), bid 3NT.`,'D');return R('P',`Opener's 2NT shows 18-19. With only ${p}, pass.`,'D')}
  return null;
}
function sysCall(seq,h){
  const n=seq.length,p=hcp(h),l=L(h);
  if(n===0)return openingBid(h);
  const o=seq[0],r=seq[1],last=seq[n-1];
  if(o==='P')return null;
  if(n>=2&&last==='P')return null;
  // ---- 1NT ----
  if(o==='1N'){
    if(n===1)return r1NT(h);
    if(n===2){switch(r){
      case '2C':return stayAns(h);case '2D':return R('2H','2♦ is a transfer: complete it with 2♥.','A');case '2H':return R('2S','2♥ is a transfer: complete it with 2♠.','A');
      case '4D':return R('4H','Texas: complete to 4♥.','A');case '4H':return R('4S','Texas: complete to 4♠.','A');case '2S':return rangeAns(h);
      case '2N':return inv(h);case '4N':return p<=15?R('P','15 HCP is a minimum: pass the quantitative 4NT.','A'):R('6N',`${p} HCP is a maximum (16-17): bid 6NT.`,'A');
      case '3N':return AP('Partner bid game.');}return null}
    if(n===3){const a=seq[2];
      if(r==='2C')return afterStay(h,a);
      if(r==='2D')return afterXfer(h,2);if(r==='2H')return afterXfer(h,3);
      if(r==='2S')return rangeResp(h,a);
      if(r==='4D'||r==='4H')return R('P','Texas was a sign-off: pass.','A');
      return null}
    if(n===4){const rep=seq[2],a=seq[3];
      if(r==='2C'){
        if(rep==='2D'){if(a==='2N')return inv(h);if(a==='3H')return smolenAns(h,3);if(a==='3S')return smolenAns(h,2);if(a==='3N'||a==='2H'||a==='2S')return AP('Partner signed off.');return null}
        if(rep==='2H'){if(a==='3H')return inv4(h,2);if(a==='2N')return l[3]>=4?null:inv(h);if(a==='2S')return l[3]>=4?R('4S','Partner\'s 2♠ shows four spades, game forcing. You have four: 4♠.','A'):R('3N','Partner\'s 2♠ shows four spades, game forcing. You have fewer than four: 3NT.','A');if(a==='4H'||a==='3N')return AP('Partner bid game.');return null}
        if(rep==='2S'){if(a==='3S')return inv4(h,3);if(a==='2N')return inv(h);if(a==='4S'||a==='3N')return AP('Partner bid game.');return null}}
      if(r==='2D'||r==='2H'){const M=r==='2D'?2:3;
        if(a==='2N')return l[M]>=3?null:inv(h);
        if(a===B(3,M))return inv4(h,M);
        if(a==='3N')return l[M]>=3?R(B(4,M),`Partner showed five ${SN[M]} and 10-14. With ${l[M]} ${SN[M]}, correct to 4${SY[M]}.`,'A'):R('P',`Partner showed five ${SN[M]}. With only ${l[M]}, pass 3NT.`,'A');
        return null}
      if(r==='2S'&&(a==='3N'||a==='3C'||a==='3D'))return AP('Partner chose the contract.');
      return null}
    if(n===5){const a=seq[3],b=seq[4];if(/^(3N|4[HS])$/.test(b)&&a!=='2N')return AP('Partner chose the contract.');if(b==='3N'||/^4[HS]$/.test(b))return AP('Partner chose the contract.');}
    return null}
  if(o==='2N')return nt2(seq,h,3);
  if(o==='2C'){
    if(n===1)return over2C(h);
    if(r!=='2D')return null;
    if(n===2)return twoClubRebid(h);
    if(seq[2]==='2N')return nt2(seq.slice(2),h,1);
    if(n===4&&(seq[3]==='3N'))return AP('Partner bid game.');
    return null}
  if(o==='2H'||o==='2S'){const M=ST.indexOf(o[1]);
    if(n===1)return wtResp(h,M);
    if(n===2){if(r==='2N')return wtAns(h,M);if(r===B(3,M)||r===B(4,M))return AP('Partner raised: pass.');return null}
    return null}
  if(o==='1H'||o==='1S'){const M=ST.indexOf(o[1]);
    if(n===1)return r1M(h,M);
    if(n===2){
      if(r===B(2,M))return p<=15?R('P',`Partner's 2${SY[M]} shows 6-9 with 3 trumps. With ${p} (11-15), pass.`,'B'):p<=18?R(B(3,M),`Partner's 2${SY[M]} shows 6-9. With ${p} (16-18), try for game with 3${SY[M]}.`,'B'):R(B(4,M),`Partner's 2${SY[M]} shows 6-9. With ${p} (19+), bid 4${SY[M]}.`,'B');
      if(r===B(3,M))return p>=15?R(B(4,M),`Partner's 3${SY[M]} shows 10-12. With ${p} (15+), bid 4${SY[M]}.`,'B'):p<=12?R('P',`Partner's 3${SY[M]} shows 10-12. With ${p} (11-12), pass.`,'B'):null;
      if(r==='3D')return p<=15?R(B(3,M),`Partner's 3♦ shows 4+ trumps, 7-9. With ${p} (11-15), sign off in 3${SY[M]}.`,'B'):R(B(4,M),`Partner's 3♦ shows 4+ trumps, 7-9. With ${p} (16+), bid 4${SY[M]}.`,'B');
      if(r==='3C')return p<=13?R(B(3,M),`Partner's 3♣ shows 4+ trumps, 10-12. With ${p} (11-13), sign off in 3${SY[M]}.`,'B'):R(B(4,M),`Partner's 3♣ shows 4+ trumps, 10-12. With ${p} (14+), bid 4${SY[M]}.`,'B');
      if(r==='2N')return jac(h,M);
      if(r===B(4,M))return AP('Partner\'s weak 4-level raise is to play.');
      if(r==='1N')return null;
      return rebid(h,M,ST.indexOf(r[1]),+r[0])}
    if(n===3){const x=seq[2];
      if(r===B(2,M)&&x===B(3,M))return p<=7?R('P',`Opener's 3${SY[M]} is a game try (16-18). With ${p} (6-7), pass.`,'B'):R(B(4,M),`Opener's 3${SY[M]} is a game try (16-18). With ${p} (8-9), accept with 4${SY[M]}.`,'B');
      if(r==='2N')return jacCont(h,M,x);
      if(/^(3[CD]|3[HS]|2[HS])$/.test(r)&&(x===B(3,M)||x===B(4,M)))return AP('Opener signed off.');
      if(x===B(4,M))return AP('Opener bid game.');
      return respAfterRebid(h,seq)}
    if(n===4){const a=seq[3];
      if(r==='2N'&&a==='4N')return rkReply(h,M);
      if(a===B(4,M)||a==='3N')return AP('Partner bid game.');
      return null}
    if(n===5&&r==='2N'&&seq[3]==='4N')return askDecide(h,M,seq[4]);
    if(n===6&&r==='2N'&&(seq[5]===B(5,M)||seq[5]===B(6,M)))return AP('Partner signed off after RKCB.');
    return null}
  if(o==='1C'||o==='1D'){const m=ST.indexOf(o[1]);
    if(n===1)return r1m(h,m);
    if(n===2){
      if(r==='1N')return isBal(h)&&p>=18&&p<=19?R('2N',`Balanced 18-19 after partner's 1NT: 2NT.`,'C'):null;
      if(r==='2N'){if(!isBal(h))return null;return p<=12?R('P',`Partner's 2NT shows 11-12. With ${p} (11-12), pass.`,'C'):R('3N',`Partner's 2NT shows 11-12. With ${p} (13+), bid 3NT.`,'C')}
      if(r==='3N')return AP('Partner bid game.');
      return rebid(h,m,ST.indexOf(r[1]),+r[0])}
    if(n===3){const x=seq[2];
      if(r==='1N'&&x==='2N')return p<=7?R('P',`Opener's 2NT shows 18-19. With ${p} (6-7), pass.`,'C'):R('3N',`Opener's 2NT shows 18-19. With ${p} (8-10), bid 3NT.`,'C');
      if(r==='2N'&&x==='3N')return AP('Opener bid game.');
      return respAfterRebid(h,seq)}
    if(n===4){const a=seq[3];if(a==='3N'||/^4[HS]$/.test(a))return AP('Partner bid game.');return null}
    return null}
  return null;
}
const SEATS4=['W','N','E','S'];
function simulate(hS,hN,dealer,note){
  let si=SEATS4.indexOf(dealer);const calls=[],seq=[],steps=[],pn=[];let ended=false;
  for(let g=0;g<40;g++){
    const seat=SEATS4[si];
    if(seat==='E'||seat==='W'){calls.push('P');si=(si+1)%4;continue}
    const a=sysCall(seq,seat==='S'?hS:hN);
    if(!a)break;
    if(seat==='S'&&!a.auto)steps.push({calls:calls.slice(),ans:a,note:steps.length?`Partner bid ${plain(seq[seq.length-1])}.`:note});
    if(seat==='N')pn.push({call:a.bid,why:a.why,auto:!!a.auto});
    calls.push(a.bid);seq.push(a.bid);
    if(a.bid==='P'){ended=seq.length>1;break}
    si=(si+1)%4;
  }
  let contract=null;if(ended){const b=[...seq].reverse().find(c=>c!=='P');contract=b||null}
  return{calls,steps,pn,contract};
}
function dealOther(rng,used,spec,lo,hi,ok){
  const avail=[0,1,2,3].map(s=>[14,13,12,11,10,9,8,7,6,5,4,3,2].filter(r=>!used[s].includes(r)));
  for(let t=0;t<4000;t++){
    const lens=spec==='bal'?balL(rng):rl(rng,spec);if(!lens||lens.some((n,s)=>n>avail[s].length))continue;
    const h=lens.map((n,s)=>{const pool=avail[s].slice();for(let i=0;i<n;i++){const j=i+Math.floor(rng()*(pool.length-i));const x=pool[i];pool[i]=pool[j];pool[j]=x}return pool.slice(0,n).sort((a,b)=>b-a)});
    const p=hcp(h);if(p<lo||p>hi)continue;if(ok&&!ok(h))continue;return h}
  return null}
const opensAs=b=>h=>{const o=openingBid(h);return !!o&&(typeof b==='string'?o.bid===b:b.test(o.bid))};
function deep(hS,hN,dealer,note,min){if(!hS||!hN)return null;const sim=simulate(hS,hN,dealer,note);if(sim.steps.length<(min||2))return null;
  return{dealer,hand:hS,partner:hN,steps:sim.steps,calls:sim.calls,pn:sim.pn,contract:sim.contract}}
function single(q){return q&&{dealer:q.dealer,hand:q.hand,partner:null,steps:[{calls:q.calls,ans:q.ans,note:q.note}],calls:q.calls.concat(q.ans.bid),pn:[],contract:null}}

// ---- recipe helpers ----
const SO=(lensF,lo,hi,pLo,pHi,min,pSpec,ok)=>rng=>{const h=deal(rng,lensF(rng),lo,hi);if(!h||(ok&&!ok(h)))return null;if(!openingBid(h))return null;
  const n=dealOther(rng,h,pSpec?pSpec(rng,h):sp({},[0,6]),pLo,pHi);return deep(h,n,'S','You are dealer.',min)};
const PO=(min,f)=>rng=>{const c=f(rng);if(!c)return null;const h=deal(rng,c.s[0],c.s[1],c.s[2]);if(!h)return null;
  const n=dealOther(rng,h,c.p[0],c.p[1],c.p[2],opensAs(c.p[3]));return deep(h,n,'N',c.note,min)};
