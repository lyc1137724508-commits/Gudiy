(() => {
  const builtins = [
    {id:"home", title:"主页", path:"index.html"},
    {id:"portfolio", title:"作品集", path:"portfolio.html"},
    {id:"resume", title:"工作履历", path:"resume.html"},
    {id:"notebook", title:"我的手记", path:"notebook.html"}
  ];

  const siteRoot = new URL("./", location.href);
  const newEntryId = () => crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
  function pageFromURL(url) {
    if (url.origin !== location.origin) return null;
    if (url.pathname === siteRoot.pathname) return "home";
    const builtin = builtins.find(page => url.pathname === siteRoot.pathname + page.path);
    if (builtin) return builtin.id;
    const id = url.searchParams.get("id");
    return url.pathname === siteRoot.pathname + "page.html" && /^[a-z0-9-]{1,80}$/.test(id || "") ? id : null;
  }
  function urlFor(id) {
    const builtin = builtins.find(page => page.id === id);
    return new URL(builtin ? builtin.path : "page.html?id=" + encodeURIComponent(id), siteRoot);
  }
  function emit(doc, name, detail) {
    doc.dispatchEvent(new doc.defaultView.CustomEvent(name, {detail, bubbles:true}));
  }
  const browserTheme = window === window.top ? document.querySelector('meta[name="theme-color"]') : null;
  const paperColor = browserTheme?.content;
  function paintMaterialRoom(preset) {
    const root = document.documentElement;
    if ((root.dataset.materialRoom || null) === preset) return;
    if (preset) root.dataset.materialRoom = preset;
    else delete root.dataset.materialRoom;
    if (browserTheme) {
      const color = preset && getComputedStyle(root).getPropertyValue("--room-base").trim();
      browserTheme.content = color || paperColor;
    }
  }
  function interceptLinks(event, visit) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    // The address bar follows the selected pane. Fragment-only links belong to the
    // document that contains them even after history.pushState changes its base URL.
    const raw = link.getAttribute("href");
    const url = raw.startsWith("#") ? new URL(raw,urlFor(documentId)) : new URL(link.href);
    const id = pageFromURL(url);
    if (!id) return;
    event.preventDefault();
    url.searchParams.delete("panel");
    visit(id, url);
  }

  const currentURL = new URL(location.href);
  const documentId = pageFromURL(currentURL) || (currentURL.pathname === siteRoot.pathname + "page.html" ? "!missing" : null);
  const header = document.getElementById("folder-header");
  if (!header) return;
  // Only frames created by this shell are panels. A shared panel URL opens as a full website.
  let host;
  if (window !== parent && currentURL.searchParams.get("panel") === "1") {
    try { if (window.frameElement?.hasAttribute("data-folder-frame")) host = parent.folderSite; } catch {}
  }
  if (host) {
    document.documentElement.classList.add("folder-embedded");
    window.folderSite = {
      documentId,
      get state() { return host.state; },
      open: id => host.open(id),
      reload: () => host.reload(),
      broadcast: (name, detail) => host.broadcast(name, detail),
      get paperPlaneSent() { return host.paperPlaneSent; },
      sendPaperPlane: () => host.sendPaperPlane(),
      setMaterialRoom(preset) {
        if (documentId !== "portfolio") return;
        paintMaterialRoom(preset);
        host.setMaterialRoom(preset);
      }
    };
    document.addEventListener("click", event => interceptLinks(event, (id, url) => host.navigate(url.href)));
    document.addEventListener("DOMContentLoaded", () => {
      if (host.state.items.length) emit(document, "folder:pages", host.state);
    }, {once:true});
    return;
  }
  if (currentURL.searchParams.has("panel")) {
    currentURL.searchParams.delete("panel");
    history.replaceState(history.state, "", currentURL);
  }
  if (!documentId) return;

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text) item.textContent = text;
    return item;
  }
  document.documentElement.classList.add("folder-desktop");
  const stage = element("div", "folder-stack");
  header.after(stage);
  const panels = new Map();
  function panelFor(id) {
    if (panels.has(id)) return panels.get(id);
    const pane = element("section", "folder-panel");
    pane.setAttribute("role","tabpanel");
    pane.id = "folder-panel-" + id;
    pane.setAttribute("aria-labelledby","folder-tab-" + id);
    pane.hidden = true;
    stage.append(pane);
    const panel = {pane, frame:null, ready:false, failed:false, hash:""};
    panels.set(id,panel);
    return panel;
  }

  const original = panelFor(documentId);
  original.ready = true;
  original.pane.classList.add("folder-original");
  for (const part of document.querySelectorAll("body > main,body > footer")) original.pane.append(part);
  original.pane.hidden = false;
  const contentSkip = document.querySelector("body > .skip");
  if (contentSkip) {
    contentSkip.textContent = "跳到当前页内容";
    contentSkip.addEventListener("click", event => {
      event.preventDefault();
      const panel = panels.get(state.activeId);
      const doc = panel.frame?.contentDocument || document;
      const target = doc.querySelector("main");
      if (target) { target.tabIndex = -1; target.focus(); }
    });
  }

  const bar = element("div","folder-bar");
  const brand = element("a","wordmark folder-brand");
  brand.href=urlFor("home").href; brand.setAttribute("aria-label","Gudiy 的个人小站主页");
  const brandName=element("strong","folder-brand-name","Gudiy");
  const sprout=element("i","sprout"); sprout.setAttribute("aria-hidden","true");
  brand.append(sprout, brandName, element("span",null,"."));
  const tools = element("div","folder-tools");
  bar.append(brand,tools);
  const strip = element("nav","folder-tabs");
  strip.setAttribute("role","tablist");strip.setAttribute("aria-label","网站页签");
  header.className="folder-header";
  header.replaceChildren(bar,strip);

  let state = {items:[], canEdit:false, activeId:documentId};
  const flightKey = "gudiy-paper-plane-sent";
  let paperPlaneSent = false;
  try { paperPlaneSent = sessionStorage.getItem(flightKey) === "1"; } catch {}
  let materialRoom = null;
  function updateMaterialRoom() {
    paintMaterialRoom(state.activeId === "portfolio" ? materialRoom : null);
  }
  let loadSerial = 0;
  let hasData = false;
  let activeEntry = history.state?.folderEntry || newEntryId();
  history.replaceState({...history.state,folderEntry:activeEntry},"",location.href);
  const scrollByEntry = new Map();
  function publicPages() { return hasData ? state.items : builtins; }
  function childDocument(panel) {
    try { return panel.frame?.contentWindow?.folderSite ? panel.frame.contentDocument : null; }
    catch { return null; }
  }
  function broadcast(name, detail) {
    if (!name.startsWith("folder:")) return;
    emit(document,name,detail);
    for (const panel of panels.values()) {
      const child = childDocument(panel);
      if (child) emit(child,name,detail);
    }
  }
  function land(id, hash) {
    if (!hash || state.activeId !== id) return;
    const panel = panels.get(id);
    if (!panel?.ready) return;
    const doc = panel.frame ? childDocument(panel) : document;
    if (!doc) return;
    let name;
    try { name = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = doc.getElementById(name);
    if (target === doc.body || name === "top") {
      if (panel.frame) panel.frame.contentWindow.scrollTo({top:0,behavior:"instant"});
      else panel.pane.scrollTo({top:0,behavior:"instant"});
    } else if (target) {
      target.scrollIntoView({block:"start", behavior:"instant"});
    }
    emit(doc,"folder:anchor",{hash});
  }
  function loadFrame(id, url, panel) {
    const frame=element("iframe","folder-frame");
    frame.dataset.folderFrame=id;
    frame.title=publicPages().find(page=>page.id===id)?.title || "页面";
    panel.frame=frame;
    const pending=element("p","folder-loading","正在打开"+frame.title+"…");
    pending.setAttribute("role","status");
    panel.pane.append(pending);
    url = new URL(url);
    url.searchParams.set("panel","1");
    frame.src=url.href;
    frame.addEventListener("load",() => {
      const child=childDocument(panel);
      pending.remove();
      if (!child) {
        // Some hosting policies or browser extensions disallow framing.
        // Continue on the same canonical URL as a normal top-level document.
        panel.failed=true;
        if (state.activeId===id) location.replace(location.href);
        return;
      }
      panel.ready=true;
      if (state.activeId === id) {
        emit(child,"folder:active",state);
        land(id,panel.hash);
      }
    });
    panel.pane.append(frame);
  }
  function updateControls() {
    const current=publicPages().find(item=>item.id===state.activeId);
    for (const link of strip.children) {
      const selected = link.dataset.page === state.activeId;
      link.tabIndex = selected || (!current && link===strip.firstElementChild) ? 0 : -1;
      link.setAttribute("aria-selected",String(selected));
      if (selected) link.setAttribute("aria-current","page"); else link.removeAttribute("aria-current");
    }
    const name = state.items.find(item=>item.id==="home")?.heading || "Gudiy";
    brandName.textContent=name;
    brand.setAttribute("aria-label",name+" 的个人小站主页");
    if (current) document.title = current.title + " · " + name;
  }
  function revealTab() {
    const link = strip.querySelector('[aria-selected="true"]');
    if (!link) return;
    const left = link.offsetLeft;
    if (left < strip.scrollLeft) strip.scrollLeft = Math.max(0,left - 5);
    else if (left + link.offsetWidth > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = left + link.offsetWidth - strip.clientWidth + 5;
  }
  function drawTabs() {
    const focused = document.activeElement?.dataset.page;
    const links=[];
    for (const page of publicPages()) {
      panelFor(page.id);
      const link=element("a","folder-tab");
      link.id="folder-tab-" + page.id;
      link.dataset.page=page.id;link.href=urlFor(page.id).href;
      link.setAttribute("role","tab");
      link.setAttribute("aria-controls","folder-panel-" + page.id);
      const label=element("span","folder-tab-label",page.title);
      const icon=element("i","folder-tab-icon");
      icon.setAttribute("aria-hidden","true");
      link.title=page.title;link.append(icon,label);links.push(link);
      const frame=panels.get(page.id).frame;
      if(frame) frame.title=page.title;
    }
    strip.replaceChildren(...links); updateControls();
    if(focused) document.getElementById("folder-tab-"+focused)?.focus({preventScroll:true});
    revealTab();
  }
  function activate(id,url,push=true,restore=false) {
    if (location.protocol === "file:" && id !== documentId) {
      location.assign(url.href);
      return;
    }
    const previous=panels.get(state.activeId);
    const scroll=previous.frame ? childDocument(previous)?.defaultView.scrollY : previous.pane.scrollTop;
    if (typeof scroll==="number") scrollByEntry.set(activeEntry,scroll);
    if (push && url.href!==location.href) {
      activeEntry=newEntryId();
      history.pushState({folderEntry:activeEntry},"",url.href);
    } else if (restore) {
      activeEntry=history.state?.folderEntry || newEntryId();
    }
    const panel = panelFor(id);
    if (panel.failed) { location.replace(url.href); return; }
    const changed = id !== state.activeId;
    if (changed) {
      if (state.activeId === "portfolio") {
        const previousDoc = previous.frame ? childDocument(previous) : document;
        if (previousDoc) emit(previousDoc, "folder:inactive", {id:"portfolio"});
      }
      const pages=publicPages();
      const previousIndex=pages.findIndex(page=>page.id===state.activeId);
      const nextIndex=pages.findIndex(page=>page.id===id);
      panel.pane.style.setProperty("--sheet-entry",nextIndex<previousIndex?"-18px":"18px");
      previous.pane.hidden=true;
    }
    state = {...state,activeId:id};
    if (changed) updateMaterialRoom();
    panel.pane.hidden=false;
    panel.hash=url.hash;
    if(id !== documentId && !panel.frame) loadFrame(id,url,panel);
    updateControls();revealTab();
    if(changed) {
      emit(document,"folder:active",state);
      const child=childDocument(panel);
      if(child)emit(child,"folder:active",state);
    }
    land(id,url.hash);
    if(restore && !url.hash && scrollByEntry.has(activeEntry)) {
      const top=scrollByEntry.get(activeEntry);
      if(panel.frame) childDocument(panel)?.defaultView.scrollTo({top,behavior:"instant"});
      else panel.pane.scrollTo({top,behavior:"instant"});
    }
  }
  function navigate(href,push=true,restore=false) {
    const url = new URL(href,location.href), id=pageFromURL(url);
    if (!id) return false;
    url.searchParams.delete("panel");
    activate(id,url,push,restore);
    return true;
  }
  async function reload() {
    const serial=++loadSerial;
    const data=await siteData.load("pages");
    if(serial!==loadSerial)return state;
    const previousIds=new Set(state.items.map(page=>page.id));
    state={...state,items:data.items,canEdit:data.canEdit,preview:Boolean(data.preview)};
    hasData=true;
    drawTabs();
    if(previousIds.has(state.activeId) && !state.items.some(page=>page.id===state.activeId)) {
      const url=urlFor("home");history.replaceState({folderEntry:activeEntry},"",url);activate("home",url,false);
    }
    for(const [id,panel] of panels) {
      if(id!==documentId && previousIds.has(id) && !state.items.some(page=>page.id===id)){
        panel.pane.remove();panels.delete(id);
      }
    }
    broadcast("folder:pages",state);
    return state;
  }
  window.folderSite = {
    documentId, get state(){return state;}, reload, navigate, broadcast,
    get paperPlaneSent() { return paperPlaneSent; },
    sendPaperPlane() {
      if (paperPlaneSent) return;
      paperPlaneSent = true;
      try { sessionStorage.setItem(flightKey,"1"); } catch {}
      broadcast("folder:paper-plane");
    },
    setMaterialRoom(preset) {
      materialRoom = preset;
      updateMaterialRoom();
    },
    open(id) { if (state.items.some(page=>page.id===id) || builtins.some(page=>page.id===id)) return navigate(urlFor(id)); return false; }
  };
  function turnTab(tab,url) {
    const id=tab.dataset.page;
    activate(id,url);
    emit(document,"gudiy:tab-turn",{id});
  }
  strip.addEventListener("click",event=>interceptLinks(event,(_id,url)=>{
    const tab=event.target.closest(".folder-tab");
    if(tab) turnTab(tab,url);
  }));
  document.addEventListener("click",event=>interceptLinks(event,(id,url)=>activate(id,url)));
  strip.addEventListener("keydown",event=>{
    const buttons=Array.from(strip.children);
    const index=buttons.indexOf(event.target.closest(".folder-tab"));
    if(index<0 || event.altKey || event.ctrlKey || event.metaKey)return;
    let next=index;
    if(event.key==="ArrowRight")next=(index+1)%buttons.length;
    else if(event.key==="ArrowLeft")next=(index+buttons.length-1)%buttons.length;
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=buttons.length-1;
    else if(event.key!==" ")return;
    event.preventDefault();
    if(!event.repeat || next!==index) turnTab(buttons[next],new URL(buttons[next].href));
    buttons[next].focus({preventScroll:true});
  });
  window.addEventListener("popstate",()=>navigate(location.href,false,true));
  drawTabs();
  document.addEventListener("DOMContentLoaded",()=>land(documentId,currentURL.hash),{once:true});
  reload().catch(()=>{
    const message=element("p","folder-network","暂时无法读取页签设置。");
    const retry=element("button","folder-tool","重新载入");
    retry.type="button";retry.onclick=async()=>{
      retry.disabled=true;
      try{await reload();message.remove();}catch{retry.disabled=false;}
    };
    message.append(retry);bar.after(message);
  });
})();
