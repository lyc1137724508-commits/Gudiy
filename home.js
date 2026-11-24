const featured = document.querySelector("#featured");
let featuredRead = 0;
async function refreshFeatured() {
  const current = ++featuredRead;
  try {
    const {items, preview}=await siteData.load("portfolio");
    if (current !== featuredRead) return;
    const selection = preview
      ? items.filter(item => item.featured !== false).slice(0, 3)
      : items.filter(item => item.featured);
    featured.replaceChildren(...selection.map(featuredCard));
    if (!selection.length) featured.append(pageCopy.bind(siteData.element("p","更多作品可在完整作品集中浏览。"),"emptyWorks"));
  } catch (error) {
    if (current === featuredRead) featured.textContent = error.message;
  }
}
function featuredCard(item, index) {
  const link=siteData.element("a",undefined,"work-link");
  link.href="portfolio.html#"+encodeURIComponent(item.id);
  const image=siteData.element("img",undefined,"work-cover");
  const label=item.title || `第 ${index + 1} 件精选作品（${item.category}）`;
  link.setAttribute("aria-label","查看作品："+label);
  image.src=item.image; image.alt=item.title||item.description||label; image.loading="lazy";
  const caption=siteData.element("div",undefined,"art-label");
  if (item.title) caption.append(siteData.element("h3",item.title));
  caption.append(siteData.element("span",item.category));
  link.append(image,caption);
  return link;
}
refreshFeatured();
document.addEventListener("folder:works",refreshFeatured);
document.addEventListener("folder:featured",refreshFeatured);

const illustrations=document.querySelector("#illustrations");
let illustrationRead=0;
async function refreshIllustrations() {
  const current=++illustrationRead;
  try {
    const {items}=await siteData.load("illustrations");
    if(current!==illustrationRead)return;
    const cards=items.map(item=>{
      const link=siteData.element("a",undefined,"art-card");
      link.classList.add(item.id);
      link.href=item.image;
      link.dataset.art="";
      link.dataset.title=item.title;
      const crop=siteData.element("div",undefined,"art-crop");
      const image=siteData.element("img");image.src=item.image;image.alt=item.description||item.title;image.loading="lazy";
      crop.append(image);
      const caption=siteData.element("div",undefined,"art-label");
      caption.append(siteData.element("h3",item.title));
      if(item.caption) caption.append(siteData.element("span",item.caption));
      link.append(crop,caption);
      return link;
    });
    illustrations.replaceChildren(...cards);
    illustrations.closest("section").hidden=!cards.length;
  } catch(error) {
    if(current===illustrationRead) illustrations.textContent=error.message;
  }
}
document.addEventListener("folder:pages",refreshIllustrations);
if(window.folderSite?.state.items.length)refreshIllustrations();

const coverLink = document.querySelector(".hero-art .cover-link");
const artViewer = document.querySelector("dialog[aria-labelledby='viewer-title']");
if (coverLink && artViewer) {
  const butterfly = document.createElement("i");
  butterfly.className = "paper-butterfly";
  butterfly.setAttribute("aria-hidden", "true");
  coverLink.parentElement.append(butterfly);
  let openedFromCover = false, landingTimer;
  document.addEventListener("click", event => {
    const artwork = event.target.closest?.("[data-art]");
    if (artwork) {
      openedFromCover = artwork === coverLink;
      butterfly.classList.remove("alighting");
      clearTimeout(landingTimer);
    }
  });
  artViewer.addEventListener("close", () => {
    if (!openedFromCover || artViewer.open) return;
    openedFromCover = false;
    butterfly.classList.add("alighting");
    landingTimer = setTimeout(() => butterfly.classList.remove("alighting"), 740);
  });
}
