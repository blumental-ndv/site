"use strict";
const $=id=>document.getElementById(id);
const endpoint="https://api.github.com/repos/blumental-ndv/site/contents/reviews.json";
const months=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
let token="", rows=[], sha="", selected=-1, busy=false;
function show(id,v){$(id).hidden=!v;}
function msg(id,s,error=false){$(id).textContent=s;$(id).style.color=error?"#f18c8c":"#6bd5a2";}
function iso(s){const m=String(s||"").match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);return m&&months.includes(m[2])?m[3]+"-"+String(months.indexOf(m[2])+1).padStart(2,"0")+"-"+m[1].padStart(2,"0"):String(s||"").match(/^\d{4}-\d{2}-\d{2}$/)?.[0]||"";}
function display(s){const [y,m,d]=s.split("-");return Number(d)+" "+months[Number(m)-1]+" "+y;}
async function api(method="GET",body){
 const response=await fetch(endpoint+(method==="GET"?"?ref=main":""),{method,cache:"no-store",redirect:"error",headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok)throw Error("GitHub: HTTP "+response.status+(response.status===409||response.status===422?" — возможен конфликт изменений. Войди заново и повтори.":""));
 return response.json();
}
function render(){
 $("item-count").textContent=rows.length;
 $("items-list").replaceChildren(...rows.map((r,i)=>{
 const b=document.createElement("button");b.className="item-row"+(i===selected?" selected":"");
 const title=document.createElement("strong");title.textContent=r.author;
 const date=document.createElement("small");date.textContent=r.date;
 b.append(title,date);b.addEventListener("click",()=>{if(!busy)edit(i);});return b;
 }));
}
function edit(i){
 selected=i;const r=rows[i]||{};
 $("review-author").value=r.author||"";$("review-date").value=iso(r.date);
 $("review-rating").value=String(r.rating||5);$("review-source").value=r.source||"";
 $("review-text").value=r.text||"";$("review-url").value=r.source_url||"";
 $("editor-title").textContent=i<0?"Новый отзыв":"Редактирование отзыва";
 show("editor-empty",false);show("editor-form",true);show("delete-item",i>=0);msg("save-message","");render();
}
function closeEditor(){selected=-1;show("editor-form",false);show("editor-empty",true);render();}
function logout(){token="";rows=[];sha="";$("token").value="";$("editor-form").reset();closeEditor();show("app-view",false);show("logout",false);show("login-view",true);$("user-label").textContent="";}
function lock(v){busy=v;document.querySelectorAll("button,input,textarea,select").forEach(el=>el.disabled=v);}
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();if(busy)return;token=$("token").value.trim();$("token").value="";lock(true);msg("login-message","Проверяем доступ…");
 try{const f=await api();const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(f.content),c=>c.charCodeAt(0))));
 if(!Array.isArray(data)||!data.every(r=>r&&typeof r.author==="string"&&typeof r.text==="string"))throw Error("Некорректный JSON");
 rows=data;sha=f.sha;show("login-view",false);show("app-view",true);show("logout",true);$("user-label").textContent="GitHub";closeEditor();msg("login-message","");
 }catch(e){token="";msg("login-message",e.message,true);}finally{lock(false);}
});
async function save(next,commit){
 if(busy)return;lock(true);msg("save-message","Сохраняем…");
 try{
 const bytes=new TextEncoder().encode(JSON.stringify(next,null,2)+"\n");let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
 const result=await api("PUT",{message:commit,content:btoa(binary),sha,branch:"main"});
 sha=result.content.sha;rows=next;render();msg("save-message","Сохранено в GitHub. Публикация запускается автоматически.");return true;
 }catch(e){msg("save-message",e.message,true);return false;}finally{lock(false);}
}
$("editor-form").addEventListener("submit",async e=>{
 e.preventDefault();if(busy)return;
 const author=$("review-author").value.trim(),text=$("review-text").value.trim(),date=$("review-date").value,url=$("review-url").value.trim();
 if(!author||!text||!date)return msg("save-message","Укажи имя, дату и текст.",true);
 if(url&&!/^https?:\/\//i.test(url))return msg("save-message","Ссылка должна начинаться с http:// или https://.",true);
 const record={...rows[selected],author,date:display(date),text,source:$("review-source").value.trim(),source_url:url,rating:Number($("review-rating").value)};
 const next=rows.slice(),index=selected<0?next.length:selected;next[index]=record;
 if(await save(next,selected<0?"Add review":"Update review")){selected=index;show("delete-item",true);render();}
});
$("delete-item").addEventListener("click",async()=>{if(busy||selected<0||!confirm("Удалить отзыв с сайта? История сохранится в GitHub."))return;const next=rows.filter((_,i)=>i!==selected);if(await save(next,"Remove review"))closeEditor();});
$("logout").addEventListener("click",logout);
$("new-item").addEventListener("click",()=>edit(-1));
$("cancel-edit").addEventListener("click",closeEditor);
logout();
