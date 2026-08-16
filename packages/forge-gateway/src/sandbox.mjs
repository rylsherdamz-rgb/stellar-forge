import vm from "node:vm";

const DENY = /(?:require\s*\(|\bimport\s*\(|\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(|\bprocess\b|\bBuffer\b|\bglobalThis\b|\bwindow\b|\bdocument\b)/;

export function runSandboxed(code, catalogApi, { timeout = 2000 } = {}) {
  if (typeof code !== "string" || code.length === 0) {
    return { error: "empty code" };
  }
  if (code.length > 100_000) {
    return { error: "code too large" };
  }
  if (DENY.test(code)) {
    return { error: "blocked: network or host APIs (fetch/require/process/globalThis) are not available in the sandbox" };
  }

  const logs = [];
  const log = (...args) => logs.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
  const catalogProxy = new Proxy(catalogApi, {
    get(target, prop) {
      if (prop === "get") return (id) => target.get(String(id));
      if (prop === "search") return (q) => target.search(String(q));
      return undefined;
    },
  });

  const sandbox = {
    console: { log, info: log, warn: log, error: log },
    catalog: catalogProxy,
    JSON, Math, Date, Array, Object, String, Number, Boolean, BigInt, Map, Set, RegExp, Symbol,
    Promise, Intl, Error, TypeError, RangeError, isNaN, isFinite, parseFloat, parseInt, encodeURIComponent, decodeURIComponent,
  };
  sandbox.__FORGE_SANDBOX__ = true;

  try {
    const result = vm.runInNewContext(code, sandbox, { timeout, filename: "agent-code.js" });
    const serializable = result === undefined ? null : JSON.parse(JSON.stringify(result));
    return { result: serializable, logs, error: null };
  } catch (err) {
    return { result: null, logs, error: err && err.message ? err.message : String(err) };
  }
}