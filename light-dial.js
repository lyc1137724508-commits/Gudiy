(() => {
  const dayId = "waterfall-village-day", nightId = "waterfall-village-night";
  let release;
  function piece(tag, className) {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  }

  function update({viewer, item, records}) {
    release?.();
    const key = item?.id ?? item?.key;
    if (key !== dayId && key !== nightId) return;
    const startsAtNight = key === nightId;
    const other = records.find(record => record.id === (startsAtNight ? dayId : nightId));
    if (!other?.image) return;

    const stage = viewer.querySelector(".viewer-image");
    const plate = piece("div", "light-plate");
    plate.hidden = true;
    plate.setAttribute("aria-hidden", "true");
    const mask = piece("div", "light-mask");
    const alternate = new Image();
    alternate.alt = "";
    alternate.decoding = "async";
    const seam = piece("i", "light-seam");
    mask.append(alternate);
    plate.append(mask, seam);
    stage.append(plate);

    const bar = piece("div", "light-instrument");
    bar.hidden = true;
    const dial = piece("label", "light-dial");
    const sky = piece("span", "light-sky");
    sky.setAttribute("aria-hidden","true");
    const sun = piece("i","light-sun"), moon = piece("i","light-moon");
    sky.append(sun, moon);
    const range = piece("input","light-range");
    range.type = "range";
    range.min = "0"; range.max = "100"; range.step = "1";
    range.value = startsAtNight ? "100" : "0";
    range.setAttribute("aria-label","瀑布小镇日夜灯光对照");
    dial.append(sky, range);
    bar.append(dial);
    stage.after(bar);
    viewer.classList.add("has-light-dial");
    let base, alternateReady = false, disposed = false;

    function setPosition() {
      const value = Number(range.value), t = value / 100;
      plate.style.setProperty("--divide", value + "%");
      mask.style.clipPath = startsAtNight
        ? "inset(0 0 0 " + value + "%)"
        : "inset(0 " + (100 - value) + "% 0 0)";
      seam.hidden = value === 0 || value === 100;
      sky.style.setProperty("--dusk",t);
      sun.style.left = (18 + 28*t) + "%";
      sun.style.top = (18 + 105*t*t) + "%";
      moon.style.left = (52 + 24*t) + "%";
      moon.style.top = (18 + 105*(1-t)*(1-t)) + "%";
      range.setAttribute("aria-valuetext",value === 0 ? "日景" : value === 100 ? "夜景" : "夜景占 " + value + "%");
    }

    function fit() {
      if (!base?.naturalWidth || !stage.clientWidth || !stage.clientHeight) return;
      // The seam follows the image, including when the surrounding stage is letterboxed.
      const scale = Math.min(stage.clientWidth / base.naturalWidth, stage.clientHeight / base.naturalHeight);
      plate.style.width = base.naturalWidth * scale + "px";
      plate.style.height = base.naturalHeight * scale + "px";
    }
    function showWhenReady() {
      if (disposed || !alternateReady || !base?.naturalWidth || !viewer.open) return;
      fit();
      plate.hidden = bar.hidden = false;
    }
    function imageShown() {
      if (stage.hasAttribute("aria-busy")) return;
      base = stage.querySelector("#art-img");
      if (base?.naturalWidth) stage.style.setProperty("--dial-ratio",base.naturalWidth + "/" + base.naturalHeight);
      showWhenReady();
    }
    function end() {
      if (disposed) return;
      disposed = true;
      alternate.onload = alternate.onerror = null;
      window.removeEventListener("resize",fit);
      observer?.disconnect();
      document.removeEventListener("gudiy:art-view",imageShown);
      viewer.removeEventListener("close",onClose);
      stage.style.removeProperty("--dial-ratio");
      viewer.classList.remove("has-light-dial");
      bar.remove(); plate.remove();
      if (release === end) release = null;
    }
    function onClose() { if (!viewer.open) end(); }
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(fit) : null;
    observer?.observe(stage);
    window.addEventListener("resize",fit);
    range.addEventListener("input",setPosition);
    // Arrow keys on the range should scrub light rather than trigger gallery navigation.
    range.addEventListener("keydown",event => {
      if (["ArrowLeft","ArrowRight"].includes(event.key)) event.stopPropagation();
    });
    document.addEventListener("gudiy:art-view",imageShown);
    viewer.addEventListener("close",onClose);
    release = end;
    setPosition();
    alternate.onload = () => { alternateReady = true; showWhenReady(); };
    alternate.onerror = end;
    alternate.src = other.image;
    imageShown();
  }
  window.lightDial = {update};
})();
