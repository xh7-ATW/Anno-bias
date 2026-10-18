// Deep-linking for the Part I/II/III panel-tabset in annotation-bias.qmd.
// Quarto's native .panel-tabset does not preserve custom heading IDs
// (e.g. {#part-1}) on the generated tab buttons/panes, so hash links to a
// specific Part, or to a formula/table inside a currently hidden Part,
// would otherwise fail to activate the right tab. This restores that.
(function () {
  var PART_IDS = ["part-1", "part-2", "part-3"];

  function getTabButtons() {
    var tabset = document.getElementById("research-parts");
    if (!tabset) return [];
    return Array.prototype.slice.call(
      tabset.querySelectorAll(':scope > ul.nav-tabs [data-bs-toggle="tab"]')
    );
  }

  function getTabPanes() {
    var tabset = document.getElementById("research-parts");
    if (!tabset) return [];
    return Array.prototype.slice.call(
      tabset.querySelectorAll(":scope > .tab-content > .tab-pane")
    );
  }

  function showTab(index) {
    var buttons = getTabButtons();
    var target = buttons[index];
    if (!target) return false;
    if (window.bootstrap && window.bootstrap.Tab) {
      window.bootstrap.Tab.getOrCreateInstance(target).show();
    } else {
      target.click();
    }
    return true;
  }

  function findTabForElementId(id) {
    var panes = getTabPanes();
    for (var i = 0; i < panes.length; i++) {
      if (panes[i].querySelector("#" + CSS.escape(id))) return i;
    }
    return -1;
  }

  function scrollToTabset() {
    var tabset = document.getElementById("research-parts");
    if (!tabset) return;
    var top = tabset.getBoundingClientRect().top + window.pageYOffset - 16;
    window.scrollTo(0, Math.max(0, top));
  }

  // Jump to the tabs, then align again once the new pane is shown, since
  // swapping panes can change the page layout above and around the tabs.
  function goToPart(index) {
    var button = getTabButtons()[index];
    if (button && !button.classList.contains("active")) {
      button.addEventListener("shown.bs.tab", function () {
        scrollToTabset();
        requestAnimationFrame(scrollToTabset);
      }, { once: true });
    }
    showTab(index);
    scrollToTabset();
  }

  function activateFromHash() {
    var hash = window.location.hash.replace("#", "");
    if (!hash) return;

    var partIndex = PART_IDS.indexOf(hash);
    if (partIndex !== -1) {
      goToPart(partIndex);
      return;
    }

    var containingTab = findTabForElementId(hash);
    if (containingTab !== -1) {
      showTab(containingTab);
      var el = document.getElementById(hash);
      if (el) {
        setTimeout(function () {
          el.scrollIntoView();
        }, 0);
      }
    }
  }

  function wireTabHashSync() {
    var buttons = getTabButtons();
    buttons.forEach(function (btn, i) {
      btn.addEventListener("shown.bs.tab", function () {
        if (PART_IDS[i] && window.location.hash.replace("#", "") !== PART_IDS[i]) {
          history.pushState(null, "", "#" + PART_IDS[i]);
        }
      });
    });
  }

  // ---------- Left table of contents ----------
  // Quarto's TOC lists only the headings outside the Part tabs, and its
  // scroll tracking cannot see sections in a hidden tab. Rebuild the TOC with
  // one entry per Part (its sections listed under the open Part) and track the
  // reading position here. This runs before Quarto's own TOC code, which then
  // finds no links to track because none carry data-scroll-target.
  function tocLink(href, html, cls) {
    var a = document.createElement("a");
    a.href = href;
    a.className = "nav-link" + (cls ? " " + cls : "");
    a.innerHTML = html;
    return a;
  }

  function rebuildToc() {
    var list = document.querySelector("#TOC > ul");
    var buttons = getTabButtons();
    var panes = getTabPanes();
    if (!list || !panes.length) return;
    var top = Array.prototype.map.call(list.querySelectorAll(":scope > li > a"), function (a) {
      return { href: a.getAttribute("href"), html: a.innerHTML };
    });
    list.innerHTML = "";
    top.forEach(function (t) {
      var li = document.createElement("li");
      li.appendChild(tocLink(t.href, t.html));
      list.appendChild(li);
      if (t.href !== "#introduction") return;
      panes.forEach(function (pane, i) {
        var part = document.createElement("li");
        part.className = "toc-part toc-part-" + (i + 1);
        part.appendChild(tocLink("#" + PART_IDS[i], buttons[i].innerHTML));
        var sub = document.createElement("div");
        sub.className = "toc-sub";
        pane.querySelectorAll("section.level3[id]").forEach(function (sec) {
          var head = sec.querySelector(":scope > h3");
          if (head) sub.appendChild(tocLink("#" + sec.id, head.innerHTML));
        });
        part.appendChild(sub);
        list.appendChild(part);
      });
    });
  }

  function activeTabIndex() {
    var panes = getTabPanes();
    for (var i = 0; i < panes.length; i++) if (panes[i].classList.contains("active")) return i;
    return 0;
  }

  // Mark the TOC entry of the section being read: the last listed section whose
  // top has passed a line near the top of the window, among visible sections.
  function syncToc() {
    var nav = document.getElementById("TOC");
    var tabset = document.getElementById("research-parts");
    if (!nav || !tabset) return;
    var open = activeTabIndex();
    var line = 160;
    var current = null;
    nav.querySelectorAll("a.nav-link").forEach(function (a) {
      a.classList.remove("active");
      var href = a.getAttribute("href");
      var partIndex = PART_IDS.indexOf(href.slice(1));
      var target = partIndex === -1 ? document.getElementById(href.slice(1)) : partIndex === open ? tabset : null;
      if (!target || !target.offsetParent) return;
      if (target.getBoundingClientRect().top <= line) current = a;
    });
    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 2) {
      var links = nav.querySelectorAll(":scope > ul > li > a.nav-link");
      current = links[links.length - 1];
    }
    (current || nav.querySelector("a.nav-link")).classList.add("active");
    nav.querySelectorAll(".toc-part").forEach(function (li, i) {
      li.classList.toggle("is-open", i === open);
    });
  }

  var tocQueued = false;
  function queueSyncToc() {
    if (tocQueued) return;
    tocQueued = true;
    requestAnimationFrame(function () {
      tocQueued = false;
      syncToc();
    });
  }

  rebuildToc();

  // ---------- Margin notes ----------
  // Footnotes and citations sit in the right margin next to the paragraph that
  // cites them, so a citation-heavy paragraph can run its notes into those of
  // the next paragraph. Push each block of notes below the previous one. Only
  // applies when the notes are in the margin (wide screens), not inline.
  function spaceMarginNotes() {
    // Right edge of the reading column, measured on a body paragraph.
    var para = document.querySelector("#quarto-document-content > section > p");
    if (!para) return;
    var bodyRight = para.getBoundingClientRect().right;
    var last = -Infinity;
    document.querySelectorAll(".column-margin.no-row-height").forEach(function (c) {
      c.style.paddingTop = "";
      var first = c.firstElementChild;
      if (!first || !c.offsetParent) return;
      if (c.getBoundingClientRect().left < bodyRight) return;
      var top = first.getBoundingClientRect().top + window.pageYOffset;
      if (top < last + 12) c.style.paddingTop = (last + 12 - top) + "px";
      last = c.lastElementChild.getBoundingClientRect().bottom + window.pageYOffset;
    });
  }

  var marginQueued = false;
  function queueSpaceMarginNotes() {
    if (marginQueued) return;
    marginQueued = true;
    requestAnimationFrame(function () {
      marginQueued = false;
      spaceMarginNotes();
    });
  }

  window.addEventListener("load", function () {
    queueSpaceMarginNotes();
    // Typeset math changes paragraph heights after load.
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
      MathJax.startup.promise.then(queueSpaceMarginNotes);
    }
    setTimeout(queueSpaceMarginNotes, 1500);
  });
  window.addEventListener("resize", queueSpaceMarginNotes);
  document.addEventListener("shown.bs.tab", queueSpaceMarginNotes);
  document.addEventListener("shown.bs.collapse", queueSpaceMarginNotes);
  document.addEventListener("hidden.bs.collapse", queueSpaceMarginNotes);

  document.addEventListener("DOMContentLoaded", function () {
    wireTabHashSync();
    activateFromHash();
    getTabButtons().forEach(function (btn) {
      btn.addEventListener("shown.bs.tab", queueSyncToc);
    });
    syncToc();
  });

  window.addEventListener("scroll", queueSyncToc, { passive: true });
  window.addEventListener("resize", queueSyncToc);

  // TOC links to a section inside a Part: open that Part first, then scroll,
  // also when the same link is clicked twice (no hashchange then).
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('#TOC a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute("href").slice(1);
    if (PART_IDS.indexOf(id) !== -1) return;
    var tab = findTabForElementId(id);
    if (tab === -1) return;
    e.preventDefault();
    showTab(tab);
    if (window.location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    setTimeout(function () {
      var el = document.getElementById(id);
      if (el) el.scrollIntoView();
    }, 0);
  });

  window.addEventListener("hashchange", activateFromHash);

  // In-text links such as [Part II](#part-2): switch to that Part and scroll to
  // the tabs, also when the same link is clicked twice (no hashchange then).
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#part-"]');
    if (!link) return;
    var index = PART_IDS.indexOf(link.getAttribute("href").slice(1));
    if (index === -1) return;
    e.preventDefault();
    goToPart(index);
  });
})();
