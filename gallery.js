// Both the illustration and the portfolio viewers use the same image-ready transition.
function createArtViewer(dialog, readEntries, updateCaption) {
  const stage = dialog.querySelector(".viewer-image");
  let image = stage.querySelector("img");
  const controls = dialog.querySelector(".viewer-controls");
  const [previous, next] = controls.querySelectorAll("button");
  const position = controls.querySelector("[aria-live]");
  const strip = document.createElement("div");
  strip.className = "art-filmstrip";
  strip.setAttribute("role", "group");
  strip.setAttribute("aria-label", "选择大图");
  const navigation = document.createElement("div");
  navigation.className = "art-navigation";
  position.replaceWith(navigation);
  navigation.append(strip, position);

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "art-retry";
  retry.textContent = "图片载入失败，点击重试";
  retry.hidden = true;
  stage.append(retry);
  let selected = null, sequence = 0, imageMotion;

  function updateStrip(entries, index) {
    const start = Math.max(0, Math.min(index - 2, entries.length - 5));
    const shown = entries.slice(start, start + 5);
    const keepFocus = strip.contains(document.activeElement);
    const buttons = shown.map((item, offset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "art-thumb";
      button.setAttribute("aria-label", "查看：" + item.label);
      button.setAttribute("aria-pressed", String(start + offset === index));
      const thumb = new Image();
      thumb.alt = "";
      thumb.src = item.src;
      button.append(thumb);
      button.onclick = () => open(item.key, Math.sign(start + offset - index));
      return button;
    });
    strip.replaceChildren(...buttons);
    strip.hidden = previous.disabled = next.disabled = entries.length < 2;
    if (keepFocus) strip.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
    position.textContent = (index + 1) + " / " + entries.length;
  }

  async function open(key, direction = 0, force = false) {
    if (dialog.open && key === selected && !force) return;
    const entries = readEntries();
    const index = entries.findIndex(item => item.key === key);
    if (index < 0) return;
    const entry = entries[index];
    const token = ++sequence;
    const opening = !dialog.open;
    selected = key;
    retry.hidden = true;
    if (opening) {
      image.hidden = true;
      dialog.showModal();
    }
    stage.setAttribute("aria-busy", "true");
    updateStrip(entries, index);
    updateCaption(entry);
    const incoming = new Image();
    incoming.alt = entry.alt || entry.label;
    incoming.decoding = "async";
    try {
      await new Promise((resolve, reject) => {
        incoming.onload = resolve;
        incoming.onerror = reject;
        incoming.src = entry.src;
      });
      // Some browsers can display a loaded image even if decode() is unavailable.
      if (incoming.decode) {
        try { await incoming.decode(); } catch (error) { if (!incoming.naturalWidth) throw error; }
      }
    } catch {
      if (token !== sequence || !dialog.open) return;
      stage.removeAttribute("aria-busy");
      image.hidden = true;
      retry.hidden = false;
      return;
    }
    if (token !== sequence || !dialog.open) return;
    imageMotion?.cancel();
    incoming.id = image.id;
    image.replaceWith(incoming);
    image = incoming;
    stage.removeAttribute("aria-busy");
    const start = direction ? "translateX(" + direction * 28 + "px) scale(.985)" : "scale(.975)";
    imageMotion = siteFeedback.animate(image, [
      {opacity:.45, transform:start},
      {opacity:1, transform:"none"}
    ], {duration:260, easing:"cubic-bezier(.18,.85,.24,1)"});
    document.dispatchEvent(new CustomEvent("gudiy:art-view",{detail:{key:entry.key}}));
  }

  function step(delta) {
    const entries = readEntries();
    if (entries.length < 2) return;
    const index = entries.findIndex(item => item.key === selected);
    const target = (index + delta + entries.length) % entries.length;
    open(entries[target].key, delta);
  }
  previous.onclick = () => step(-1);
  next.onclick = () => step(1);
  retry.onclick = () => open(selected, 0, true);
  dialog.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.target.closest("input,[role=slider]") ||
      event.altKey || event.metaKey || event.ctrlKey ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    step(event.key === "ArrowLeft" ? -1 : 1);
  });
  let gesture;
  stage.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" || !event.isPrimary || event.target.closest("button")) { gesture = null; return; }
    gesture = {id:event.pointerId, x:event.clientX, y:event.clientY};
  });
  stage.addEventListener("pointercancel", () => { gesture = null; });
  stage.addEventListener("pointerup", event => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  });
  dialog.addEventListener("close", () => {
    if (dialog.open) return;
    ++sequence;
    selected = gesture = null;
    imageMotion?.cancel();
    stage.removeAttribute("aria-busy");
  });
  return {open};
}

(() => {
  const dialog = document.querySelector("dialog[aria-labelledby='viewer-title']");
  if (!dialog || typeof dialog.showModal !== "function") return;
  // Home redraws cards from editable records. Keep their identity across those redraws.
  const keyFor = link => link.classList.contains("cover-link") ? "cover" : "art:" + link.classList.item(1);
  const entries = () => Array.from(document.querySelectorAll("[data-art]"))
    .filter(link => !link.closest("[data-page-cover][hidden]"))
    .map(link => ({key:keyFor(link), src:link.href, label:link.dataset.title, alt:link.querySelector("img").alt}));
  const gallery = createArtViewer(dialog, entries, entry => {
    document.querySelector("#viewer-title").textContent = entry.label;
  });
  document.addEventListener("click", event => {
    const link = event.target.closest?.("[data-art]");
    if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    gallery.open(keyFor(link));
  });
  document.querySelector("#close-viewer").onclick = () => dialog.close();
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
})();
