"""Split references/REQUESTED_CSV_JSON_DATA_DUMP_FOR_AGENT.md into the data/
files and build data/results-data.js for the interactive result components.
Part III (semi-synthetic Bernoulli Task II) comes from the official per-finding
results in references/part_iii_per_finding_detailed.csv instead of the dump.

Run from the project root:  python data/extract_from_dump.py
"""

import csv
import io
import json
import math
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DUMP = ROOT / "references" / "REQUESTED_CSV_JSON_DATA_DUMP_FOR_AGENT.md"
DATA = ROOT / "data"
SYNTH_CSV = ROOT / "references" / "part_iii_per_finding_detailed.csv"
SYNTH_SETTING = ROOT / "references" / "SYNTHETIC_BERNOULLI_OFFICIAL_GENERATION_SETTING.md"
# total error budgets shown in Part III, as CSV value -> display key
SYNTH_ALPHAS = {"0.1": "0.10", "0.15": "0.15", "0.2": "0.20"}

OUTPUT_PATHS = {
    "SCALAR_TASK_I_SUMMARY": "task1-scalar/summary.csv",
    "REAL_BERNOULLI_TASK_I_SUMMARY": "task1-bernoulli/summary.csv",
    "REAL_BERNOULLI_TASK_I_THRESHOLDED_META": "task1-bernoulli/thresholded-meta.json",
    "REAL_BERNOULLI_TASK_I_THRESHOLDS": "task1-bernoulli/thresholds.csv",
    "REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_JSON": "task1-bernoulli/calibration/temperature.json",
    "REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_SUMMARY": "task1-bernoulli/calibration/calibration-summary.csv",
    "REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_PER_ASPECT": "task1-bernoulli/calibration/calibration-aspects.csv",
    "CONTINUOUS_TASK_II_EXHAUSTIVE_SUMMARY": "task2-scalar/configurations.csv",
    "CONTINUOUS_TASK_II_TRUE_RATE_BY_K_PROB": "task2-scalar/by-k-prob.csv",
    "CONTINUOUS_TASK_II_METADATA": "task2-scalar/meta.json",
}


def read_blocks():
    text = DUMP.read_text(encoding="utf-8")
    blocks = {}
    # A block is "## NAME", an opening ```csv/```json fence, and the next ``` (the closing
    # fence may follow the last line directly, as in "}```").
    for m in re.finditer(r"^## ([A-Z0-9_]+)\n", text, re.M):
        name = m.group(1)
        if name in blocks:
            continue
        opening = re.compile(r"^```(?:csv|json)\n", re.M).search(text, m.end())
        if not opening:
            continue
        close = text.index("```", opening.end())
        body = text[opening.end():close]
        blocks[name] = body if body.endswith("\n") else body + "\n"
    missing = set(OUTPUT_PATHS) - set(blocks)
    if missing:
        raise SystemExit(f"missing blocks in dump: {sorted(missing)}")
    return blocks


def rows(body):
    return list(csv.DictReader(io.StringIO(body)))


def num(value):
    if value is None or value.strip() == "" or value.strip().lower() == "nan":
        return None
    x = float(value)
    return None if math.isnan(x) else x


def boolean(value):
    v = value.strip()
    if v == "True":
        return True
    if v == "False":
        return False
    return None


def build_payload(blocks):
    # Scalar Task I: one row per ordered triple, decisions at every level.
    scalar = {}
    for r in rows(blocks["SCALAR_TASK_I_SUMMARY"]):
        key = (r["A_model"], r["B_human"], r["C_external_ref"])
        entry = scalar.setdefault(key, {
            "A": key[0], "B": key[1], "C": key[2],
            "n": int(r["n_images"]),
            "S": num(r["S_hat"]), "se": num(r["se"]), "t": num(r["t_stat"]),
            "p": num(r["p_value_one_sided_H1_S_gt_0"]),
            "dSelf": num(r["delta_self_ref_A"]),
            "dExt": num(r["delta_external_ref_C"]),
            "reject": {}, "bound": {},
        })
        entry["reject"][r["alpha"]] = boolean(r["reject_H0_S_le_0"])
        entry["bound"][r["alpha"]] = num(r["S_rejection_boundary"])

    # Real Bernoulli Task I: aspects (mean first, then aspect_index order).
    bern_aspects = {}
    bern = defaultdict(dict)
    for r in rows(blocks["REAL_BERNOULLI_TASK_I_SUMMARY"]):
        idx = int(r["aspect_index"])
        name = "Average across 27 findings" if r["scale"] == "mean_over_aspects" else r["aspect"]
        bern_aspects[idx] = name
        key = f'{r["A_model"]}|{r["B_human"]}|{r["C_external_ref"]}'
        entry = bern[idx].setdefault(key, {
            "A": r["A_model"], "B": r["B_human"], "C": r["C_external_ref"],
            "S": num(r["S_hat"]), "se": num(r["se"]), "t": num(r["t_stat"]),
            "p": num(r["p_value_one_sided_H1_S_gt_0"]),
            "dSelf": num(r["delta_self_ref_A"]),
            "dExt": num(r["delta_external_ref_C"]),
            "reject": {}, "bound": {},
        })
        entry["reject"][r["alpha"]] = boolean(r["reject_H0_S_le_0"])
        entry["bound"][r["alpha"]] = num(r["S_rejection_boundary"])
    triple_order = list(scalar.keys())
    bern_out = {
        "aspects": [{"index": i, "name": bern_aspects[i]} for i in sorted(bern_aspects)],
        "rows": {
            str(i): [bern[i][f"{a}|{b}|{c}"] for (a, b, c) in triple_order]
            for i in sorted(bern)
        },
    }

    calib_summary = [
        {
            "model": r["annotator"], "n": int(r["n_val"]),
            "T": num(r["temperature_mean"]),
            "eceRaw": num(r["raw_ece"]), "eceCal": num(r["calibrated_ece"]),
            "brierRaw": num(r["raw_brier"]), "brierCal": num(r["calibrated_brier"]),
            "bceRaw": num(r["raw_bce"]), "bceCal": num(r["calibrated_bce"]),
        }
        for r in rows(blocks["REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_SUMMARY"])
    ]
    calib_aspects = defaultdict(list)
    for r in rows(blocks["REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_PER_ASPECT"]):
        calib_aspects[r["aspect"]].append({
            "model": r["annotator"], "T": num(r["temperature"]),
            "eceRaw": num(r["raw_ece"]), "eceCal": num(r["calibrated_ece"]),
            "brierRaw": num(r["raw_brier"]), "brierCal": num(r["calibrated_brier"]),
            "bceRaw": num(r["raw_bce"]), "bceCal": num(r["calibrated_bce"]),
        })

    # Continuous Task II.
    by_k_prob = [
        {"K": int(r["K"]), "prob": r["prob"], "n": int(r["n_experiments"]),
         "hits": int(r["n_true"]), "pct": num(r["true_percent"])}
        for r in rows(blocks["CONTINUOUS_TASK_II_TRUE_RATE_BY_K_PROB"])
    ]
    configs = {}
    for r in rows(blocks["CONTINUOUS_TASK_II_EXHAUSTIVE_SUMMARY"]):
        key = (r["A_model"], r["B_true"], r["reference_annotators"])
        entry = configs.setdefault(key, {
            "A": key[0], "B": key[1], "K": int(r["K"]),
            "refs": key[2].replace(",", ", "),
            "delta": num(r["Delta_hat_ref"]),
            "absDelta": num(r["abs_Delta_hat_ref"]),
            "byProb": {},
        })
        entry["byProb"][r["prob"]] = {
            "bound": num(r["total_rejection_boundary_abs"]),
            "margin": num(r["certification_margin"]),
            "cert": boolean(r["certify_same_nonzero_sign"]),
        }
    cont_meta = json.loads(blocks["CONTINUOUS_TASK_II_METADATA"])

    # Semi-synthetic Bernoulli Task II (official per-finding results).
    synth_aspects = {}
    synth = defaultdict(lambda: defaultdict(dict))
    for r in csv.DictReader(io.StringIO(SYNTH_CSV.read_text(encoding="utf-8"))):
        if r["alpha_total"] not in SYNTH_ALPHAS:
            continue
        idx = int(r["aspect_index"])
        synth_aspects[idx] = r["aspect"]
        n, k = int(r["n_trials"]), int(r["n_rejections"])
        synth[idx][r["K"]][SYNTH_ALPHAS[r["alpha_total"]]] = {
            "n": n, "r": k, "pct": 100.0 * k / n,
            "gap": num(r["mean_abs_Delta_hat_ref"]),
            "rhs": num(r["mean_rhs_distortion_bound"]),
            "U": num(r["mean_U_tau_gamma"]),
        }

    return {
        "scalar": list(scalar.values()),
        "bernoulli": bern_out,
        "calibration": {"summary": calib_summary, "aspects": calib_aspects},
        "continuous": {
            "byKProb": by_k_prob,
            "configs": sorted(configs.values(), key=lambda c: (c["A"], c["B"], c["K"], c["refs"])),
            "testSizesByB": cont_meta.get("test_sizes_by_B", {}),
            "componentLevels": cont_meta.get("component_level_interpretation"),
        },
        "synthetic": {
            "aspects": [{"index": i, "name": synth_aspects[i]} for i in sorted(synth_aspects)],
            "cells": {str(i): synth[i] for i in sorted(synth)},
        },
    }


def check(payload):
    """Spot-check numbers quoted in blog-results-presentation-instructions.md."""
    failures = []

    def expect(label, got, want, tol=1e-6):
        if got is None or abs(got - want) > tol:
            failures.append(f"{label}: got {got}, want {want}")

    s = {(r["A"], r["B"], r["C"]): r for r in payload["scalar"]}
    expect("scalar R8/R9/R10 S", s[("R8", "R9", "R10")]["S"], 0.0008508403, 1e-9)
    expect("scalar R10/R9/R8 p", s[("R10", "R9", "R8")]["p"], 0.9999952, 1e-7)

    # Thresholded (0-1 loss) Bernoulli Task I, validation-selected thresholds.
    per_aspect = [r for i, rs in payload["bernoulli"]["rows"].items() if i != "-1" for r in rs]
    for alpha, want in (("0.01", 12), ("0.05", 22), ("0.1", 32)):
        got = sum(1 for r in per_aspect if r["reject"][alpha])
        if got != want:
            failures.append(f"bernoulli rejections at {alpha}: got {got}, want {want}")
    atel = next(a["index"] for a in payload["bernoulli"]["aspects"] if a["name"] == "Atelectasis")
    r = next(x for x in payload["bernoulli"]["rows"][str(atel)] if (x["A"], x["B"], x["C"]) == ("R8", "R9", "R10"))
    expect("atelectasis self gap", r["dSelf"], -0.006, 1e-9)
    expect("atelectasis ext gap", r["dExt"], 0.002, 1e-9)
    expect("atelectasis p", r["p"], 0.01692506948, 1e-9)

    grid = {(c["K"], c["prob"]): c for c in payload["continuous"]["byKProb"]}
    if (grid[(4, "0.2")]["hits"], grid[(4, "0.2")]["n"]) != (14, 30):
        failures.append("continuous K4 prob .2: expected 14/30")
    cfg = next(c for c in payload["continuous"]["configs"]
               if c["A"] == "R13" and c["B"] == "R11" and c["K"] == 4)
    expect("continuous default pair |delta|", cfg["absDelta"], 0.0003145104, 1e-10)
    expect("continuous default pair bound", cfg["byProb"]["0.05"]["bound"], 0.0002655212, 1e-10)

    # Pooled counts quoted in the official setting note and in Part III.
    cells = payload["synthetic"]["cells"]
    for K, want in (("16", 87), ("24", 415), ("32", 1222)):
        got = sum(cells[i][K]["0.20"]["r"] for i in cells)
        if got != want:
            failures.append(f"synthetic pooled K{K} alpha .20: got {got}, want {want}")
    rib = next(a["index"] for a in payload["synthetic"]["aspects"] if a["name"] == "Rib fracture")
    c = cells[str(rib)]["32"]["0.20"]
    if (c["r"], c["n"]) != (115, 120):
        failures.append("synthetic Rib fracture K32 alpha .20: expected 115/120")

    return failures


def main():
    blocks = read_blocks()
    for name, rel in OUTPUT_PATHS.items():
        path = DATA / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(blocks[name], encoding="utf-8")

    synth_dir = DATA / "task2-bernoulli"
    synth_dir.mkdir(parents=True, exist_ok=True)
    (synth_dir / "per-finding.csv").write_text(SYNTH_CSV.read_text(encoding="utf-8"), encoding="utf-8")
    (synth_dir / "generation-setting.md").write_text(SYNTH_SETTING.read_text(encoding="utf-8"), encoding="utf-8")

    payload = build_payload(blocks)
    failures = check(payload)
    js = "window.ANNO_RESULTS = " + json.dumps(payload, separators=(",", ":")) + ";\n"
    (DATA / "results-data.js").write_text(js, encoding="utf-8")

    print(f"wrote {len(OUTPUT_PATHS)} data files and results-data.js ({len(js) // 1024} KB)")
    print("checks: OK" if not failures else "checks FAILED:\n  " + "\n  ".join(failures))


if __name__ == "__main__":
    main()
