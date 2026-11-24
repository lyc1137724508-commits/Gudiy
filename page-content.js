(() => {
  const pageId = window.folderSite?.documentId;
  const heading = document.querySelector("[data-page-heading]");
  const description = document.querySelector("[data-page-description]");
  const cover = document.querySelector("[data-page-cover]");
  const jobsList = document.getElementById("job-list");

  function renderJobs(jobs) {
    if (!jobsList) return;
    const fragment = document.createDocumentFragment();
    for (const job of jobs) {
      const entry = document.createElement("li");
      const period = siteData.element("p", job.period, "job-period");
      const body = siteData.element("div", undefined, "job-body");
      const title = siteData.element("h3", job.company);
      title.append(siteData.element("span", job.role, "job-role"));
      body.append(title, siteData.element("p", job.description));
      entry.append(period, body);
      fragment.append(entry);
    }
    jobsList.replaceChildren(fragment);
    jobsList.closest("section").hidden = !jobs.length;
  }

  function renderCover(record) {
    if (!cover) return;
    const img = cover.matches("img") ? cover : cover.querySelector("img");
    const label = record.imageTitle || record.heading || record.title;
    cover.hidden = !record.image;
    document.querySelector("[data-page-cover-layout]")?.classList.toggle("without-cover", !record.image);
    if (!record.image) {
      img.removeAttribute("src");
      return;
    }
    if (img.getAttribute("src") !== record.image) img.src = record.image;
    img.alt = label;
    const caption = cover.querySelector("[data-cover-caption]");
    if (caption) {
      caption.textContent = record.imageTitle;
      caption.hidden = !record.imageTitle;
    }
    const link = cover.querySelector("[data-art]");
    if (link) {
      link.href = record.image;
      link.dataset.title = label;
      link.setAttribute("aria-label", "放大图片：" + label);
    }
  }

  function render(state) {
    if (!state?.items?.length) return;
    const pages = new Map(state.items.map(page => [page.id, page]));
    const record = pages.get(pageId);
    if (record) {
      if (heading) heading.textContent = record.heading;
      if (description) description.textContent = record.description;
      renderCover(record);
      if (jobsList) renderJobs(record.jobs || []);
    } else if (document.getElementById("custom-article")) {
      heading.textContent = "找不到这个页面";
      description.replaceChildren(siteData.element("a", "返回主页", "text-link"));
      description.firstElementChild.href = "index.html";
      cover.hidden = true;
    }
    for (const node of document.querySelectorAll("[data-link-page]")) {
      const target = pages.get(node.dataset.linkPage);
      if (target) node.textContent = (node.dataset.prefix || "") + target.title;
    }
    for (const node of document.querySelectorAll("[data-page-reference]")) {
      const target = pages.get(node.dataset.pageReference);
      if (target) node.textContent = target.heading;
    }
    for (const node of document.querySelectorAll("[data-description-reference]")) {
      const target = pages.get(node.dataset.descriptionReference);
      if (target) node.textContent = target.description;
    }
    if (record) pageCopy.apply(pageId, record.copy, state.items);
  }
  document.addEventListener("folder:pages", event => render(event.detail));
  if (!pageId && document.getElementById("custom-article")) {
    render({items:[{id:"home", title:"主页"}]});
  } else {
    render(window.folderSite?.state);
  }
})();
