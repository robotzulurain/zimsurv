// Stronger glue: autodetect filter dropdowns and broadcast changes to all tabs.
// No UI/visual changes.

(function () {
  const KEYS = ["host_type","organism","antibiotic","facility","patient_type","sex"];

  const SEX_VALUES = new Set(["m","male","f","female","unknown"]);
  const HOST_VALUES = new Set(["human","animal","environment","all"]);

  function clean(v) {
    if (v == null) return "";
    const s = String(v).trim();
    return (s === "" || s === "All") ? "" : s;
  }

  function optionSet(el) {
    const set = new Set();
    if (!el || !el.options) return set;
    for (const o of el.options) {
      const t = (o.value || o.text || "").trim();
      if (t) set.add(t.toLowerCase());
    }
    return set;
  }

  // Try to deduce a semantic key for an element
  function detectKey(el) {
    const id = (el.id || "").toLowerCase();
    const name = (el.name || "").toLowerCase();
    const data = ((el.dataset && el.dataset.filter) || "").toLowerCase();
    const cand = data || id || name;

    if (cand.includes("host")) return "host_type";
    if (cand.includes("organism") || cand.includes("microbe")) return "organism";
    if (cand.includes("antibiotic") || cand.includes("abx")) return "antibiotic";
    if (cand.includes("facility") || cand.includes("site")) return "facility";
    if (cand.includes("patient_type") || cand.includes("patient-type") || cand.includes("ptype")) return "patient_type";
    if (cand === "sex" || cand.includes("sex") || cand.includes("gender")) return "sex";
    if (KEYS.includes(cand)) return cand;

    // Heuristic: detect by options (works even without IDs)
    if (el.tagName === "SELECT") {
      const set = optionSet(el);
      if (set.size) {
        // Sex dropdown heuristic
        const sexHits = [...set].filter(v => SEX_VALUES.has(v)).length;
        if (sexHits >= 2) return "sex"; // M/F present => sex

        // Host dropdown heuristic
        const hostHits = [...set].filter(v => HOST_VALUES.has(v)).length;
        if (hostHits >= 2) return "host_type";
      }
    }
    return "";
  }

  function readFilters() {
    const out = { ...(window.__amrFilters || {}) };
    document.querySelectorAll("select, input").forEach(el => {
      const k = detectKey(el);
      if (!k) return;
      const v = clean(el.value);
      if (v) out[k] = v; else delete out[k];
    });
    return out;
  }

  function broadcast(next) {
    window.__amrFilters = next;
    window.dispatchEvent(new CustomEvent("amr:filters-changed", { detail: next }));
  }

  function handleChange() { broadcast(readFilters()); }

  // Attach listeners to relevant elements
  function attach(el) {
    if (!el || el.__amrBound) return;
    const k = detectKey(el);
    if (!k) return;
    el.addEventListener("change", handleChange);
    el.__amrBound = true;
  }

  function scan() {
    document.querySelectorAll("select, input").forEach(attach);
  }

  function init() {
    scan();
    // initialize broadcast with current values
    broadcast(readFilters());
    // Observe future changes (in case the FilterBar mounts later)
    const mo = new MutationObserver(() => scan());
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
