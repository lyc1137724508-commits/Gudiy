(() => {
  const contactAddress = "1137724508@qq.com";
  const emailPattern = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
  const field = (key, label, defaultValue, required = true, rows = 0) =>
    ({key, label, defaultValue, required, rows});
  const linkTitle = (id, prefix, fallback) => pages =>
    prefix + (pages.find(page => page.id === id)?.title || fallback);
  const footerName = field("footerName", "页脚署名", "Gudiy · 李岳宸", false);
  const contactLink = field("footerLink", "页脚联系链接", "联系作者");
  const definitions = {
    home: [
      field("greeting", "问候语", "Hello there!", false),
      field("introPrefix", "展示名前的文字", "你好，我是", false),
      field("browseWorks", "作品集按钮", linkTitle("portfolio", "浏览", "作品集")),
      field("viewResume", "履历按钮与链接", linkTitle("resume", "查看", "工作履历")),
      field("worksHeading", "精选作品栏目标题", "我的作品"),
      field("allWorks", "完整作品集链接", linkTitle("portfolio", "查看完整", "作品集")),
      field("emptyWorks", "没有精选作品时的文字", "更多作品可在完整作品集中浏览。", false),
      field("galleryHeading", "插画栏目标题", "插画小廊"),
      field("galleryIntro", "插画栏目介绍", "点开一张，看看全幅风景。", false, 2),
      field("notesHeading", "手记栏目标题", linkTitle("notebook", "", "我的手记")),
      field("openNotes", "手记入口链接", "打开手记"),
      field("aboutHeading", "个人介绍栏目标题", "关于我"),
      field("contactIntro", "邮箱前的文字", "给我写信", false),
      {...field("contactEmail", "全站公开联系邮箱", contactAddress), type:"email", pattern:emailPattern.source},
      field("signature", "个人签名", "Gudiy.", false),
      footerName,
      field("footerLink", "返回页首链接", "回到页首")
    ],
    portfolio: [
      field("byline", "标题上方的文字", "Selected works", false),
      field("allCategories", "全部分类按钮", "全部"),
      field("countUnit", "作品数量后的文字", "件作品", false),
      field("emptyWorks", "作品集为空时的文字", "作品将在这里展示。", false),
      field("postscript", "作品集底部附记", "", false, 7),
      footerName, contactLink
    ],
    resume: [
      field("byline", "标题上方的署名", "李岳宸 / Gudiy", false),
      field("experienceHeading", "工作经历栏目标题", "工作经历"),
      footerName, contactLink
    ],
    notebook: [
      field("byline", "标题上方的文字", "Gudiy’s Notebook", false),
      field("notesShelf", "笔记栏目名称", "知识库"),
      field("toolsShelf", "工具栏目名称", "工具收藏"),
      field("projectsShelf", "项目栏目名称", "项目想法"),
      field("searchLabel", "搜索框标签", "搜索"),
      field("searchHint", "搜索框提示", "搜索本栏标题或内容", false),
      field("filterLabel", "分类筛选标签", "分类"),
      field("readHint", "访客阅读提示", "展开条目可阅读全文。", false, 2),
      field("emptyShelf", "栏目为空时的文字", "这个栏目暂时为空。", false),
      field("emptySearch", "没有匹配条目时的文字", "没有匹配的条目。", false),
      field("toolLink", "工具链接文字", "打开工具"),
      field("exportLink", "导出展示页按钮", "导出展示页"),
      footerName, field("footerLink", "页脚联系链接", "给我写信")
    ]
  };
  const custom = [footerName, contactLink];

  function fields(id, pages = window.folderSite?.state.items || []) {
    const list = Object.hasOwn(definitions, id) ? definitions[id] : custom;
    return list.map(def => typeof def.defaultValue === "function"
      ? {...def, defaultValue:def.defaultValue(pages)} : def);
  }
  function valuesFor(id, copy, pages) {
    const values = new Map();
    for (const def of fields(id, pages)) {
      const value = copy?.[def.key];
      const valid = typeof value === "string" && (!def.required || value.trim())
        && (def.type !== "email" || emailPattern.test(value));
      values.set(def.key, valid ? value : def.defaultValue);
    }
    return values;
  }
  let currentValues = new Map();
  function renderField(node) {
    const value = currentValues.get(node.dataset.copy);
    if (value === undefined) return;
    if (node.hasAttribute("data-copy-placeholder")) {
      node.placeholder = value;
    } else {
      if (node.textContent !== value) node.textContent = value;
      node.hidden = !value;
    }
  }
  function apply(id, copy, pages) {
    currentValues = valuesFor(id, copy, pages);
    document.querySelectorAll("[data-copy]").forEach(renderField);
    const email = pages.find(page => page.id === "home")?.copy?.contactEmail;
    const address = typeof email === "string" && emailPattern.test(email) ? email : contactAddress;
    for (const link of document.querySelectorAll("[data-contact-link]")) {
      link.href = "mailto:" + encodeURIComponent(address).replace("%40", "@");
      if (link.hasAttribute("data-contact-address")) link.textContent = address;
    }
  }
  // Collection controls are rendered asynchronously and may appear before page settings arrive.
  function bind(node, key) {
    node.dataset.copy = key;
    renderField(node);
    return node;
  }
  window.pageCopy = {fields, apply, bind};
})();
