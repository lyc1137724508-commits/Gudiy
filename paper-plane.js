(() => {
  const button = document.querySelector(".paper-fold");
  if (!button) return;
  const paper = button.querySelector("canvas");
  const ctx = paper.getContext("2d");
  if (!ctx) return;

  const ink = "#706e59", front = "#fff8de", back = "#c2c9ac", crease = "#e5dfbc";
  const labels = ["折叠这张纸", "折叠纸角", "折出机翼", "放飞纸飞机"];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let fold = 0, motion = null;

  function facet(points, color) {
    ctx.beginPath();
    points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = .95;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    // Short, uneven fibres give even the flat sheet a little tooth.
    ctx.strokeStyle = "#8c846b2c";
    ctx.lineWidth = .55;
    ctx.beginPath();
    for (let n = 0; n < 100; n++) {
      const x = (n*37 + 11) % 73, y = (n*17 + Math.floor(n/11)) % 51;
      ctx.moveTo(x,y); ctx.lineTo(x+1.8+(n%3),y-.75);
    }
    ctx.stroke();
    ctx.restore();
  }
  function draw() {
    ctx.setTransform(2,0,0,2,0,0);
    ctx.clearRect(0,0,76,52);
    ctx.lineJoin = "round";
    if (fold === 0) {
      facet([[14,11],[53,4],[61,39],[22,47]],front);
      facet([[51,4.5],[53,4],[55,13]],crease);
    } else if (fold === 1) {
      facet([[18,20],[56,12],[60,32],[22,40]],back);
      facet([[17,17],[55,10],[59,30],[21,38]],front);
    } else if (fold === 2) {
      facet([[13,28],[46,9],[65,13],[42,39],[25,43]],front);
      facet([[13,28],[46,9],[65,13],[33,28]],crease);
      facet([[25,43],[33,28],[65,13],[42,39]],back);
    } else {
      facet([[6,29],[68,6],[29,35]],front);
      facet([[29,35],[68,6],[31,47]],"#a6b395");
      facet([[31,47],[38,32],[68,6]],crease);
      facet([[32,28],[68,6],[48,41]],front);
    }
    button.setAttribute("aria-label",labels[fold]);
  }
  function freshSheet() {
    motion?.cancel();
    motion = null;
    delete button.dataset.flying;
    fold = 0;
    draw();
  }
  function launch() {
    window.folderSite?.sendPaperPlane?.();
    if (reduced.matches || !paper.animate) { freshSheet(); return; }
    const bounds = button.closest(".desk-intro").getBoundingClientRect();
    const origin = paper.getBoundingClientRect();
    const rightRoom = bounds.right - origin.right, leftRoom = origin.left - bounds.left;
    const direction = rightRoom >= 45 || rightRoom >= leftRoom ? 1 : -1;
    const distance = Math.max(0, Math.min(132, (direction > 0 ? rightRoom : leftRoom) - 3));
    const lift = Math.min(36, Math.max(0, origin.top - bounds.top - 3));
    const pose = (x,y,angle,scale) =>
      "translate(" + direction*distance*x + "px," + -lift*y + "px) scaleX(" + direction + ") rotate(" + angle + "deg) scale(" + scale + ")";
    button.dataset.flying = "";
    motion = paper.animate([
      {transform:pose(0,0,0,1)},
      {transform:pose(.33,.78,-10,1), offset:.34},
      {transform:pose(.7,1,9,.85), offset:.66, opacity:1},
      {transform:pose(1,.54,21,.62), opacity:0}
    ], {duration:780, easing:"cubic-bezier(.26,.72,.35,1)", fill:"forwards"});
    motion.onfinish = freshSheet;
  }
  button.addEventListener("click", () => {
    if (button.hasAttribute("data-flying")) return;
    motion?.cancel();
    motion = null;
    if (fold === labels.length-1) { launch(); return; }
    fold++;
    draw();
    if (!reduced.matches && paper.animate) {
      motion = paper.animate([
        {transform:"perspective(100px) rotateY(-40deg) rotate(-5deg)"},
        {transform:"none"}
      ], {duration:205, easing:"ease-out"});
    }
  });
  reduced.addEventListener("change", () => {
    if (!reduced.matches) return;
    if (button.hasAttribute("data-flying")) freshSheet();
    else { motion?.cancel(); motion = null; }
  });
  draw();
  button.hidden = false;
})();
