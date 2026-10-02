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

  document.addEventListener("DOMContentLoaded", function () {
    wireTabHashSync();
    activateFromHash();
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
