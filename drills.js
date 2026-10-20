// The drill sets: which hands get dealt for each drill.
// ================== Drill sets ==================
const Q=(dealer,calls,hand,ans,note)=>({dealer,calls,hand,ans,note:note||''});
const nmaj=r=>rl(r,sp({2:[2,3],3:[2,3]},[2,5]));
const majSpec=r=>sp({2:[2,6],3:[2,6]},[0,5]);
const NT1={p:['bal',15,17,'1N'],note:'Partner opened 1NT (15-17).'};
const SETS=[
 {id:'open-bal',name:'Opening: balanced hands',refs:'Opening · A · D · E',blurb:'Open, then keep going: NT rebids, Stayman and transfer answers, 2NT and 2♣ follow-ups.',
  recipes:[SO(r=>balL(r),12,14,6,15),SO(r=>balL(r),12,14,6,15),SO(r=>balL(r),15,17,0,15,2,majSpec),SO(r=>balL(r),15,17,0,15,2,majSpec),SO(r=>balL(r),15,17,0,15,2,majSpec),
   SO(r=>balL(r),18,19,5,12),SO(r=>balL(r),18,19,5,12),SO(r=>balL(r),20,22,0,10,2,majSpec),SO(r=>balL(r),20,22,0,10,2,majSpec),SO(r=>balL(r),23,27,0,7),SO(r=>balL(r,[[5,3,3,2]]),11,14,6,15),SO(r=>balL(r),3,11,0,15,1)]},
 {id:'open-unbal',name:'Opening: unbalanced hands',refs:'Opening · B · D · E',blurb:'Open, hear partner, then rebid: raises, reverses, jump shifts, weak-two answers.',
  recipes:(()=>{const ub=h=>!isBal(h);return[
   SO(r=>{const M=ri(r,2,3);return rl(r,sp({[M]:[5,6]},[0,5]))},11,16,4,16,2,null,ub),SO(r=>{const M=ri(r,2,3);return rl(r,sp({[M]:[5,6]},[0,5]))},11,16,4,16,2,null,ub),
   SO(r=>rl(r,sp({2:[5,5],3:[5,5]},[0,3])),10,17,4,14,2,null,ub),SO(r=>rl(r,sp({2:[0,4],3:[0,4]},[0,6])),11,14,6,14,2,null,ub),
   SO(r=>rl(r,sp({},[1,6])),15,19,6,12,2,null,ub),SO(r=>rl(r,sp({},[1,6])),15,19,6,12,2,null,ub),SO(r=>rl(r,sp({},[1,6])),20,22,4,12,2,null,ub),
   SO(r=>shuffle(r,[4,4,4,1]),12,20,6,14,2),
   SO(r=>{const s=ri(r,2,3);return rl(r,sp({[s]:[6,6]},[0,4]))},5,10,14,17,2,(r,h)=>{const M=L(h)[2]===6?2:3;return sp({[M]:[0,3]},[1,5])}),
   SO(r=>rl(r,sp({},[0,6])),23,26,0,7,2,null,ub),
   SO(r=>{const s=ri(r,0,3);return rl(r,sp({[s]:[7,8]},[0,3]))},3,10,0,15,1)]})()},
 {id:'nt-resp',name:'Responding to 1NT',refs:'A',blurb:'Stayman, transfers, Smolen, the 2♠ range-ask and what you bid next.',
  recipes:[PO(1,r=>({...NT1,s:[nmaj(r),9,17]})),PO(1,r=>({...NT1,s:[nmaj(r),9,17]})),PO(2,r=>({...NT1,s:[nmaj(r),8,8]})),
   PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[4,4],[5-M]:[2,4]},[2,5])),8,15]}}),PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[4,4],[5-M]:[2,4]},[2,5])),8,15]}}),
   PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[5,5],[5-M]:[1,3]},[1,5])),0,14]}}),PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[5,5],[5-M]:[1,3]},[1,5])),6,14]}}),
   PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[6,6],[5-M]:[0,3]},[0,4])),2,9]}}),PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[6,7],[5-M]:[0,3]},[0,4])),10,15]}}),
   PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[5,5],[5-M]:[4,4]},[1,3])),0,13]}}),PO(2,r=>{const M=ri(r,2,3);return{...NT1,s:[rl(r,sp({[M]:[5,5],[5-M]:[4,4]},[1,3])),0,13]}}),
   PO(2,r=>{const m=ri(r,0,1);return{...NT1,s:[rl(r,sp({[m]:[6,7],2:[0,3],3:[0,3]},[0,3])),0,7]}})]},
 {id:'nt-open',name:'Opening 1NT and 2NT',refs:'A · E',blurb:'You open and answer partner: Stayman, transfers, invitations, Smolen, range-ask.',
  recipes:[SO(r=>balL(r),15,17,6,15,2,majSpec),SO(r=>balL(r),15,17,6,15,2,majSpec),SO(r=>balL(r),15,17,6,15,2,majSpec),SO(r=>balL(r),15,17,6,15,2,majSpec),
   SO(r=>balL(r),15,17,8,9,2),SO(r=>balL(r),15,17,0,7,2,r=>{const m=ri(r,0,1);return sp({[m]:[6,7],2:[0,3],3:[0,3]},[0,3])}),
   SO(r=>balL(r),20,22,0,10,2,majSpec),SO(r=>balL(r),20,22,0,10,2,majSpec)]},
 {id:'major-resp',name:'Responding to 1♥/1♠',refs:'B · D · G',blurb:'Raises and game tries, Jacoby 2NT through RKCB, and bidding after opener rebids.',
  recipes:(()=>{const M1=(t,lo,hi,min,h4s)=>PO(min,r=>{const M=h4s?2:ri(r,2,3);const o={[M]:t};if(h4s)o[3]=[4,5];return{s:[rl(r,sp(o,[0,6])),lo,hi],p:[sp({[M]:[5,6]},[0,5]),11,19,B(1,M)],note:`Partner opened 1${SY[M]} (5+ cards).`}});
   return[M1([3,3],6,9,2),M1([3,3],6,9,2),M1([3,3],8,9,2),M1([3,3],10,12,1),M1([4,4],7,9,1),M1([4,5],10,12,1),M1([4,5],13,17,2),M1([4,5],13,22,2),M1([4,5],16,22,2),M1([0,2],6,12,2,true),M1([0,2],6,12,2,true),M1([0,2],11,16,1),M1([5,6],1,6,1)]})()},
 {id:'minor-resp',name:'Responding to 1♣/1♦',refs:'C · D',blurb:'Your first response, then your second call after opener rebids.',
  recipes:(()=>{const m1=(lf,lo,hi,min,pp)=>PO(min,r=>{const m=ri(r,0,1);return{s:[lf(r),lo,hi],p:pp?['bal',18,19,B(1,m)]:[sp({},[0,6]),11,19,B(1,m)],note:`Partner opened 1${SY[m]}.`}});
   return[m1(nmaj,6,10,2,true),m1(nmaj,6,10,2,true),m1(r=>balL(r),6,12,2),m1(r=>balL(r),6,12,2),m1(r=>rl(r,sp({2:[4,5],3:[0,4]},[0,5])),6,15,2),m1(r=>rl(r,sp({3:[4,5],2:[0,4]},[0,5])),6,15,2),
    m1(r=>rl(r,sp({},[0,6])),6,14,2),m1(r=>rl(r,sp({},[0,6])),6,14,2),m1(nmaj,11,12,1),m1(nmaj,13,15,1)]})()},
 {id:'comp',name:'Competitive bidding',refs:'F',blurb:'One call per hand: overcalls, takeout and negative doubles, Michaels, Cappelletti.',
  recipes:(()=>{const OV=(lf,lo,hi)=>rng=>{const x=ri(rng,0,3);const h=deal(rng,lf(rng,x),lo,hi);if(!h)return null;const a=overcall(h,x);return a?Q('E',[B(1,x)],h,a,`RHO opened 1${SY[x]}.`):null};
   const NEG=weak=>rng=>{const cs=[[0,1],[ri(rng,0,1),2],[ri(rng,0,1),3],[2,3]];const[o,v]=pick(rng,cs);let o2={};
     if(!weak){if(o===0&&v===1)o2={2:[4,4],3:[4,4]};else if(v===2)o2={3:[4,4],2:[0,3]};else if(v===3&&o<=1)o2={2:[4,4],3:[0,3]};else o2={0:[4,6],1:[4,6],3:[0,3]}}
     const h=deal(rng,rl(rng,sp(o2,[0,5])),weak?0:6,weak?5:11);if(!h)return null;const a=negDbl(h,o,v);return a?Q('N',[B(1,o),B(1,v)],h,a,`Partner opened 1${SY[o]}; RHO overcalled 1${SY[v]}.`):null};
   const ADV=rng=>{const x=ri(rng,0,3);const h=deal(rng,rl(rng,sp({[x]:[0,3]},[0,6])),0,14);if(!h)return null;const a=advance(h,x);return a?Q('W',[B(1,x),'X','P'],h,a,`LHO opened 1${SY[x]}; partner made a takeout double.`):null};
   const CAP=(lf,lo,hi)=>rng=>{const h=deal(rng,lf(rng),lo,hi);if(!h)return null;const a=vs1NT(h);return a?Q('E',['1N'],h,a,'RHO opened a strong 1NT. You play Cappelletti.'):null};
   const two=(r,x)=>{const un=[0,1,2,3].filter(s=>s!==x);let pr;if(r()<.5){pr=x<=1?[2,3]:[x===2?3:2,ri(r,0,1)]}else pr=un.slice(0,2);return rl(r,sp({[pr[0]]:[5,6],[pr[1]]:[5,5]},[0,3]))};
   return[OV((r,x)=>rl(r,sp({},[0,6])),8,15),OV((r,x)=>rl(r,sp({[x]:[0,2]},[3,4])),12,17),OV((r,x)=>balL(r),15,18),
    OV((r,x)=>{const s=pick(r,[0,1,2,3].filter(t=>t!==x));return rl(r,sp({[s]:[6,6],[x]:[0,3]},[0,4]))},6,9),OV(two,6,10),OV(two,16,19),OV((r,x)=>rl(r,sp({},[0,4])),0,9),
    NEG(false),NEG(false),NEG(true),ADV,ADV,
    CAP(r=>rl(r,sp({2:[4,5],3:[4,5]},[0,4])),8,14),CAP(r=>{const M=ri(r,2,3),m=ri(r,0,1);return rl(r,sp({[M]:[5,6],[5-M]:[0,3],[m]:[4,5]},[0,4]))},8,14),
    CAP(r=>{const s=ri(r,0,3);return rl(r,sp({[s]:[6,7]},[0,3]))},8,13),CAP(r=>balL(r),8,18),CAP(r=>rl(r,sp({0:[5,6],1:[5,6]},[0,3])),8,13)].map(f=>rng=>single(f(rng)))})()},
 {id:'slam',name:'Slam bidding',refs:'B · G',blurb:'Jacoby 2NT to RKCB from both sides, key-card decisions, quantitative 4NT.',
  recipes:(()=>{const JR=(lo,hi)=>PO(2,r=>{const M=ri(r,2,3);return{s:[rl(r,sp({[M]:[4,5]},[1,5])),lo,hi],p:[sp({[M]:[5,6]},[1,5]),11,21,B(1,M)],note:`Partner opened 1${SY[M]}.`}});
   const JO=SO(r=>{const M=ri(r,2,3);return rl(r,sp({[M]:[5,6]},[2,4]))},12,21,13,22,3,(r,h)=>{const M=ST.indexOf(openingBid(h).bid[1]);return sp({[M]:[4,5]},[1,5])},opensAs(/^1[HS]$/));
   const JO2=SO(r=>{const M=ri(r,2,3);return rl(r,sp({[M]:[5,6]},[2,4]))},11,21,13,22,2,(r,h)=>{const M=ST.indexOf(openingBid(h).bid[1]);return sp({[M]:[4,5]},[1,5])},opensAs(/^1[HS]$/));
   return[JR(13,22),JR(16,22),JR(18,22),JR(20,22),JO,JO,JO2,PO(1,r=>({...NT1,s:[nmaj(r),16,17]})),SO(r=>balL(r),15,17,16,17,2,r=>sp({2:[2,3],3:[2,3]},[2,5]))]})()},
 {id:'big',name:'Strong openings & weak twos',refs:'E',blurb:'2NT and 2♣ auctions from both sides, and the weak-two 2NT ask.',
  recipes:[PO(2,r=>({s:[rl(r,sp({},[0,6])),0,10],p:['bal',20,22,'2N'],note:'Partner opened 2NT (20-22).'})),PO(2,r=>{const M=ri(r,2,3);return{s:[rl(r,sp({[M]:[5,6],[5-M]:[0,3]},[0,4])),0,10],p:['bal',20,22,'2N'],note:'Partner opened 2NT (20-22).'}}),
   PO(2,r=>({s:[rl(r,sp({},[0,6])),0,7],p:['bal',23,24,'2C'],note:'Partner opened 2♣ (23+).'})),PO(2,r=>({s:[rl(r,sp({},[0,6])),0,7],p:['bal',23,24,'2C'],note:'Partner opened 2♣ (23+).'})),
   SO(r=>rl(r,sp({},[1,6])),23,27,0,7,2),SO(r=>balL(r),23,26,0,7,2),
   SO(r=>{const s=ri(r,2,3);return rl(r,sp({[s]:[6,6]},[0,4]))},5,10,14,17,2,(r,h)=>{const M=L(h)[2]===6?2:3;return sp({[M]:[0,3]},[1,5])}),
   SO(r=>{const s=ri(r,2,3);return rl(r,sp({[s]:[6,6]},[0,4]))},5,10,14,17,2,(r,h)=>{const M=L(h)[2]===6?2:3;return sp({[M]:[0,3]},[1,5])}),
   SO(r=>balL(r),20,22,0,10,2,majSpec)]},
];
SETS.push({id:'mixed',name:'Mixed auctions',refs:'All',blurb:'Hands drawn from every uncontested drill, shuffled together.',
  recipes:SETS.filter(d=>d.id!=='comp').flatMap(d=>d.recipes)});
function buildSet(def,seed){
  let hsh=0;for(const c of def.id)hsh=(hsh*31+c.charCodeAt(0))|0;
  const rng=mulberry(seed*7919+hsh);const out=[],seen=new Set();let i=0,g=0;
  const order=shuffle(rng,def.recipes.map((_,k)=>k));
  while(out.length<25&&g<60000){g++;const q=def.recipes[order[i%order.length]](rng);
    if(q&&q.steps&&q.steps.length){const key=q.hand.map(s=>s.join('.')).join('|')+q.steps[0].calls.join();if(!seen.has(key)){seen.add(key);out.push(q);i++}}}
  return shuffle(rng,out);
}
if(typeof module!=='undefined')module.exports={SETS,buildSet,hcp,plain,shapeStr,bv};
