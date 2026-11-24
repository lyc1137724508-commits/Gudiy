const node = siteData.element, byId = name => document.getElementById(name);
function shelfNames() {
  return Object.fromEntries(Array.from(document.querySelectorAll("[data-shelf]"), b => [b.dataset.shelf,b.textContent]));
}
const topics={notes:["建站笔记","制作笔记","课程笔记","读书心得","实习经历","文章","日记","旅行"],tools:["工具收藏"],projects:["项目记录","待尝试","进行中","已完成"]};
let entries=[], shelf="notes";
const selectOptions=(select, values)=>select.replaceChildren(...values.map(value=>{const o=node("option",value);o.value=value;return o;}));
function button(label, handler) { const b=node("button",label);b.type="button";b.onclick=handler;return b; }
function topicValues() {return [...new Set([...topics[shelf],...entries.filter(e=>e.shelf===shelf).map(e=>e.category)])];}
function refreshControls() {
  document.querySelectorAll("[data-shelf]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.shelf===shelf)));
  selectOptions(byId("topic-filter"),["全部分类",...topicValues()]);
  byId("topic-filter-label").hidden=shelf==="tools";
}
function showEntries() {
  const word=byId("lookup").value.trim().toLowerCase(), topic=byId("topic-filter").value;
  const matches=entries.filter(e=>e.shelf===shelf && (!topic || topic==="全部分类" || topic===e.category) &&
    [e.title,e.category,e.description,e.url].join(" ").toLowerCase().includes(word));
  const list=byId("entry-list");list.replaceChildren();
  for (const item of matches) {
    const entry=node("details",undefined,"entry"),summary=node("summary");
    summary.append(node("strong",item.title),node("span",item.category));
    const body=node("div",undefined,"entry-details");body.append(node("p",item.description));
    const actions=node("div",undefined,"entry-actions");
    if(item.url) {const link=pageCopy.bind(node("a","打开工具","entry-link"),"toolLink");link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";actions.append(link);}
    if(actions.children.length) body.append(actions);
    entry.append(summary,body);list.append(entry);
  }
  if(!matches.length) {
    const searching = word || topic!=="全部分类";
    list.append(pageCopy.bind(node("p",searching?"没有匹配的条目。":"这个栏目暂时为空。","empty"),searching?"emptySearch":"emptyShelf"));
  }
}
async function loadData() {
  const data=await siteData.load("notebook");entries=data.items;
  const notice=byId("storage-notice");
  pageCopy.bind(notice,"readHint");
  refreshControls();showEntries();
}
document.querySelectorAll("[data-shelf]").forEach(b=>b.onclick=()=>{if(shelf===b.dataset.shelf)return;shelf=b.dataset.shelf;byId("lookup").value="";refreshControls();showEntries();siteFeedback.reveal(byId("entry-list"));});
byId("lookup").oninput=showEntries;byId("topic-filter").onchange=showEntries;
document.querySelectorAll("[data-dismiss]").forEach(button=>button.onclick=()=>button.closest("dialog").close());
byId("export-open").onclick=()=>{
  const options=byId("export-options");options.replaceChildren();
  const names=shelfNames();
  for(const item of entries) {
    const label=node("label"),c=node("input");c.type="checkbox";c.value=item.id;
    label.append(c,document.createTextNode(names[item.shelf]+" · "+item.title));options.append(label);
  }
  if(!entries.length)options.append(node("p","暂无可导出的条目。"));
  byId("download").disabled=true;byId("exporter").showModal();
};
byId("export-options").onchange=()=>{byId("download").disabled=!byId("export-options").querySelector(":checked");};
byId("export-form").onsubmit=e=>{
  e.preventDefault();
  const ids=new Set(Array.from(byId("export-options").querySelectorAll(":checked"),input=>input.value));
  if(!ids.size)return;
  const doc=document.implementation.createHTMLDocument(byId("desk-title").textContent);doc.documentElement.lang="zh-CN";
  const charset=doc.createElement("meta");charset.setAttribute("charset","utf-8");
  const meta=doc.createElement("meta");meta.name="viewport";meta.content="width=device-width,initial-scale=1";doc.head.prepend(charset,meta);
  const css=doc.createElement("style");css.textContent="body{max-width:48rem;margin:auto;padding:clamp(1rem,6vw,4rem);background:#faf9f3;color:#233e33;font:1.05rem/1.8 system-ui,sans-serif}h1,h2,h3{font-family:Georgia,serif}article{border-top:1px solid #c7d0be;padding:1rem 0}p{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#30543c}small{color:#5a6758}";doc.head.append(css);
  doc.body.append(node("h1",byId("desk-title").textContent));
  const signature=document.querySelector('[data-copy="footerName"]').textContent;
  if (signature) doc.body.append(node("p",signature));
  for(const [key,title] of Object.entries(shelfNames())){
    const chosen=entries.filter(i=>i.shelf===key&&ids.has(i.id));if(!chosen.length)continue;
    const section=node("section");section.append(node("h2",title));
    for(const item of chosen){
      const article=node("article");article.append(node("small",item.category),node("h3",item.title),node("p",item.description));
      if(item.url){const a=pageCopy.bind(node("a","打开工具"),"toolLink");a.href=item.url;article.append(a);}
      section.append(article);
    }doc.body.append(section);
  }
  const url=URL.createObjectURL(new Blob(["<!doctype html>\n",doc.documentElement.outerHTML],{type:"text/html;charset=utf-8"}));
  const link=node("a");link.href=url;link.download="Gudiy-数字手记.html";document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);byId("exporter").close();byId("desk-status").textContent="已生成所选条目的独立展示页。";
};
loadData().catch(err=>{byId("desk-status").textContent=err.message;});
