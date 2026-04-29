import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const worlds=[
 {id:"modern",e:"🏙️",name:"现代都市",desc:"这垃圾人生，一秒也不想哭了"},
 {id:"xianxia",e:"⚔️",name:"九州仙域",desc:"炼气筑基，渡劫飞升成仙"},
 {id:"space",e:"🚀",name:"银河纪元",desc:"群星是征途，也是坟场"},
 {id:"cyber",e:"🤖",name:"夜之城 2099",desc:"义体改造，霓虹下求生"},
 {id:"academy",e:"🧙‍♂️",name:"奥术大陆",desc:"恭喜入学，你是一个巫师"},
 {id:"abyss",e:"🐙",name:"深渊低语",desc:"直面深渊，深渊亦回望"},
 {id:"three",e:"🏯",name:"三国 · 逐鹿中原",desc:"乱世群雄，逐鹿中原"},
 {id:"more",e:"🌐",name:"更多世界",desc:"精选 · 热门 · 自由探索"}
];
const genders=[["👨","男性"],["👩","女性"],["✨","自定义"]];
const races=[["♟️","人类"],["🧝","精灵"],["🧛","吸血鬼"],["🤖","仿生人"],["🐉","龙裔"],["✨","自定义"]];
const talentPool=[
 {n:"动物朋友",r:"常见",d:"与动物特别亲近，治愈系、伙伴类事件加成"},
 {n:"梦想家",r:"常见",d:"脑袋里装满幻想，更容易触发理想主义选择"},
 {n:"阅读障碍",r:"少见",d:"学习与文字事件更困难，但直觉更敏锐"},
 {n:"天生富贵",r:"稀有",d:"初始金钱增加，但更容易被卷入利益纷争"},
 {n:"武学奇才",r:"稀有",d:"战斗和修炼类事件更容易获得优势"},
 {n:"社恐但敏锐",r:"少见",d:"社交压力更高，但智谋判断更强"},
 {n:"幸运儿",r:"史诗",d:"坏事常有转机，低概率触发奇遇"},
 {n:"商业嗅觉",r:"稀有",d:"金钱类选择收益更高"},
 {n:"灾厄体质",r:"罕见",d:"更容易遇到危险，但大难不死后成长更快"}
];
const attrMeta=[
 ["force","⚔️","武力","个人战斗力和军事才能"],
 ["iq","📚","智谋","谋略、外交和政治手段"],
 ["charm","♟️","魅力","领袖气质，招揽人才的能力"],
 ["family","🏯","出身","家族背景和起始资源"]
];
const initial = { step:0, world:null, gender:"男性", race:"人类", info:"", talents:[], attrs:{force:0,iq:0,charm:0,family:0}, age:0, money:0, hp:10, rep:0, stress:0, log:[], alive:true, event:null, redraw:3 };

function sample(arr,n){return [...arr].sort(()=>Math.random()-.5).slice(0,n)}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function nameMap(k){return {money:"金钱",hp:"生命",stress:"压力",rep:"声望",iq:"智谋",force:"武力",charm:"魅力",family:"出身"}[k]||k}
function effectText(e={}){return Object.entries(e).filter(([_,v])=>v).map(([k,v])=>`${nameMap(k)} ${v>0?"+":""}${v}`).join("，") || "无明显变化"}

function App(){
 const [S,setS]=useState(initial);
 const [loading,setLoading]=useState(false);
 const remain = 12 - Object.values(S.attrs).reduce((a,b)=>a+b,0);
 const update = p => setS(s => ({...s, ...p}));
 const go = step => update({step});

 async function fetchEvent(state){
   setLoading(true);
   try{
     const res=await fetch("/api/story",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)});
     const data=await res.json();
     setS(s=>({...s,event:data}));
   }finally{setLoading(false)}
 }

 function startLife(){
   let s={...S, step:6, age:0, hp:10+S.attrs.force, money:100+S.attrs.family*80, rep:0, stress:0, log:[], alive:true, event:null};
   for(const t of s.talents){
     if(t.n==="天生富贵") s.money+=500;
     if(t.n==="武学奇才") s.attrs.force+=2;
     if(t.n==="社恐但敏锐"){s.attrs.iq+=2;s.attrs.charm=Math.max(0,s.attrs.charm-1)}
     if(t.n==="幸运儿") s.rep+=1;
     if(t.n==="阅读障碍") s.attrs.iq=Math.max(0,s.attrs.iq-1);
   }
   setS(s); fetchEvent(s);
 }

 function applyEffects(effects={}){
   setS(s=>{
     const ns={...s, attrs:{...s.attrs}};
     for(const [k,v] of Object.entries(effects)){
       if(["force","iq","charm","family"].includes(k)) ns.attrs[k]=clamp((ns.attrs[k]||0)+Number(v),0,99);
       else ns[k]=Number(ns[k]||0)+Number(v);
     }
     ns.money=Math.max(0,Math.round(ns.money||0));
     ns.hp=clamp(Math.round(ns.hp||0),0,99);
     ns.stress=clamp(Math.round(ns.stress||0),0,99);
     ns.rep=Math.max(0,Math.round(ns.rep||0));
     return ns;
   });
 }

 async function choose(choice){
   const gain=effectText(choice.effects);
   let next={...S, age:S.age+1, log:[...S.log,{text:`${S.age}岁：${choice.text}。${choice.desc}`,gain}], event:null};
   for(const [k,v] of Object.entries(choice.effects||{})){
     if(["force","iq","charm","family"].includes(k)) next.attrs={...next.attrs,[k]:clamp((next.attrs[k]||0)+Number(v),0,99)};
     else next[k]=Number(next[k]||0)+Number(v);
   }
   next.money=Math.max(0,Math.round(next.money||0)); next.hp=clamp(Math.round(next.hp||0),0,99); next.stress=clamp(Math.round(next.stress||0),0,99); next.rep=Math.max(0,Math.round(next.rep||0));
   if(next.hp<=0||next.age>85||next.stress>=20) next.alive=false;
   setS(next);
   if(next.alive) await fetchEvent(next);
 }

 async function customAction(){
   const input=document.getElementById("customAction");
   const action=input?.value.trim();
   if(!action)return;
   setLoading(true);
   try{
    const res=await fetch("/api/custom",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({state:S,action})});
    const data=await res.json();
    await choose({text:action,desc:data.result,effects:data.effects||{}});
   }finally{setLoading(false)}
 }

 if(S.step===0) return <Shell><Top title="AI 人生重开手帐" sub="选择你的下一世" logo/><Divider/><div className="grid">{worlds.map(w=><div key={w.id} onClick={()=>update({world:w})} className={"world "+(S.world?.id===w.id?"sel":"")}><div className="emoji">{w.e}</div><b>{w.name}</b><p>{w.desc}</p></div>)}</div><Bottom><button disabled={!S.world} onClick={()=>go(1)}>开始这一世</button></Bottom></Shell>;
 if(S.step===1) return <Shell><Top title="身份设定" sub="选择你这一世的性别和种族"/><Divider/><Section title="性别"><div className="picks">{genders.map(x=><div className={"pick "+(S.gender===x[1]?"sel":"")} onClick={()=>update({gender:x[1]})}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></Section><Section title="种族"><div className="picks">{races.map(x=><div className={"pick small "+(S.race===x[1]?"sel":"")} onClick={()=>update({race:x[1]})}>{x[0]}　{x[1]}</div>)}</div></Section><Section title="额外信息（可选）"><textarea maxLength="300" value={S.info} onChange={e=>update({info:e.target.value})} placeholder="如：从小失明、有一个宿敌、前世是国王..."/><div className="count">{S.info.length}/300</div></Section><Bottom row><button className="ghost" onClick={()=>go(0)}>返回</button><button onClick={()=>go(2)}>下一步</button></Bottom></Shell>;
 if(S.step===2) return <Shell center><div className="star">✦</div><h2>天赋抽取</h2><p className="sub">命运将为你揭示三张天赋牌</p><button onClick={()=>update({talents:sample(talentPool,3),step:3,redraw:3})}>揭示命运</button></Shell>;
 if(S.step===3) return <Shell><h2>你的天赋</h2><Divider/>{S.talents.map(t=><div className="talent"><div><b>{t.n}</b><span>{t.r}</span></div><p>{t.d}</p></div>)}<Bottom row><button className="ghost" onClick={()=>S.redraw>0&&update({talents:sample(talentPool,3),redraw:S.redraw-1})}>重新抽取（剩余{S.redraw}次）</button><button onClick={()=>go(4)}>开始分配属性</button></Bottom></Shell>;
 if(S.step===4) return <Shell><h2>← 属性分配</h2><div className="remain">剩余 <b>{remain}</b><span>/12点</span></div><p className="sub centerText">天赋：{S.talents.map(t=>t.n).join(" · ")}</p><Divider/>{attrMeta.map(a=><div className="stat"><div className="statHead"><b>{a[1]} {a[2]}</b><span>{a[3]}</span></div><div className="control"><i onClick={()=>S.attrs[a[0]]>0&&update({attrs:{...S.attrs,[a[0]]:S.attrs[a[0]]-1}})}>−</i><div className="bar"><em style={{width:S.attrs[a[0]]*10+"%"}}/></div><i onClick={()=>remain>0&&S.attrs[a[0]]<10&&update({attrs:{...S.attrs,[a[0]]:S.attrs[a[0]]+1}})}>＋</i><b>{S.attrs[a[0]]}</b></div></div>)}<Bottom row><button className="ghost" onClick={()=>{let a={force:0,iq:0,charm:0,family:0};for(let i=0;i<12;i++){let k=Object.keys(a)[Math.floor(Math.random()*4)];a[k]++}update({attrs:a})}}>随机分配</button><button disabled={remain!==0} onClick={()=>go(5)}>开始人生</button></Bottom></Shell>;
 if(S.step===5) return <Shell><Top title="命运预览" sub="确认你的角色信息，准备开始人生"/><Divider/><Card><div className="chips"><b>{S.world.e} {S.world.name}</b><b>👤 {S.gender}</b><b>♟️ {S.race}</b></div></Card><Card title="天赋">{S.talents.map(t=><p><b>{t.n}</b>　{t.d}</p>)}</Card><Card title="属性"><div className="attrGrid">{attrMeta.map(a=><p>{a[1]} {a[2]}　<b>{S.attrs[a[0]]}</b></p>)}</div></Card><Card title="身世"><p className="sub">{S.info||"正在编织你的命运..."}</p></Card><Bottom><button onClick={startLife}>开始人生</button></Bottom></Shell>;
 return <Shell><div className="lifeHead"><div className="age">{S.age}岁</div><div className="sub">{S.world.e} {S.world.name} · {S.gender} · {S.race}</div><div className="meters"><Meter n="生命" v={S.hp}/><Meter n="金钱" v={S.money}/><Meter n="声望" v={S.rep}/><Meter n="压力" v={S.stress}/></div></div>{!S.alive?<Ending S={S}/>:<div className="event card">{loading&&!S.event?<p className="story">命运正在书写这一岁...</p>:<><p className="story">{S.event?.story}</p>{S.event?.choices?.map((c,i)=><div className="choice" onClick={()=>choose(c)}><b>{c.text}</b><p>{c.desc}</p><small>{effectText(c.effects)}</small></div>)}<div className="custom"><input id="customAction" placeholder="或者输入你自己的选择..."/><button disabled={loading} onClick={customAction}>执行</button></div></>}</div>}<div className="log">{S.log.slice(-10).reverse().map(l=><div className="logItem">{l.text}<div>{l.gain}</div></div>)}</div></Shell>
}
function Shell(p){return <main className={"app "+(p.center?"center":"")}>{p.children}</main>}
function Top({title,sub,logo}){return <div className="top">{logo&&<div className="logo"/>}<h1>{title}</h1><p>{sub}</p></div>}
function Divider(){return <div className="sep">✦</div>}
function Section({title,children}){return <section><h3>{title}</h3>{children}</section>}
function Bottom({children,row}) {return <div className={"bottom "+(row?"row":"")}>{children}</div>}
function Card({title,children}){return <div className="card preview">{title&&<b>{title}</b>}{children}</div>}
function Meter({n,v}){return <div className="meter">{n}<b>{v}</b></div>}
function Ending({S}){let score=S.money+S.rep*100+S.hp*30-S.stress*40;let rank=score>1800?"传奇人生":score>900?"精彩人生":score>300?"平凡人生":"坎坷人生";return <div className="card event"><h2>人生结束</h2><p className="story">你活到了 {S.age} 岁。最终金钱 {S.money}，声望 {S.rep}，压力 {S.stress}。命运评价：<b>{rank}</b>。</p><button onClick={()=>location.reload()}>重新开始</button></div>}

createRoot(document.getElementById("root")).render(<App/>);
