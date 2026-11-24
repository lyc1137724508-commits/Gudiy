(() => {
  const box = document.getElementById("scene-box");
  const viewer = document.getElementById("work-view");
  if (!box || !viewer) return;

  // The layers share one little isometric lawn. Each piece has its own shadow
  // and silhouette so it can land independently, in any discovery order.
  function layer(paint, x = 0, y = 0) {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 224;
    canvas.setAttribute("aria-hidden","true");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(2,2);
      ctx.translate(x,y);
      ctx.lineCap = ctx.lineJoin = "round";
      function shape(path,fill,edge,width = 1) {
        const outline = new Path2D(path);
        if (fill) { ctx.fillStyle = fill; ctx.fill(outline); }
        if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = width; ctx.stroke(outline); }
      }
      function oval(x,y,rx,ry,fill) {
        ctx.beginPath();
        ctx.ellipse(x,y,rx,ry,0,0,2*Math.PI);
        ctx.fillStyle = fill; ctx.fill();
      }
      paint(shape,oval);
    }
    box.append(canvas);
    return canvas;
  }

  layer((shape,oval) => {
    oval(102,91,75,12,"#55633d1b");
    shape("M12 71 100 48 188 67 188 76 103 104 12 81Z","#956d4d","#705c46");
    shape("M12 71 103 94 103 104 12 81Z","#c29061");
    shape("M15 78 102 100 185 74",null,"#e2ba86");
    shape("M12 70 97 45 188 66 103 94Z","#c7d0a2","#6d7653",1.4);
    shape("M17 69 98 47 182 66 103 90Z","#a4b789");
    shape("M22 68 56 57 84 52 73 57 37 70Z","#cfdbac");
    shape("M100 87Q103 80 93 77T85 68Q89 64 99 62",null,"#dbc49d",4);
    shape("M26 68l-2-4m3 4 2-5m6 2-1-3m118 7 2-5m0 5 3-2m-98 4-1-4m2 4 2-3",null,"#70885f",1.2);
    oval(43,68,3,1.1,"#879374"); oval(150,75,2.6,1,"#7e906e");
    oval(138,59,1.9,.8,"#dce0b2"); oval(60,72,1.8,.7,"#e2d5aa");
  });

  const house = layer((shape,oval) => {
    oval(88,64,28,5,"#536c574a");
    shape("M60 44 77 26 92 42 92 67 60 59Z","#ebcf94","#715d4b",1.4);
    shape("M92 42 113 37 113 59 92 67Z","#b39b72","#715d4b",1.3);
    shape("M60 57 92 64 113 57 113 61 92 69 60 61Z","#8e9276","#776b59");
    shape("M56 44 76 22 94 40 91 45 76 29 61 47Z","#a65943","#6e5043",1.4);
    shape("M76 22 99 17 118 34 94 41Z","#c67852","#74523e",1.4);
    shape("M81 24 101 20m-16 8 20-5m-16 9 20-5m-16 9 20-5",null,"#de9b68",1);
    shape("M89 21v-9l5-1 4 2v8l-4 2Z","#d5b18a","#776653");
    shape("M87.5 12l6.5-2 6 2-6 2Z","#e3c39d","#776653");
    shape("M77 62v-8q1-6 5-4l2 2v12Z","#776044","#675641");
    shape("M65 45l7 2v7l-7-2Zm32 2 7-2v7l-7 2Z","#ffdb83","#6e6550");
    shape("M68.5 46v7m32-7v6",null,"#8d7655",.85);
    shape("M87 46v16m-25-10 24 6",null,"#a28561",1.1);
    oval(77,35,1.4,1.7,"#8a7358");
  });

  const lamp = layer((shape,oval) => {
    oval(136,73,14,3.4,"#d8c280");
    oval(136,73,6.1,1.5,"#778464");
    shape("M133 71h5v2h-6Z","#6d674c");
    shape("M135 71V40q0-6 5-6h5",null,"#5f5844",2.8);
    shape("M136 70V42",null,"#a88d68",.9);
    shape("M145 34v4m-4 3 4-4 4 4",null,"#645c48",1.3);
    oval(145,48,11,11,"#ffe29444");
    shape("M139 42h12l-2 11-4 2-4-2Z","#ffdf8a","#78644c",1.3);
    shape("M139 42l6-4 6 4Z","#718078","#545e53");
    shape("M145 44v8",null,"#c59b56");
    oval(144,47,1.7,2.8,"#fff2bd");
    shape("M142 54h6l-2 2h-2Z","#6d644c");
  });

  const creature = layer((shape,oval) => {
    oval(111,80,15,3.3,"#64775c62");
    // A sleeping fox curls its cream-tipped tail back beneath its chin.
    shape("M98 77q-4-6 1-11 6-7 15-3 10 3 10 10 0 7-12 7Z","#ca7950","#805941",1.3);
    shape("M95 69l-1-8 7 4 5-3 3 6v4q-3 5-7 5-6 0-9-5Z","#d99661","#805941",1.2);
    shape("M96 67l-.4-3 3 2.3m6-.3 1.8-1.2.7 2.1",null,"#986449",1);
    shape("M94 70l4.4 2.4 6.2-.6-3.6 4.1-4.8-1.6Z","#f3d7a1");
    shape("M97 70q1.4 1 2.6-.1",null,"#604f40",1.1);
    oval(96.2,72.8,.85,.6,"#594e41");
    shape("M120 67q8 5 2 11-5 4-15 2-5-1-8-4 7 1 12-2 4-2 9-7Z","#d38b5c","#8c6146",1.2);
    shape("M100 76q4 1 9-1l-1 2 3 .4-2.1 2.4q-5-.5-8.9-3.8Z","#f3d8aa");
  });

  // A fold from the notebook has landed along the far edge of the lawn.
  const paperPlane = layer((shape,oval) => {
    oval(168,65,9,2.1,"#5a674255");
    shape("M155 61l24-11-10 16-4-5-5 2Z","#fff8dc","#7c7c67",1.1);
    shape("M160 63l19-13-14 11-1 4Z","#d5d2b8","#84846d",.65);
    shape("M165 61l14-11-10 16Z","#e6e5cf","#858575",.65);
  });
  paperPlane.hidden = !window.folderSite?.paperPlaneSent;
  document.addEventListener("folder:paper-plane",() => {
    paperPlane.hidden = false;
    describe();
  });

  const pieces = {house,lamp,creature};
  const categoryPiece = new Map([["场景","house"],["灯光练习","house"],["道具","lamp"],["生物","creature"]]);
  const keyPrefix = "gudiy-diorama-v1-";
  const seen = new Set();
  const pending = new Set();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let onScreen = !("IntersectionObserver" in window);
  box.setAttribute("role","button");
  box.tabIndex = 0;

  // Flower beds follow the open front and side edges of the isometric lawn.
  const beds = [
    {x:42,y:72,variety:"poppy"}, {x:157,y:73,variety:"daisy"},
    {x:71,y:80,variety:"bell"}, {x:117,y:85,variety:"poppy"},
    {x:56,y:66,variety:"daisy"}
  ];
  const flowers = new Map();
  let bee, flight, perch;

  function plant(bed) {
    const bloom = layer((shape,oval) => {
      oval(1,0,6,1.5,"#4d674137");
      shape("M0 0Q-1-7 1-13",null,"#405f42",1.9);
      shape("M0-3Q-6-2-7-8-2-8 0-3ZM0-5Q2-11 7-10 5-5 0-5Z","#6f9055","#47674b",.7);
      if (bed.variety === "poppy") {
        shape("M1-12Q-6-12-6-17q1-4 5-1 2-6 5-3 1 2-1 5 6-4 6 0-1 4-8 4Z","#e78a63","#a45344",.95);
        oval(1,-14,2.1,1.3,"#70493f");
      } else if (bed.variety === "daisy") {
        for (let petal = 0; petal < 6; petal++) {
          const a = petal * Math.PI/3;
          oval(1+3.8*Math.cos(a),-14+3.6*Math.sin(a),2.8,2.8,"#796a4c");
          oval(1+3.8*Math.cos(a),-14+3.6*Math.sin(a)-.25,2.4,2.35,"#fff3c7");
        }
        oval(1,-14,2.6,2.4,"#e6a749");
      } else {
        shape("M1-12q0-7 5-6",null,"#52794e",1.6);
        shape("M4-17q6-3 7 3l2 4-4-.6-.9 2.3-2.2-2.3-3.9.3 2-3.8Z","#ac95ca","#665680",.95);
        shape("M0-12q-4-4-6 0l-1.7 3.4 2.5-.4 1.4 1.3 1-1.8 2 .1Z","#c6acd4","#776492",.8);
      }
    },bed.x,bed.y);
    if (bee) box.append(bee);
    flowers.set(bed,bloom);
    bloom.style.transformOrigin = (bed.x/2)+"% "+(bed.y/112*100)+"%";
    if (!reduced.matches && bloom.animate) bloom.animate([
      {transform:"scale(.24,.08)"},{transform:"scale(.89,1.12)",offset:.68},{transform:"none"}
    ],{duration:390,easing:"ease-out"});
  }
  function pollinate(bed, rect) {
    let from = {x:175,y:17};
    if (!bee) {
      bee = layer((shape,oval) => {
        shape("M-4-2q-7-7-3-9 5-2 7 8 1-10 5-9 4 3-2 11Z","#e4f3ef","#71877d",1);
        shape("M-8 0l-4-1 4 3Z","#514b39");
        shape("M-8 0q1-6 8-5 7 1 7 6-1 4-7 4-8 0-8-5Z","#efb64d","#63513f",1.2);
        shape("M-3-4q-2 4-1 8m5-8q-2 4-1 8",null,"#634d38",2.3);
        oval(6,0,3,3,"#735b3d"); oval(7,-1,1,.85,"#372f29");
        shape("M6-2q-1-3 2-4",null,"#5d493b",.9);
      },100,56);
    } else {
      const last = bee.getBoundingClientRect();
      from = {x:100 + (last.left-rect.left)*200/rect.width, y:56 + (last.top-rect.top)*112/rect.height};
    }
    const to = {x:bed.x-3,y:bed.y-22};
    const transform = ({x,y}) => "translate("+((x-100)/2)+"%,"+((y-56)/112*100)+"%)";
    flight?.cancel();
    bee.style.transform = transform(to);
    perch = bed;
    if (!reduced.matches && bee.animate) {
      const arc = {x:(from.x+to.x)/2+5,y:Math.min(from.y,to.y)-14};
      flight = bee.animate([{transform:transform(from)},{transform:transform(arc),offset:.48},{transform:transform(to)}],
        {duration:620,easing:"cubic-bezier(.28,.5,.38,1)"});
    }
  }
  function tend(event) {
    const rect = box.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const free = beds.filter(bed => !flowers.has(bed));
    let bed = free[0] || beds[(beds.indexOf(perch)+1)%beds.length];
    if (event?.detail) {
      const x = (event.clientX-rect.left)/rect.width*200, y = (event.clientY-rect.top)/rect.height*112;
      const distance = spot => Math.hypot(spot.x-x,spot.y-10-y);
      for (const candidate of free.length ? free : beds) {
        if (distance(candidate) < distance(bed)) bed = candidate;
      }
    }
    if (!flowers.has(bed)) plant(bed);
    if (flowers.size >= 3) pollinate(bed,rect);
    describe();
  }
  box.addEventListener("click",tend);
  box.addEventListener("keydown",event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (!event.repeat && event.key === "Enter") tend();
  });
  box.addEventListener("keyup",event => {
    if (event.key === " ") { event.preventDefault(); tend(); }
  });

  function describe() {
    const names = [];
    if (!house.hidden) names.push("小屋");
    if (!lamp.hidden) names.push("路灯");
    if (!creature.hidden) names.push("小狐狸");
    if (!paperPlane.hidden) names.push("纸飞机");
    if (flowers.size) names.push(flowers.size + " 朵野花");
    if (bee) names.push("蜜蜂");
    const scene = names.length ? "袖珍草地上的" + names.join("、") : "一方袖珍草地";
    box.setAttribute("aria-label", scene + (flowers.size < beds.length ? "，种花" : "，让蜜蜂采蜜"));
  }
  function stored(piece) {
    try { return localStorage.getItem(keyPrefix+piece) === "1"; } catch { return false; }
  }
  for (const [id,canvas] of Object.entries(pieces)) {
    if (stored(id)) seen.add(id);
    canvas.hidden = !seen.has(id);
  }
  describe();

  function land() {
    if (viewer.open || !onScreen || !pending.size) return;
    let delay = 0;
    for (const id of pending) {
      const canvas = pieces[id];
      canvas.hidden = false;
      if (!reduced.matches && canvas.animate) {
        canvas.animate([
          {opacity:0,transform:"translateY(-12px)"},
          {opacity:1,transform:"translateY(0)",offset:.75},
          {transform:"translateY(-1.4px)",offset:.88},
          {transform:"none"}
        ],{duration:360,delay,fill:"backwards",easing:"ease-out"});
        delay += 115;
      }
    }
    pending.clear();
    describe();
  }
  document.addEventListener("gudiy:work-viewed",event => {
    const {id,category} = event.detail || {};
    const piece = categoryPiece.get(category);
    if (!id || !piece || seen.has(piece)) return;
    seen.add(piece);
    pending.add(piece);
    try { localStorage.setItem(keyPrefix+piece,"1"); } catch { /* Keep this visit in memory. */ }
    land();
  });
  viewer.addEventListener("close",land);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      onScreen = entries[entries.length-1].isIntersecting;
      land();
    }, {threshold:.15}).observe(box);
  }
  window.addEventListener("storage",event => {
    for (const [id,canvas] of Object.entries(pieces)) {
      if (event.key !== keyPrefix+id && event.key !== null) continue;
      if (stored(id)) {
        if (!seen.has(id)) { seen.add(id); pending.add(id); }
      } else {
        seen.delete(id); pending.delete(id); canvas.hidden = true;
      }
    }
    land();
    describe();
  });
})();
