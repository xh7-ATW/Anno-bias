// Interactive result components for annotation-bias.qmd.
// Reads window.ANNO_RESULTS (data/results-data.js, built by
// data/extract_from_dump.py) and replaces each static fallback in a
// `.ab-widget[data-widget=...]` container with its interactive version.
// Display values are rounded here; every decision comes from the unrounded data.

// Citation groups such as [@a; @b] share one `data-cites="a b"` parent, and
// Quarto's hover card lists every key of that parent. Give each link its own
// single-key parent (before Quarto builds the cards on DOMContentLoaded) so
// hovering one reference shows only that reference.
(function () {
  document.querySelectorAll('.citation[data-cites*=" "] a[role="doc-biblioref"]').forEach(function (link) {
    var href = link.getAttribute("href") || "";
    if (href.indexOf("#ref-") !== 0) return;
    var own = document.createElement("span");
    own.setAttribute("data-cites", href.slice(5));
    link.parentNode.insertBefore(own, link);
    own.appendChild(link);
  });
})();

// References to figures ("Figure 2") just jump to the figure: drop the class
// Quarto uses to attach a hover preview, before it builds the previews.
(function () {
  document.querySelectorAll('a.quarto-xref[href^="#fig-"]').forEach(function (link) {
    link.classList.remove("quarto-xref");
  });
})();

// Keep collapsible callouts open across a page reload: remember which ones are
// open when the page unloads, and reopen them (without animation) on load.
// A callout is identified by its title and its position among same-titled ones.
// Math in the title is left out, since MathJax rewrites it after load.
(function () {
  var KEY = "ab-open-callouts";
  function keys() {
    var seen = {};
    return Array.prototype.map.call(document.querySelectorAll(".callout"), function (c) {
      var t = c.querySelector(".callout-title-container");
      var title = "";
      if (t) {
        var copy = t.cloneNode(true);
        copy.querySelectorAll(".math, mjx-container, .screen-reader-only").forEach(function (m) { m.remove(); });
        title = copy.textContent.replace(/\s+/g, " ").trim();
      }
      seen[title] = (seen[title] || 0) + 1;
      return { el: c, key: title + "#" + seen[title] };
    });
  }
  function save() {
    var open = keys().filter(function (k) {
      var body = k.el.querySelector(".callout-collapse");
      return body && body.classList.contains("show");
    }).map(function (k) { return k.key; });
    try { sessionStorage.setItem(KEY, JSON.stringify(open)); } catch (e) {}
  }
  var open = [];
  try { open = JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (e) {}
  if (open.length) {
    keys().forEach(function (k) {
      if (open.indexOf(k.key) === -1) return;
      var body = k.el.querySelector(".callout-collapse");
      var header = k.el.querySelector(".callout-header");
      if (!body || !header) return;
      body.classList.add("show");
      header.classList.remove("collapsed");
      header.setAttribute("aria-expanded", "true");
    });
  }
  window.addEventListener("pagehide", save);
  window.addEventListener("beforeunload", save);
})();

(function () {
  "use strict";

  var D = window.ANNO_RESULTS;
  if (!D) return;

  var SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴",
    5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  var MINUS = "−";
  var RADIOLOGISTS = ["R8", "R9", "R10"];
  var controllers = {};

  // ---------- number formatting ----------

  function minus(s) {
    return s.replace("-", MINUS);
  }

  function supExp(e) {
    return String(e).split("").map(function (c) { return SUP[c]; }).join("");
  }

  function sigN(x, n) {
    if (x === null || x === undefined) return "Not available";
    if (x === 0) return "0";
    var e = Math.floor(Math.log10(Math.abs(x)));
    return minus(x.toFixed(Math.max(0, n - 1 - e)));
  }

  function sciGap(x) {
    return x === 0 ? "0" : sci(x);
  }

  function sci(x) {
    var e = Math.floor(Math.log10(Math.abs(x)));
    var m = (x / Math.pow(10, e)).toFixed(2);
    if (Math.abs(parseFloat(m)) >= 10) {
      e += 1;
      m = (x / Math.pow(10, e)).toFixed(2);
    }
    return minus(m) + " × 10" + supExp(e);
  }

  // p-values: small ones in scientific notation, ones very close to 1 as "≈ 1",
  // otherwise at most three decimal places (0.0808 -> "0.081", 0.500 -> "0.5").
  // Values below 0.01 use scientific notation.
  function fmtP(p) {
    if (p === null || p === undefined) return "Not available";
    if (p < 0.01) return sci(p);
    if (p > 0.999) return "≈ 1";
    return String(parseFloat(p.toFixed(3)));
  }

  var CLEAR_HINT = " Select the cell again to clear.";

  // "p = 0.0123" or "p ≈ 1"
  function pEquals(p) {
    var s = fmtP(p);
    return s.charAt(0) === "≈" ? "p " + s : "p = " + s;
  }

  // Cell text: a p-value, or "No variation" when every paired term Z_i is zero
  // (the statistic and its standard error are both 0, so the test does not apply).
  function pCellText(p) {
    return p === null || p === undefined ? "No variation" : fmtP(p);
  }

  function thresholdText(p, alpha) {
    return p < alpha ? "p < " + alpha.toFixed(2) : "p ≥ " + alpha.toFixed(2);
  }

  // The "(p < α)" line under a significant p-value; omitted otherwise
  // (the cell keeps its height through CSS and the value is centred vertically).
  function thresholdSpan(p, alpha) {
    return p !== null && p !== undefined && p < alpha ? h("span", { class: "ab-matrix-thr", text: "(" + thresholdText(p, alpha) + ")" }) : null;
  }

  function fmtPct(x) {
    if (x === null || x === undefined) return "Not available";
    if (x === 0) return "0%";
    if (x < 0.05) return "<0.1%";
    var r = Math.round(x * 10) / 10;
    if (x < 100 && r >= 100) return ">99.9%";
    return (r % 1 === 0 ? String(r) : r.toFixed(1)) + "%";
  }

  function fmtInt(n) {
    return n.toLocaleString("en-US");
  }

  function probLabel(key) {
    return parseFloat(key).toFixed(2);
  }

  function unitLabel(e) {
    return e === 0 ? "" : "×10" + supExp(e);
  }

  // Engineering exponent (multiple of 3) so one unit fits a whole group.
  function groupExp(values) {
    var maxAbs = 0;
    values.forEach(function (v) { if (v !== null && Math.abs(v) > maxAbs) maxAbs = Math.abs(v); });
    if (maxAbs === 0 || maxAbs >= 1) return 0;
    return 3 * Math.floor(Math.log10(maxAbs) / 3);
  }

  // Light-to-dark heatmap scales (0-100%), one per Part in that Part's main
  // color (--part-1/2/3 in annotation-bias.css).
  var HEAT_STOPS = [[241, 245, 249], [198, 216, 234], [122, 163, 201], [59, 110, 160], [31, 78, 121]];
  var PART_HEAT_STOPS = [
    HEAT_STOPS,
    [[240, 247, 246], [194, 226, 221], [114, 182, 173], [44, 125, 118], [20, 82, 78]],
    [[246, 242, 248], [222, 206, 230], [177, 142, 196], [121, 78, 143], [83, 46, 101]],
  ];

  // Heatmap scale for the Part tab that contains `el`.
  function heatStopsFor(el) {
    var pane = el && el.closest("#research-parts > .tab-content > .tab-pane");
    if (!pane) return HEAT_STOPS;
    var i = Array.prototype.indexOf.call(pane.parentNode.children, pane);
    return PART_HEAT_STOPS[i] || HEAT_STOPS;
  }

  function heatColor(pct, stops) {
    stops = stops || HEAT_STOPS;
    var t = Math.max(0, Math.min(100, pct)) / 100 * (stops.length - 1);
    var i = Math.min(stops.length - 2, Math.floor(t));
    var f = t - i;
    var c = stops[i].map(function (v, k) { return Math.round(v + (stops[i + 1][k] - v) * f); });
    return "rgb(" + c.join(",") + ")";
  }

  function heatText(pct) {
    return pct >= 55 ? "#ffffff" : "var(--article-ink)";
  }

  // ---------- DOM helpers ----------

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "text") el.textContent = v;
        else if (k === "html") el.innerHTML = v;
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  var uid = 0;
  function nextId(prefix) {
    uid += 1;
    return prefix + "-" + uid;
  }

  function selectField(label, options, value, onChange) {
    var id = nextId("ab-select");
    var select = h("select", { id: id });
    options.forEach(function (o) {
      select.appendChild(h("option", { value: o.value, text: o.label }));
    });
    select.value = value;
    select.addEventListener("change", function () { onChange(select.value); });
    return { field: h("div", { class: "ab-field" }, [h("label", { for: id, text: label }), select]), select: select };
  }

  function segmentedField(label, options, value, onChange) {
    var labelId = nextId("ab-seg");
    var group = h("div", { class: "ab-seg", role: "group", "aria-labelledby": labelId });
    var buttons = options.map(function (o) {
      var b = h("button", { type: "button", "data-value": o.value, text: o.label });
      b.addEventListener("click", function () { onChange(o.value); });
      group.appendChild(b);
      return b;
    });
    function sync(v) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-value") === v ? "true" : "false");
      });
    }
    sync(value);
    return { field: h("div", { class: "ab-field" }, [h("span", { id: labelId, class: "ab-field-label", text: label }), group]), sync: sync };
  }

  function makeTable(headers, rows, extraClass) {
    var thead = h("thead", null, [h("tr", null, headers.map(function (c) {
      return h("th", { class: c.num ? "ab-num" : null, html: c.label });
    }))]);
    return h("table", { class: "table ab-table" + (extraClass ? " " + extraClass : "") }, [thead, h("tbody", null, rows)]);
  }

  function cell(content, num) {
    return h("td", { class: num ? "ab-num" : null, html: content });
  }

  function makeSelectable(el, onSelect) {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.classList.add("ab-selectable");
    el.addEventListener("click", onSelect);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    });
  }

  function heatLegend(label, scale) {
    scale = scale || HEAT_STOPS;
    var stops = scale.map(function (c, i) {
      return "rgb(" + c.join(",") + ") " + (i / (scale.length - 1) * 100) + "%";
    }).join(", ");
    return h("div", { class: "ab-heat-legend", "aria-hidden": "true" }, [
      h("span", { class: "ab-heat-legend-label", text: label || "Rejection percentage" }),
      h("span", { class: "ab-heat-legend-scale" }, [
        h("span", { class: "ab-heat-legend-bar", style: "background: linear-gradient(to right, " + stops + ")" }),
        h("span", { class: "ab-heat-legend-ticks" }, [h("span", { text: "0%" }), h("span", { text: "50%" }), h("span", { text: "100%" })]),
      ]),
    ]);
  }

  function niceTicks(lo, hi, count) {
    var span = hi - lo;
    if (span <= 0) span = Math.abs(hi) || 1;
    var step = Math.pow(10, Math.floor(Math.log10(span / count)));
    var err = span / count / step;
    if (err >= 7.5) step *= 10;
    else if (err >= 3.5) step *= 5;
    else if (err >= 1.5) step *= 2;
    var start = Math.floor(lo / step) * step;
    var end = Math.ceil(hi / step) * step;
    var ticks = [];
    for (var v = start; v <= end + step / 2; v += step) ticks.push(Math.abs(v) < step / 1e6 ? 0 : v);
    return { ticks: ticks, lo: start, hi: end, step: step };
  }

  function tickLabel(v, step) {
    if (v === 0) return "0";
    return minus(v.toFixed(Math.max(0, -Math.floor(Math.log10(step)))));
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function countWord(n) {
    return n === 2 ? "both" : n === 1 ? "one" : "neither";
  }

  // ---------- Task I comparison matrix (shared by scalar and Bernoulli) ----------

  // rows: records with A (training radiologist), B (human), C (external), p, reject.
  function buildMatrix(rows, alpha, alphaKey, state, onSelect) {
    function find(a, b) {
      return rows.filter(function (r) { return r.A === a && r.B === b; })[0];
    }
    var head = h("thead", null, [h("tr", null, [h("th", { scope: "col", class: "ab-matrix-corner" }, [
      h("span", { class: "ab-long", text: "Model" }), h("span", { class: "ab-short", text: "Model" }),
    ])].concat(RADIOLOGISTS.map(function (b) {
      return h("th", { scope: "col" }, [h("span", { class: "ab-long", text: "Human " + b }), h("span", { class: "ab-short", text: b })]);
    })))]);
    var body = h("tbody", null, RADIOLOGISTS.map(function (a) {
      return h("tr", null, [h("th", { scope: "row" }, [
        h("span", { class: "ab-long", text: a + "-trained model" }), h("span", { class: "ab-short", text: a + " model" }),
      ])].concat(RADIOLOGISTS.map(function (b) {
        if (a === b) return h("td", { class: "ab-matrix-diag", "aria-label": "Not applicable" }, [h("span", { text: "—" })]);
        var r = find(a, b);
        var detected = r.reject[alphaKey];
        var key = r.A + "|" + r.B + "|" + r.C;
        var td = h("td", {
          class: "ab-matrix-cell" + (detected ? " is-detected" : "") +
            (state.highlight === key ? " is-highlight" : "") + (state.selected === key ? " is-selected" : ""),
          title: describeCell(r, alpha, alphaKey),
          "aria-label": describeCell(r, alpha, alphaKey),
        }, [
          h("span", { class: "ab-matrix-p", text: pCellText(r.p) }),
          thresholdSpan(r.p, alpha),
        ]);
        makeSelectable(td, function () { onSelect(key); });
        return td;
      })));
    }));

    // Narrow screens: the same cells grouped by model, one comparison per line.
    var list = h("div", { class: "ab-matrix-list" }, RADIOLOGISTS.map(function (a) {
      return h("div", { class: "ab-matrix-group" }, [h("div", { class: "ab-matrix-group-title", text: a + "-trained model" })].concat(
        RADIOLOGISTS.filter(function (b) { return b !== a; }).map(function (b) {
          var r = find(a, b);
          var key = r.A + "|" + r.B + "|" + r.C;
          var item = h("div", {
            class: "ab-matrix-item" + (r.reject[alphaKey] ? " is-detected" : "") +
              (state.highlight === key ? " is-highlight" : "") + (state.selected === key ? " is-selected" : ""),
            "aria-label": describeCell(r, alpha, alphaKey),
          }, [
            h("span", { class: "ab-matrix-item-who" }, [
              h("span", { class: "ab-matrix-item-main", text: "vs human " + r.B }),
              h("span", { class: "ab-matrix-thr", text: "external reference " + r.C }),
            ]),
            h("span", { class: "ab-matrix-item-p" }, [
              h("span", { class: "ab-matrix-p", text: pCellText(r.p) }),
              thresholdSpan(r.p, alpha),
            ]),
          ]);
          makeSelectable(item, function () { onSelect(key); });
          return item;
        })));
    }));

    return h("div", null, [h("table", { class: "ab-matrix" }, [head, body]), list]);
  }

  function describeCell(r, alpha, alphaKey) {
    if (r.p === null || r.p === undefined) {
      return r.A + "-trained model vs human " + r.B + ", external reference " + r.C +
        ": every paired term Z_i is zero, so the test does not apply.";
    }
    return r.A + "-trained model vs human " + r.B + ", external reference " + r.C + ": " + pEquals(r.p) +
      (r.p > 0.999 ? "" : " (" + thresholdText(r.p, alpha) + ")") +
      ", positive self-reference effect " + (r.reject[alphaKey] ? "detected." : "not detected.");
  }

  function matrixLegend() {
    return h("div", { class: "ab-matrix-legend" }, [
      h("span", null, [h("span", { class: "ab-swatch is-detected", "aria-hidden": "true" }), "Positive effect detected"]),
      h("span", null, [h("span", { class: "ab-swatch", "aria-hidden": "true" }), "Not detected"]),
    ]);
  }

  // ---------- Dot plots on the -log10(p) scale (Figures 1 and 2) ----------

  // Axis range of -log10(p); the smallest p-value in the data is about 2e-12.
  var NLP_MAX = 12;

  function nlp(p) { return Math.min(NLP_MAX, -Math.log10(Math.max(p, 1e-300))); }
  function nlpPos(v) { return (v / NLP_MAX * 100) + "%"; }

  function alphaLine(alpha) {
    return h("span", { class: "pd-alpha", style: "left:" + nlpPos(-Math.log10(alpha)) });
  }

  function nlpAxisRow() {
    return h("div", { class: "pd-row pd-axis-row", "aria-hidden": "true" }, [
      h("div", { class: "pd-label" }),
      h("div", { class: "pd-track" }, [0, 2, 4, 6, 8, 10, 12].map(function (t) {
        return h("span", { class: "ab-tick", style: "left:" + nlpPos(t), text: String(t) });
      })),
      h("div", { class: "pd-value" }),
    ]);
  }

  function nlpAxisTitle() {
    return h("div", { class: "pd-axis-title", html: "&minus;log<sub>10</sub>(p-value): further right means stronger evidence" });
  }

  function pdLegend(alpha) {
    return h("div", { class: "ab-matrix-legend pd-legend" }, [
      h("span", null, [h("span", { class: "pd-dot pd-dot-static is-detected", "aria-hidden": "true" }), "Positive effect detected"]),
      h("span", null, [h("span", { class: "pd-dot pd-dot-static", "aria-hidden": "true" }), "Not detected"]),
      h("span", null, [h("span", { class: "pd-alpha-static", "aria-hidden": "true" }), "Level " + alpha.toFixed(2)]),
    ]);
  }

  function initScalarMatrix(container) {
    var alpha = 0.01, alphaKey = "0.01";
    var state = { selected: null };
    var plot = h("div", { class: "pd-plot" });
    var detail = h("p", { class: "ab-detail", "aria-live": "polite" });

    function render() {
      plot.innerHTML = "";
      D.scalar.forEach(function (r) {
        var key = r.A + "|" + r.B + "|" + r.C;
        var dot = r.p === null || r.p === undefined ? null : h("span", {
          class: "pd-dot" + (r.reject[alphaKey] ? " is-detected" : ""),
          style: "left:" + nlpPos(nlp(r.p)),
        });
        var row = h("div", { class: "pd-row" + (state.selected === key ? " is-selected" : ""), title: describeCell(r, alpha, alphaKey), "aria-label": describeCell(r, alpha, alphaKey) }, [
          h("div", { class: "pd-label" }, [
            h("span", { class: "pd-main", text: r.A + "-trained model vs " + r.B }),
            h("span", { class: "pd-sub", text: "external reference " + r.C }),
          ]),
          h("div", { class: "pd-track" }, [alphaLine(alpha), dot]),
          h("div", { class: "pd-value", text: pCellText(r.p) }),
        ]);
        makeSelectable(row, function () { state.selected = state.selected === key ? null : key; render(); });
        plot.appendChild(row);
      });
      plot.appendChild(nlpAxisRow());
      plot.appendChild(nlpAxisTitle());
      var sel = D.scalar.filter(function (r) { return r.A + "|" + r.B + "|" + r.C === state.selected; })[0];
      detail.textContent = sel ? describeCell(sel, alpha, alphaKey) + " Select the row again to clear." : "Select a row to see its p-value and decision.";
    }

    container.innerHTML = "";
    container.appendChild(pdLegend(alpha));
    container.appendChild(plot);
    container.appendChild(detail);
    render();
  }

  // ---------- Part I: real Bernoulli Task I (matrix + change chart) ----------

  function initBernoulli(container, changeHost) {
    var data = D.bernoulli;
    var alphas = [{ value: "0.01", label: "0.01" }, { value: "0.05", label: "0.05" }, { value: "0.1", label: "0.10" }];
    // Individual findings only (the across-finding average, index -1, is not shown); start on Atelectasis.
    var findings = data.aspects.filter(function (a) { return a.index !== -1; });
    var start = findings.filter(function (a) { return a.name === "Atelectasis"; })[0] || findings[0];
    var state = { aspect: String(start.index), alpha: "0.05", selected: null, highlight: null };

    function aspectName() {
      var a = findings.filter(function (x) { return String(x.index) === state.aspect; })[0];
      return a ? a.name : "";
    }

    var aspectField = selectField("Finding",
      findings.map(function (a) { return { value: String(a.index), label: a.name }; }),
      state.aspect,
      function (v) { state.aspect = v; state.highlight = null; state.selected = null; render(); });
    var alphaField = segmentedField("Level", alphas, state.alpha,
      function (v) { state.alpha = v; render(); });

    var lead = h("p", { class: "ab-lead", "aria-live": "polite" });
    var legendHost = h("div");
    var strip = h("div", { class: "pd-plot pd-strip" });
    var listHost = h("div", { class: "ab-scroll" });
    var detail = h("p", { class: "ab-detail", "aria-live": "polite" });

    container.innerHTML = "";
    container.appendChild(h("div", { class: "ab-controls" }, [aspectField.field, alphaField.field]));
    container.appendChild(lead);
    container.appendChild(legendHost);
    container.appendChild(strip);
    container.appendChild(listHost);
    container.appendChild(detail);

    var chart = changeHost ? initChangeChart(changeHost) : null;

    // One row per finding, one dot per comparison; the selected finding is highlighted.
    function renderStrip(alpha) {
      strip.innerHTML = "";
      findings.forEach(function (f) {
        var key = String(f.index);
        var rs = data.rows[key];
        var current = key === state.aspect;
        var hits = rs.filter(function (r) { return r.reject[state.alpha]; }).length;
        var dots = rs.filter(function (r) { return r.p !== null && r.p !== undefined; }).map(function (r) {
          var k = r.A + "|" + r.B + "|" + r.C;
          return h("span", {
            class: "pd-dot is-small" + (r.reject[state.alpha] ? " is-detected" : "") + (current && state.highlight === k ? " is-highlight" : ""),
            style: "left:" + nlpPos(nlp(r.p)),
            title: f.name + ": " + describeCell(r, alpha, state.alpha),
          });
        });
        var row = h("div", { class: "pd-row pd-strip-row" + (current ? " is-current" : ""), "aria-label": f.name + ": detected in " + hits + " of 6 comparisons" }, [
          h("div", { class: "pd-label", text: f.name }),
          h("div", { class: "pd-track" }, [alphaLine(alpha)].concat(dots)),
          h("div", { class: "pd-value", text: hits + " of 6" }),
        ]);
        makeSelectable(row, function () { state.aspect = key; state.highlight = null; state.selected = null; render(); });
        strip.appendChild(row);
      });
      strip.appendChild(nlpAxisRow());
      strip.appendChild(nlpAxisTitle());
    }

    // The six p-values of the selected finding.
    function renderList(rows, alpha) {
      var trs = rows.map(function (r) {
        var key = r.A + "|" + r.B + "|" + r.C;
        var tr = h("tr", { class: (r.reject[state.alpha] ? "is-cert" : "") + (state.highlight === key || state.selected === key ? " is-selected" : "") }, [
          cell(r.A + "-trained model vs " + r.B),
          cell(r.C),
          cell(pCellText(r.p) + (r.p !== null && r.p !== undefined && r.p < alpha ? " (" + thresholdText(r.p, alpha) + ")" : ""), true),
        ]);
        makeSelectable(tr, function () { state.selected = state.selected === key ? null : key; render(); });
        return tr;
      });
      listHost.innerHTML = "";
      listHost.appendChild(makeTable([{ label: "Comparison" }, { label: "External reference" }, { label: "p-value", num: true }], trs, "ab-inspect-table pd-list"));
    }

    function render() {
      aspectField.select.value = state.aspect;
      alphaField.sync(state.alpha);
      var rows = data.rows[state.aspect];
      var alpha = parseFloat(state.alpha);

      var detected = rows.filter(function (r) { return r.reject[state.alpha]; }).length;
      lead.textContent = aspectName() + ": a positive self-reference effect is detected in " + detected + " of 6 comparisons at level " +
        alpha.toFixed(2) + ".";

      legendHost.innerHTML = "";
      legendHost.appendChild(pdLegend(alpha));
      renderStrip(alpha);
      renderList(rows, alpha);
      var sel = rows.filter(function (r) { return r.A + "|" + r.B + "|" + r.C === state.selected; })[0];
      detail.textContent = sel ? describeCell(sel, alpha, state.alpha) + " Select the row again to clear." : "Select a finding in the plot, or a comparison in the table, for details.";

      if (chart) chart.render(rows, aspectName(), state.highlight);
    }

    render();

    return {
      set: function (opts) {
        if (opts.aspect) {
          var a = findings.filter(function (x) { return x.name === opts.aspect; })[0];
          if (a) state.aspect = String(a.index);
        }
        if (opts.alpha) state.alpha = opts.alpha;
        state.highlight = opts.highlight || null;
        state.selected = opts.highlight || null;
        render();
      },
    };
  }

  // Figure 3: for each comparison, who has the lower Brier score under each
  // reference (dSelf = model minus human when judged by the training
  // radiologist, dExt = the same when judged by the external radiologist).
  function initChangeChart(container) {
    var lead = h("p", { class: "ab-lead", "aria-live": "polite" });
    var legend = h("div", { class: "ab-matrix-legend" }, [
      h("span", null, [h("span", { class: "ab-swatch is-model", "aria-hidden": "true" }), "Model better"]),
      h("span", null, [h("span", { class: "ab-swatch is-human", "aria-hidden": "true" }), "Human better"]),
    ]);
    var tableHost = h("div", { class: "ab-scroll" });

    container.innerHTML = "";
    container.appendChild(lead);
    container.appendChild(legend);
    container.appendChild(tableHost);

    function verdictCell(d) {
      var model = d < 0;
      var text = (model ? "Model" : "Human") + " better by " + sigN(Math.abs(d), 2);
      return h("td", { class: "ab-verdict-cell " + (model ? "is-model" : "is-human"), text: text });
    }

    function render(rows, name, highlight) {
      var reversals = rows.filter(function (r) { return (r.dSelf < 0) !== (r.dExt < 0); }).length;
      lead.textContent = name + ": the better performer changes in " + reversals + " of 6 comparisons when the external radiologist replaces the training radiologist as the reference.";

      var head = h("thead", null, [h("tr", null, [
        h("th", { scope: "col", text: "Comparison" }),
        h("th", { scope: "col" }, [h("span", { class: "ab-long", text: "Judged by the training radiologist" }), h("span", { class: "ab-short", text: "Training ref." })]),
        h("th", { scope: "col" }, [h("span", { class: "ab-long", text: "Judged by the external radiologist" }), h("span", { class: "ab-short", text: "External ref." })]),
        h("th", { scope: "col", text: "Better performer" }),
      ])]);
      var body = h("tbody", null, rows.map(function (r) {
        var key = r.A + "|" + r.B + "|" + r.C;
        var reversed = (r.dSelf < 0) !== (r.dExt < 0);
        return h("tr", { class: (highlight === key ? "is-highlight" : null) }, [
          h("th", { scope: "row" }, [
            h("span", { class: "ab-verdict-main", text: r.A + "-trained model vs " + r.B }),
            h("span", { class: "ab-verdict-sub", text: "references: " + r.A + " → " + r.C }),
          ]),
          verdictCell(r.dSelf),
          verdictCell(r.dExt),
          h("td", { class: "ab-verdict-flag" + (reversed ? " is-reversed" : ""), text: reversed ? "Reversed" : "Unchanged" }),
        ]);
      }));
      tableHost.innerHTML = "";
      tableHost.appendChild(h("table", { class: "ab-verdict" }, [head, body]));
    }

    return { render: render };
  }

  // ---------- Part II: continuous Task II heatmap ----------

  function initContinuousHeatmap(container) {
    var grid = D.continuous.byKProb;
    var probs = ["0.01", "0.05", "0.1", "0.2"];
    var Ks = [2, 3, 4];
    var selected = null;
    var detail = h("p", { class: "ab-detail", "aria-live": "polite" });
    var tableHost = h("div", { class: "ab-scroll" });

    function cellFor(K, p) {
      return grid.filter(function (g) { return g.K === K && g.prob === p; })[0];
    }

    function describe(g) {
      return "K = " + g.K + ", total error budget " + probLabel(g.prob) + ": " + g.hits + " of " + g.n +
        " configurations certified (" + fmtPct(g.pct) + ").";
    }

    function render() {
      var head = h("thead", null, [
        h("tr", null, [h("th", { scope: "col" }), h("th", { colspan: "4", class: "ab-heat-group", scope: "colgroup", text: "Total error budget" })]),
        h("tr", null, [h("th", { scope: "col" })].concat(probs.map(function (p) { return h("th", { scope: "col", text: probLabel(p) }); }))),
      ]);
      var body = h("tbody", null, Ks.map(function (K) {
        return h("tr", null, [h("th", { scope: "row", html: "<i>K</i> = " + K })].concat(probs.map(function (p) {
          var g = cellFor(K, p);
          var key = K + "|" + p;
          var btn = h("button", {
            type: "button",
            class: "ab-heat-cell" + (selected === key ? " is-selected" : ""),
            style: "background:" + heatColor(g.pct, heatStopsFor(container)) + ";color:" + heatText(g.pct),
            title: describe(g),
            "aria-label": describe(g),
            "aria-pressed": selected === key ? "true" : "false",
            text: fmtPct(g.pct),
          });
          btn.addEventListener("click", function () { selected = selected === key ? null : key; render(); });
          // Hovering or focusing a cell shows its count without selecting it.
          ["mouseenter", "focus"].forEach(function (ev) {
            btn.addEventListener(ev, function () { detail.textContent = describe(g); });
          });
          ["mouseleave", "blur"].forEach(function (ev) {
            btn.addEventListener(ev, showSelected);
          });
          return h("td", null, [btn]);
        })));
      }));
      tableHost.innerHTML = "";
      tableHost.appendChild(h("table", { class: "ab-heatmap" }, [head, body]));
      showSelected();
    }

    function showSelected() {
      if (selected) {
        var parts = selected.split("|");
        detail.textContent = describe(cellFor(parseInt(parts[0], 10), parts[1])) + CLEAR_HINT;
      } else {
        detail.textContent = "Hover over or select a cell to see its count.";
      }
    }

    container.innerHTML = "";
    container.appendChild(tableHost);
    container.appendChild(heatLegend("Certification rate", heatStopsFor(container)));
    container.appendChild(detail);
    render();
  }

  // ---------- Part II: inspect one continuous comparison ----------

  function initContinuousInspect(container) {
    var configs = D.continuous.configs;
    var probs = [{ value: "0.01", label: "0.01" }, { value: "0.05", label: "0.05" }, { value: "0.1", label: "0.10" }, { value: "0.2", label: "0.20" }];
    var annotators = [];
    configs.forEach(function (c) {
      if (annotators.indexOf(c.A) === -1) annotators.push(c.A);
      if (annotators.indexOf(c.B) === -1) annotators.push(c.B);
    });
    annotators.sort();
    var pairs = [];
    annotators.forEach(function (a) {
      annotators.forEach(function (b) {
        if (a !== b) pairs.push({ value: a + "|" + b, label: a + "-trained model vs " + b });
      });
    });

    var state = { pair: "R13|R11", prob: "0.05", selected: null };
    var pairField = selectField("Comparison", pairs, state.pair,
      function (v) { state.pair = v; state.selected = null; render(); });
    var probField = segmentedField("Total error budget", probs, state.prob,
      function (v) { state.prob = v; render(); });
    var summary = h("p", { class: "ab-lead" });
    var tableHost = h("div", { class: "ab-scroll" });
    var explain = h("p", { class: "ab-detail", "aria-live": "polite" });

    container.innerHTML = "";
    container.appendChild(h("div", { class: "ab-controls" }, [pairField.field, probField.field]));
    container.appendChild(summary);
    container.appendChild(tableHost);
    container.appendChild(explain);

    function panelsForPair() {
      var ab = state.pair.split("|");
      return configs.filter(function (c) { return c.A === ab[0] && c.B === ab[1]; })
        .sort(function (x, y) { return x.K - y.K || (x.refs < y.refs ? -1 : 1); });
    }

    function render() {
      probField.sync(state.prob);
      var panels = panelsForPair();
      if (!state.selected && panels.length) state.selected = panels[panels.length - 1].refs;
      var certified = panels.filter(function (p) { return p.byProb[state.prob].cert; }).length;
      summary.textContent = certified + " of " + panels.length + " reference panels are certified (✓) at total error budget " + probLabel(state.prob) + ".";

      var trs = [];
      var lastK = null;
      panels.forEach(function (p) {
        if (p.K !== lastK) {
          var nK = panels.filter(function (q) { return q.K === p.K; }).length;
          trs.push(h("tr", { class: "ab-group-row" }, [h("th", { colspan: "3", text: p.K + " references · " + nK + (nK === 1 ? " panel" : " panels") })]));
          lastK = p.K;
        }
        var r = p.byProb[state.prob];
        var cls = (r.cert ? "is-cert" : "") + (p.refs === state.selected ? " is-selected" : "");
        var tr = h("tr", { class: cls || null, "aria-label": p.refs + (r.cert ? ": certified" : ": not certified") }, [
          cell((r.cert ? "✓ " : "") + p.refs),
          cell(sciGap(p.absDelta), true),
          cell(sciGap(r.bound), true),
        ]);
        makeSelectable(tr, function () { state.selected = p.refs; render(); });
        trs.push(tr);
      });
      tableHost.innerHTML = "";
      tableHost.appendChild(makeTable([
        { label: "Reference panel" },
        { label: "Observed gap", num: true },
        { label: "Required gap", num: true },
      ], trs, "ab-inspect-table"));

      var sel = panels.filter(function (p) { return p.refs === state.selected; })[0];
      if (!sel) {
        explain.textContent = "";
        return;
      }
      var r = sel.byProb[state.prob];
      var head = "Panel " + sel.refs + " at total error budget " + probLabel(state.prob) + ": ";
      if (r.cert) {
        explain.textContent = head + "the observed gap " + sciGap(sel.absDelta) + " exceeds the required gap " +
          sciGap(r.bound) + ", so the reference is certified.";
      } else {
        explain.textContent = head + "the observed gap " + sciGap(sel.absDelta) + " does not exceed the required gap " +
          sciGap(r.bound) + ", so the reference is not certified.";
      }
    }

    render();
  }

  // ---------- Part III: synthetic Bernoulli Task II ----------

  function initSynthetic(container, allHost) {
    var syn = D.synthetic;
    var Ks = ["16", "24", "32"];
    var probs = [{ value: "0.10", label: "0.10" }, { value: "0.15", label: "0.15" }, { value: "0.20", label: "0.20" }];
    var rib = syn.aspects.filter(function (a) { return a.name === "Rib fracture"; })[0] || syn.aspects[0];
    var state = { aspect: String(rib.index), prob: "0.20", selectedK: null };

    var aspectField = selectField("Finding",
      syn.aspects.map(function (a) { return { value: String(a.index), label: a.name }; }),
      state.aspect,
      function (v) { state.aspect = v; render(); });
    var probField = segmentedField("Total error budget", probs, state.prob,
      function (v) { state.prob = v; render(); });

    var lead = h("p", { class: "ab-lead", "aria-live": "polite" });
    var chartHost = h("div", { class: "lc-host" });
    var detail = h("p", { class: "ab-detail", "aria-live": "polite" });
    var caption = h("p", { class: "ab-caption" });

    container.innerHTML = "";
    container.appendChild(h("div", { class: "ab-controls" }, [aspectField.field, probField.field]));
    container.appendChild(lead);
    container.appendChild(chartHost);
    container.appendChild(detail);
    container.appendChild(caption);

    function aspectName(aspect) {
      if (aspect === "avg") return "Average across 27 findings";
      var a = syn.aspects.filter(function (x) { return String(x.index) === aspect; })[0];
      return a ? a.name : "";
    }

    function valueFor(aspect, K) {
      if (aspect === "avg") {
        var sumPct = 0, r = 0, n = 0, count = 0;
        Object.keys(syn.cells).forEach(function (i) {
          var c = syn.cells[i][K][state.prob];
          sumPct += c.pct; r += c.r; n += c.n; count += 1;
        });
        return { pct: sumPct / count, r: r, n: n, unit: "finding–trial decisions" };
      }
      var c = syn.cells[aspect][K][state.prob];
      return { pct: c.pct, r: c.r, n: c.n, unit: "trials" };
    }

    function valueAt(K, prob) {
      var saved = state.prob;
      state.prob = prob;
      var v = valueFor(state.aspect, K);
      state.prob = saved;
      return v;
    }

    function describe(K, prob) {
      prob = prob || state.prob;
      var v = valueAt(K, prob);
      var text = aspectName(state.aspect) + ", K = " + K + " at total error budget " + probLabel(prob) + ": " + fmtInt(v.r) + " of " +
        fmtInt(v.n) + " " + v.unit + " certified (" + fmtPct(v.pct) + ").";
      if (state.aspect !== "avg") {
        var c = syn.cells[state.aspect][K][prob];
        text += " On average over the trials, the estimated gap is " + c.gap.toFixed(3) + " and the right side of the certification rule is " + c.rhs.toFixed(3) + ".";
      }
      return text;
    }

    // Certification rate against K, one line per total error budget; the
    // selected budget is drawn thicker. Hovering a point shows its count.
    var SVGNS = "http://www.w3.org/2000/svg";
    function svg(tag, attrs, children) {
      var el = document.createElementNS(SVGNS, tag);
      Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      (children || []).forEach(function (c) { if (c) el.appendChild(c); });
      return el;
    }

    function renderLines() {
      var W = 600, H = 300, L = 56, R = 86, T = 14, B = 46;
      function x(i) { return L + i * (W - L - R) / (Ks.length - 1); }
      function y(pct) { return T + (1 - pct / 100) * (H - T - B); }
      var root = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "lc-svg", role: "img",
        "aria-label": "Certification rate for " + aspectName(state.aspect) + " against the number of reference annotators K, one line per total error budget." });
      [0, 25, 50, 75, 100].forEach(function (t) {
        root.appendChild(svg("line", { class: "lc-grid", x1: L, x2: W - R, y1: y(t), y2: y(t) }));
        var lab = svg("text", { class: "lc-tick", x: L - 8, y: y(t) + 4, "text-anchor": "end" });
        lab.textContent = t + "%";
        root.appendChild(lab);
      });
      Ks.forEach(function (K, i) {
        var lab = svg("text", { class: "lc-tick", x: x(i), y: H - B + 20, "text-anchor": "middle" });
        lab.textContent = "K = " + K;
        root.appendChild(lab);
      });
      var xt = svg("text", { class: "lc-axis-title", x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle" });
      xt.textContent = "Number of reference annotators";
      root.appendChild(xt);

      probs.forEach(function (p, j) {
        var isSel = p.value === state.prob;
        var pts = Ks.map(function (K, i) { return { K: K, i: i, v: valueAt(K, p.value) }; });
        var g = svg("g", { class: "lc-series lc-series-" + j + (isSel ? " is-selected" : "") });
        g.appendChild(svg("polyline", { class: "lc-line", points: pts.map(function (q) { return x(q.i) + "," + y(q.v.pct); }).join(" ") }));
        pts.forEach(function (q) {
          var c = svg("circle", { class: "lc-pt", cx: x(q.i), cy: y(q.v.pct), r: isSel ? 5.5 : 4, tabindex: "0" });
          var tip = svg("title");
          tip.textContent = describe(q.K, p.value);
          c.appendChild(tip);
          c.addEventListener("mouseenter", function () { detail.textContent = describe(q.K, p.value); });
          c.addEventListener("focus", function () { detail.textContent = describe(q.K, p.value); });
          c.addEventListener("mouseleave", showDetail);
          c.addEventListener("blur", showDetail);
          c.addEventListener("click", function () { state.prob = p.value; state.selectedK = q.K; render(); });
          g.appendChild(c);
        });
        var last = pts[pts.length - 1];
        var lab = svg("text", { class: "lc-label", x: x(last.i) + 10, y: y(last.v.pct) + 4 });
        lab.textContent = "\u03b1 = " + p.label;
        g.appendChild(lab);
        root.appendChild(g);
      });
      chartHost.innerHTML = "";
      chartHost.appendChild(root);
    }

    function showDetail() {
      detail.textContent = state.selectedK ? describe(state.selectedK) : "Hover over or select a point to see its count.";
    }

    function render() {
      aspectField.select.value = state.aspect;
      probField.sync(state.prob);
      var vals = Ks.map(function (K) { return valueFor(state.aspect, K); });

      lead.textContent = aspectName(state.aspect) + " at total error budget " + probLabel(state.prob) + ": the certification rate is " +
        fmtPct(vals[0].pct) + " with K = 16, " + fmtPct(vals[1].pct) + " with K = 24, and " + fmtPct(vals[2].pct) + " with K = 32.";

      renderLines();
      showDetail();
      caption.textContent = "Percentage of the 120 trials in which the test certifies the reference.";

      renderAll();
    }

    function renderAll() {
      if (!allHost) return;
      var head = h("thead", null, [h("tr", null, [h("th", { scope: "col", text: "Finding" })].concat(Ks.map(function (K) {
        return h("th", { scope: "col", html: "<i>K</i> = " + K });
      })))]);
      var body = h("tbody", null, syn.aspects.map(function (a) {
        var key = String(a.index);
        var tr = h("tr", { class: key === state.aspect ? "is-selected" : null }, [h("th", { scope: "row", text: a.name })].concat(Ks.map(function (K) {
          var c = syn.cells[key][K][state.prob];
          return h("td", null, [h("span", {
            class: "ab-heat-cell",
            style: "background:" + heatColor(c.pct, heatStopsFor(allHost)) + ";color:" + heatText(c.pct),
            title: a.name + ", K = " + K + ": " + c.r + " of " + c.n + " trials certified",
            text: fmtPct(c.pct),
          })]);
        })));
        makeSelectable(tr, function () {
          state.aspect = key;
          render();
          container.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
        });
        return tr;
      }));
      allHost.innerHTML = "";
      allHost.appendChild(h("div", { class: "ab-scroll" }, [h("table", { class: "ab-heatmap ab-heatmap-aspects" }, [head, body])]));
      allHost.appendChild(heatLegend("Certification rate", heatStopsFor(allHost)));
    }

    render();

    return {
      set: function (opts) {
        if (opts.aspect) {
          var a = syn.aspects.filter(function (x) { return x.name === opts.aspect; })[0];
          if (a) state.aspect = String(a.index);
        }
        if (opts.prob) state.prob = opts.prob;
        render();
      },
    };
  }

  // ---------- Introduction: the reference decides who looks better ----------

  // One image x with latent truth Y*(x) = 0 and no annotation noise. Annotator A
  // labels Y_A = b_A, the model predicts Y_A + e_A, and annotator B labels b_B.
  // Errors are distances to the reference: A (Equation 1) or the truth (Equation 2).
  function initIntroBias(container) {
    var LEARN_ERR = 0.1;  // the model's learning error e_A(x)
    var B_BIAS = 0.3;     // annotator B's bias b_B(x)
    var AXIS_MIN = -1, AXIS_MAX = 1, ERR_MAX = 1.2;
    var bA = 0;

    function pos(v) { return ((v - AXIS_MIN) / (AXIS_MAX - AXIS_MIN) * 100) + "%"; }
    function num(v) { return (v < 0 ? "\u2212" : "") + Math.abs(v).toFixed(2); }

    var inputId = nextId("ab-range");
    var input = h("input", { id: inputId, type: "range", min: "-0.8", max: "0.8", step: "0.05", value: "0" });
    var output = h("output", { class: "ib-value", for: inputId });
    var controls = h("div", { class: "ab-controls" }, [h("div", { class: "ab-field ib-field" }, [
      h("label", { for: inputId, html: "Bias of annotator A, <i>b</i><sub>A</sub>(<i>x</i>)" }), input, output,
    ])]);
    var status = h("p", { class: "ab-lead ib-status", "aria-live": "polite" });

    var dots = {};
    var lanes = h("div", { class: "ib-lanes" }, [
      { key: "truth", label: "Latent truth <i>Y</i><sup>*</sup>(<i>x</i>)" },
      { key: "a", label: "Annotator A, <i>Y</i><sub>A</sub>(<i>x</i>)" },
      { key: "model", label: "Model, <i>\u0176</i><sub>A</sub>(<i>x</i>)" },
      { key: "b", label: "Annotator B, <i>Y</i><sub>B</sub>(<i>x</i>)" },
    ].map(function (l) {
      dots[l.key] = h("span", { class: "ib-dot is-" + l.key });
      return h("div", { class: "ib-lane" }, [
        h("div", { class: "ib-lane-label", html: l.label }),
        h("div", { class: "ib-track" }, [h("span", { class: "ib-truth-line", style: "left:" + pos(0) }), dots[l.key]]),
      ]);
    }).concat([h("div", { class: "ib-lane ib-axis", "aria-hidden": "true" }, [
      h("div", { class: "ib-lane-label" }),
      h("div", { class: "ib-track" }, [-1, -0.5, 0, 0.5, 1].map(function (t) {
        return h("span", { class: "ab-tick", style: "left:" + pos(t), text: (t < 0 ? "\u2212" : "") + Math.abs(t) });
      })),
    ])]));

    function panel(title, sub) {
      var fills = [h("span", { class: "ib-fill is-model" }), h("span", { class: "ib-fill is-human" })];
      var vals = [h("span", { class: "ib-num" }), h("span", { class: "ib-num" })];
      var verdict = h("p", { class: "ib-verdict" });
      var el = h("div", { class: "ib-panel" }, [
        h("div", { class: "ib-panel-title", text: title }),
        h("div", { class: "ib-panel-sub", html: sub }),
        h("div", { class: "ib-bar-row" }, [h("span", { text: "Model" }), h("span", { class: "ib-bar" }, [fills[0]]), vals[0]]),
        h("div", { class: "ib-bar-row" }, [h("span", { text: "Annotator B" }), h("span", { class: "ib-bar" }, [fills[1]]), vals[1]]),
        verdict,
      ]);
      function set(modelErr, humanErr) {
        [modelErr, humanErr].forEach(function (e, i) {
          fills[i].style.width = Math.min(100, e / ERR_MAX * 100) + "%";
          vals[i].textContent = e.toFixed(2);
        });
        var winner = Math.abs(modelErr - humanErr) < 1e-9 ? "tie" : modelErr < humanErr ? "model" : "human";
        verdict.className = "ib-verdict is-" + winner;
        verdict.textContent = winner === "tie" ? "Tie" : winner === "model" ? "The model looks better" : "Annotator B looks better";
        return winner;
      }
      return { el: el, set: set };
    }

    var selfRef = panel("Annotator A as reference", "Errors measured against <i>Y</i><sub>A</sub>(<i>x</i>), as in Equation 1");
    var truthRef = panel("Latent truth as reference", "Errors measured against <i>Y</i><sup>*</sup>(<i>x</i>), as in Equation 2");

    container.innerHTML = "";
    container.appendChild(controls);
    container.appendChild(status);
    container.appendChild(lanes);
    container.appendChild(h("div", { class: "ib-panels" }, [selfRef.el, truthRef.el]));

    function render() {
      var yA = bA, yModel = bA + LEARN_ERR, yB = B_BIAS;
      output.textContent = num(bA);
      dots.truth.style.left = pos(0);
      dots.a.style.left = pos(yA);
      dots.model.style.left = pos(yModel);
      dots.b.style.left = pos(yB);
      var self = selfRef.set(Math.abs(yModel - yA), Math.abs(yB - yA));
      var truth = truthRef.set(Math.abs(yModel), Math.abs(yB));
      var flip = self !== truth && self !== "tie" && truth !== "tie";
      status.classList.toggle("is-flip", flip);
      status.textContent = flip
        ? "The conclusion flips: against annotator A " + (self === "model" ? "the model" : "annotator B") +
          " looks better, but against the latent truth " + (truth === "model" ? "the model" : "annotator B") + " does."
        : self === "tie" || truth === "tie"
          ? "One of the two comparisons is a tie at this bias."
          : "Both references favor " + (self === "model" ? "the model." : "annotator B.");
    }

    input.addEventListener("input", function () {
      bA = parseFloat(input.value);
      render();
    });
    render();
  }

  // ---------- Hover definitions for the main symbols ----------

  // Keys are the TeX source with spaces and braces removed and trailing
  // punctuation dropped; `parts` limits a definition to Part tabs (0, 1, 2)
  // where it holds. Definitions follow the wording of the article.
  var SYMBOLS = {
    "\\mu^*": { parts: [0, 1], html: "<b>Latent target</b>: the population-average score on each item; not observed." },
    "\\widehat\\mu_A": { html: "<b>The model</b>: a prediction rule fitted to annotator A's labels." },
    "\\Delta_R": { parts: [0], html: "<b>MSE gap</b> with annotator R as the evaluation reference: the model's MSE minus annotator B's MSE, both against R. A negative gap favors the model." },
    "\\Delta_A": { parts: [0], html: "<b>MSE gap under self-reference</b>: the reference is the training annotator A." },
    "\\Delta_C": { parts: [0], html: "<b>MSE gap under an external reference</b>: the reference is an annotator C distinct from A and B." },
    "S_A,C": { parts: [0], html: "<b>Self-reference effect</b>: the change in the MSE gap when C replaces A as the reference, <i>S</i><sub>A,C</sub> = &Delta;<sub>C</sub> &minus; &Delta;<sub>A</sub>. A positive value means self-reference favors the model." },
    "\\widehatS_A,C": { parts: [0], html: "<b>Estimate of the self-reference effect</b> <i>S</i><sub>A,C</sub> on the evaluation images." },
    "\\Delta^*": { parts: [1, 2], html: "<b>Latent gap</b>: the gap against the latent target &mu;<sup>*</sup>. Its sign decides whether the model or annotator B is closer to &mu;<sup>*</sup>." },
    "\\widehat\\mu_\\mathcalR": { parts: [1, 2], html: "<b>Evaluation reference</b>: the average of the surrogate predictors of the <i>K</i> reference annotators." },
    "\\widehat\\mu_r": { parts: [1, 2], html: "<b>Surrogate predictor</b> of annotator <i>r</i>: a model trained on <i>r</i>'s labels, whose predictions stand in for <i>r</i>'s labels on the evaluation images." },
    "\\Delta_\\widehat\\mathcalR": { parts: [1, 2], html: "<b>Gap against the evaluation reference</b>: the gap with the evaluation reference in place of the latent target &mu;<sup>*</sup>." },
    "g_\\widehat\\mathcalR": { parts: [1, 2], html: "<b>Reference distortion</b>: replacing &mu;<sup>*</sup> with the evaluation reference changes the gap by &minus;2<i>g</i>." },
    "B_\\mathcalR": { parts: [1], html: "<b>Bound on |<i>g</i>|</b> for aggregate scores: |<i>g</i>| &le; <i>B</i><sub>&#x211B;</sub> with probability at least 1 &minus; &alpha;<sub>g</sub> &minus; &gamma; + o(1)." },
    "B_\\mathcalR^\\mathrmBern": { parts: [2], html: "<b>Bound on |<i>g</i>|</b> for binary labels: |<i>g</i>| &le; <i>B</i><sub>&#x211B;</sub><sup>Bern</sup> with probability at least 1 &minus; &alpha;<sub>g</sub> &minus; &gamma; + o(1)." },
    "K": { parts: [1, 2], html: "<b>Number of reference annotators.</b>" },
    "\\tau_g": { parts: [1], html: "<b>Scale of the distortion</b> under the Gaussian assumption <i>g</i> ~ N(0, &tau;<sub>g</sub><sup>2</sup>) for each annotator." },
    "U_g": { parts: [1], html: "<b>Upper confidence bound</b> for &tau;<sub>g</sub>, with Pr(&tau;<sub>g</sub> &le; <i>U</i><sub>g</sub>) &ge; 1 &minus; &gamma; + o(1)." },
    "\\tau": { parts: [2], html: "<b>Standard deviation of the logit offsets</b> <i>C</i><sub>r</sub> across annotators." },
    "U_\\tau": { parts: [2], html: "<b>Upper confidence bound</b> for &tau;, with Pr(&tau; &le; <i>U</i><sub>&tau;</sub>) &ge; 1 &minus; &gamma; + o(1)." },
    "\\kappa": { parts: [2], html: "<b>Sensitivity parameter</b> of the bounded item-dependent variation assumption; it cannot be obtained by calibration and must be specified in advance." },
    "\\rho": { parts: [2], html: "&rho; = (<i>N</i> + 1)/(<i>n</i><sub>1</sub> + 1), where <i>N</i> is the number of images in <i>D</i><sub>1</sub> on which the model and annotator B disagree." },
    "D_1": { parts: [1, 2], html: "<b>Evaluation set</b>: <i>n</i><sub>1</sub> images labeled by B, on which the gap is estimated." },
    "D_2": { parts: [1, 2], html: "<b>Calibration set</b>: <i>n</i><sub>2</sub> images labeled by B, on which the bound on |<i>g</i>| is calibrated." },
  };

  function symbolKey(tex) {
    return tex.replace(/[\s{}]/g, "").replace(/[.,;:]+$/, "");
  }

  function partIndexOf(el) {
    var pane = el.closest("#research-parts > .tab-content > .tab-pane");
    return pane ? Array.prototype.indexOf.call(pane.parentNode.children, pane) : -1;
  }

  // A symbol gets a hover definition only where the reader has not seen it for
  // a while: at least SYMBOL_GAP paragraphs after its previous mention, or its
  // first mention in a Part tab. Its first mention overall (usually where it is
  // defined) gets none. Folded callouts are skipped: they neither count as a
  // mention nor get definitions.
  var SYMBOL_GAP = 12;

  function initSymbolNotes() {
    if (!window.tippy || !window.MathJax || !MathJax.startup || !MathJax.startup.document) return;
    var content = document.getElementById("quarto-document-content");
    if (!content) return;
    var blocks = Array.prototype.filter.call(content.querySelectorAll("p, li"), function (b) {
      return !b.closest(".callout, .tippy-box, #refs, .column-margin");
    });
    var items = Array.from(MathJax.startup.document.math).filter(function (item) {
      var root = item.typesetRoot;
      return root && root.isConnected && !root.closest(".callout, .tippy-box, #refs, .column-margin");
    }).map(function (item) {
      var root = item.typesetRoot;
      var block = root.closest("p, li");
      return { item: item, root: root, tex: symbolKey(String(item.math)), block: blocks.indexOf(block), part: partIndexOf(root) };
    }).filter(function (m) { return m.block !== -1; });
    items.sort(function (a, b) { return a.block - b.block || (a.root.compareDocumentPosition(b.root) & 2 ? 1 : -1); });

    var last = {};  // symbol key -> {block, part} of its previous mention
    items.forEach(function (m) {
      var key = SYMBOLS[m.tex] ? m.tex : m.tex.replace(/\((x|X)\)$/, "");
      var def = !m.item.display && SYMBOLS[key];
      var prev = def ? last[key] : null;
      var stale = prev && (prev.part !== m.part || m.block - prev.block >= SYMBOL_GAP);
      // Record every symbol this formula mentions, standalone or inside it.
      Object.keys(SYMBOLS).forEach(function (k) {
        if (m.tex.indexOf(k) !== -1) last[k] = { block: m.block, part: m.part };
      });
      if (!def || !stale) return;
      if (def.parts && def.parts.indexOf(m.part) === -1) return;
      var root = m.root;
      root.classList.add("has-def");
      window.tippy(root, {
        content: def.html,
        allowHTML: true,
        theme: "quarto",
        maxWidth: 360,
        placement: "top",
        delay: [120, 0],
        appendTo: function () { return document.body; },
      });
    });
  }

  window.addEventListener("load", function () {
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(initSymbolNotes);
  });

  // ---------- wiring ----------

  function widget(name) {
    return document.querySelector('.ab-widget[data-widget="' + name + '"]');
  }

  function init() {
    var el;
    if ((el = widget("intro-bias"))) initIntroBias(el);
    if ((el = widget("scalar-matrix"))) initScalarMatrix(el);
    if ((el = widget("bernoulli-task1"))) controllers["bernoulli-task1"] = initBernoulli(el, widget("bernoulli-change"));
    if ((el = widget("continuous-heatmap"))) initContinuousHeatmap(el);
    if ((el = widget("continuous-inspect"))) initContinuousInspect(el);
    if ((el = widget("synthetic-task2"))) controllers["synthetic-task2"] = initSynthetic(el, widget("synthetic-all-aspects"));

    document.querySelectorAll("a.ab-instance-link").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var ctrl = controllers[link.getAttribute("data-target")];
        if (!ctrl) return;
        e.preventDefault();
        ctrl.set({
          aspect: link.getAttribute("data-aspect"),
          alpha: link.getAttribute("data-alpha"),
          highlight: link.getAttribute("data-highlight"),
        });
        var target = document.getElementById(link.getAttribute("href").slice(1));
        if (target) target.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
