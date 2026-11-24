const el = siteData.element;
const get = selector => document.querySelector(selector);
const shelf = get("#categories"), catalog = get("#catalog"), statusLine = get("#status");
const viewer = get("#work-view");
let records=[], category="";
let portfolioRead=0;
const filtered = () => records.filter(item=>!category || item.category===category);
function workLabel(item, index) {
  return item.title || `第 ${index + 1} 件作品（${item.category}）`;
}
function action(text, run) {
  const button=el("button",text); button.type="button"; button.addEventListener("click",run); return button;
}
function render(filterChanged = false) {
  const topics=[...new Set(records.map(item=>item.category))];
  if (!topics.includes(category)) category="";
  shelf.replaceChildren();
  for (const name of ["",...topics]) {
    const button=action(name || "全部",()=>{
      if(category===name)return;
      category=name;render(true);
      shelf.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
      siteFeedback.reveal(catalog);
    });
    if (!name) pageCopy.bind(button,"allCategories");
    button.setAttribute("aria-pressed",String(name===category)); shelf.append(button);
  }
  catalog.replaceChildren();
  const results=filtered();
  for (const [index,item] of results.entries()) {
    const tile=el("article",undefined,"project-tile"),open=action("",()=>openView(item));
    const label=workLabel(item,index);
    open.className="open-work"; open.setAttribute("aria-label","查看作品："+label);
    const img=el("img",undefined,"work-cover"); img.src=item.image;img.alt=item.title||item.description||label;img.loading="lazy";
    const cap=el("div",undefined,"art-label");
    if (item.title) cap.append(el("h3",item.title));
    cap.append(el("span",item.category));
    open.append(img,cap);tile.append(open);
    catalog.append(tile);
  }
  if (!records.length) catalog.append(pageCopy.bind(el("p","作品将在这里展示。","empty"),"emptyWorks"));
  updateCount(results.length,filterChanged);
  window.materialSphere?.filter(category);
}
function updateCount(count, filterChanged) {
  const counter=get("#work-count");
  const oldLabel=counter.querySelector(".current-count")?.textContent;
  const label=el("span",String(count),"current-count");
  counter.replaceChildren(label);
  if (!filterChanged || !oldLabel) return;
  const old=el("span",oldLabel,"previous-count");
  old.setAttribute("aria-hidden","true");
  counter.append(old);
  const direction=Number(oldLabel)>count ? -1 : 1;
  siteFeedback.animate(label,[
    {transform:"translateY("+direction*85+"%)",opacity:.2},
    {transform:"none",opacity:1}
  ],{duration:225,easing:"cubic-bezier(.2,.85,.2,1)"});
  const motion=siteFeedback.animate(old,[
    {transform:"none",opacity:1},
    {transform:"translateY("+(-direction*95)+"%)",opacity:0}
  ],{duration:165,easing:"ease-in"});
  if (motion) motion.finished.then(()=>old.remove(),()=>old.remove());
  else old.remove();
}
async function refresh() {
  const current=++portfolioRead;
  const data=await siteData.load("portfolio");
  if (current!==portfolioRead) return;
  records=data.items;
  render();
}
const workViewer=createArtViewer(viewer,()=>filtered().map((item,index)=>({
  key:item.id,src:item.image,label:workLabel(item,index),alt:item.title||item.description,
  title:item.title,description:item.description
})),entry=>{
  const title=get("#art-title");title.textContent=entry.title;title.hidden=!entry.title;
  viewer.setAttribute("aria-label",entry.label);get("#art-description").textContent=entry.description;
  const item=records.find(work=>work.id===entry.key);
  window.lightDial?.update({viewer,item,records});
  window.materialSphere?.view(item);
});
document.addEventListener("gudiy:art-view",event=>{
  const item=records.find(work=>work.id===event.detail?.key);
  if(item) document.dispatchEvent(new CustomEvent("gudiy:work-viewed",{detail:{id:item.id,category:item.category}}));
});
function openView(item) { workViewer.open(item.id); }
document.querySelector("[data-close]").onclick=()=>viewer.close();
let requestedWorkHash=location.hash;
function openLinkedWork(hash) {
  requestedWorkHash=hash;
  const item=records.find(record=>"#"+record.id===hash);
  if (!item) return;
  if (category && category!==item.category) { category="";render(); }
  openView(item);
}
document.addEventListener("folder:anchor",event=>openLinkedWork(event.detail.hash));
document.addEventListener("folder:featured",()=>refresh().catch(error=>{statusLine.textContent=error.message;}));
refresh().then(()=>{statusLine.textContent="";openLinkedWork(requestedWorkHash);})
  .catch(error=>{statusLine.textContent=error.message;});
