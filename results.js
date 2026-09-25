// Interactive result components for annotation-bias.qmd.
// Reads window.ANNO_RESULTS (data/results-data.js, built by
// data/extract_from_dump.py) and replaces each static fallback in a
// `.ab-widget[data-widget=...]` container with its interactive version.
// Display values are rounded here; every decision comes from the unrounded data.
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

  function sci(x) {
    var e = Math.floor(Math.log10(Math.abs(x)));
    var m = (x / Math.pow(10, e)).toFixed(2);
    if (Math.abs(parseFloat(m)) >= 10) {
      e += 1;
      m = (x / Math.pow(10, e)).toFixed(2);
    }
    return minus(m) + " × 10" + supExp(e);
  }

  // p-values: small ones in scientific notation, ones close to 1 with enough
  // digits that they do not collapse to 1, otherwise three significant digits.
  function fmtP(p) {
    if (p === null || p === undefined) return "Not available";
    if (p < 0.001) return sci(p);
    if (p > 0.99) {
      for (var d = 6; d < 12; d++) {
        var s = p.toFixed(d);
        if (s !== (1).toFixed(d)) return s;
      }
      return "1";
    }
    return p.toPrecision(3);
  }

  function thresholdText(p, alpha) {
    return p < alpha ? "p < " + alpha.toFixed(2) : "p ≥ " + alpha.toFixed(2);
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

  // Light-to-dark blue scale shared by every heatmap cell (0-100%).
  var HEAT_STOPS = [[241, 245, 249], [198, 216, 234], [122, 163, 201], [59, 110, 160], [31, 78, 121]];

  function heatColor(pct) {
    var t = Math.max(0, Math.min(100, pct)) / 100 * (HEAT_STOPS.length - 1);
    var i = Math.min(HEAT_STOPS.length - 2, Math.floor(t));
    var f = t - i;
    var c = HEAT_STOPS[i].map(function (v, k) { return Math.round(v + (HEAT_STOPS[i + 1][k] - v) * f); });
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

  function heatLegend() {
    var stops = HEAT_STOPS.map(function (c, i) {
      return "rgb(" + c.join(",") + ") " + (i / (HEAT_STOPS.length - 1) * 100) + "%";
    }).join(", ");
    return h("div", { class: "ab-heat-legend", "aria-hidden": "true" }, [
      h("span", { class: "ab-heat-legend-label", text: "Rejection percentage" }),
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
          h("span", { class: "ab-matrix-p", text: fmtP(r.p) }),
          h("span", { class: "ab-matrix-thr", text: "(" + thresholdText(r.p, alpha) + ")" }),
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
              h("span", { class: "ab-matrix-p", text: fmtP(r.p) }),
              h("span", { class: "ab-matrix-thr", text: "(" + thresholdText(r.p, alpha) + ")" }),
            ]),
          ]);
          makeSelectable(item, function () { onSelect(key); });
          return item;
        })));
    }));

    return h("div", null, [h("table", { class: "ab-matrix" }, [head, body]), list]);
  }

  function describeCell(r, alpha, alphaKey) {
    return r.A + "-trained model vs human " + r.B + ", external reference " + r.C + ": p = " + fmtP(r.p) +
      " (" + thresholdText(r.p, alpha) + "), positive self-reference effect " + (r.reject[alphaKey] ? "detected." : "not detected.");
  }

  function matrixLegend() {
    return h("div", { class: "ab-matrix-legend" }, [
      h("span", null, [h("span", { class: "ab-swatch is-detected", "aria-hidden": "true" }), "Positive effect detected"]),
      h("span", null, [h("span", { class: "ab-swatch", "aria-hidden": "true" }), "Not detected"]),
      h("span", { class: "ab-matrix-legend-note", text: "Colour shows the test decision, not the size of the effect." }),
    ]);
  }

  function initScalarMatrix(container) {
    var state = { selected: null, highlight: null };
    var tableHost = h("div", { class: "ab-scroll" });
    var detail = h("p", { class: "ab-detail", "aria-live": "polite" });

    function render() {
      tableHost.innerHTML = "";
      tableHost.appendChild(buildMatrix(D.scalar, 0.05, "0.05", state, function (key) { state.selected = key; render(); }));
      var sel = D.scalar.filter(function (r) { return r.A + "|" + r.B + "|" + r.C === state.selected; })[0];
      detail.textContent = sel ? describeCell(sel, 0.05, "0.05") : "Select a cell to see which radiologist served as the external reference.";
    }

    container.innerHTML = "";
    container.appendChild(matrixLegend());
    container.appendChild(tableHost);
    container.appendChild(detail);
    render();
  }

  // ---------- Part I: real Bernoulli Task I (matrix + change chart) ----------

  function initBernoulli(container, changeHost) {
    var data = D.bernoulli;
    var alphas = [{ value: "0.01", label: "0.01" }, { value: "0.05", label: "0.05" }, { value: "0.1", label: "0.10" }];
    var state = { aspect: "-1", alpha: "0.05", selected: null, highlight: null };

    function aspectName() {
      var a = data.aspects.filter(function (x) { return String(x.index) === state.aspect; })[0];
      if (!a) return "";
      return a.index === -1 ? "Average across 27 findings" : a.name;
    }

    var aspectField = selectField("Finding",
      data.aspects.map(function (a) { return { value: String(a.index), label: a.index === -1 ? "Average across 27 findings" : a.name }; }),
      state.aspect,
      function (v) { state.aspect = v; state.highlight = null; state.selected = null; render(); });
    var alphaField = segmentedField("Threshold", alphas, state.alpha,
      function (v) { state.alpha = v; render(); });

    var lead = h("p", { class: "ab-lead", "aria-live": "polite" });
    var tableHost = h("div", { class: "ab-scroll" });
    var detail = h("p", { class: "ab-detail", "aria-live": "polite" });

    container.innerHTML = "";
    container.appendChild(h("div", { class: "ab-controls" }, [aspectField.field, alphaField.field]));
    container.appendChild(lead);
    container.appendChild(matrixLegend());
    container.appendChild(tableHost);
    container.appendChild(detail);

    var chart = changeHost ? initChangeChart(changeHost) : null;

    function render() {
      aspectField.select.value = state.aspect;
      alphaField.sync(state.alpha);
      var rows = data.rows[state.aspect];
      var alpha = parseFloat(state.alpha);

      var detected = rows.filter(function (r) { return r.reject[state.alpha]; }).length;
      var perModel = RADIOLOGISTS.map(function (a) {
        var n = rows.filter(function (r) { return r.A === a && r.reject[state.alpha]; }).length;
        return a + "-trained model: " + countWord(n);
      });
      lead.textContent = aspectName() + ": positive self-reference effects are detected in " + detected + " of 6 comparisons at threshold " +
        alpha.toFixed(2) + " (" + perModel.join("; ") + ").";

      tableHost.innerHTML = "";
      tableHost.appendChild(buildMatrix(rows, alpha, state.alpha, state, function (key) { state.selected = key; render(); }));
      var sel = rows.filter(function (r) { return r.A + "|" + r.B + "|" + r.C === state.selected; })[0];
      detail.textContent = sel ? describeCell(sel, alpha, state.alpha) : "Select a cell to see which radiologist served as the external reference.";

      if (chart) chart.render(rows, aspectName(), state.highlight);
    }

    render();

    return {
      set: function (opts) {
        if (opts.aspect) {
          var a = data.aspects.filter(function (x) { return x.name === opts.aspect; })[0];
          if (a) state.aspect = String(a.index);
        }
        if (opts.alpha) state.alpha = opts.alpha;
        state.highlight = opts.highlight || null;
        state.selected = opts.highlight || null;
        render();
      },
    };
  }

  function initChangeChart(container) {
    var lead = h("p", { class: "ab-lead", "aria-live": "polite" });
    var legend = h("div", { class: "ab-legend" }, [
      h("span", null, [h("span", { class: "ab-pt ab-pt-self ab-pt-static", "aria-hidden": "true" }), " Judged by the radiologist who trained the model"]),
      h("span", null, [h("span", { class: "ab-pt ab-pt-ext ab-pt-static", "aria-hidden": "true" }), " Judged by the external radiologist"]),
    ]);
    var headHost = h("div", { class: "ab-dot-row ab-dot-head" });
    var rowsHost = h("div", { class: "ab-dot-rows" });
    var ticksHost = h("div", { class: "ab-dot-row ab-dot-axis", "aria-hidden": "true" });
    var axisLabelHost = h("div", { class: "ab-dot-row ab-dot-axis" });

    container.innerHTML = "";
    container.appendChild(lead);
    container.appendChild(legend);
    container.appendChild(headHost);
    container.appendChild(rowsHost);
    container.appendChild(ticksHost);
    container.appendChild(axisLabelHost);

    function render(rows, name, highlight) {
      var e = groupExp(rows.reduce(function (acc, r) { return acc.concat([r.dSelf, r.dExt]); }, []));
      var k = Math.pow(10, e);
      var unit = unitLabel(e);
      function sc(v) { return v / k; }

      var reversals = rows.filter(function (r) { return (r.dSelf < 0) !== (r.dExt < 0); }).length;
      lead.textContent = name + ": the observed model–human ranking reverses in " + reversals + " of 6 comparisons when the reference changes.";

      var values = [0];
      rows.forEach(function (r) { values.push(sc(r.dSelf), sc(r.dExt)); });
      var lo = Math.min.apply(null, values);
      var hi = Math.max.apply(null, values);
      var pad = (hi - lo) * 0.06 || 1;
      var scale = niceTicks(lo - pad, hi + pad, 5);
      function pos(v) { return ((v - scale.lo) / (scale.hi - scale.lo)) * 100; }
      var zero = pos(0);

      headHost.innerHTML = "";
      headHost.appendChild(h("div", { class: "ab-dot-label" }));
      headHost.appendChild(h("div", { class: "ab-dot-sides" }, [
        h("span", null, [h("span", { class: "ab-long", text: "← model has lower loss" }), h("span", { class: "ab-short", text: "← model better" })]),
        h("span", null, [h("span", { class: "ab-long", text: "human has lower loss →" }), h("span", { class: "ab-short", text: "human better →" })]),
      ]));

      rowsHost.innerHTML = "";
      rows.forEach(function (r) {
        var key = r.A + "|" + r.B + "|" + r.C;
        var a = pos(sc(r.dSelf));
        var c = pos(sc(r.dExt));
        var desc = r.A + "-trained model vs " + r.B + ": judged by " + r.A + " " + sigN(sc(r.dSelf), 3) + ", judged by " + r.C + " " +
          sigN(sc(r.dExt), 3) + (unit ? " (" + unit + ")" : "");
        rowsHost.appendChild(h("div", { class: "ab-dot-row" + (highlight === key ? " is-highlight" : ""), title: desc, "aria-label": desc }, [
          h("div", { class: "ab-dot-label" }, [
            h("span", { class: "ab-dot-main", text: r.A + "-trained model vs " + r.B }),
            h("span", { class: "ab-dot-sub", text: "external reference: " + r.C }),
          ]),
          h("div", { class: "ab-dot-track" }, [
            h("span", { class: "ab-zero", style: "left:" + zero + "%" }),
            h("span", { class: "ab-link", style: "left:" + Math.min(a, c) + "%;width:" + Math.abs(c - a) + "%" }),
            h("span", { class: "ab-pt ab-pt-self", style: "left:" + a + "%" }),
            h("span", { class: "ab-pt ab-pt-ext", style: "left:" + c + "%" }),
          ]),
        ]));
      });

      ticksHost.innerHTML = "";
      var ticks = h("div", { class: "ab-dot-track ab-ticks" });
      scale.ticks.forEach(function (t) {
        ticks.appendChild(h("span", { class: "ab-tick", style: "left:" + pos(t) + "%", text: tickLabel(t, scale.step) }));
      });
      ticksHost.appendChild(h("div", { class: "ab-dot-label" }));
      ticksHost.appendChild(ticks);

      axisLabelHost.innerHTML = "";
      axisLabelHost.appendChild(h("div", { class: "ab-dot-label" }));
      axisLabelHost.appendChild(h("div", { class: "ab-axis-caption", text: "Model loss minus human loss" + (unit ? " (" + unit + ")" : "") }));
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
      return g.K + " references, total error budget " + probLabel(g.prob) + ": " + g.hits + " of " + g.n +
        " configurations certified (" + fmtPct(g.pct) + ").";
    }

    function render() {
      var head = h("thead", null, [
        h("tr", null, [h("th", { scope: "col" }), h("th", { colspan: "4", class: "ab-heat-group", scope: "colgroup", text: "Total error budget" })]),
        h("tr", null, [h("th", { scope: "col" })].concat(probs.map(function (p) { return h("th", { scope: "col", text: probLabel(p) }); }))),
      ]);
      var body = h("tbody", null, Ks.map(function (K) {
        return h("tr", null, [h("th", { scope: "row" }, [
          h("span", { class: "ab-long", text: K + " references" }), h("span", { class: "ab-short", text: K + " refs" }),
        ])].concat(probs.map(function (p) {
          var g = cellFor(K, p);
          var key = K + "|" + p;
          var btn = h("button", {
            type: "button",
            class: "ab-heat-cell" + (selected === key ? " is-selected" : ""),
            style: "background:" + heatColor(g.pct) + ";color:" + heatText(g.pct),
            title: describe(g),
            "aria-label": describe(g),
            "aria-pressed": selected === key ? "true" : "false",
            text: fmtPct(g.pct),
          });
          btn.addEventListener("click", function () { selected = key; render(); });
          return h("td", null, [btn]);
        })));
      }));
      tableHost.innerHTML = "";
      tableHost.appendChild(h("table", { class: "ab-heatmap" }, [head, body]));
      if (selected) {
        var parts = selected.split("|");
        detail.textContent = describe(cellFor(parseInt(parts[0], 10), parts[1]));
      } else {
        detail.textContent = "Select a cell to see its count.";
      }
    }

    container.innerHTML = "";
    container.appendChild(tableHost);
    container.appendChild(heatLegend());
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
      var maxGap = Math.max.apply(null, panels.map(function (p) { return p.absDelta; }));
      var e = maxGap > 0 && maxGap < 1 ? Math.floor(Math.log10(maxGap)) : 0;
      var k = Math.pow(10, e);
      var unit = unitLabel(e);
      var u = unit ? " (" + unit + ")" : "";

      var certified = panels.filter(function (p) { return p.byProb[state.prob].cert; }).length;
      summary.textContent = certified + " of " + panels.length + " reference panels are certified (✓) at total error budget " + probLabel(state.prob) + "." +
        (e ? " Gaps are in units of 10" + supExp(e) + "." : "");

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
          cell(sigN(p.absDelta / k, 3), true),
          cell(sigN(r.bound / k, 3), true),
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
        var who = sel.delta < 0 ? "model" : "human";
        explain.textContent = head + "the observed gap " + sigN(sel.absDelta / k, 3) + " exceeds the required " +
          sigN(r.bound / k, 3) + u + ", so the procedure certifies the comparison. The " + who + " has the lower loss against this reference, so " +
          "the certified direction favors the " + who + ", under this loss comparison and the stated assumptions.";
      } else {
        explain.textContent = head + "the observed gap " + sigN(sel.absDelta / k, 3) + " does not exceed the required " +
          sigN(r.bound / k, 3) + u + ", so the procedure reaches no conclusion for this panel.";
      }
    }

    render();
  }

  // ---------- Part III: synthetic Bernoulli Task II ----------

  function initSynthetic(container, allHost) {
    var syn = D.synthetic;
    var Ks = ["16", "24", "32"];
    var probs = [{ value: "0.05", label: "0.05" }, { value: "0.10", label: "0.10" }, { value: "0.20", label: "0.20" }];
    var state = { aspect: "avg", prob: "0.10", selectedK: null };

    var aspectField = selectField("Aspect",
      [{ value: "avg", label: "Average across 27 aspects" }].concat(syn.aspects.map(function (a) { return { value: String(a.index), label: a.name }; })),
      state.aspect,
      function (v) { state.aspect = v; render(); });
    var probField = segmentedField("prob", probs, state.prob,
      function (v) { state.prob = v; render(); });

    var lead = h("p", { class: "ab-lead", "aria-live": "polite" });
    var barsHost = h("div", { class: "ab-bars" });
    var detail = h("p", { class: "ab-detail", "aria-live": "polite" });
    var caption = h("p", { class: "ab-caption" });

    container.innerHTML = "";
    container.appendChild(h("div", { class: "ab-controls" }, [aspectField.field, probField.field]));
    container.appendChild(lead);
    container.appendChild(barsHost);
    container.appendChild(detail);
    container.appendChild(caption);

    function aspectName(aspect) {
      if (aspect === "avg") return "Average across 27 aspects";
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
        return { pct: sumPct / count, r: r, n: n, unit: "aspect–trial decisions" };
      }
      var c = syn.cells[aspect][K][state.prob];
      return { pct: c.pct, r: c.r, n: c.n, unit: "trials" };
    }

    function describe(K) {
      var v = valueFor(state.aspect, K);
      return aspectName(state.aspect) + ", " + K + " references at prob = " + probLabel(state.prob) + ": " + fmtInt(v.r) + " of " +
        fmtInt(v.n) + " " + v.unit + " rejected (" + fmtPct(v.pct) + ").";
    }

    function render() {
      aspectField.select.value = state.aspect;
      probField.sync(state.prob);
      var vals = Ks.map(function (K) { return valueFor(state.aspect, K); });

      lead.textContent = aspectName(state.aspect) + " at prob = " + probLabel(state.prob) + ": the rejection percentage is " +
        fmtPct(vals[0].pct) + " with 16 references, " + fmtPct(vals[1].pct) + " with 24, and " + fmtPct(vals[2].pct) + " with 32.";

      barsHost.innerHTML = "";
      Ks.forEach(function (K, i) {
        var v = vals[i];
        var row = h("div", { class: "ab-bar-row" + (state.selectedK === K ? " is-selected" : ""), title: describe(K), "aria-label": describe(K) }, [
          h("div", { class: "ab-bar-label", text: K + " references" }),
          h("div", { class: "ab-bar-track" }, [h("span", { class: "ab-bar-fill", style: "width:" + Math.min(100, Math.max(0, v.pct)) + "%" })]),
          h("div", { class: "ab-bar-value", text: fmtPct(v.pct) }),
        ]);
        makeSelectable(row, function () { state.selectedK = K; render(); });
        barsHost.appendChild(row);
      });
      var axis = h("div", { class: "ab-bar-track ab-ticks" });
      [0, 25, 50, 75, 100].forEach(function (t) {
        axis.appendChild(h("span", { class: "ab-tick", style: "left:" + t + "%", text: t + "%" }));
      });
      barsHost.appendChild(h("div", { class: "ab-bar-row ab-bar-axis", "aria-hidden": "true" }, [h("div", { class: "ab-bar-label" }), axis, h("div", { class: "ab-bar-value" })]));

      detail.textContent = state.selectedK ? describe(state.selectedK) : "Select a bar to see its count.";
      caption.textContent = state.aspect === "avg"
        ? "Equal-weight average of the 27 aspect percentages. Each aspect contributes 120 trials per panel size; the trials are shared across aspects."
        : "Percentage of 120 trials per panel size in which the test rejects.";

      renderAll();
    }

    function renderAll() {
      if (!allHost) return;
      var head = h("thead", null, [h("tr", null, [h("th", { scope: "col", text: "Aspect" })].concat(Ks.map(function (K) {
        return h("th", { scope: "col" }, [h("span", { class: "ab-long", text: K + " references" }), h("span", { class: "ab-short", text: K })]);
      })))]);
      var body = h("tbody", null, syn.aspects.map(function (a) {
        var key = String(a.index);
        var tr = h("tr", { class: key === state.aspect ? "is-selected" : null }, [h("th", { scope: "row", text: a.name })].concat(Ks.map(function (K) {
          var c = syn.cells[key][K][state.prob];
          return h("td", null, [h("span", {
            class: "ab-heat-cell",
            style: "background:" + heatColor(c.pct) + ";color:" + heatText(c.pct),
            title: a.name + ", " + K + " references: " + c.r + " of " + c.n + " trials rejected",
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
      allHost.appendChild(h("p", { class: "ab-lead", text: "Rejection percentage by aspect at prob = " + probLabel(state.prob) + "; columns are the number of references, 120 trials per cell. Select a row to show it above." }));
      allHost.appendChild(h("div", { class: "ab-scroll" }, [h("table", { class: "ab-heatmap ab-heatmap-aspects" }, [head, body])]));
      allHost.appendChild(heatLegend());
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

  // ---------- wiring ----------

  function widget(name) {
    return document.querySelector('.ab-widget[data-widget="' + name + '"]');
  }

  function init() {
    var el;
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
