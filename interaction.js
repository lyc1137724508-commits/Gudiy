// The site responds only to its own controls. Sound is enabled by an explicit gesture.
const siteFeedback = (() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let enabled=false, audioContext, toastTimer;
  try { enabled=localStorage.getItem("gudiy-sound")==="on"; } catch {}
  const sound=document.createElement("button");
  sound.type="button";sound.className="sound-switch";document.body.append(sound);
  function soundLabel() {
    sound.setAttribute("aria-pressed",String(enabled));sound.setAttribute("aria-label","交互音效");
    const icon=document.createElement("b");icon.textContent="♪";icon.setAttribute("aria-hidden","true");
    sound.replaceChildren(icon,document.createTextNode(enabled?"音效开":"音效关"));
  }
  soundLabel();
  window.addEventListener("storage",event=>{
    if (event.key==="gudiy-sound" || event.key===null) {
      enabled=event.newValue==="on";soundLabel();
    }
  });
  function note(frequency,start,duration,volume,endFrequency=frequency*.84,wave="sine") {
    if(!audioContext || audioContext.state!=="running")return;
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    const t=audioContext.currentTime+start;
    osc.type=wave;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+duration+.01);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  async function play(kind) {
    if(!enabled)return;
    try {
      const Audio=window.AudioContext || window.webkitAudioContext;
      if(!Audio)return;
      audioContext ??=new Audio();
      if(audioContext.state==="suspended")await audioContext.resume();
      if(kind==="saved"){
        note(523,0,.08,.043);note(659,.052,.09,.043);note(784,.108,.17,.045,780);
      } else if(kind==="page"){
        note(180,0,.054,.047,108,"triangle");note(480,.025,.074,.033,342,"triangle");
      } else if(kind==="view"){
        note(540,0,.085,.036,644);note(806,.04,.12,.028,808);
      } else if(kind==="switch"){
        note(620,0,.066,.043,720,"triangle");
      } else {
        note(365,0,.055,.041,210,"triangle");
      }
    }catch{}
  }
  sound.onclick=()=>{enabled=!enabled;try{localStorage.setItem("gudiy-sound",enabled?"on":"off");}catch{}soundLabel();if(enabled)play("switch");};
  function animate(element,frames,opts) {
    if(reduced.matches || !element?.animate)return;
    return element.animate(frames,opts);
  }
  function shellDocument() {
    try {
      if(window.frameElement?.hasAttribute("data-folder-frame")) return parent.document;
    } catch {}
    return document;
  }
  function react(kind) {
    const shell=shellDocument();
    shell.dispatchEvent(new shell.defaultView.CustomEvent("gudiy:react",{detail:{kind}}));
  }
  document.addEventListener("gudiy:art-view",()=>{play("view");react("view");});
  document.addEventListener("folder:active",()=>{if(shellDocument()===document)play("page");});
  function tapRing(control,event) {
    if(reduced.matches || !Element.prototype.animate)return;
    const bounds=control.getBoundingClientRect();
    const x=event.detail?event.clientX:bounds.left+bounds.width/2;
    const y=event.detail?event.clientY:bounds.top+bounds.height/2;
    const host=control.closest("dialog[open]") || document.body;
    const ring=document.createElement("i");
    ring.className="tap-ring";
    ring.setAttribute("aria-hidden","true");
    if(host!==document.body) {
      const rect=host.getBoundingClientRect();
      ring.style.position="absolute";
      ring.style.left=(x-rect.left+host.scrollLeft)+"px";
      ring.style.top=(y-rect.top+host.scrollTop)+"px";
    } else {
      ring.style.left=x+"px";ring.style.top=y+"px";
    }
    host.append(ring);
    const ripple=ring.animate([{opacity:.85,scale:".23"},{opacity:.55,offset:.46},{opacity:0,scale:"1.4"}],
      {duration:305,easing:"cubic-bezier(.16,.75,.28,1)"});
    ripple.onfinish=ripple.oncancel=()=>ring.remove();
  }
  function leaves(x,y,host) {
    if(reduced.matches || !Element.prototype.animate)return;
    const rect=host===document.body?{left:0,top:0}:host.getBoundingClientRect();
    for(let i=0;i<5;i++){
      const leaf=document.createElement("i");leaf.className="note-spark";leaf.setAttribute("aria-hidden","true");
      leaf.style.background=["#91aa64","#d9a653","#557d53"][i%3];
      leaf.style.left=(x-rect.left)+"px";leaf.style.top=(y-rect.top)+"px";
      if(host!==document.body)leaf.style.position="absolute";
      host.append(leaf);
      const angle=-Math.PI*(.08+.84*i/4),dx=Math.cos(angle)*(25+i*3),dy=Math.sin(angle)*(26+i*4);
      const anim=leaf.animate([{opacity:0,transform:"scale(.25)"},{opacity:.9,offset:.16},
        {opacity:0,transform:"translate("+dx+"px,"+dy+"px) rotate("+(i*47-85)+"deg) scale(.6)"}],{duration:330+i*21,easing:"ease-out"});
      anim.onfinish=()=>leaf.remove();anim.oncancel=()=>leaf.remove();
    }
  }
  document.addEventListener("click",event=>{
    const control=event.target.closest?.("button,a,summary");
    if(!control || control.disabled || event.defaultPrevented)return;
    if(control.matches("button,[role=tab],.primary,.resume-button,summary"))tapRing(control,event);
    if(control===sound)return;
    // Navigation and artwork play their own cue when the new content is shown.
    if(control.closest(".folder-tabs") || control.matches("[data-art],.open-work,.work-link,.viewer-controls button,#prev-work,#next-work,.primary[href$='portfolio.html'],.resume-button"))return;
    const isSwitch=!!control.closest(".shelves,#categories");
    play(isSwitch?"switch":"press");
    if(control.matches(".primary,.shelves button,.pe-submit,.folder-new")) {
      const r=control.getBoundingClientRect();
      leaves(event.detail?event.clientX:r.left+r.width/2,event.detail?event.clientY:r.top+r.height/2,control.closest("dialog[open]") || document.body);
    }
  },true);
  document.addEventListener("change",event=>{
    const input=event.target;
    if(!input.matches?.("select,input[type=checkbox],input[type=radio]"))return;
    play("switch");
    const card=input.closest(".pe-featured-card");
    animate(card || input,[{scale:".96"},{scale:"1.025",offset:.65},{scale:"1"}],{duration:210,easing:"ease-out"});
  });
  function reveal(list) {
    Array.from(list.children).slice(0,12).forEach((item,index)=>animate(item,[{opacity:.2,transform:"translateY(9px) scale(.984)"},{opacity:1,transform:"none"}],
      {duration:210,easing:"cubic-bezier(.2,.8,.2,1)",delay:Math.min(index,5)*19,fill:"backwards"}));
  }
  function flip(image,direction) {
    animate(image,[{opacity:.35,transform:"translateX("+(direction*14)+"px) scale(.985)"},{opacity:1,transform:"none"}],{duration:185,easing:"ease-out"});
  }
  function saved(message) {
    play("saved");react("saved");
    const shell=shellDocument();
    shell.querySelector(".save-stamp")?.remove();clearTimeout(toastTimer);
    const stamp=shell.createElement("div");stamp.className="save-stamp";stamp.textContent=message;stamp.setAttribute("aria-hidden","true");
    shell.body.append(stamp);animate(stamp,[{opacity:0,transform:"translateY(-8px) rotate(-5deg) scale(1.18)"},{opacity:1,transform:"rotate(1deg) scale(.96)",offset:.7},{transform:"none"}],{duration:290,easing:"ease-out"});
    toastTimer=setTimeout(()=>stamp.remove(),2200);
  }
  return {reveal,flip,saved,animate};
})();
