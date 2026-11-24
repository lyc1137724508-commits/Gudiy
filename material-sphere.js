// The sun stays on the site's paper palette until the visitor turns it.
(() => {
  const lights = [
    {id:"moon", name:"月蓝"}, {id:"amber", name:"琥珀"}, {id:"coral", name:"珊瑚"},
    {id:"orchid", name:"紫晶"}, {id:"teal", name:"青碧"}, {id:"dawn", name:"天光"}
  ];
  const step = 360 / lights.length;
  const viewer = document.getElementById("work-view");
  const dials = new Map();
  let inShelf = false, inViewer = false;
  let angle = 0, light = null, drag = null;

  function render() {
    for (const dial of dials.values()) {
      dial.style.setProperty("--sun-angle", angle + "deg");
      dial.setAttribute("aria-valuenow", String(light === null ? 0 : light * step));
      dial.setAttribute("aria-valuetext", light === null ? "原色" : lights[light].name + "，" + light * step + " 度");
    }
    window.folderSite?.setMaterialRoom?.(light === null ? null : lights[light].id);
  }
  function reset() {
    endCapture();
    angle = 0;
    light = null;
    render();
  }
  function endCapture() {
    if (!drag) return;
    const {dial, id} = drag;
    drag = null;
    if (dial.hasPointerCapture(id)) dial.releasePointerCapture(id);
  }
  function turn(value, snap) {
    const sector = Math.round(value / step);
    light = (sector % lights.length + lights.length) % lights.length;
    angle = snap ? sector * step : value;
    render();
  }
  function bearing(x, y) { return Math.atan2(x, -y) * 180 / Math.PI; }
  function create(slot) {
    const dial = document.createElement("div");
    dial.className = "sphere-dial";
    dial.tabIndex = 0;
    dial.setAttribute("role","slider");
    dial.setAttribute("aria-label","太阳光照方向");
    dial.setAttribute("aria-valuemin","0");
    dial.setAttribute("aria-valuemax",String(360 - step));
    const sun = document.createElement("span");
    sun.className = "sphere-sun";
    sun.setAttribute("aria-hidden","true");
    dial.append(sun);
    slot.append(dial);

    dial.addEventListener("pointerdown", e => {
      if (!e.isPrimary || e.button !== 0 || drag) return;
      const rect = dial.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      drag = {dial, id:e.pointerId, startX:e.clientX, startY:e.clientY, cx, cy,
        startAngle:angle, startLight:light, bearing:bearing(dx,dy),
        orbit:Math.hypot(dx,dy) >= rect.width * .24, moved:false, travel:0, axis:null};
      dial.focus({preventScroll:true});
      dial.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    function move(e) {
      if (drag?.dial !== dial || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      let delta;
      if (drag.orbit) {
        const x = e.clientX - drag.cx, y = e.clientY - drag.cy;
        if (Math.hypot(x,y) < 3) return;
        const direction = bearing(x,y);
        drag.travel += (direction - drag.bearing + 540) % 360 - 180;
        drag.bearing = direction;
        delta = drag.travel;
      } else {
        drag.axis ??= Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
        delta = (drag.axis === "x" ? dx : -dy) * 3;
      }
      if (!drag.moved && Math.abs(delta) < 5) return;
      drag.moved = true;
      turn(drag.startAngle + delta, false);
    }
    dial.addEventListener("pointermove", move);
    dial.addEventListener("pointerup", e => {
      if (drag?.dial !== dial || e.pointerId !== drag.id) return;
      move(e);
      if (drag.moved) turn(angle, true);
      endCapture();
    });
    function cancel(e) {
      if (drag?.dial !== dial || e.pointerId !== drag.id) return;
      angle = drag.startAngle;
      light = drag.startLight;
      endCapture();
      render();
    }
    dial.addEventListener("pointercancel", cancel);
    dial.addEventListener("lostpointercapture", cancel);
    dial.addEventListener("keydown", e => {
      if (drag || e.altKey || e.ctrlKey || e.metaKey) return;
      const moves = {ArrowLeft:-1, ArrowDown:-1, ArrowRight:1, ArrowUp:1, PageDown:-1, PageUp:1};
      if (Object.hasOwn(moves,e.key)) turn((Math.round(angle / step) + moves[e.key]) * step, true);
      else if (e.key === "Home") turn(0, true);
      else if (e.key === "End") turn(360 - step, true);
      else return;
      e.preventDefault();
      e.stopPropagation();
    });
    dials.set(slot,dial);
  }
  function update(id, visible) {
    const slot = document.getElementById(id);
    if (slot) {
      slot.hidden = !visible;
      if (visible && !dials.has(slot)) create(slot);
    }
    if (viewer?.open ? inViewer : inShelf) render();
    else reset();
  }
  function isMaterial(category) { return typeof category === "string" && category.trim() === "材质"; }
  function view(item) {
    inViewer = isMaterial(item?.category);
    update("materials-in-view",inViewer);
  }
  viewer?.addEventListener("close", () => { if (!viewer.open) view(null); });
  document.addEventListener("folder:inactive", reset);
  window.addEventListener("pageshow", e => { if (e.persisted) reset(); });
  window.materialSphere = {
    filter(category) {
      inShelf = isMaterial(category);
      update("materials-in-shelf",inShelf);
    },
    view
  };
})();
