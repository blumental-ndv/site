// Публичный вывод отзывов из локального JSON. Supabase для посетителей не используется.
(() => {
  const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  function dateValue(value) {
    const m=String(value||"").match(/^(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})$/i);
    return m ? Number(m[3])*10000+(months.indexOf(m[2].toLowerCase())+1)*100+Number(m[1]) : 0;
  }
  function createReviewCard(p) {
    const card=document.createElement("article"); card.className="review-card";
    const y=String(p.date||"").match(/(20\d{2})/); card.dataset.year=y?y[1]:"Без даты";
    const content=document.createElement("div"),stars=document.createElement("div"); stars.className="review-stars";
    const rating=Math.max(1,Math.min(5,Number(p.rating)||5)); stars.textContent="★".repeat(rating)+"☆".repeat(5-rating);
    const quote=document.createElement("p"); quote.className="review-text"; quote.textContent=p.text||""; content.append(stars,quote);
    const details=document.createElement("div"),author=document.createElement("strong"); author.className="review-author"; author.textContent=p.author||"Клиент";
    const meta=document.createElement("span"); meta.className="review-meta"; meta.textContent=[p.source||"Клиент",p.date].filter(Boolean).join(", "); details.append(author,meta);
    if(p.source_url){try{const u=new URL(p.source_url);if(u.protocol==="https:"||u.protocol==="http:"){const a=document.createElement("a");a.className="review-link";a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=p.source&&p.source!=="Источник"?"Проверить на "+p.source+" →":"Источник отзыва →";details.append(a);}}catch(_){}}
    card.append(content,details); return card;
  }
  function buildYearNavigation(list) {
    if(!list)return; const cards=[...list.querySelectorAll(".review-card")]; if(!cards.length)return;
    let nav=document.querySelector(".reviews-year-nav"); if(!nav){nav=document.createElement("nav");nav.className="reviews-year-nav";nav.setAttribute("aria-label","Навигация по годам отзывов");list.parentNode.insertBefore(nav,list);}
    const years=[...new Set(cards.map(c=>c.dataset.year||"Без даты"))].sort((a,b)=>a==="Без даты"?1:b==="Без даты"?-1:Number(b)-Number(a));
    nav.replaceChildren(...["Все",...years].map((year,i)=>{const a=document.createElement("a");a.href="#";a.className="reviews-year-link"+(i===0?" active":"");a.textContent=year==="Все"?"Все годы":year;a.setAttribute("aria-current",i===0?"true":"false");a.addEventListener("click",e=>{e.preventDefault();cards.forEach(c=>c.hidden=year!=="Все"&&c.dataset.year!==year);nav.querySelectorAll(".reviews-year-link").forEach(x=>{const active=x===a;x.classList.toggle("active",active);x.setAttribute("aria-current",active?"true":"false");});});return a;}));
  }
  async function loadReviews() {
    const full=document.querySelector(".all-reviews-grid"),home=document.querySelector(".reviews-grid"); if(!full&&!home)return;
    try {
      const response=await fetch("reviews.json",{cache:"no-cache"}); if(!response.ok)throw new Error("HTTP "+response.status);
      const raw=await response.json(); const reviews=(Array.isArray(raw)?raw:[]).filter(x=>x&&x.author&&x.text).sort((a,b)=>dateValue(b.date)-dateValue(a.date));
      if(full){full.replaceChildren(...reviews.map(createReviewCard));if(!reviews.length){const p=document.createElement("p");p.className="review-meta";p.textContent="Пока нет опубликованных отзывов.";full.append(p);}else buildYearNavigation(full);}
      if(home)home.replaceChildren(...reviews.slice(0,3).map(createReviewCard));
    } catch(error) {console.error("Не удалось загрузить reviews.json",error);const msg="Отзывы временно не удалось загрузить.";if(full)full.textContent=msg;if(home)home.textContent=msg;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadReviews,{once:true});else loadReviews();
})();
