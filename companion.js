(() => {
  const frame = window.frameElement;
  if (frame?.hasAttribute("data-folder-frame")) {
    const sync = () => {
      const open = Boolean(document.querySelector("dialog[open]"));
      const wasOpen = frame.hasAttribute("data-sprout-modal");
      frame.toggleAttribute("data-sprout-modal", open);
      if (wasOpen && !open) parent.document.dispatchEvent(new parent.Event("gudiy:desk-return"));
    };
    new MutationObserver(sync).observe(document.body, {subtree:true, attributes:true, attributeFilter:["open"]});
    document.addEventListener("close", sync, true);
    return;
  }

  const sound = document.querySelector(".sound-switch");
  const tools = document.querySelector(".folder-tools");
  if (sound && tools) tools.prepend(sound);

  const pot = document.createElement("button");
  pot.type = "button";
  pot.className = "desk-sprout";
  const sprite = document.createElement("canvas");
  sprite.width = 50;
  sprite.height = 46;
  sprite.setAttribute("aria-hidden", "true");
  pot.append(sprite);
  const ctx = sprite.getContext("2d");
  const tabs = document.querySelector(".folder-tabs");
  if (!ctx || !tabs) return;
  const ledge = document.createElement("div");
  ledge.className = "pot-ledge";
  tabs.before(ledge);
  ledge.append(tabs,pot);

  const palette = {
    D:"#664434", B:"#995537", R:"#be7149", T:"#d98e60", P:"#f2b987", C:"#ffe1ab",
    X:"#513d30", E:"#71503c", A:"#ac8060", K:"#294b3c", G:"#45744c", L:"#76a154",
    H:"#aac96a", Y:"#f2c963", I:"#ffefbe", V:"#c87a62", M:"#e9a7a0"
  };
  const smallLeaf = [".LL..","LHHL.","KGLGL","..KGG","....K"];
  const wideLeaf = ["..HHHH...","HLHHLLL..","KLLLHGGL.",".KGGLLGG.","..KKGGLGK",".....KKGK"];
  const daisy = ["...III...",".IIPIPI..",".IPIIIIP.","..IIYYPI.","IPPYYYPII",".PPIYIIP.","..IIPIPI.","..PIIPI..","...PP...."];
  const moth = ["L...L","IY.YI",".YKY.",".IKI.","..K.."];
  const beetle = ["...K..",".KRVRK","KRRVRK",".KRKK.","..K.K."];
  const sparkle = ["..Y..","..I..","YIIIY","..I..","..Y.."];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const stageNames = ["花盆","新芽","幼苗","枝叶","花苞","开花的盆栽"];
  let turns = 0, faceTimer, movement, viewed = false;

  function block(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x,y,width,height);
  }
  function stamp(x, y, pattern, mirror = false, colors = palette) {
    for (let row = 0; row < pattern.length; row++) {
      const line = pattern[row];
      for (let column = 0; column < line.length; column++) {
        const color = colors[line[column]];
        if (color) block(x + (mirror ? line.length - 1 - column : column), y + row, 1, 1, color);
      }
    }
  }
  function clay() {
    block(10,43,30,1,"#4b493329");
    block(14,44,22,1,"#4b493319");
    // Curved shoulder, tapered body and the tiny light on the glazed left edge.
    for (let y = 32; y < 43; y++) {
      const inset = Math.floor((y-32)/3);
      const x = 13+inset, width = 24-2*inset;
      block(x,y,width,1,palette.D);
      block(x+1,y,width-2,1,y>40 ? palette.B : palette.R);
      if (y < 41) {
        block(x+2,y,2,1,palette.T);
        block(x+width-4,y,3,1,palette.B);
      }
    }
    block(17,42,16,1,palette.D);
    block(11,30,28,4,palette.D);
    block(12,30,26,3,palette.T);
    block(13,31,14,1,palette.P);
    block(12,28,26,2,palette.B);
    block(14,27,22,1,palette.R);
    block(14,28,22,2,palette.X);
    block(16,28,18,1,palette.E);
    block(18,28,2,1,palette.A);
    block(29,29,1,1,palette.A);
    block(36,31,2,2,palette.R);
  }
  function draw(mood = "") {
    ctx.clearRect(0,0,sprite.width,sprite.height);
    const level = Math.min(turns,5);
    clay();
    if (level) {
      const height = [0,4,9,14,18,20][level];
      const top = 30-height;
      block(24,top,2,height,palette.G);
      block(25,top+2,1,Math.max(1,height-2),palette.L);
      if (level === 1) {
        stamp(21,24,["HH..","LGL.","..KG"]);
        stamp(25,25,[".HL","LG.","K.."]);
      } else {
        stamp(20,top-2,smallLeaf);
        stamp(25,top-1,smallLeaf,true);
      }
      if (level >= 3) {
        stamp(16,20,wideLeaf);
        stamp(25,18,wideLeaf,true);
      }
      if (level === 4) stamp(22,top-4,[".LLL.","KHYHL",".GYYK","..GG."]);
      if (level === 5) {
        const seasons = turns % 3;
        const colors = seasons === 0 ? {...palette,I:"#fbdcc4",P:"#dc9a80"} :
          seasons === 1 ? {...palette,I:"#f7bec6",P:"#de8ca3"} : palette;
        stamp(21,3,daisy,false,colors);
        if (seasons === 1) stamp(35,8,moth);
      }
    }
    if (mood === "tap") stamp(34,24,beetle);
    if (mood === "saved" || (level && mood === "grow")) stamp(11,level >= 3 ? 10 : 18,sparkle);
    if (mood === "view" && level >= 2) stamp(33,14,moth);
    // A pair of indigo maker's marks doubles as the pot's sleepy face.
    block(21,36,1,2,palette.X);
    block(28,36,mood === "view" || mood === "tap" ? 2 : 1,mood === "view" || mood === "tap" ? 1 : 2,palette.X);
    block(24,38,2,1,palette.B);
    pot.setAttribute("aria-label",stageNames[level]);
  }

  function react(kind) {
    clearTimeout(faceTimer);
    draw(kind);
    faceTimer = setTimeout(draw, 1050);
    movement?.cancel();
    if (motion.matches || !sprite.animate) return;
    const poses = kind === "tap" || kind === "view"
      ? ["rotate(0)","rotate(-8deg)","rotate(5deg)","rotate(0)"]
      : ["scale(1.06,.9)","translateY(-3px) scale(.96,1.06)","scale(1.02,.98)","none"];
    movement = sprite.animate(poses.map(transform => ({transform})),{duration:370,easing:"ease-out"});
  }
  pot.addEventListener("click",() => react("tap"));
  document.addEventListener("gudiy:tab-turn",() => {
    turns++;
    react("grow");
  });
  document.addEventListener("gudiy:react",event => {
    if (event.detail?.kind === "view") viewed = true;
    if (event.detail?.kind === "saved") react("saved");
  });
  function returnFromArt() {
    if (viewed) {
      viewed = false;
      react("view");
    }
  }
  document.addEventListener("gudiy:desk-return", returnFromArt);
  document.addEventListener("close",event => {
    if (event.target.localName === "dialog") returnFromArt();
  },true);
  draw();
})();
