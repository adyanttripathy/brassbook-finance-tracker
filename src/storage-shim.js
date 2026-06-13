/**
 * storage-shim.js
 * BrassBook persists data via `window.storage`, which only exists inside the
 * Claude artifact sandbox. In a normal browser we back it with localStorage so
 * the ledger, points, and badges survive page reloads.
 *
 * The shim is a no-op if a real window.storage is already present.
 */
if (typeof window !== "undefined" && !window.storage) {
  const PREFIX = "brassbook:";
  const key = (k) => PREFIX + k;

  window.storage = {
    async get(k) {
      const value = localStorage.getItem(key(k));
      return value === null ? null : { key: k, value, shared: false };
    },
    async set(k, value, shared = false) {
      localStorage.setItem(key(k), value);
      return { key: k, value, shared };
    },
    async delete(k, shared = false) {
      localStorage.removeItem(key(k));
      return { key: k, deleted: true, shared };
    },
    async list(prefix = "", shared = false) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const full = localStorage.key(i);
        if (full && full.startsWith(PREFIX)) {
          const bare = full.slice(PREFIX.length);
          if (bare.startsWith(prefix)) keys.push(bare);
        }
      }
      return { keys, prefix, shared };
    },
  };
}
